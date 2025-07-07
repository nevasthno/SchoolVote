package com.example.demo;

import com.example.demo.javaSrc.comments.Comment;
import com.example.demo.javaSrc.comments.CommentRepository;
import com.example.demo.javaSrc.people.*;
import com.example.demo.javaSrc.petitions.Petition;
import com.example.demo.javaSrc.petitions.PetitionRepository;
import com.example.demo.javaSrc.school.ClassRepository;
import com.example.demo.javaSrc.school.SchoolClass;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;


import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
public class CommentRepositoryTest {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private PeopleRepository peopleRepository;

    @Autowired
    private PetitionRepository petitionRepository;

    @Autowired
    private ClassRepository classRepository;

    private People testPeople;
    private Petition testPetition;

    @BeforeEach
    void setUp() {
        classRepository.deleteAll();
        peopleRepository.deleteAll();
        SchoolClass class1 = new SchoolClass();
        class1.setName("1A");
        class1.setSchoolId(1L);
        classRepository.save(class1);
        testPeople = peopleRepository.save(new People(1L, class1.getId(), "test", "ggg", "Student",
         null, "email@test.com", "wvvrvfrere", People.Role.STUDENT));
        Date start = Date.from(LocalDateTime.now().atZone(ZoneId.systemDefault()).toInstant());
        Date end = Date.from(LocalDateTime.now().plusDays(10).atZone(ZoneId.systemDefault()).toInstant());

        testPetition = petitionRepository.save(
            new Petition(
                "Test Petition",
                "This is a test petition",
                1L,                  
                class1.getId(),       
                testPeople.getId(),   
                start,
                end,
                Petition.Status.OPEN
            )
        );
    }

    @Test
    void testSaveAndFindByPetitionId() {
        Comment comment = new Comment(testPeople.getId(), testPetition.getId(), "Great idea!");
        commentRepository.save(comment);

        List<Comment> comments = commentRepository.findByPetitionId(testPetition.getId());
        assertThat(comments).hasSize(1);
        assertThat(comments.get(0).getText()).isEqualTo("Great idea!");
    }

    @Test
    void testFindByPeopleId() {
        commentRepository.save(new Comment(testPeople.getId(), testPetition.getId(), "Great idea!"));

        List<Comment> comments = commentRepository.findByUserId(testPeople.getId());
        assertThat(comments).hasSize(1);
    }

    @Test
    void testFindByPetitionIdAndPeopleId() {
        commentRepository.save(new Comment(testPeople.getId(), testPetition.getId(), "Great idea!"));

        List<Comment> comments = commentRepository.findByPetitionIdAndUserId(testPetition.getId(), testPeople.getId());
        assertThat(comments).hasSize(1);
    }

    @Test
    void testDeleteByPetitionId() {
       
        commentRepository.save(new Comment(testPeople.getId(), testPetition.getId(), "Great idea!"));
        commentRepository.deleteByPetitionId(testPetition.getId());

        List<Comment> comments = commentRepository.findByPetitionId(testPetition.getId());
        assertThat(comments).isEmpty();
    }

    @Test
    void testDeleteByPeopleId() {
        commentRepository.save(new Comment(testPeople.getId(), testPetition.getId(), "Great idea!"));
        commentRepository.deleteByUserId(testPeople.getId());

        List<Comment> comments = commentRepository.findByUserId(testPeople.getId());
        assertThat(comments).isEmpty();
    }
}
