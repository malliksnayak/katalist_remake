package com.katalist.katalistremake.controller;

import com.katalist.katalistremake.model.Image;
import com.katalist.katalistremake.repository.ImageRepository;
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
    private final ImageRepository imageRepository;

    public ImageController(VisualProvider visualProvider,
                           SceneRepository sceneRepository,
                           ImageRepository imageRepository) {
        this.visualProvider = visualProvider;
        this.sceneRepository = sceneRepository;
        this.imageRepository = imageRepository;
    }

    @PostMapping(produces = "application/json")
    public ResponseEntity<Map<String, String>> generateImage(@RequestBody Map<String, Object> request) {
        String prompt = (String) request.get("prompt");
        String sceneId = (String) request.get("sceneId");
        boolean force = request.get("force") != null && (boolean) request.get("force");

        if (prompt == null || prompt.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            String base64Image = processImageGeneration(sceneId, prompt, force);
            return ResponseEntity.ok(Map.of("imageBase64", base64Image));
        } catch (Exception e) {
            log.error("Failed to generate image", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    public String processImageGeneration(String sceneId, String prompt, boolean force) throws Exception {
        // 1. Check if we already have this image in the database (unless forcing)
        if (!force && sceneId != null && !sceneId.isEmpty()) {
            log.info("Checking database for existing image (Scene ID: {})", sceneId);
            var existingImage = imageRepository.findBySceneId(sceneId);
            if (existingImage.isPresent() && existingImage.get().getImageBase64() != null) {
                log.info("DATABASE MATCH: Image found for Scene {}. Skipping generation.", sceneId);
                return existingImage.get().getImageBase64();
            }
            log.info("DATABASE MISS: No image found for Scene {} in DB.", sceneId);
        }

        // 2. Not found, no sceneId, or forced, so generate new
        log.info("Generating image for Scene {}. Force='{}'...", sceneId, force);
        String base64Image = visualProvider.generateImage(prompt);

        // 3. Save/Update to DB if sceneId is present
        if (sceneId != null && !sceneId.isEmpty()) {
            sceneRepository.findById(sceneId).ifPresent(scene -> {
                Image image = imageRepository.findBySceneId(sceneId)
                        .orElse(Image.builder().scene(scene).build());

                image.setImageBase64(base64Image);
                image.setMimeType("image/png");
                imageRepository.save(image);
                log.info("Persisted image to Database for Scene {}", sceneId);
            });
        }

        return base64Image;
    }
}
