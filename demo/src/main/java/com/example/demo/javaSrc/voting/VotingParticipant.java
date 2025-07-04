package com.example.demo.javaSrc.voting;

import jakarta.persistence.*;

@Entity
@Table(name = "voting_participant")
public class VotingParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voting_id", nullable = false)
    private Vote vote;

    @Column(name = "user_id", nullable = false)
    private Long userId; // Assuming you have a User entity and table

    public VotingParticipant() {
    }

    public VotingParticipant(Vote vote, Long userId) {
        this.vote = vote;
        this.userId = userId;
    }

    public Long getId() {
        return id;
    }

    public Vote getVote() {
        return vote;
    }

    public void setVote(Vote vote) {
        this.vote = vote;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}