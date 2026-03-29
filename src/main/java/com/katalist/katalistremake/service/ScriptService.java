package com.katalist.katalistremake.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.katalist.katalistremake.model.Project;
import com.katalist.katalistremake.model.Scene;
import com.katalist.katalistremake.repository.ProjectRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Slf4j
@Service
public class ScriptService {

    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;
    private final ProjectRepository projectRepository;

    public ScriptService(ChatClient.Builder chatClientBuilder,
            ObjectMapper objectMapper,
            ProjectRepository projectRepository) {
        this.chatClient = chatClientBuilder.build();
        this.objectMapper = objectMapper;
        this.projectRepository = projectRepository;
    }

    public Project generateStoryboard(String redditStory, String visualStyle, String voice) throws IOException {
        log.info("=== [AI REQUEST] Generating storyboard MVP ===");

        String finalStyle = (visualStyle == null || visualStyle.isBlank())
                ? "Cinematic, high-quality, photorealistic"
                : visualStyle;

        String systemPrompt = "Act as a professional scriptwriter and storyboard artist. " +
                "Break the following story into a high-granularity storyboard. " +
                "Each scene MUST represent a small, specific chronological window. " +
                "CRITICAL: You MUST use the EXACT original sentences from the story for each scene's audioScript. " +
                "DO NOT rewrite, DO NOT summarize, and DO NOT skip any part of the provided text. " +
                "Every single word from the input MUST be preserved verbatim in the resulting storyboard. " +
                "If there are numbers give the output in terms on fowrds spelling the number for good narration (e.g. 100 -> one hundred). "
                +
                "The narration (audioScript) for each scene must be short—around 2 sentences (approx. 15-20 seconds of speech). "
                +
                "For each scene, provide a highly detailed, distinct image generation prompt " +
                "reflecting this visual style: " + finalStyle + ". " +
                "Output ONLY a JSON array of objects. Each object MUST have exactly two keys: 'audioScript' and 'imagePrompt'. "
                +
                "Return ONLY raw JSON without markdown formatting.";

        String userPrompt = "Story: " + redditStory;

        try {
            log.info("Requesting LLM with story ({} chars)...", redditStory.length());
            String rawResponse = chatClient.prompt()
                    .system(systemPrompt)
                    .user(userPrompt)
                    .call()
                    .content();

            if (rawResponse == null || rawResponse.isBlank()) {
                throw new IOException("Empty response from AI");
            }

            String sanitised = rawResponse.replaceAll("(?s)```json\\s*", "").replaceAll("```", "").trim();

            Scene[] sceneDTOs = objectMapper.readValue(sanitised, Scene[].class);

            Project project = new Project();
            project.setOriginalStory(redditStory);
            project.setVisualStyle(finalStyle);
            project.setVoice(voice != null ? voice : "af_bella");

            String firstLine = redditStory.split("\n")[0];
            project.setTitle(firstLine.substring(0, Math.min(firstLine.length(), 50)));

            for (int i = 0; i < sceneDTOs.length; i++) {
                Scene scene = sceneDTOs[i];
                scene.setOrderIndex(i);
                project.addScene(scene);
            }

            Project savedProject = projectRepository.save(project);
            log.info("Saved Project {} with {} scenes", savedProject.getId(), savedProject.getScenes().size());
            return savedProject;

        } catch (Exception e) {
            log.error("AI Generation failed: {}", e.getMessage());
            throw new IOException("Failed to generate storyboard: " + e.getMessage(), e);
        }
    }
}
