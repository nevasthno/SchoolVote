package com.example.demo.javaSrc.votingAndPetitions;

import java.util.Date;
import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class PetitionService {
    private final PetitionRepository petitionsRepository;

    public PetitionService(PetitionRepository petitionsRepository) {
        this.petitionsRepository = petitionsRepository;
    }

    public Petition createPetition(Petition petition) {
        return petitionsRepository.save(petition);
    }

    public Petition getPetitionById(Long id) {
        return petitionsRepository.findById(id).orElse(null);
    }

    public List<Petition> getPetitionByClassAndSchool(Long classId, Long schoolId) {
        return petitionsRepository.findByClassIdAndSchoolId(classId, schoolId);
    }

    public List<Petition> getPetitionBySchool(Long schoolId) {
        return petitionsRepository.findBySchoolId(schoolId);
    }

    public List<Petition> getPetitionByTitle(String title) {
        return petitionsRepository.findByTitle(title);
    }

    public List<Petition> getPetitionByDescription(String description) {
        return petitionsRepository.findByDescription(description);
    }

    public List<Petition> getPetitionByCreatedBy(Long createdBy) {
        return petitionsRepository.findByCreatedBy(createdBy);
    }

    public List<Petition> getPetitionByStartDateBetween(Date startDate, Date endDate) {
        return petitionsRepository.findByStartDateBetween(startDate, endDate);
    }

    public List<Petition> getAllPetition() {
        return petitionsRepository.findAll();
    }

    public void deletePetition(Long id) {
        petitionsRepository.deleteById(id);
    }

    public Petition updatePetition(Long id, Petition updatedPetition) {
        return petitionsRepository.findById(id).map(existing -> {
            existing.setSchoolId(updatedPetition.getSchoolId());
            existing.setClassId(updatedPetition.getClassId());
            existing.setTitle(updatedPetition.getTitle());
            existing.setDescription(updatedPetition.getDescription());
            existing.setCreatedBy(updatedPetition.getCreatedBy());
            existing.setStartDate(updatedPetition.getStartDate());
            existing.setEndDate(updatedPetition.getEndDate());
            existing.setStatus(updatedPetition.getStatus());
            return petitionsRepository.save(existing);
        }).orElse(null);
    }

}
