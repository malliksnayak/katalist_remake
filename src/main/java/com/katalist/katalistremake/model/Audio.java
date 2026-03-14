package com.katalist.katalistremake.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
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
@Table(name = "audios")
public class Audio {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne
    @JoinColumn(name = "scene_id", nullable = false)
    @JsonBackReference
    private Scene scene;

    @Column(columnDefinition = "TEXT")
    private String audioBase64;
    
    private String mimeType;
}
