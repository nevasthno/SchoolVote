package com.example.demo.javaSrc.votingAndPetitions;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PetitionVoteRepository extends JpaRepository<PetitionVote, Long> {
    boolean existsByPetitionIdAndStudentId(Long petitionId, Long studentId);
}