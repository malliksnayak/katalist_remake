package com.katalist.katalistremake.service.visual.strategies;

import java.util.Map;

public interface ImageGenerationStrategy {
    String getModelName();
    String getEndpointUrl();
    Map<String, Object> buildPayload(String prompt);
    String extractImage(Object output);
}
