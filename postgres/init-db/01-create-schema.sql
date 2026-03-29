-- Create Tables for Katalist Asset Generator (MVP Refactor)

-- 1. Projects table
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255),
    original_story TEXT,
    visual_style VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Scenes table
CREATE TABLE IF NOT EXISTS scenes (
    id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL,
    order_index INT,
    audio_script TEXT,
    duration_seconds INT,
    image_prompt TEXT,
    
    -- Assets (Stored directly in the entity)
    audio_base64 TEXT,
    audio_mime_type VARCHAR(255),
    voice VARCHAR(255),
    image_base64 TEXT,
    image_mime_type VARCHAR(255),
    
    CONSTRAINT fk_scene_project 
      FOREIGN KEY (project_id) 
      REFERENCES projects(id) 
      ON DELETE CASCADE
);

-- Ensure default project exists for testing if needed
-- INSERT INTO projects (id, title, original_story, visual_style) 
-- VALUES ('demo-project', 'Welcome to Katalist', 'A default starter story.', 'Photorealistic');
