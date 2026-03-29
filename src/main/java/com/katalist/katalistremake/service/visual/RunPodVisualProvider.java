package com.katalist.katalistremake.service.visual;

import com.katalist.katalistremake.service.visual.strategies.ImageGenerationStrategy;
import jakarta.annotation.Nonnull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
public class RunPodVisualProvider implements VisualProvider {

    @Nonnull
    private final String apiKey;
    private final Map<String, ImageGenerationStrategy> strategies;

    public RunPodVisualProvider(
            @Value("${runpod.api.key}") @Nonnull String apiKey,
            List<ImageGenerationStrategy> strategyList) {
        this.apiKey = Objects.requireNonNull(apiKey);
        this.strategies = Objects.requireNonNull(strategyList).stream()
                .collect(Collectors.toMap(s -> s.getModelName().toUpperCase(), s -> s));
        log.info("Initialized RunPodVisualProvider with strategies: {}", strategies.keySet());
    }

    @Override
    @SuppressWarnings({ "unchecked", "null" })
    public String generateImage(String prompt, String model) throws Exception {
        String modelKey = (model == null ? "FLUX" : model).toUpperCase();
        ImageGenerationStrategy strategy = Optional.ofNullable(strategies.get(modelKey))
                .orElseGet(() -> {
                    log.warn("Model '{}' not found, falling back to FLUX", modelKey);
                    return strategies.get("FLUX");
                });

        log.info("Requesting image using model: {} for prompt: {}", strategy.getModelName(), prompt);

        RestClient restClient = RestClient.builder()
                .baseUrl(strategy.getEndpointUrl())
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();

        Map<String, Object> body = strategy.buildPayload(prompt);

        try {
            Map<String, Object> response = restClient.post()
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response == null) {
                throw new RuntimeException("Empty response from RunPod for model " + strategy.getModelName());
            }

            String jobId = (String) response.get("id");
            String status = (String) response.get("status");

            // Polling loop if the job is not initially finished (runsync timeout)
            int retries = 0;
            int maxRetries = 30; // Max 60 seconds of polling
            while (jobId != null && ("IN_QUEUE".equals(status) || "PROCESSING".equals(status)) && retries < maxRetries) {
                log.info("Job {} is still {}, polling again in 2s (Retry {}/{})...", jobId, status, retries + 1, maxRetries);
                Thread.sleep(2000);
                
                String statusUrl = strategy.getEndpointUrl().replace("/runsync", "/status/" + jobId);
                RestClient statusClient = RestClient.builder()
                        .baseUrl(statusUrl)
                        .defaultHeader("Authorization", "Bearer " + apiKey)
                        .defaultHeader("Content-Type", "application/json")
                        .build();

                response = statusClient.get().retrieve().body(Map.class);
                if (response == null) break;
                status = (String) response.get("status");
                retries++;
            }

            if (response != null && "COMPLETED".equals(status)) {
                Object output = response.get("output");
                String image = strategy.extractImage(output);
                if (image != null) {
                    if (image.startsWith("data:")) {
                        return image.substring(image.indexOf(",") + 1);
                    }
                    return image;
                }
            }

            log.error("RunPod final response: {}", response);
            throw new RuntimeException("RunPod job failed or timed out for model " + strategy.getModelName() + " with status: " + status);
        } catch (Exception e) {
            log.error("RunPod image generation failed for model {}", strategy.getModelName(), e);
            throw e;
        }
    }
}
