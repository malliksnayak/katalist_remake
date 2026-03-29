package com.katalist.katalistremake.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@JsonIgnoreProperties(ignoreUnknown = true)
@Table(name = "scenes")
public class Scene {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @JsonBackReference
    private Project project;

    private int orderIndex;
    
    @Column(columnDefinition = "TEXT")
    private String audioScript;
    
    private int durationSeconds;
    
    @Column(columnDefinition = "TEXT")
    private String imagePrompt;

    // AUDIO ASSETS (Merged)
    @Column(columnDefinition = "TEXT")
    private String audioBase64;
    private String audioMimeType;
    private String voice;

    // IMAGE ASSETS (Merged)
    @Column(columnDefinition = "TEXT")
    private String imageBase64;
    private String imageMimeType;
}