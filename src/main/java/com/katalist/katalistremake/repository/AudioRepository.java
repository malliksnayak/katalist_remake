package com.katalist.katalistremake.repository;

import com.katalist.katalistremake.model.Audio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AudioRepository extends JpaRepository<Audio, String> {
    Optional<Audio> findBySceneId(String sceneId);
}
