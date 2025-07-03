package com.example.demo.javaSrc.votingAndPetitions;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PetitionsRepository extends JpaRepository<Petitions, Long> {
    Optional<Petitions> findById(Long id);
    List<Petitions> findByClassIdAndSchoolId(Long classId, Long schoolId);
    List<Petitions> findBySchoolId(Long schoolId);
    List<Petitions> findByTitle(String title);
    List<Petitions> findByDescription(String description);
    List<Petitions> findByCreatedBy(Long createdBy);
    List<Petitions> findByStartDateBetween(Date startDate, Date endDate);        
} 