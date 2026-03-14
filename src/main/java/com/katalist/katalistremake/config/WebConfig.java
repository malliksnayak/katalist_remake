package com.katalist.katalistremake.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Map URLs starting with /media/ to the local media directory
        String mediaPath = Paths.get("media").toAbsolutePath().toUri().toString();
        registry.addResourceHandler("/media/**")
                .addResourceLocations(mediaPath);
    }
}
