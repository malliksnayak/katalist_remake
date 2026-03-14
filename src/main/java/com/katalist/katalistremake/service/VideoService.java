package com.katalist.katalistremake.service;

import com.katalist.katalistremake.model.Project;
import com.katalist.katalistremake.model.Scene;
import lombok.extern.slf4j.Slf4j;
import org.bytedeco.ffmpeg.global.avcodec;
import org.bytedeco.ffmpeg.global.avutil;
import org.bytedeco.javacv.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.Base64;

@Slf4j
@Service
public class VideoService {

    @Value("${storage.path:./storage}")
    private String storagePath;

    private static final int FPS = 30;
    private static final double PAUSE_DURATION = 1.0; // 1 second pause

    public File generateVideo(Project project) throws Exception {
        Path rootPath = Paths.get(storagePath);
        if (!Files.exists(rootPath)) {
            Files.createDirectories(rootPath);
        }
        Path tempDir = Files.createTempDirectory(rootPath, "video_" + project.getId());
        File finalVideoFile = new File(tempDir.toFile(), "final_video.mp4");

        List<Scene> scenes = new ArrayList<>(project.getScenes());
        scenes.sort(Comparator.comparingInt(Scene::getSceneOrder));

        int width = 1024;
        int height = 576; // 16:9

        try (FFmpegFrameRecorder recorder = new FFmpegFrameRecorder(finalVideoFile, width, height, 2)) {
            recorder.setVideoCodec(avcodec.AV_CODEC_ID_H264);
            recorder.setFormat("mp4");
            recorder.setFrameRate(FPS);
            recorder.setVideoBitrate(2000000);
            recorder.setAudioCodec(avcodec.AV_CODEC_ID_AAC);
            recorder.setAudioBitrate(128000);
            recorder.setSampleRate(44100);
            recorder.setPixelFormat(avutil.AV_PIX_FMT_YUV420P);
            
            recorder.start();

            Java2DFrameConverter converter = new Java2DFrameConverter();
            long globalTimestamp = 0; // in microseconds

            for (Scene scene : scenes) {
                if (scene.getImage() == null || scene.getAudio() == null) continue;

                // Load Image and apply Letterboxing
                byte[] imageBytes = Base64.getDecoder().decode(scene.getImage().getImageBase64());
                BufferedImage originalImage = ImageIO.read(new ByteArrayInputStream(imageBytes));
                BufferedImage letterboxedImage = createLetterboxedImage(originalImage, width, height);
                Frame imageFrame = converter.convert(letterboxedImage);

                // Load Audio to temp file for grabbing
                byte[] audioBytes = Base64.getDecoder().decode(scene.getAudio().getAudioBase64());
                File tempAudioFile = File.createTempFile("scene_audio", ".wav", tempDir.toFile());
                Files.write(tempAudioFile.toPath(), audioBytes);

                long sceneStartTimestamp = globalTimestamp;

                try (FFmpegFrameGrabber audioGrabber = new FFmpegFrameGrabber(tempAudioFile)) {
                    audioGrabber.start();

                    Frame audioFrame;
                    while ((audioFrame = audioGrabber.grabFrame()) != null) {
                        if (audioFrame.samples != null) {
                            // Set the audio frame timestamp relative to the global video timeline
                            long pts = sceneStartTimestamp + audioFrame.timestamp;
                            recorder.setTimestamp(pts);
                            recorder.record(audioFrame);

                            // Fill in video frames up to this timestamp to keep sync
                            while (globalTimestamp < pts) {
                                recorder.setTimestamp(globalTimestamp);
                                recorder.record(imageFrame);
                                globalTimestamp += (1000000 / FPS);
                            }
                        }
                    }
                    
                    // After audio ends, ensure video frames cover the full length of the audio
                    long audioDuration = audioGrabber.getLengthInTime();
                    long sceneContentEnd = sceneStartTimestamp + audioDuration;
                    
                    while (globalTimestamp < sceneContentEnd) {
                        recorder.setTimestamp(globalTimestamp);
                        recorder.record(imageFrame);
                        globalTimestamp += (1000000 / FPS);
                    }
                    
                    audioGrabber.stop();
                }

                // Add 1.0s pause (Silent video and audio frames)
                long pauseEnd = globalTimestamp + (long)(PAUSE_DURATION * 1000000);
                
                int samplesPerFrame = recorder.getSampleRate() / FPS;
                java.nio.ShortBuffer silentSamples = java.nio.ShortBuffer.allocate(samplesPerFrame * recorder.getAudioChannels());

                while (globalTimestamp < pauseEnd) {
                    recorder.setTimestamp(globalTimestamp);
                    recorder.record(imageFrame);
                    
                    recorder.setTimestamp(globalTimestamp);
                    recorder.recordSamples(recorder.getSampleRate(), recorder.getAudioChannels(), silentSamples);
                    
                    globalTimestamp += (1000000 / FPS);
                }
                
                tempAudioFile.delete();
            }

            recorder.stop();
            return finalVideoFile;

        } catch (Exception e) {
            log.error("Failed to generate video using JavaCV for project {}", project.getId(), e);
            throw e;
        }
    }

    private BufferedImage createLetterboxedImage(BufferedImage img, int targetW, int targetH) {
        BufferedImage newImg = new BufferedImage(targetW, targetH, BufferedImage.TYPE_3BYTE_BGR);
        java.awt.Graphics2D g = newImg.createGraphics();
        
        // Fill background with black
        g.setColor(java.awt.Color.BLACK);
        g.fillRect(0, 0, targetW, targetH);
        
        // Calculate scaling
        double imageAspect = (double) img.getWidth() / img.getHeight();
        double targetAspect = (double) targetW / targetH;
        
        int x = 0, y = 0, w = targetW, h = targetH;
        
        if (imageAspect > targetAspect) {
            // Image is wider than target - letterbox top/bottom
            h = (int) (targetW / imageAspect);
            y = (targetH - h) / 2;
        } else {
            // Image is taller than target - pillarbox sides
            w = (int) (targetH * imageAspect);
            x = (targetW - w) / 2;
        }
        
        g.setRenderingHint(java.awt.RenderingHints.KEY_INTERPOLATION, java.awt.RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(img, x, y, w, h, null);
        g.dispose();
        
        return newImg;
    }

    public void cleanup(File videoFile) {
        if (videoFile != null && videoFile.exists()) {
            try {
                Path dir = videoFile.getParentFile().toPath();
                Files.walk(dir)
                        .sorted(Comparator.reverseOrder())
                        .map(Path::toFile)
                        .forEach(File::delete);
                log.info("Cleaned up temporary video directory: {}", dir);
            } catch (IOException e) {
                log.warn("Failed to cleanup temporary video directory", e);
            }
        }
    }
}
