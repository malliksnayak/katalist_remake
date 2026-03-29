package com.katalist.katalistremake.controller;

import com.katalist.katalistremake.model.Scene;
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

    public AudioController(NarrationProvider narrationProvider, 
                           SceneRepository sceneRepository) {
        this.narrationProvider = narrationProvider;
        this.sceneRepository = sceneRepository;
    }

    @PostMapping(produces = "application/json")
    public ResponseEntity<Map<String, String>> generateAudio(@RequestBody Map<String, Object> request) {
        String sceneId = (String) request.get("sceneId"); 
        String voice = (String) request.getOrDefault("voice", "af_bella");
        boolean force = request.get("force") != null && (boolean) request.get("force");

        log.info("=== [MVP AUDIO] Request for Scene {} ===", sceneId);

        if (sceneId == null || sceneId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        return sceneRepository.findById(sceneId).map(scene -> {
            try {
                // 1. Check for existing (unless forcing)
                if (!force && scene.getAudioBase64() != null && voice.equals(scene.getVoice())) {
                    log.info("Audio already exists for scene {}, skipping.", sceneId);
                    return ResponseEntity.ok(Map.of("audioBase64", scene.getAudioBase64()));
                }

                // 2. Generate
                log.info("Generating audio for scene {} using voice {}...", sceneId, voice);
                byte[] audioData = narrationProvider.generateAudio(scene.getAudioScript(), voice);
                String base64Audio = Base64.getEncoder().encodeToString(audioData);

                // 3. Save
                scene.setAudioBase64(base64Audio);
                scene.setAudioMimeType("audio/wav");
                scene.setVoice(voice);
                sceneRepository.save(scene);

                return ResponseEntity.ok(Map.of("audioBase64", base64Audio));
            } catch (Exception e) {
                log.error("Audio generation failed", e);
                return ResponseEntity.internalServerError().<Map<String, String>>build();
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/preview")
    public ResponseEntity<byte[]> previewAudio(@RequestBody Map<String, String> request) {
        String text = request.getOrDefault("text", "Hello, I am your narrator for this storyboard.");
        String voice = request.getOrDefault("voice", "af_bella");

        log.info("=== [MVP AUDIO] Preview Request for Voice {} ===", voice);

        try {
            byte[] audioData = narrationProvider.generateAudio(text, voice);
            return ResponseEntity.ok()
                    .header("Content-Type", "audio/wav")
                    .body(audioData);
        } catch (Exception e) {
            log.error("Audio preview failed", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/voices")
    public ResponseEntity<Map<String, Object>> getVoices() {
        // Reduced fallback/direct approach for MVP
        return ResponseEntity.ok(Map.of("available_voices", new String[]{"af_bella","af_sarah","am_adam","am_michael"}));
    }
}

