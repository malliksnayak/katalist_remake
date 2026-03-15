package com.katalist.katalistremake.service.visual;

import com.katalist.katalistremake.service.visual.strategies.ImageGenerationStrategy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
public class RunPodVisualProvider implements VisualProvider {

    private final String apiKey;
    private final Map<String, ImageGenerationStrategy> strategies;

    public RunPodVisualProvider(
            @Value("${runpod.api.key}") String apiKey,
            List<ImageGenerationStrategy> strategyList) {
        this.apiKey = apiKey;
        this.strategies = strategyList.stream()
                .collect(Collectors.toMap(s -> s.getModelName().toUpperCase(), s -> s));
        log.info("Initialized RunPodVisualProvider with strategies: {}", strategies.keySet());
    }

    @Override
    @SuppressWarnings("unchecked")
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

            return Optional.ofNullable(response)
                    .map(r -> r.get("output"))
                    .map(strategy::extractImage)
                    .map(img -> img.startsWith("data:") ? img.substring(img.indexOf(",") + 1) : img)
                    .orElseThrow(() -> {
                        log.error("RunPod response: {}", response);
                        return new RuntimeException("Unexpected response format from RunPod for model " + strategy.getModelName());
                    });
        } catch (Exception e) {
            log.error("RunPod image generation failed for model {}", strategy.getModelName(), e);
            throw e;
        }
    }
}
