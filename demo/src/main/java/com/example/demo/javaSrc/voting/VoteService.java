package com.example.demo.javaSrc.voting;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.javaSrc.people.People;
import com.example.demo.javaSrc.people.PeopleRepository;

@Service
public class VoteService {
    private final VoteRepository voteRepository;
    private final VotingVariantRepository votingVariantRepository;
    private final VotingParticipantRepository votingParticipantRepository;
    private final VotingVoteRepository votingVoteRepository; 
    private final PeopleRepository peopleRepository;


    @Autowired
    public VoteService(VoteRepository voteRepository,
                       VotingVariantRepository votingVariantRepository,
                       VotingParticipantRepository votingParticipantRepository,
                       VotingVoteRepository votingVoteRepository,
                       PeopleRepository peopleRepository) {
        this.voteRepository = voteRepository;
        this.votingVariantRepository = votingVariantRepository;
        this.votingParticipantRepository = votingParticipantRepository;
        this.votingVoteRepository = votingVoteRepository;
        this.peopleRepository = peopleRepository;
    }


    @Transactional
    public Vote createVoting(Vote vote, List<String> variantTexts, List<Long> participantUserIds) {
        vote.setStatus(Vote.VoteStatus.OPEN);
        Vote savedVote = voteRepository.save(vote);

        if (variantTexts != null && !variantTexts.isEmpty()) {
            for (String text : variantTexts) {
                VotingVariant variant = new VotingVariant(savedVote, text);
                votingVariantRepository.save(variant);
            }
        }

        if (savedVote.getVotingLevel() == Vote.VotingLevel.SELECTED_USERS && participantUserIds != null && !participantUserIds.isEmpty()) {
            for (Long userId : participantUserIds) {
                VotingParticipant participant = new VotingParticipant(savedVote, userId);
                votingParticipantRepository.save(participant);
            }
        }
        return savedVote;
    }

    public Vote getVotingById(Long id) {
        return voteRepository.findById(id).orElse(null);
    }

    public List<Vote> getVotingsByClassAndSchool(Long classId, Long schoolId) {
        return voteRepository.findByClassIdAndSchoolId(classId, schoolId);
    }

    public List<Vote> getVotingsBySchool(Long schoolId) {
        return voteRepository.findBySchoolId(schoolId);
    }

    public List<Vote> getVotingsByTitle(String title) {
        return voteRepository.findByTitle(title);
    }

    public List<Vote> getVotingsByDescription(String description) {
        return voteRepository.findByDescription(description);
    }

    public List<Vote> getVotingsByCreatedBy(Long createdBy) {
        return voteRepository.findByCreatedBy(createdBy);
    }

    public List<Vote> getVotingsByStartDateBetween(Date startDate, Date endDate) {
        return voteRepository.findByStartDateBetween(startDate, endDate);
    }

    public List<Vote> getAllVotings() {
        return voteRepository.findAll();
    }

    public void deleteVoting(Long id) {
        voteRepository.deleteById(id);
    }

    @Transactional
    public Vote updateVoting(Long id, Vote updatedVote, List<String> updatedVariantTexts, List<Long> updatedParticipantUserIds) {
        return voteRepository.findById(id).map(existing -> {
            existing.setSchoolId(updatedVote.getSchoolId());
            existing.setClassId(updatedVote.getClassId());
            existing.setTitle(updatedVote.getTitle());
            existing.setDescription(updatedVote.getDescription());
            existing.setCreatedBy(updatedVote.getCreatedBy());
            existing.setStartDate(updatedVote.getStartDate());
            existing.setEndDate(updatedVote.getEndDate());
            existing.setMultipleChoice(updatedVote.isMultipleChoice());
            existing.setVotingLevel(updatedVote.getVotingLevel());
           
            if (updatedVariantTexts != null) {
                votingVariantRepository.findByVoteId(id).forEach(votingVariantRepository::delete); 
                for (String text : updatedVariantTexts) {
                    votingVariantRepository.save(new VotingVariant(existing, text)); 
                }
            }


            if (existing.getVotingLevel() == Vote.VotingLevel.SELECTED_USERS && updatedParticipantUserIds != null) {
                votingParticipantRepository.findByVoteId(id).forEach(votingParticipantRepository::delete); 
                for (Long userId : updatedParticipantUserIds) {
                    votingParticipantRepository.save(new VotingParticipant(existing, userId)); 
                }
            }

            return voteRepository.save(existing);
        }).orElse(null);
    }

   
    public List<Vote> getAccessibleVotingsForUser(Long userId, Long schoolId, Long classId) {

        List<Vote> allVotings = voteRepository.findByStatus(Vote.VoteStatus.OPEN); 

        return allVotings.stream()
                .filter(vote -> {
                    switch (vote.getVotingLevel()) {
                        case SCHOOL:
                            return vote.getSchoolId().equals(schoolId);
                        case ACLASS:
                            return vote.getClassId() != null && vote.getClassId().equals(classId) && vote.getSchoolId().equals(schoolId);
                        case TEACHERSGROUP:
                            People people = peopleRepository.findById(userId).orElseThrow();
                            if(people.getRole()== People.Role.TEACHER) {
                                return vote.getSchoolId().equals(schoolId);
                            }else{
                                return false; 
                            }
                            
                        case SELECTED_USERS:
                            return votingParticipantRepository.findByVoteIdAndUserId(vote.getId(), userId).isPresent();
                        default:
                            return false;
                    }
                })
                .toList();
    }


    @Transactional
    public Vote closeVoting(Long voteId) {
        return voteRepository.findById(voteId).map(vote -> {
            vote.setStatus(Vote.VoteStatus.CLOSED);
            return voteRepository.save(vote);
        }).orElse(null);
    }

    @Transactional
    public void closeExpiredVotings() {
        Date now = new Date();
        List<Vote> openVotings = voteRepository.findByStatus(Vote.VoteStatus.OPEN);
        openVotings.stream()
                .filter(vote -> vote.getEndDate().before(now))
                .forEach(vote -> vote.setStatus(Vote.VoteStatus.CLOSED));
        voteRepository.saveAll(openVotings);
    }


    @Transactional
    public boolean recordVote(Long votingId, List<Long> variantIds, Long userId) {
        Optional<Vote> voteOptional = voteRepository.findById(votingId);
        if (voteOptional.isEmpty()) {
            return false; 
        }
        Vote vote = voteOptional.get();

        if (vote.getStatus() == Vote.VoteStatus.CLOSED || vote.getEndDate().before(new Date())) {
            return false; 
        }

        if (vote.getVotingLevel() == Vote.VotingLevel.SELECTED_USERS) {
            boolean isParticipant = votingParticipantRepository.findByVoteIdAndUserId(votingId, userId).isPresent();
            if (!isParticipant) {
                return false; 
            }
        }
        // Add logic for 'teachers_group', 'school', 'class' based on user's roles/attributes

        if (!vote.isMultipleChoice() && variantIds.size() > 1) {
            return false; 
        }

        for (Long variantId : variantIds) {
            if (!vote.isMultipleChoice()) {
                long existingVotesCount = votingVariantRepository.findByVoteId(votingId).stream()
                        .flatMap(variant -> votingVoteRepository.findByVotingIdAndUserId(votingId, userId).stream()) 
                        .count();
                if (existingVotesCount > 0) {
                    return false; 
                }
            } else { 
                Optional<VotingVote> existingVote = votingVoteRepository.findByVotingIdAndUserIdAndVariantId(votingId, userId, variantId);
                if (existingVote.isPresent()) {
                    continue; 
                }
            }

            VotingVote newVote = new VotingVote(vote, votingVariantRepository.findById(variantId).orElseThrow(() -> new IllegalArgumentException("Variant not found")), userId);
            votingVoteRepository.save(newVote);
        }
        return true;
    }

    public VotingResults getVotingResults(Long votingId) {
        Optional<Vote> voteOptional = voteRepository.findById(votingId);
        if (voteOptional.isEmpty()) {
            return null; 
        }
        Vote vote = voteOptional.get();

        List<VotingVariant> variants = votingVariantRepository.findByVoteId(votingId);
        VotingResults results = new VotingResults(vote.getTitle(), vote.getDescription(), vote.isMultipleChoice());

        for (VotingVariant variant : variants) {
            long voteCount = votingVoteRepository.countByVotingIdAndVariantId(votingId, variant.getId());
            results.addVariantResult(variant.getText(), voteCount);
        }
        return results;
    }


}