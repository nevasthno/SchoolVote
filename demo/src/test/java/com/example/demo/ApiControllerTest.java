package com.example.demo;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import com.example.demo.javaSrc.people.*;
import com.example.demo.javaSrc.school.*;
import com.example.demo.javaSrc.worker.*;
import com.example.demo.javaSrc.petitions.*;
import com.example.demo.javaSrc.voting.*;
import com.example.demo.javaSrc.comments.*;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

import org.mockito.InjectMocks;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.springframework.security.test.context.support.WithMockUser;

@SpringBootTest
@AutoConfigureMockMvc
public class ApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PeopleService peopleService;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @MockBean
    private SchoolService schoolService;

    @MockBean
    private ClassService classService;

    @MockBean
    private PeopleRepository peopleRepository;

    @MockBean
    private VoteService voteService;

    @MockBean
    private PetitionService petitionService;

    @MockBean
    private PetitionRepository petitionRepository;

    @MockBean
    private CommentService commentService;

    @MockBean
    private CommentRepository commentRepository;

    @InjectMocks
    private ApiController apiController;

    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        reset(peopleService, schoolService, classService, voteService, 
              petitionService, commentService, passwordEncoder);
    }

    @Test
    @WithMockUser(username = "user", roles = {"TEACHER"})
    void testGetAllSchool() throws Exception {
        School school1 = new School();
        school1.setName("School 1");
        School school2 = new School();
        school2.setName("School 2");
        List<School> schools = List.of(school1, school2);

        when(schoolService.getAllSchools()).thenReturn(schools);

        mockMvc.perform(get("/api/schools")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("School 1"))
                .andExpect(jsonPath("$[1].name").value("School 2"));
    }

    @Test
    @WithMockUser(username = "user", roles = {"TEACHER"})
    void testGetAllClasses() throws Exception {
        SchoolClass class1 = new SchoolClass();
        class1.setName("Class 1");
        class1.setSchoolId(1L);
        SchoolClass class2 = new SchoolClass();
        class2.setName("Class 2");
        class2.setSchoolId(1L);
        List<SchoolClass> classes = List.of(class1, class2);

        when(classService.getBySchoolId(1L)).thenReturn(classes);

        mockMvc.perform(get("/api/classes")
                        .param("schoolId", "1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Class 1"))
                .andExpect(jsonPath("$[1].name").value("Class 2"));
    }

    @Test
    @WithMockUser(username = "user", roles = {"TEACHER"})
    void testGetAllUsers() throws Exception {
        People people1 = new People();
        people1.setFirstName("John");
        people1.setLastName("Doe");
        people1.setEmail("jo@gg.com");
        People people2 = new People();
        people2.setFirstName("Jane");
        people2.setLastName("Doe");
        people2.setEmail("ja@gg.com");

        List<People> peopleList = List.of(people1, people2);

        when(peopleService.getAllPeople()).thenReturn(peopleList);

        mockMvc.perform(get("/api/loadUsers")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].firstName").value("John"))
                .andExpect(jsonPath("$[0].lastName").value("Doe"))
                .andExpect(jsonPath("$[1].firstName").value("Jane"))
                .andExpect(jsonPath("$[1].lastName").value("Doe"));
    }

    @Test
    @WithMockUser(username = "user", roles = {"TEACHER"})
    void testGetUsersByRole() throws Exception {
        People people1 = new People();
        people1.setFirstName("John");
        people1.setLastName("Doe");
        people1.setEmail("jo@gg.com");
        people1.setRole(People.Role.STUDENT);
        People people2 = new People();
        people2.setFirstName("Jane");
        people2.setLastName("Doe");
        people2.setEmail("ja@gg.com");
        people2.setRole(People.Role.STUDENT);

        List<People> peopleList = List.of(people1, people2);

        when(peopleService.getPeopleByRole("STUDENT")).thenReturn(peopleList);

        mockMvc.perform(get("/api/users/role/STUDENT")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].firstName").value("John"))
                .andExpect(jsonPath("$[1].firstName").value("Jane"));
    }


    @Test
    @WithMockUser(username = "teacher@test.com", roles = {"TEACHER"})
    void testUpdateUserByTeacher_Success() throws Exception {
        Long userId = 1L;
        People updatedUser = new People();
        updatedUser.setId(userId);
        updatedUser.setFirstName("Updated");
        updatedUser.setLastName("User");

        when(peopleService.updateProfile(eq(userId), any(People.class))).thenReturn(updatedUser);

        mockMvc.perform(put("/api/users/{id}", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Updated"))
                .andExpect(jsonPath("$.lastName").value("User"));

        verify(peopleService).updateProfile(eq(userId), any(People.class));
    }

    @Test
    @WithMockUser(username = "teacher@test.com", roles = {"TEACHER"})
    void testUpdateUserByTeacher_NotFound() throws Exception {
        Long userId = 999L;
        People updatedUser = new People();

        when(peopleService.updateProfile(eq(userId), any(People.class))).thenReturn(null);

        mockMvc.perform(put("/api/users/{id}", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedUser)))
                .andExpect(status().isNotFound());
    }

    

    @Test
    void testSignPetition_Success() throws Exception {
        Long petitionId = 1L;
        People student = new People();
        student.setId(1L);
        student.setEmail("student@test.com");

        Authentication authentication = new UsernamePasswordAuthenticationToken(student, null, AuthorityUtils.createAuthorityList("ROLE_STUDENT"));

        doNothing().when(petitionService).vote(eq(petitionId), eq(1L), eq(PetitionVote.VoteVariant.YES));

        mockMvc.perform(post("/api/petitions/{id}/vote", petitionId)
                        .with(authentication(authentication)))
                .andExpect(status().isOk());

        verify(petitionService).vote(petitionId, 1L, PetitionVote.VoteVariant.YES);
    }

    @Test
    void testSignPetition_BadRequest() throws Exception {
        Long petitionId = 1L;
        People student = new People();
        student.setId(1L);
        student.setEmail("student@test.com");

        Authentication authentication = new UsernamePasswordAuthenticationToken(student, null, AuthorityUtils.createAuthorityList("ROLE_STUDENT"));

        doThrow(new RuntimeException("Vote failed")).when(petitionService)
                .vote(eq(petitionId), eq(1L), eq(PetitionVote.VoteVariant.YES));

        mockMvc.perform(post("/api/petitions/{id}/vote", petitionId)
                        .with(authentication(authentication)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "director@test.com", roles = {"DIRECTOR"})
    void testDirectorApprove_Success() throws Exception {
        Long petitionId = 1L;
        Petition petition = new Petition();
        petition.setId(petitionId);
        petition.setDirectorsDecision(Petition.DirectorsDecision.PENDING);

        when(petitionService.getPetitionById(petitionId)).thenReturn(petition);
        when(petitionService.createPetition(any(Petition.class))).thenReturn(petition);

        mockMvc.perform(post("/api/petitions/{id}/director", petitionId))
                .andExpect(status().isOk());

        verify(petitionService).createPetition(any(Petition.class));
    }

    @Test
    @WithMockUser(username = "director@test.com", roles = {"DIRECTOR"})
    void testDirectorApprove_BadRequest() throws Exception {
        Long petitionId = 1L;
        Petition petition = new Petition();
        petition.setId(petitionId);
        petition.setDirectorsDecision(Petition.DirectorsDecision.APPROVED); 

        when(petitionService.getPetitionById(petitionId)).thenReturn(petition);

        mockMvc.perform(post("/api/petitions/{id}/director", petitionId))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "user@test.com")
    void testCastVote_Success() throws Exception {
        Long votingId = 1L;
        List<Long> variantIds = List.of(1L);
        
        People user = new People();
        user.setId(1L);
        
        Vote vote = new Vote();
        vote.setMultipleChoice(false);

        when(voteService.getVotingById(votingId)).thenReturn(vote);
        when(peopleService.findByEmail("user@test.com")).thenReturn(user);
        when(voteService.recordVote(votingId, variantIds, 1L)).thenReturn(true);

        mockMvc.perform(post("/api/voting/{votingId}/vote", votingId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(variantIds)))
                .andExpect(status().isOk())
                .andExpect(content().string("Vote recorded successfully"));
    }

    @Test
    @WithMockUser(username = "user@test.com")
    void testCastVote_MultipleChoiceViolation() throws Exception {
        Long votingId = 1L;
        List<Long> variantIds = List.of(1L, 2L); // Multiple choices
        
        Vote vote = new Vote();
        vote.setMultipleChoice(false); // Single choice only

        when(voteService.getVotingById(votingId)).thenReturn(vote);

        mockMvc.perform(post("/api/voting/{votingId}/vote", votingId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(variantIds)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Це одно‑відповідне голосування, виберіть лише один варіант."));
    }



}