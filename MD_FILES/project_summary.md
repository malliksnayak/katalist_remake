# Katalist Remake - Application Summary

## Overview
**Katalist Remake** is a Spring Boot application designed to take plain text stories (like Reddit posts) and automatically generate structural storyboards for videos. It acts as an integration layer between user requests and advanced AI models (currently using OpenRouter.ai to access LLMs like Llama 3 or Gemini).

## Core Capabilities

1. **Storyboard Generation Endpoint**
   - **Endpoint:** `POST /api/v1/storyboard/generate`
   - **Input Payload:** JSON object containing a `"story"` key (e.g., `{"story": "History Mystery: The Roanoke Colony..."}`)
   - **Output:** Returns a structured JSON representation of a video storyboard (`Storyboard` object containing a list of `Scene` objects).

2. **AI Integration (OpenRouter + Spring AI)**
   - Uses the `spring-ai-openai-spring-boot-starter` to communicate with **OpenRouter.ai**.
   - Fully configured in `application.properties` (using environment variables like `OPENROUTER_API_KEY`).
   - Translates text to a highly structured JSON array without markdown wrapping.

3. **Externalized AI Prompts**
   - The prompt given to the AI is not hardcoded in Java. Instead, it is loaded dynamically from `src/main/resources/prompts/storyboard.txt` at application startup.
   - This makes tweaking and tuning the AI persona and output format much easier without recompiling code.

## Data Models (Lombok-powered)
- **`Storyboard`**: Contains a `title` and a list of `Scene` objects.
- **`Scene`**: Represents a single shot in the video, consisting of:
  - `sceneOrder`: Sequence identifier.
  - `visualDescription`: A detailed description of the physical scene.
  - `audioScript`: What the narrator/characters are saying.
  - `durationSeconds`: Estimated timing for the scene.
  - `imagePrompt`: A distilled text-to-image prompt tailored for tools like Midjourney or DALL-E.

## Technical Stack & Configuration
- **Java 17** & **Spring Boot 3.2.3**
- **Lombok (v1.18.38)**: Upgraded explicitly to avoid compatibility issues (`TypeTag::UNKNOWN`) with Oracle JDK 17.0.13.
- **Detailed SLF4J Logging**: Configured to show the full lifecycle of a request:
  - Controller receiving the payload.
  - The exact Prompt text sent to the AI.
  - The elapsed time and raw textual response received from the LLM.
  - Serialization outcomes.
