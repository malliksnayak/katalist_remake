package com.katalist.katalistremake.controller;

import com.katalist.katalistremake.model.Scene;
import com.katalist.katalistremake.repository.SceneRepository;
import jakarta.annotation.Nonnull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;

@Slf4j
@RestController
@RequestMapping("/api/v1/scenes")
public class SceneController {

    private final SceneRepository sceneRepository;

    public SceneController(SceneRepository sceneRepository) {
        this.sceneRepository = sceneRepository;
    }

    @GetMapping("/{id}/audio")
    public ResponseEntity<byte[]> getAudio(@PathVariable @Nonnull String id) {
        return sceneRepository.findById(id).map(scene -> {
            String audioBase64 = scene.getAudioBase64();
            if (audioBase64 == null) {
                return ResponseEntity.noContent().<byte[]>build();
            }
            byte[] data = Base64.getDecoder().decode(audioBase64);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, scene.getAudioMimeType() != null ? scene.getAudioMimeType() : "audio/wav")
                    .body(data);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> getImage(@PathVariable @Nonnull String id) {
        return sceneRepository.findById(id).map(scene -> {
            String imageBase64 = scene.getImageBase64();
            if (imageBase64 == null) {
                return ResponseEntity.noContent().<byte[]>build();
            }
            byte[] data = Base64.getDecoder().decode(imageBase64);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, scene.getImageMimeType() != null ? scene.getImageMimeType() : "image/png")
                    .body(data);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}")
    @SuppressWarnings("null")
    public ResponseEntity<Scene> updateScene(@PathVariable @Nonnull String id, @RequestBody @Nonnull Scene updates) {
        log.info("Updating scene {}: {}", id, updates);
        return sceneRepository.findById(id).map(scene -> {
            if (updates.getAudioScript() != null) {
                scene.setAudioScript(updates.getAudioScript());
            }
            if (updates.getImagePrompt() != null) {
                scene.setImagePrompt(updates.getImagePrompt());
            }
            if (updates.getDurationSeconds() > 0) {
                scene.setDurationSeconds(updates.getDurationSeconds());
            }
            Scene saved = sceneRepository.save(scene);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteScene(@PathVariable @Nonnull String id) {
        log.info("Deleting scene {}", id);
        if (sceneRepository.existsById(id)) {
            sceneRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
