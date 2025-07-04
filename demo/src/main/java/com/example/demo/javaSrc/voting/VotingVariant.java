package com.example.demo.javaSrc.voting;

import jakarta.persistence.*;

@Entity
@Table(name = "voting_variant")
public class VotingVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voting_id", nullable = false)
    private Vote vote;

    @Column(name = "text", nullable = false)
    private String text;

    public VotingVariant() {
    }

    public VotingVariant(Vote vote, String text) {
        this.vote = vote;
        this.text = text;
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

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }
}