package com.katalist.katalistremake.service.narration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.Nonnull;
import java.util.Base64;
import java.util.Objects;
import com.fasterxml.jackson.databind.JsonNode;

@Slf4j
@Service
@ConditionalOnProperty(name = "video.narration.provider", havingValue = "kokoro")
public class KokoroNarrationService implements NarrationProvider {

    @Nonnull
    private final String serviceUrl;
    private final RestTemplate restTemplate;

    public KokoroNarrationService(@Value("${kokoro.service.url}") String serviceUrl) {
        this.serviceUrl = Objects.requireNonNull(serviceUrl);
        this.restTemplate = new RestTemplate();
        log.info("Started KokoroNarrationService with URL: {}", serviceUrl);
    }

    @Override
    public byte[] generateAudio(String text, String voice) {
        log.debug("Generating audio via Kokoro for text: '{}' using voice: {}", 
                   text.length() > 50 ? text.substring(0, 50) + "..." : text, voice);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        KokoroRequest requestBody = new KokoroRequest(text, voice, 1.0, "en-us");
        HttpEntity<KokoroRequest> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<JsonNode> response = restTemplate.postForEntity(serviceUrl, request, JsonNode.class);
            
            JsonNode body = response.getBody();
            if (response.getStatusCode().is2xxSuccessful() && body != null) {
                
                // Assuming standard FastAPI bridge response containing "base64" key mapped to Base64 string.
                JsonNode audioNode = body.get("audio");
                if (audioNode == null) {
                    audioNode = body.get("audio_base64");
                }
                if (audioNode == null) {
                    audioNode = body.get("base64");
                }
                
                if (audioNode != null && audioNode.isTextual()) {
                    return Base64.getDecoder().decode(audioNode.asText());
                } else {
                    log.error("Unknown response format from Kokoro: missing audio key or not a string. Body: {}", body);
                    throw new RuntimeException("Missing 'audio', 'audio_base64' or 'base64' string in Kokoro JSON response.");
                }
            } else {
                log.error("Kokoro service HTTP error: {}", response.getStatusCode());
                throw new RuntimeException("Failed to generate audio from Kokoro provider.");
            }
        } catch (Exception e) {
            log.error("Exception communicating with Kokoro TTS", e);
            throw new RuntimeException("Error executing TTS generation", e);
        }
    }

    @Override
    public String getProviderName() {
        return "kokoro";
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class KokoroRequest {
        private String text;
        private String voice;
        private double speed;
        private String lang;
    }
}
