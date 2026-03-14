package com.katalist.katalistremake.service.visual;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.List;

@Slf4j
@Service
public class RunPodVisualProvider implements VisualProvider {

    private final RestClient restClient;

    public RunPodVisualProvider(
            @Value("${runpod.api.url}") String apiUrl,
            @Value("${runpod.api.key}") String apiKey) {
        this.restClient = RestClient.builder()
                .baseUrl(apiUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    @Override
    public String generateImage(String prompt) throws Exception {
        log.info("Requesting image from RunPod for prompt: {}", prompt);

        Map<String, Object> input = Map.of(
                "prompt", prompt,
                "negative_prompt", "blurry, low quality, deformed, ugly",
                "height", 512,
                "width", 512,
                "num_inference_steps", 4,
                "guidance_scale", 0.0,
                "seed", 1337,
                "num_images", 1
        );

        Map<String, Object> body = Map.of("input", input);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.containsKey("output")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> output = (Map<String, Object>) response.get("output");
                if (output != null && output.containsKey("images")) {
                    @SuppressWarnings("unchecked")
                    List<Object> images = (List<Object>) output.get("images");
                    if (images != null && !images.isEmpty()) {
                        Object firstImageObj = images.get(0);
                        String fullImage = null;

                        if (firstImageObj instanceof String) {
                            fullImage = (String) firstImageObj;
                        } else if (firstImageObj instanceof Map) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> imgMap = (Map<String, Object>) firstImageObj;
                            fullImage = (String) imgMap.get("image");
                        }

                        if (fullImage != null) {
                            // Base64 from RunPod might include the prefix "data:image/png;base64,"
                            if (fullImage.startsWith("data:")) {
                                return fullImage.substring(fullImage.indexOf(",") + 1);
                            }
                            return fullImage;
                        }
                    }
                }
            }
            log.error("RunPod response: {}", response);
            throw new RuntimeException("Unexpected response format from RunPod");
        } catch (Exception e) {
            log.error("RunPod image generation failed", e);
            throw e;
        }
    }
}
