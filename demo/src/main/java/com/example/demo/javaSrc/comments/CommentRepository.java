package com.example.demo.javaSrc.comments;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import jakarta.transaction.Transactional;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    
    List<Comment> findByPetitionId(Long petitionId);
    
    List<Comment> findByUserId(Long userId);

    List<Comment> findByPetitionIdAndUserId(Long petitionId, Long userId);
    
    @Transactional
    void deleteByPetitionId(Long petitionId);
    
    @Transactional
    void deleteByUserId(Long userId);
    
}
