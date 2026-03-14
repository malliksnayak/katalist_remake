package com.katalist.katalistremake.controller;

import com.katalist.katalistremake.model.Project;
import com.katalist.katalistremake.repository.ProjectRepository;
import com.katalist.katalistremake.service.VideoService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;

@Slf4j
@RestController
@RequestMapping("/api/v1/video")
public class VideoController {

    private final VideoService videoService;
    private final ProjectRepository projectRepository;

    public VideoController(VideoService videoService, ProjectRepository projectRepository) {
        this.videoService = videoService;
        this.projectRepository = projectRepository;
    }

    @GetMapping("/download/{projectId}")
    public ResponseEntity<StreamingResponseBody> downloadVideo(@PathVariable String projectId) {
        log.info("Request to download video for project: {}", projectId);
        
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        try {
            File videoFile = videoService.generateVideo(project);
            String filename = project.getTitle().replaceAll("[^a-zA-Z0-9.-]", "_") + ".mp4";

            StreamingResponseBody responseBody = outputStream -> {
                try (InputStream inputStream = new FileInputStream(videoFile)) {
                    inputStream.transferTo(outputStream);
                    log.info("Video stream completed for project: {}", projectId);
                } catch (Exception e) {
                    log.error("Error during video streaming", e);
                } finally {
                    videoService.cleanup(videoFile);
                }
            };

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("video/mp4"))
                    .body(responseBody);
        } catch (Exception e) {
            log.error("Error generating video", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
