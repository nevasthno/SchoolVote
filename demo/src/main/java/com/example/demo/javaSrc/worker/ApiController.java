package com.example.demo.javaSrc.worker;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.javaSrc.comments.Comment;
import com.example.demo.javaSrc.comments.CommentRepository;
import com.example.demo.javaSrc.comments.CommentService;
import com.example.demo.javaSrc.people.People;
import com.example.demo.javaSrc.people.PeopleService;
import com.example.demo.javaSrc.school.School;
import com.example.demo.javaSrc.school.SchoolService;
import com.example.demo.javaSrc.voting.*;
import com.example.demo.javaSrc.petitions.*;

import com.example.demo.javaSrc.school.SchoolClass;
import com.example.demo.javaSrc.school.ClassService;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api")
public class ApiController {

    private final PeopleService peopleService;
    private final PasswordEncoder passwordEncoder;
    private final SchoolService schoolService;
    private final ClassService classService;
    private final VoteService voteService;
    private final PetitionService petitionService;
    private final PetitionRepository petitionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final CommentService commentService;
    private final CommentRepository commentRepository;
    

    @Autowired
    public ApiController(
            PeopleService peopleService,
            PasswordEncoder passwordEncoder,
            SchoolService schoolService,
            ClassService classService,
            VoteService voteService,
            PetitionService petitionService,
            PetitionRepository petitionRepository,
            CommentService commentService,
            CommentRepository commentRepository
            ) {

        this.peopleService = peopleService;
        this.passwordEncoder = passwordEncoder;
        this.schoolService = schoolService;
        this.classService = classService;
        this.voteService = voteService;
        this.petitionService = petitionService;
        this.petitionRepository = petitionRepository;
        this.commentService = commentService;
        this.commentRepository = commentRepository;
    }

    private People currentUser(Authentication auth) {
        return peopleService.findByEmail(auth.getName());
    }

    @GetMapping("/schools")
    public List<School> getAllSchools() {
        return schoolService.getAllSchools();
    }

    @GetMapping("/classes")
    public List<SchoolClass> getClasses(
            @RequestParam Long schoolId) {
        if (schoolId == null) {
            return List.of();
        }
        return classService.getBySchoolId(schoolId);
    }

    @GetMapping("/teachers")
    public List<People> getTeachers(
            Authentication auth,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) String name) {

        People me = currentUser(auth);
        Long sch = schoolId != null ? schoolId : me.getSchoolId();
        Long cls = classId != null ? classId : me.getClassId();

        List<People> teachers;
        if (classId == null) {
            teachers = peopleService.getBySchoolClassAndRole(sch, null, People.Role.TEACHER);
        } else {
            teachers = new ArrayList<>();
            teachers.addAll(peopleService.getBySchoolClassAndRole(sch, null, People.Role.TEACHER));
            teachers.addAll(peopleService.getBySchoolClassAndRole(sch, cls, People.Role.TEACHER));
        }

        if (name != null && !name.isBlank()) {
            teachers.removeIf(p -> !p.getFirstName().toLowerCase().contains(name.toLowerCase()) &&
                    !p.getLastName().toLowerCase().contains(name.toLowerCase()));
        }
        return teachers;
    }

    @GetMapping("/users")
    public List<People> getUsers(
            Authentication auth,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) String name) {

        People me = currentUser(auth);
        Long sch = schoolId != null ? schoolId : me.getSchoolId();
        Long cls = classId != null ? classId : me.getClassId();

        List<People> all;
        if (classId == null) {
            all = peopleService.getBySchoolAndClass(sch, null);
        } else {
            all = new ArrayList<>();
            all.addAll(peopleService.getBySchoolAndClass(sch, null));
            all.addAll(peopleService.getBySchoolAndClass(sch, cls));
        }

        if (name != null && !name.isBlank()) {
            all = all.stream()
                    .filter(p -> p.getFirstName().contains(name)
                            || p.getLastName().contains(name))
                    .toList();
        }
        return all;
    }

    @PreAuthorize("hasAnyRole('TEACHER', 'DIRECTOR')")
    @PostMapping("/users")
    public ResponseEntity<People> createUser(
            @RequestBody People newUser,
            Authentication auth) {

        if (newUser.getSchoolId() == null) {
            return ResponseEntity.badRequest().body(null);
        }

        String rawPass = newUser.getPassword();
        newUser.setPassword(passwordEncoder.encode(rawPass));

        return ResponseEntity.ok(peopleService.createPeople(newUser));
    }

    @GetMapping("/me")
    public ResponseEntity<People> getMyProfile(Authentication auth) {
        String email = auth.getName();
        People user = peopleService.findByEmail(email);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(user);
    }

    @PutMapping("/me")
    public ResponseEntity<People> updateMyProfile(@RequestBody People updatedData, Authentication auth) {
        String email = auth.getName();
        People currentUser = peopleService.findByEmail(email);
        if (currentUser == null) {
            return ResponseEntity.notFound().build();
        }

        if (updatedData.getEmail() != null && !updatedData.getEmail().equals(email)) {
            if (!isValidEmail(updatedData.getEmail())) {
                return ResponseEntity.badRequest().body(null);
            }
            if (peopleService.findByEmail(updatedData.getEmail()) != null) {
                return ResponseEntity.badRequest().body(null);
            }
        }

        if (updatedData.getFirstName() != null) {
            currentUser.setFirstName(updatedData.getFirstName());
        }
        if (updatedData.getLastName() != null) {
            currentUser.setLastName(updatedData.getLastName());
        }
        if (updatedData.getAboutMe() != null) {
            currentUser.setAboutMe(updatedData.getAboutMe());
        }
        if (updatedData.getDateOfBirth() != null) {
            currentUser.setDateOfBirth(updatedData.getDateOfBirth());
        }
        if (updatedData.getEmail() != null) {
            currentUser.setEmail(updatedData.getEmail());
        }
        if (updatedData.getPassword() != null && !updatedData.getPassword().isEmpty()) {
            currentUser.setPassword(passwordEncoder.encode(updatedData.getPassword()));
        }
        Long userId = currentUser.getId();
        People updated = peopleService.updateUser(userId, currentUser);
        return ResponseEntity.ok(updated);
    }

    private boolean isValidEmail(String email) {
        return email != null && email.matches("^[A-Za-z0-9+_.-]+@(.+)$");
    }

    @PreAuthorize("hasAnyRole('TEACHER', 'DIRECTOR')")
    @GetMapping("/loadUsers")
    public List<People> getAllUsers() {
        return peopleService.getAllPeople();
    }

    @PreAuthorize("hasAnyRole('TEACHER', 'DIRECTOR')")
    @GetMapping("/users/role/{role}")
    public List<People> getUsersByRole(@PathVariable String role) {
        return peopleService.getPeopleByRole(role);
    }

    @PreAuthorize("hasAnyRole('TEACHER', 'DIRECTOR')")
    @PutMapping("/users/{id}")
    public ResponseEntity<People> updateUserByTeacher(@PathVariable Long id, @RequestBody People updatedData) {
        People updated = peopleService.updateProfile(id, updatedData);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/createPetition")
    public ResponseEntity<Petition> createPetition(@RequestBody Petition petitionRB, Authentication auth) {
        People user = currentUser(auth);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        Petition petition = new Petition();
        petition.setSchoolId(petitionRB.getSchoolId());
        petition.setClassId(petitionRB.getClassId());
        petition.setTitle(petitionRB.getTitle());
        petition.setDescription(petitionRB.getDescription());
        petition.setCreatedBy(user.getId());
        petition.setStartDate(petitionRB.getStartDate());
        petition.setEndDate(petitionRB.getEndDate());

        petitionRepository.save(petition);

        return ResponseEntity.ok(petition);
    }

    @PostMapping("/petitions/{id}/vote")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> voteForPetition(@PathVariable Long id,
            @RequestParam("vote") PetitionVote.VoteVariant vote,
            @AuthenticationPrincipal People user) {
        try {
            Long studentId = user.getId();
            petitionService.vote(id, studentId, vote);
            return ResponseEntity.ok("Vote recorded");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/createVoting")
    public ResponseEntity<Vote> createVoting(@RequestBody Vote request) {
        try {
            Vote newVote = new Vote();
            newVote.setSchoolId(request.getSchoolId());
            newVote.setClassId(request.getClassId());
            newVote.setTitle(request.getTitle());
            newVote.setDescription(request.getDescription());
            newVote.setCreatedBy(request.getCreatedBy());
            newVote.setStartDate(request.getStartDate());
            newVote.setEndDate(request.getEndDate());
            newVote.setMultipleChoice(request.isMultipleChoice());

            // Defensive: ensure votingLevel is not null and valid
            if (request.getVotingLevel() != null) {
                newVote.setVotingLevel(request.getVotingLevel());
            } else {
                newVote.setVotingLevel(Vote.VotingLevel.SCHOOL);
            }

            newVote.setStatus(Vote.VoteStatus.OPEN);

            // Serialize variants to JSON for variantsJson field
            try {
                if (request.getVariants() != null && !request.getVariants().isEmpty()) {
                    String variantsJson = objectMapper.writeValueAsString(
                            request.getVariants().stream().map(VotingVariant::getText).toList());
                    newVote.setVariantsJson(variantsJson);
                } else {
                    newVote.setVariantsJson("[]");
                }
            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.status(500).body(null);
            }

            List<String> variantStrings = request.getVariants() != null
                    ? request.getVariants().stream().map(VotingVariant::getText).toList()
                    : List.of();

            List<Long> participantIds = request.getParticipants() != null
                    ? request.getParticipants().stream().map(VotingParticipant::getUserId).toList()
                    : List.of();

            Vote createdVote = voteService.createVoting(newVote, variantStrings, participantIds);
            return new ResponseEntity<>(createdVote, HttpStatus.CREATED);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }
     @GetMapping("/votes")
    public List<Vote> getVotes(@RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long classId) {
        if (classId != null && schoolId != null) {
            return voteService.getVotingsByClassAndSchool(classId, schoolId);
        } else if (schoolId != null) {
            return voteService.getVotingsBySchool(schoolId);
        } else {
            return voteService.getAllVotings();
        }
    }
    @GetMapping("voting/{id}")
    public ResponseEntity<Vote> getVotingById(@PathVariable Long id) {
        Vote vote = voteService.getVotingById(id);
        if (vote != null) {
            return new ResponseEntity<>(vote, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @GetMapping("voting/user/{userId}")
    public ResponseEntity<List<Vote>> getAccessibleVotings(@PathVariable Long userId,
            @RequestParam Long schoolId,
            @RequestParam(required = false) Long classId) {
        List<Vote> votings = voteService.getAccessibleVotingsForUser(userId, schoolId, classId);
        return new ResponseEntity<>(votings, HttpStatus.OK);
    }

    @PostMapping("voting/{votingId}/vote")
    public ResponseEntity<String> castVote(@PathVariable Long votingId, @RequestBody Vote request,
            Authentication auth) {
        System.out.println("Received castVote: votingId=" + votingId + ", request=" + request);
        List<Long> variantIds = request.getVariants() != null
                ? request.getVariants().stream().map(VotingVariant::getId).toList()
                : List.of();

        Long userId = null;
        if (auth != null) {
            People user = currentUser(auth);
            if (user != null) {
                userId = user.getId();
            }
        }

        boolean success = voteService.recordVote(votingId, variantIds, userId);
        if (success) {
            return new ResponseEntity<>("Vote recorded successfully", HttpStatus.OK);
        }
        return new ResponseEntity<>("Failed to record vote. Check voting status, eligibility, or if you already voted.",
                HttpStatus.BAD_REQUEST);
    }

    @GetMapping("voting/{votingId}/results")
    public ResponseEntity<VotingResults> getVotingResults(@PathVariable Long votingId) {
        VotingResults results = voteService.getVotingResults(votingId);
        if (results != null) {
            return new ResponseEntity<>(results, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PutMapping("voting/{id}")
    public ResponseEntity<Vote> updateVoting(@PathVariable Long id, @RequestBody Vote request) {
        Vote updatedVote = new Vote();
        updatedVote.setSchoolId(request.getSchoolId());
        updatedVote.setClassId(request.getClassId());
        updatedVote.setTitle(request.getTitle());
        updatedVote.setDescription(request.getDescription());
        updatedVote.setCreatedBy(request.getCreatedBy());
        updatedVote.setStartDate(request.getStartDate());
        updatedVote.setEndDate(request.getEndDate());
        updatedVote.setMultipleChoice(request.isMultipleChoice());
        updatedVote.setVotingLevel(request.getVotingLevel());

        List<String> variantStrings = request.getVariants() != null
                ? request.getVariants().stream().map(VotingVariant::getText).toList()
                : List.of();

        List<Long> participantIds = request.getParticipants() != null
                ? request.getParticipants().stream().map(VotingParticipant::getUserId).toList()
                : List.of();

        Vote createdVote = voteService.updateVoting(id, updatedVote, variantStrings, participantIds);
        return new ResponseEntity<>(createdVote, HttpStatus.CREATED);
    }

    @DeleteMapping("voting/{id}")
    public ResponseEntity<Void> deleteVoting(@PathVariable Long id) {
        voteService.deleteVoting(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @PostMapping("/comments")
    public ResponseEntity<Comment> addComment(@RequestBody Comment comment) {
        Comment saved = commentService.addComment(comment);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/comments/{id}")
    public ResponseEntity<Comment> getComment(@PathVariable Long id) {
        Comment comment = commentService.getComment(id);
        if (comment == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(comment);
    }

    @GetMapping("/comments/petition/{petitionId}")
    public List<Comment> getCommentsByPetition(@PathVariable Long petitionId) {
        return commentService.getCommentsByPetitionId(petitionId);
    }

    @GetMapping("/comments/user/{userId}")
    public List<Comment> getCommentsByUser(@PathVariable Long userId) {
        return commentService.getCommentsByUserId(userId);
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/comments/petition/{petitionId}")
    public ResponseEntity<Void> deleteCommentsByPetition(@PathVariable Long petitionId) {
        commentService.deleteCommentsByPetitionId(petitionId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/comments/user/{userId}")
    public ResponseEntity<Void> deleteCommentsByUser(@PathVariable Long userId) {
        commentService.deleteCommentsByUserId(userId);
        return ResponseEntity.noContent().build();
    }
}
