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
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;
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
            log.info("Checking database for existing audio (Scene ID: {}, Voice: {})", sceneId, voice);
            var existingAudio = audioRepository.findBySceneId(sceneId);
            if (existingAudio.isPresent()) {
                Audio audio = existingAudio.get();
                if (audio.getAudioBase64() != null && voice.equals(audio.getVoice())) {
                    log.info("DATABASE MATCH: Audio found for Scene {} with Voice {}. Skipping generation.", sceneId, voice);
                    return audio.getAudioBase64();
                } else if (audio.getAudioBase64() != null) {
                    log.info("DATABASE VOICE MISMATCH: Scene {} has voice {}, but {} requested. Regenerating.", 
                        sceneId, audio.getVoice(), voice);
                }
            } else {
                log.info("DATABASE MISS: No audio found for Scene {} in DB.", sceneId);
            }
        }

        // 2. Not found, no sceneId, voice mismatch, or forced, so generate new
        log.info("Generating audio for Scene {}. Voice='{}', Force='{}'...", sceneId, voice, force);
        byte[] audioData = narrationProvider.generateAudio(text, voice);
        String base64Audio = Base64.getEncoder().encodeToString(audioData);
        
        // 3. Save/Update to DB if sceneId is present
        if (sceneId != null && !sceneId.isEmpty()) {
            sceneRepository.findById(sceneId).ifPresent(scene -> {
                Audio audio = audioRepository.findBySceneId(sceneId)
                        .orElse(Audio.builder().scene(scene).build());
                
                audio.setAudioBase64(base64Audio);
                audio.setMimeType("audio/wav");
                audio.setVoice(voice); // Store the voice used
                audioRepository.save(audio);
                log.info("Persisted audio to Database for Scene {}", sceneId);
            });
        }
        
        return base64Audio;
    }

    @GetMapping("/voices")
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> getVoices(@Value("${kokoro.service.url}") String serviceUrl) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            // Assuming kokoro service serves voices at /voices (base url minus /audio)
            String voicesUrl = serviceUrl.replace("/audio", "/voices");
            Map<String, Object> body = restTemplate.getForObject(voicesUrl, Map.class);
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            log.error("Failed to fetch voices from Kokoro service", e);
            // Fallback default list
            return ResponseEntity.ok(Map.of("available_voices", new String[]{"af_bella","af_sarah","am_adam","am_michael"}));
        }
    }
}
