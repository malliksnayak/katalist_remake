package com.katalist.katalistremake.service.narration;

import com.katalist.katalistremake.model.Audio;
import com.katalist.katalistremake.model.Scene;
import com.katalist.katalistremake.model.Storyboard;
import com.katalist.katalistremake.repository.AudioRepository;
import com.katalist.katalistremake.repository.SceneRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class NarrationOrchestrator {

    private final NarrationProvider narrationProvider;
    private final AudioRepository audioRepository;
    private final SceneRepository sceneRepository;

    public NarrationOrchestrator(NarrationProvider narrationProvider,
                                 AudioRepository audioRepository,
                                 SceneRepository sceneRepository) {
        this.narrationProvider = narrationProvider;
        this.audioRepository = audioRepository;
        this.sceneRepository = sceneRepository;
        log.info("NarrationOrchestrator online. Provider active: {}", narrationProvider.getProviderName());
    }

    public void processStoryboard(String projectId, Storyboard storyboard) {
        log.info("Starting audio generation sequence for project: {}", projectId);

        List<Scene> scenes = storyboard.getScenes();
        if (scenes == null || scenes.isEmpty()) {
            // If the DTO list is empty, try to fetch from DB if needed, 
            // but usually this is called after generation.
            log.warn("Storyboard requested audio generation but contains zero scenes.");
            return;
        }

        for (Scene sceneDto : scenes) {
            // Find the actual persistent scene entity
            Optional<Scene> sceneOpt = sceneRepository.findById(sceneDto.getId());
            if (sceneOpt.isEmpty()) {
                log.error("Could not find scene with ID {} in database to attach audio.", sceneDto.getId());
                continue;
            }
            Scene scene = sceneOpt.get();

            String audioScript = scene.getAudioScript();
            if (audioScript == null || audioScript.trim().isEmpty()) {
                log.info("Skipping Scene {} - empty audio script.", scene.getSceneOrder());
                continue;
            }

            log.info(">>> Submitting Scene {} to {} TTS engine...", scene.getSceneOrder(), narrationProvider.getProviderName());
            long startMs = System.currentTimeMillis();

            try {
                byte[] audioBytes = narrationProvider.generateAudio(audioScript, "af_heart");
                String base64Audio = Base64.getEncoder().encodeToString(audioBytes);
                
                // Check if audio already exists for this scene
                Audio audio = audioRepository.findBySceneId(scene.getId())
                        .orElse(Audio.builder().scene(scene).build());
                
                audio.setAudioBase64(base64Audio);
                audio.setMimeType("audio/wav"); // Standard for Kokoro wav output
                audioRepository.save(audio);

                long elapsed = System.currentTimeMillis() - startMs;
                log.info("<<< Success! Scene {} audio saved to Database ({}ms, {} bytes)", 
                         scene.getSceneOrder(), elapsed, audioBytes.length);
                         
            } catch (Exception e) {
                log.error("<<< Failed! Scene {} encountered TTS engine error.", scene.getSceneOrder(), e);
            }
        }
        
        log.info("Audio sequence complete for project: {}", projectId);
    }
}
