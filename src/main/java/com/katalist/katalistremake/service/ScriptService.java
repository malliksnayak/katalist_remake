package com.katalist.katalistremake.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.katalist.katalistremake.model.Project;
import com.katalist.katalistremake.model.Storyboard;
import com.katalist.katalistremake.repository.ProjectRepository;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
public class ScriptService {

    private static final String PROMPT_PATH = "classpath:prompts/storyboard.txt";

    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;
    private final ResourceLoader resourceLoader;
    private final ProjectRepository projectRepository;

    private String promptTemplate;

    public ScriptService(ChatClient.Builder chatClientBuilder,
                         ObjectMapper objectMapper,
                         ResourceLoader resourceLoader,
                         ProjectRepository projectRepository) {
        this.chatClient = chatClientBuilder.build();
        this.objectMapper = objectMapper;
        this.resourceLoader = resourceLoader;
        this.projectRepository = projectRepository;
    }

    /**
     * Load and cache the prompt template once at startup.
     * Any misconfiguration (e.g. missing file) will fail fast here.
     */
    @PostConstruct
    public void loadPromptTemplate() throws IOException {
        Resource resource = resourceLoader.getResource(PROMPT_PATH);
        try (InputStream is = resource.getInputStream()) {
            promptTemplate = new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
        log.info("Prompt template loaded from '{}' ({} chars).", PROMPT_PATH, promptTemplate.length());
        log.debug("Prompt template content:\n{}", promptTemplate);
    }

    public Project generateStoryboard(String redditStory, String visualStyle) throws IOException {
        log.info("=== [AI REQUEST] Generating storyboard ===");

        log.info("Story input ({} chars): {}", redditStory.length(), redditStory);

        // Fallback style if none provided
        String finalStyle = (visualStyle == null || visualStyle.isBlank()) 
                ? "Cinematic, high-quality, photorealistic" 
                : visualStyle;

        // Substitute placeholders in the template
        String prompt = promptTemplate
                .replace("{story}", redditStory)
                .replace("{style}", finalStyle);
        log.debug("=== [AI PROMPT (after substitution)] ===\n{}", prompt);

        try {
            long startMs = System.currentTimeMillis();

            String rawResponse = chatClient.prompt()
                    .user(prompt)
                    .call()
                    .content();

            long elapsedMs = System.currentTimeMillis() - startMs;
            log.info("=== [AI RESPONSE] Received in {}ms ===", elapsedMs);
            log.debug("Raw AI response:\n{}", rawResponse);

            if (rawResponse == null || rawResponse.isBlank()) {
                log.error("AI returned a null/empty response.");
                throw new IOException("Empty response from AI");
            }

            // Strip markdown fences if the model wrapped JSON anyway
            String sanitised = rawResponse
                    .replaceAll("(?s)```json\\s*", "")
                    .replaceAll("```", "")
                    .trim();

            if (!sanitised.equals(rawResponse.trim())) {
                log.warn("Markdown fences were stripped from AI response.");
            }
            log.debug("Sanitised JSON ({} chars):\n{}", sanitised.length(), sanitised);

            Storyboard storyboard = objectMapper.readValue(sanitised, Storyboard.class);
            log.info("=== [PARSE SUCCESS] Storyboard \"{}\" with {} scene(s) ===",
                    storyboard.getTitle(),
                    storyboard.getScenes() == null ? 0 : storyboard.getScenes().size());

            Project project = new Project();
            project.setTitle(storyboard.getTitle());
            project.setOriginalStory(redditStory);

            if (storyboard.getScenes() != null) {
                for (com.katalist.katalistremake.model.Scene sceneDTO : storyboard.getScenes()) {
                    project.addScene(sceneDTO);
                }
            }

            // Fallback for blank title
            if (project.getTitle() == null || project.getTitle().isBlank()) {
                String firstLine = redditStory.split("\n")[0];
                project.setTitle(firstLine.substring(0, Math.min(firstLine.length(), 50)));
            }

            Project savedProject = projectRepository.save(project);
            log.info("Saved newly generated Project to Database with ID {}", savedProject.getId());

            return savedProject;

        } catch (Exception e) {
            log.error("=== [AI ERROR] Failed to generate storyboard: {} ===", e.getMessage());
            log.error("Stack trace:", e);
            throw new IOException("Failed to generate storyboard: " + e.getMessage(), e);
        }
    }
}
