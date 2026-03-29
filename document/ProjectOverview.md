# Katalist Backend API Reference (Refactored MVP)

This document provides a complete guide for building a modern frontend on top of the Katalist Asset Generator.

---

## 🏗️ 1. Project Management
Handling the overarching storyboards and content generation.

### **Generate Complete Storyboard (AI)**
`POST /api/v1/projects/generate`
- **Body**: `{ "story": "...", "visualStyle": "..." }`
- **Action**: Converts raw text into structured scenes (scripts and image prompts).
- **Strategy**: Start your UI workflow here! It returns the full `Project` with newly created `Scene` objects.

### **List All Projects**
`GET /api/v1/projects`
- **Action**: Fetch metadata for every project in the system.
- **UI Use**: Display the dashboard/history view.

### **Fetch Project Detail**
`GET /api/v1/projects/{id}`
- **Action**: Returns a project with all its associated scenes (ordered by `orderIndex`).
- **UI Use**: Deep-dive view of a single storyboard.

### **Update/Delete Project**
`PATCH /api/v1/projects/{id}` | `DELETE /api/v1/projects/{id}`
- **Action**: Edit title/style or permanently remove content.

---

## 🎙️ 2. Audio & Narration
Managing the voiceovers for your scenes.

### **Trigger Audio Cogeneration**
`POST /api/v1/audio`
- **Body**: `{ "sceneId": "...", "voice": "...", "force": false }`
- **Action**: Generates (and saves) a narration for the specific scene.
- **UI Use**: Trigger a "Generate Audio" button for a scene.

### **Fetch Binary Audio Stream**
`GET /api/v1/scenes/{id}/audio`
- **Result**: Binary stream of the audio (`audio/wav`).
- **Strategy (Performance)**: Use this as the `src` attribute in your `<audio>` tags. Do **not** use Base64 for the primary player to keep the UI snappy!

### **List Available Voices**
`GET /api/v1/audio/voices`
- **Action**: Returns a list of strings for supported TTS voices (e.g., `af_bella`, `am_adam`).

---

## 🖼️ 3. Image & Visuals
Managing the AI-generated graphics for your scenes.

### **Trigger Image Generation**
`POST /api/v1/images`
- **Body**: `{ "sceneId": "...", "model": "FLUX", "force": false }`
- **Action**: Generates (and saves) a high-quality visual for the scene.
- **UI Use**: Trigger a "Generate Image" or "Re-roll Image" button.

### **Fetch Binary Image Stream**
`GET /api/v1/scenes/{id}/image`
- **Result**: Binary stream of the PNG image (`image/png`).
- **Strategy (Performance)**: Point your `<img>` tags here directly. It handles caching better than huge JSON payloads.

---

## 🎞️ 4. Scene Management
Granular control over specific segments of your storyboard.

### **Update Scene Metadata**
`PATCH /api/v1/scenes/{id}`
- **Body**: `{ "audioScript": "...", "imagePrompt": "...", "orderIndex": 0 }`
- **Action**: Allows users to manually tweak AI-suggested scripts or prompts.
- **UI Use**: Inline editing of scene content or drag-and-drop reordering.

### **Delete Single Scene**
`DELETE /api/v1/scenes/{id}`
- **Action**: Removes a single scene from a project.

---

## 💡 Frontend Architecture Tips (Performance)

1.  **Lazy Loading**:
    Always fetch the project metadata first (`GET /api/v1/projects/{id}`). 
    The `Scene` objects in the response will tell you if an asset has already been generated (check if `audioMimeType` or `imageMimeType` are present). 
    If they are, simply render an `<img>` or `<audio>` tag pointing to the binary endpoints:
    ```html
    <img src="/api/v1/scenes/{id}/image" loading="lazy" />
    ```

2.  **Polling/Realtime**:
    Since Generation (Audio/Image) can take 5–15 seconds, your UI should show a "Generating..." loader while `POST /api/v1/audio` or `POST /api/v1/images` is running. 
    These calls are now **synchronous** in this MVP, so the request will wait for the result before returning.

3.  **Ordering**:
    Always sort your scenes by the `orderIndex` returned in the JSON!
