package com.katalist.katalistremake.controller;

import com.katalist.katalistremake.model.Project;
import com.katalist.katalistremake.repository.ProjectRepository;
import com.katalist.katalistremake.service.ScriptService;

import jakarta.annotation.Nonnull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
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

    public ProjectController(ScriptService scriptService,
            ProjectRepository projectRepository) {
        this.scriptService = scriptService;
        this.projectRepository = projectRepository;
        log.info("ProjectController MVP online.");
    }

    @PostMapping(value = "/generate", produces = "application/json")
    public ResponseEntity<Project> createStoryboard(@RequestBody Map<String, String> request) {
        String story = request.get("story");
        String visualStyle = request.get("visualStyle");

        String voice = request.getOrDefault("voice", "af_bella");
        log.info("=== [MVP REQUEST] POST /api/v1/projects/generate ===");

        if (story == null || story.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            Project newProject = scriptService.generateStoryboard(story, visualStyle, voice);
            return ResponseEntity.ok(newProject);
        } catch (IOException e) {
            log.error("Generation failed: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects() {
        return ResponseEntity.ok(projectRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getProjectById(@PathVariable @Nonnull String id) {
        if (id == null || id.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        return projectRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}")
    @SuppressWarnings("null")
    public ResponseEntity<Project> updateProject(@PathVariable String id, @RequestBody Project updates) {
        if (id == null || id.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return projectRepository.findById(id)
                .map(project -> {
                    if (updates.getTitle() != null)
                        project.setTitle(updates.getTitle());
                    if (updates.getVisualStyle() != null)
                        project.setVisualStyle(updates.getVisualStyle());
                    Project savedProject = projectRepository.save(project);
                    return ResponseEntity.ok(savedProject);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/export")
    public void exportProject(@PathVariable @NonNull String id, jakarta.servlet.http.HttpServletResponse response)
            throws IOException {
        Project project = projectRepository.findById(id).orElseThrow(() -> new IOException("Project not found"));

        response.setContentType("application/zip");
        response.setHeader("Content-Disposition", "attachment; filename=\"project_" + id + ".zip\"");

        try (java.util.zip.ZipOutputStream zos = new java.util.zip.ZipOutputStream(response.getOutputStream())) {
            List<com.katalist.katalistremake.model.Scene> scenes = project.getScenes();
            scenes.sort(java.util.Comparator.comparingInt(com.katalist.katalistremake.model.Scene::getOrderIndex));

            for (int i = 0; i < scenes.size(); i++) {
                com.katalist.katalistremake.model.Scene scene = scenes.get(i);
                String sequence = String.format("%02d", i + 1);

                // Add Image
                if (scene.getImageBase64() != null) {
                    byte[] imageData = java.util.Base64.getDecoder().decode(scene.getImageBase64());
                    java.util.zip.ZipEntry imgEntry = new java.util.zip.ZipEntry("scene_" + sequence + ".png");
                    zos.putNextEntry(imgEntry);
                    zos.write(imageData);
                    zos.closeEntry();
                }

                // Add Audio
                if (scene.getAudioBase64() != null) {
                    byte[] audioData = java.util.Base64.getDecoder().decode(scene.getAudioBase64());
                    java.util.zip.ZipEntry audioEntry = new java.util.zip.ZipEntry("scene_" + sequence + ".wav");
                    zos.putNextEntry(audioEntry);
                    zos.write(audioData);
                    zos.closeEntry();
                }
            }
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable String id) {
        if (id == null || id.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (projectRepository.existsById(id)) {
            projectRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
