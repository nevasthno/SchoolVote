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

    public Petitions createPetition(Petitions petition) {
        return petitionsRepository.save(petition);
    }

    public Petitions getPetitionById(Long id) {
        return petitionsRepository.findById(id).orElse(null);
    }

    public List<Petitions> getPetitionsByClassAndSchool(Long classId, Long schoolId) {
        return petitionsRepository.findByClassIdAndSchoolId(classId, schoolId);
    }

    public List<Petitions> getPetitionsBySchool(Long schoolId) {
        return petitionsRepository.findBySchoolId(schoolId);
    }

    public List<Petitions> getPetitionsByTitle(String title) {
        return petitionsRepository.findByTitle(title);
    }

    public List<Petitions> getPetitionsByDescription(String description) {
        return petitionsRepository.findByDescription(description);
    }

    public List<Petitions> getPetitionsByCreatedBy(Long createdBy) {
        return petitionsRepository.findByCreatedBy(createdBy);
    }

    public List<Petitions> getPetitionsByStartDateBetween(Date startDate, Date endDate) {
        return petitionsRepository.findByStartDateBetween(startDate, endDate);
    }

    public List<Petitions> getAllPetitions() {
        return petitionsRepository.findAll();
    }

    public void deletePetition(Long id) {
        petitionsRepository.deleteById(id);
    }

    public Petitions updatePetition(Long id, Petitions updatedPetition) {
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
