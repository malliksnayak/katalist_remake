package com.katalist.katalistremake.controller;

import com.katalist.katalistremake.model.Audio;
import com.katalist.katalistremake.repository.AudioRepository;
import com.katalist.katalistremake.repository.SceneRepository;
import com.katalist.katalistremake.service.narration.NarrationProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/audio")
public class AudioController {

    private final NarrationProvider narrationProvider;
    private final SceneRepository sceneRepository;
    private final AudioRepository audioRepository;

    public AudioController(NarrationProvider narrationProvider, 
                           SceneRepository sceneRepository,
                           AudioRepository audioRepository) {
        this.narrationProvider = narrationProvider;
        this.sceneRepository = sceneRepository;
        this.audioRepository = audioRepository;
    }

    @PostMapping(produces = "application/json")
    public ResponseEntity<Map<String, String>> generateAudio(@RequestBody Map<String, Object> request) {
        String text = (String) request.get("text");
        String voice = (String) request.getOrDefault("voice", "af_bella");
        String sceneId = (String) request.get("sceneId"); 
        boolean force = request.get("force") != null && (boolean) request.get("force");

        if (text == null || text.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            String base64Audio = processAudioGeneration(sceneId, text, voice, force);
            // We return base64 directly or a message saying success. 
            // Since the user wants to decode from DB, returning base64 here is a good immediate feedback.
            return ResponseEntity.ok(Map.of("audioBase64", base64Audio));
        } catch (Exception e) {
            log.error("Failed to generate audio", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    public String processAudioGeneration(String sceneId, String text, String voice, boolean force) throws Exception {
        // 1. Check if we already have this audio in the database (unless forcing)
        if (!force && sceneId != null && !sceneId.isEmpty()) {
            log.info("Checking database for existing audio (Scene ID: {})", sceneId);
            var existingAudio = audioRepository.findBySceneId(sceneId);
            if (existingAudio.isPresent() && existingAudio.get().getAudioBase64() != null) {
                log.info("DATABASE MATCH: Audio found for Scene {}. Skipping generation.", sceneId);
                return existingAudio.get().getAudioBase64();
            }
            log.info("DATABASE MISS: No audio found for Scene {} in DB.", sceneId);
        }

        // 2. Not found, no sceneId, or forced, so generate new
        log.info("Generating audio for Scene {}. Force='{}'...", sceneId, force);
        byte[] audioData = narrationProvider.generateAudio(text, voice);
        String base64Audio = Base64.getEncoder().encodeToString(audioData);
        
        // 3. Save/Update to DB if sceneId is present
        if (sceneId != null && !sceneId.isEmpty()) {
            sceneRepository.findById(sceneId).ifPresent(scene -> {
                Audio audio = audioRepository.findBySceneId(sceneId)
                        .orElse(Audio.builder().scene(scene).build());
                
                audio.setAudioBase64(base64Audio);
                audio.setMimeType("audio/wav");
                audioRepository.save(audio);
                log.info("Persisted audio to Database for Scene {}", sceneId);
            });
        }
        
        return base64Audio;
    }
}
