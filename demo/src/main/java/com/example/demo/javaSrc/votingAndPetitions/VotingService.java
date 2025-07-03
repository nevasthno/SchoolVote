package com.example.demo.javaSrc.votingAndPetitions;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class VotingService {
    private final VotingRepository votingRepository;
    
    @Autowired
    public VotingService(VotingRepository votingRepository) {
        this.votingRepository = votingRepository;
    }

    public Voting createVoting(Voting voting) {
        return votingRepository.save(voting);
    }

    public Voting getVotingById(Long id) {
        return votingRepository.findById(id).orElse(null);
    }

    public List<Voting> getVotingsByClassAndSchool(Long classId, Long schoolId) {
        return votingRepository.findByClassIdAndSchoolId(classId, schoolId);
    }

    public List<Voting> getVotingsBySchool(Long schoolId) {
        return votingRepository.findBySchoolId(schoolId);
    }

    public List<Voting> getVotingsByTitle(String title) {
        return votingRepository.findByTitle(title);
    }

    public List<Voting> getVotingsByDescription(String description) {
        return votingRepository.findByDescription(description);
    }

    public List<Voting> getVotingsByCreatedBy(Long createdBy) {
        return votingRepository.findByCreatedBy(createdBy);
    }

    public List<Voting> getVotingsByStartDateBetween(Date startDate, Date endDate) {
        return votingRepository.findByStartDateBetween(startDate, endDate);
    }

    public List<Voting> getAllVotings() {
        return votingRepository.findAll();
    }

    public void deleteVoting(Long id) {
        votingRepository.deleteById(id);
    }

    public Voting updateVoting(Long id, Voting updatedVoting) {
        return votingRepository.findById(id).map(existing -> {
            existing.setSchoolId(updatedVoting.getSchoolId());
            existing.setClassId(updatedVoting.getClassId());
            existing.setTitle(updatedVoting.getTitle());
            existing.setDescription(updatedVoting.getDescription());
            existing.setCreatedBy(updatedVoting.getCreatedBy());
            existing.setStartDate(updatedVoting.getStartDate());
            existing.setEndDate(updatedVoting.getEndDate());
            existing.setMultipleChoice(updatedVoting.isMultipleChoice());
            return votingRepository.save(existing);
        }).orElse(null);
    }

    
}
