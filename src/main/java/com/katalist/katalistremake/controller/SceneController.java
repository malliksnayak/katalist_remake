package com.katalist.katalistremake.controller;

import com.katalist.katalistremake.model.Scene;
import com.katalist.katalistremake.repository.SceneRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/scenes")
public class SceneController {

    private final SceneRepository sceneRepository;

    public SceneController(SceneRepository sceneRepository) {
        this.sceneRepository = sceneRepository;
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Scene> updateScene(@PathVariable String id, @RequestBody Scene updates) {
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
    public ResponseEntity<Void> deleteScene(@PathVariable String id) {
        log.info("Deleting scene {}", id);
        if (sceneRepository.existsById(id)) {
            sceneRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
