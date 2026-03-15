package com.katalist.katalistremake.service.visual.strategies;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.net.URI;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class FluxStrategy implements ImageGenerationStrategy {

    @Value("${runpod.api.flux.url}")
    private String endpointUrl;

    @Override
    public String getModelName() {
        return "FLUX";
    }

    @Override
    public String getEndpointUrl() {
        return endpointUrl;
    }

    @Override
    public Map<String, Object> buildPayload(String prompt) {
        return Map.of(
                "input", Map.of(
                        "prompt", prompt,
                        "seed", -1,
                        "num_inference_steps", 4,
                        "guidance", 7,
                        "negative_prompt", "",
                        "image_format", "png",
                        "width", 1024,
                        "height", 768));
    }

    @Override
    @SuppressWarnings("unchecked")
    public String extractImage(Object output) {
        if (output == null) return null;

        String url = null;
        if (output instanceof String) {
            url = (String) output;
        } else if (output instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) output;
            Object imageUrl = map.get("image_url");
            if (imageUrl instanceof String) {
                url = (String) imageUrl;
            } else if (imageUrl instanceof List && !((List<?>) imageUrl).isEmpty()) {
                url = String.valueOf(((List<?>) imageUrl).get(0));
            }
        }

        if (url == null || url.isBlank()) {
            return null;
        }

        log.info("Downloading image from URL: {}", url);
        try (InputStream in = new URI(url).toURL().openStream()) {
            byte[] bytes = in.readAllBytes();
            return Base64.getEncoder().encodeToString(bytes);
        } catch (Exception e) {
            log.error("Failed to download and encode image from: {}", url, e);
            throw new RuntimeException("Failed to download image from URL: " + url, e);
        }
    }
}
