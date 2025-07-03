package com.example.demo.javaSrc.votingAndPetitions;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class VoteService {
    private final VoteRepository votingRepository;

    @Autowired
    public VoteService(VoteRepository votingRepository) {
        this.votingRepository = votingRepository;
    }

    public Vote createVoting(Vote voting) {
        return votingRepository.save(voting);
    }

    public Vote getVotingById(Long id) {
        return votingRepository.findById(id).orElse(null);
    }

    public List<Vote> getVotingsByClassAndSchool(Long classId, Long schoolId) {
        return votingRepository.findByClassIdAndSchoolId(classId, schoolId);
    }

    public List<Vote> getVotingsBySchool(Long schoolId) {
        return votingRepository.findBySchoolId(schoolId);
    }

    public List<Vote> getVotingsByTitle(String title) {
        return votingRepository.findByTitle(title);
    }

    public List<Vote> getVotingsByDescription(String description) {
        return votingRepository.findByDescription(description);
    }

    public List<Vote> getVotingsByCreatedBy(Long createdBy) {
        return votingRepository.findByCreatedBy(createdBy);
    }

    public List<Vote> getVotingsByStartDateBetween(Date startDate, Date endDate) {
        return votingRepository.findByStartDateBetween(startDate, endDate);
    }

    public List<Vote> getAllVotings() {
        return votingRepository.findAll();
    }

    public void deleteVoting(Long id) {
        votingRepository.deleteById(id);
    }

    public Vote updateVoting(Long id, Vote updatedVoting) {
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
