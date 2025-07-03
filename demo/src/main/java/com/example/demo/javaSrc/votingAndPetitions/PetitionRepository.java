package com.example.demo.javaSrc.votingAndPetitions;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PetitionRepository extends JpaRepository<Petition, Long> {
    Optional<Petition> findById(Long id);

    List<Petition> findByClassIdAndSchoolId(Long classId, Long schoolId);

    List<Petition> findBySchoolId(Long schoolId);

    List<Petition> findByTitle(String title);

    List<Petition> findByDescription(String description);

    List<Petition> findByCreatedBy(Long createdBy);

    List<Petition> findByStartDateBetween(Date startDate, Date endDate);
}