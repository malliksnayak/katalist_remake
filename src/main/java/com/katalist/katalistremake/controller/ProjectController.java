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
    private final ImageController imageController;

    public ProjectController(ScriptService scriptService, 
                             ProjectRepository projectRepository, 
                             AudioController audioController,
                             ImageController imageController) {
        this.scriptService = scriptService;
        this.projectRepository = projectRepository;
        this.audioController = audioController;
        this.imageController = imageController;
        log.info("ProjectController registered – endpoints for projects and assets are LIVE.");
    }

    @PostMapping(value = "/generate", produces = "application/json")
    public ResponseEntity<Project> createStoryboard(@RequestBody Map<String, String> request) {
        String story = request.get("story");
        String visualStyle = request.get("visualStyle");

        log.info("=== [REQUEST] POST /api/v1/projects/generate ===");

        if (story == null || story.isBlank()) {
            log.warn("Request rejected – 'story' field is missing or blank.");
            return ResponseEntity.badRequest().build();
        }

        log.info("Story received ({} chars). Visual Style: {}. Delegating to ScriptService...", 
                 story.length(), visualStyle != null ? visualStyle : "Default");

        try {
            Project project = scriptService.generateStoryboard(story, visualStyle);
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

    @PostMapping("/{id}/generate-all-assets")
    public ResponseEntity<Project> generateAllAssets(@PathVariable String id, 
                                                    @RequestParam(defaultValue = "af_bella") String voice,
                                                    @RequestParam(defaultValue = "FLUX") String imageModel) {
        log.info("=== [BATCH REQUEST] Generating ALL assets (SEQUENTIAL: Audio THEN Images) for project {} ===", id);
        return projectRepository.findById(id).map(project -> {
            // STEP 1: ALL AUDIO FIRST (Sequential for stability)
            log.info("Step 1/2: Generating all audio scenes...");
            for (Scene scene : project.getScenes()) {
                if (scene.getAudioScript() != null && !scene.getAudioScript().isBlank()) {
                    try {
                        audioController.processAudioGeneration(scene.getId(), scene.getAudioScript(), voice, false);
                    } catch (Exception e) {
                        log.error("Failed to generate audio for scene {}", scene.getId(), e);
                    }
                }
            }

            // STEP 2: ALL IMAGES SECOND (Concurrent - 3 at a time)
            log.info("Step 2/2: Generating all image scenes (Multi-threaded, pool=3)...");
            List<Scene> scenesWithPrompts = project.getScenes().stream()
                    .filter(s -> s.getImagePrompt() != null && !s.getImagePrompt().isBlank())
                    .toList();

            java.util.concurrent.ExecutorService imageExecutor = java.util.concurrent.Executors.newFixedThreadPool(3);
            try {
                List<java.util.concurrent.CompletableFuture<Void>> futures = scenesWithPrompts.stream()
                        .map(scene -> java.util.concurrent.CompletableFuture.runAsync(() -> {
                            try {
                                imageController.processImageGeneration(scene.getId(), scene.getImagePrompt(), imageModel, false);
                            } catch (Exception e) {
                                log.error("Failed to generate image for scene {}", scene.getId(), e);
                            }
                        }, imageExecutor))
                        .toList();

                java.util.concurrent.CompletableFuture.allOf(futures.toArray(new java.util.concurrent.CompletableFuture[0])).join();
            } finally {
                imageExecutor.shutdown();
            }

            return projectRepository.findById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/generate-all-audio")
    public ResponseEntity<Project> generateAllAudio(@PathVariable String id, 
                                                   @RequestParam(defaultValue = "af_bella") String voice) {
        log.info("=== [BATCH REQUEST] Generating ONLY Audio for project {} ===", id);
        return projectRepository.findById(id).map(project -> {
            for (Scene scene : project.getScenes()) {
                if (scene.getAudioScript() != null && !scene.getAudioScript().isBlank()) {
                    try {
                        audioController.processAudioGeneration(scene.getId(), scene.getAudioScript(), voice, false);
                    } catch (Exception e) {
                        log.error("Failed to generate audio for scene {}", scene.getId(), e);
                    }
                }
            }
            return projectRepository.findById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/generate-all-images")
    public ResponseEntity<Project> generateAllImages(@PathVariable String id, 
                                                    @RequestParam(defaultValue = "FLUX") String imageModel) {
        log.info("=== [BATCH REQUEST] Generating ONLY Images for project {} (Multi-threaded, pool=3) ===", id);
        return projectRepository.findById(id).map(project -> {
            List<Scene> scenesWithPrompts = project.getScenes().stream()
                    .filter(s -> s.getImagePrompt() != null && !s.getImagePrompt().isBlank())
                    .toList();

            java.util.concurrent.ExecutorService imageExecutor = java.util.concurrent.Executors.newFixedThreadPool(3);
            try {
                List<java.util.concurrent.CompletableFuture<Void>> futures = scenesWithPrompts.stream()
                        .map(scene -> java.util.concurrent.CompletableFuture.runAsync(() -> {
                            try {
                                imageController.processImageGeneration(scene.getId(), scene.getImagePrompt(), imageModel, false);
                            } catch (Exception e) {
                                log.error("Failed to generate image for scene {}", scene.getId(), e);
                            }
                        }, imageExecutor))
                        .toList();

                java.util.concurrent.CompletableFuture.allOf(futures.toArray(new java.util.concurrent.CompletableFuture[0])).join();
            } finally {
                imageExecutor.shutdown();
            }

            return projectRepository.findById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
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
