# Agent Task: Build Katalist Remake Dashboard

## Tech Stack
- Framework: Next.js 14+ (App Router)
- Styling: Tailwind CSS + shadcn/ui
- State Management: React Query (for API sync)
- Icons: Lucide React

## Dashboard Layout Requirements
1. **Navigation Sidebar**: Home, Projects, Assets, Settings.
2. **Main Workspace**:
   - **Top Bar**: Project title, "Generate All Assets" button, and "Export to Revideo" button.
   - **Two-Column Layout**:
     - **Left (40%)**: Input area for the Reddit story + "Generate Storyboard" trigger.
     - **Right (60%)**: A scrollable vertical feed of Scene Cards.

## Component Specifications: Scene Card
Each card represents a `Scene` object from our Java backend and must include:
- **Header**: Scene Number + Duration.
- **Visual Section**: A placeholder square for the image. Add a "Regenerate Image" button.
- **Audio Section**: An editable text area for `audioScript` + a "Play Audio" button (to call our Kokoro service).
- **Prompt Section**: A collapsible text area for the `imagePrompt`.

## API Integration Mockup
- `POST /api/v1/storyboard/generate`: Triggered by the Input area.
- `POST /api/v1/audio`: Triggered by the "Play Audio" button on a card.
- `GET /api/v1/projects/{id}`: To load existing storyboards.

## Action Steps for Agent
1. Setup a clean Next.js project with shadcn/ui components (Card, Button, Textarea, ScrollArea).
2. Create the `StoryboardView` page that maps through the `scenes` JSON.
3. Implement a "Skeleton Loader" for when the LLM is thinking/generating the storyboard.


# UI-to-Backend Connection Specification

## 1. Backend Integration Strategy
The UI is a Next.js application that will eventually be served as static content from the Spring Boot `src/main/resources/static` directory. 

## 2. API Connection Details
- **Base URL**: All API calls should use a relative path `/api/v1` or an environment variable `NEXT_PUBLIC_API_URL`.
- **CORS Requirements**: During development, the Spring Boot backend must allow requests from `http://localhost:3000`.
- **Content-Type**: All requests and responses must use `application/json`.

## 3. Core API Endpoints
The AI agent must implement the following connections using `fetch` or `React Query`:

### A. Generate Storyboard
- **Endpoint**: `POST /api/v1/storyboard/generate`
- **Request Body**: `{"story": string}`
- **Expected Response**: 
  ```json
  {
    "title": "String",
    "scenes": [
      {
        "sceneOrder": number,
        "visualDescription": "string",
        "audioScript": "string",
        "durationSeconds": number,
        "imagePrompt": "string"
      }
    ]
  }

### B. Generate Audio
- **Endpoint**: `POST /api/v1/audio`
- **Request Body**: `{"text": string, "voice": string}`
- **Expected Response**: `byte[]` (audio file)

### C. Get Project
- **Endpoint**: `GET /api/v1/projects/{id}`
- **Expected Response**: `Project` object
