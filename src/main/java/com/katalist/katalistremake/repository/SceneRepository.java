package com.katalist.katalistremake.repository;

import com.katalist.katalistremake.model.Scene;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SceneRepository extends JpaRepository<Scene, String> {
    List<Scene> findByProjectIdOrderByOrderIndexAsc(String projectId);
}
