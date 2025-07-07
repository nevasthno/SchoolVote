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

import java.util.List;

import org.mockito.InjectMocks;
import org.mockito.Mockito;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

   
    @InjectMocks
    private ApiController apiController;  

    
    @BeforeEach
    void setUp() {
        peopleRepository.deleteAll();
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
        Authentication auth = Mockito.mock(Authentication.class);

        
        mockMvc.perform(get("/api/users/role/STUDENT")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].firstName").value("John"))
                .andExpect(jsonPath("$[1].firstName").value("Jane"));
    }

}
