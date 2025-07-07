package com.example.demo.javaSrc.comments;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CommentService {
    @Autowired
    private CommentRepository commentRepository;
    public CommentService(CommentRepository commentRepository) {
        this.commentRepository = commentRepository;
    }

    public Comment addComment(Comment comment) {
        return commentRepository.save(comment);
    }

    public void deleteComment(Long id) {
        commentRepository.deleteById(id);
    }

    public Comment getComment(Long id) {
        return commentRepository.findById(id).orElse(null);
    }
    public List<Comment> getAllComments() {
        return commentRepository.findAll();
    }
    public List<Comment> getCommentsByPetitionIdAndUserId(Long petitionId, Long userId) {
        return commentRepository.findByPetitionIdAndUserId(petitionId, userId);
    }
    public List<Comment> getCommentsByPetitionId(Long petitionId) {
        return commentRepository.findByPetitionId(petitionId);
    }
    public List<Comment> getCommentsByUserId(Long userId) {
        return commentRepository.findByUserId(userId);
    }
    public void deleteCommentsByPetitionId(Long petitionId) {
        commentRepository.deleteByPetitionId(petitionId);
    }
    public void deleteCommentsByUserId(Long userId) {
        commentRepository.deleteByUserId(userId);
    }
}
