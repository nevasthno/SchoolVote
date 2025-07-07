package com.example.demo;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.example.demo.javaSrc.people.People;
import com.example.demo.javaSrc.people.PeopleRepository;
import com.example.demo.javaSrc.petitions.Petition;
import com.example.demo.javaSrc.petitions.PetitionRepository;
import com.example.demo.javaSrc.school.ClassRepository;
import com.example.demo.javaSrc.school.SchoolClass;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Date;
import java.util.List;

@SpringBootTest
public class PetitionRepositoryTest {
    @Autowired
    private PetitionRepository petitionRepository;

    @Autowired
    private PeopleRepository peopleRepository;

    @Autowired
    private ClassRepository classRepository;

    private People testUser;
    private SchoolClass schoolClass;
    private Petition testPetition;

    @BeforeEach
    void setup() {
        classRepository.deleteAll();
        petitionRepository.deleteAll();
        peopleRepository.deleteAll();

        schoolClass = new SchoolClass();
        schoolClass.setName("1A");
        schoolClass.setSchoolId(1L);
        classRepository.save(schoolClass);

        testUser = new People();
        testUser.setSchoolId(1L);
        testUser.setClassId(schoolClass.getId());
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setEmail("test@example.com");
        testUser.setPassword("pass");
        testUser.setRole(People.Role.STUDENT);
        peopleRepository.save(testUser);

        testPetition = new Petition(
                "Test Title",
                "Test Description",
                1L,
                schoolClass.getId(),
                testUser.getId(),
                new Date(System.currentTimeMillis() - 100000),
                new Date(System.currentTimeMillis() + 100000),
                Petition.Status.OPEN);
        testPetition.setDirectorsDecision(Petition.DirectorsDecision.PENDING);
        petitionRepository.save(testPetition);
    }

    @Test
    void testFindById() {
        var found = petitionRepository.findById(testPetition.getId());
        assertThat(found).isPresent();
    }

    @Test
    void testFindByClassIdAndSchoolId() {
        List<Petition> found = petitionRepository.findByClassIdAndSchoolId(schoolClass.getId(), 1L);
        assertThat(found).hasSize(1);
    }

    @Test
    void testFindBySchoolId() {
        List<Petition> found = petitionRepository.findBySchoolId(1L);
        assertThat(found).hasSize(1);
    }

    @Test
    void testFindByTitle() {
        List<Petition> found = petitionRepository.findByTitle("Test Title");
        assertThat(found).hasSize(1);
    }

    @Test
    void testFindByDescription() {
        List<Petition> found = petitionRepository.findByDescription("Test Description");
        assertThat(found).hasSize(1);
    }

    @Test
    void testFindByCreatedBy() {
        List<Petition> found = petitionRepository.findByCreatedBy(testUser.getId());
        assertThat(found).hasSize(1);
    }

    @Test
    void testFindByStatus() {
        List<Petition> found = petitionRepository.findByStatus(Petition.Status.OPEN);
        assertThat(found).hasSize(1);
    }

    @Test
    void testFindByStartDateBetween() {
        Date start = new Date(System.currentTimeMillis() - 200000);
        Date end = new Date(System.currentTimeMillis() + 200000);
        List<Petition> found = petitionRepository.findByStartDateBetween(start, end);
        assertThat(found).hasSize(1);
    }

    @Test
    void testFindByDirectorsDecision() {
        List<Petition> found = petitionRepository.findByDirectorsDecision(Petition.DirectorsDecision.PENDING);
        assertThat(found).hasSize(1);
    }
}
