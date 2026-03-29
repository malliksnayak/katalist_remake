package com.katalist.katalistremake.controller;

import com.katalist.katalistremake.model.Scene;
import com.katalist.katalistremake.repository.SceneRepository;
import com.katalist.katalistremake.service.visual.VisualProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/images")
public class ImageController {

    private final VisualProvider visualProvider;
    private final SceneRepository sceneRepository;

    public ImageController(VisualProvider visualProvider,
                           SceneRepository sceneRepository) {
        this.visualProvider = visualProvider;
        this.sceneRepository = sceneRepository;
    }

    @PostMapping(produces = "application/json")
    public ResponseEntity<Map<String, String>> generateImage(@RequestBody Map<String, Object> request) {
        String sceneId = (String) request.get("sceneId");
        String model = (String) request.getOrDefault("model", "FLUX");
        boolean force = request.get("force") != null && (boolean) request.get("force");

        log.info("=== [MVP IMAGE] Request for Scene {} ===", sceneId);

        if (sceneId == null || sceneId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        return sceneRepository.findById(sceneId).map(scene -> {
            try {
                // 1. Check for existing
                if (!force && scene.getImageBase64() != null) {
                    log.info("Image already exists for scene {}, skipping.", sceneId);
                    return ResponseEntity.ok(Map.of("imageBase64", scene.getImageBase64()));
                }

                // 2. Generate
                log.info("Generating image for scene {} using prompt: {}...", sceneId, scene.getImagePrompt());
                String base64Image = visualProvider.generateImage(scene.getImagePrompt(), model);

                // 3. Save
                scene.setImageBase64(base64Image);
                scene.setImageMimeType("image/png");
                sceneRepository.save(scene);

                return ResponseEntity.ok(Map.of("imageBase64", base64Image));
            } catch (Exception e) {
                log.error("Image generation failed", e);
                return ResponseEntity.internalServerError().<Map<String, String>>build();
            }
        }).orElse(ResponseEntity.notFound().build());
    }
}

