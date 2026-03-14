package com.katalist.katalistremake.controller;

import com.katalist.katalistremake.model.Project;
import com.katalist.katalistremake.model.Scene;
import com.katalist.katalistremake.repository.ProjectRepository;
import com.katalist.katalistremake.service.ScriptService;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {
    private final ScriptService scriptService;
    private final ProjectRepository projectRepository;
    private final AudioController audioController;

    public ProjectController(ScriptService scriptService, ProjectRepository projectRepository, AudioController audioController) {
        this.scriptService = scriptService;
        this.projectRepository = projectRepository;
        this.audioController = audioController;
        log.info("ProjectController registered – endpoints for projects are LIVE.");
    }

    @PostMapping(value = "/generate", produces = "application/json")
    public ResponseEntity<Project> createStoryboard(@RequestBody Map<String, String> request) {
        String story = request.get("story");

        log.info("=== [REQUEST] POST /api/v1/projects/generate ===");

        if (story == null || story.isBlank()) {
            log.warn("Request rejected – 'story' field is missing or blank.");
            return ResponseEntity.badRequest().build();
        }

        log.info("Story received ({} chars). Delegating to ScriptService...", story.length());

        try {
            Project project = scriptService.generateStoryboard(story);
            log.info("=== [RESPONSE] 200 OK – returning project \"{}\" with ID {} ===",
                    project.getTitle(),
                    project.getId());
            return ResponseEntity.ok(project);
        } catch (IOException e) {
            log.error("=== [RESPONSE] 500 Internal Server Error – {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects() {
        return ResponseEntity.ok(projectRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getProjectById(@PathVariable String id) {
        return projectRepository.findById(id)
                .map(project -> {
                    long audioCount = project.getScenes().stream()
                            .filter(s -> s.getAudio() != null)
                            .count();
                    log.info("Fetching Project {}: Found {}/{} scenes with audio.", id, audioCount, project.getScenes().size());
                    return ResponseEntity.ok(project);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/generate-all-audio")
    public ResponseEntity<Project> generateAllAudio(@PathVariable String id) {
        log.info("=== [BATCH REQUEST] Generating all audio for project {} ===", id);
        return projectRepository.findById(id).map(project -> {
            for (Scene scene : project.getScenes()) {
                if (scene.getAudioScript() != null && !scene.getAudioScript().isBlank()) {
                    try {
                        audioController.processAudioGeneration(scene.getId(), scene.getAudioScript(), "af_bella", false);
                    } catch (Exception e) {
                        log.error("Failed to generate audio for scene {}", scene.getId(), e);
                    }
                }
            }
            // Refresh and return
            return ResponseEntity.ok(projectRepository.findById(id).get());
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable String id) {
        log.info("=== [REQUEST] DELETE /api/v1/projects/{} ===", id);
        if (projectRepository.existsById(id)) {
            projectRepository.deleteById(id);
            log.info("Deleted project {}", id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
