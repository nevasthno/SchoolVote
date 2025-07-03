package com.example.demo.javaSrc.votingAndPetitions;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;


@Repository
public interface VotingRepository extends JpaRepository<Voting, Long>  {
    Optional<Voting> findById(Long id);
    List<Voting> findByClassIdAndSchoolId(Long classId, Long schoolId);
    List<Voting> findBySchoolId(Long schoolId);
    List<Voting> findByTitle(String title);
    List<Voting> findByDescription(String description);
    List<Voting> findByCreatedBy(Long createdBy);
    List<Voting> findByStartDateBetween(Date startDate, Date endDate);
}
