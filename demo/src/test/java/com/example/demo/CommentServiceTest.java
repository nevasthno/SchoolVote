package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.example.demo.javaSrc.comments.Comment;
import com.example.demo.javaSrc.comments.CommentRepository;
import com.example.demo.javaSrc.comments.CommentService;
import com.example.demo.javaSrc.people.People;
import com.example.demo.javaSrc.people.PeopleRepository;
import com.example.demo.javaSrc.petitions.Petition;
import com.example.demo.javaSrc.petitions.PetitionRepository;
import com.example.demo.javaSrc.school.ClassRepository;
import com.example.demo.javaSrc.school.SchoolClass;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Date;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

@SpringBootTest
public class CommentServiceTest {
    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private CommentService commentService;

    @Autowired
    private PeopleRepository peopleRepository;

    @Autowired
    private PetitionRepository petitionRepository;

    @Autowired
    private ClassRepository classRepository;

    private People testUser;
    private Petition testPetition;

    @BeforeEach
    void setup() {
        commentRepository.deleteAll();
        peopleRepository.deleteAll();
        petitionRepository.deleteAll();
        classRepository.deleteAll();
        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setName("1A");
        schoolClass.setSchoolId(1L);
        classRepository.save(schoolClass);

        testUser = new People();
        testUser.setSchoolId(1L);
        testUser.setClassId(schoolClass.getId());
        testUser.setFirstName("John");
        testUser.setLastName("Doe");
        testUser.setEmail("john@example.com");
        testUser.setPassword("password");
        testUser.setRole(People.Role.STUDENT);
        peopleRepository.save(testUser);

        testPetition = new Petition("Test", "Description", 1L, schoolClass.getId(),
                testUser.getId(), new Date(), new Date(System.currentTimeMillis() + 100000), Petition.Status.OPEN);
        petitionRepository.save(testPetition);
    }

    @Test
    void testAddComment() {
        Comment comment = new Comment(testUser.getId(), testPetition.getId(), "Great!");
        Comment saved = commentService.addComment(comment);
        assertThat(saved.getId()).isNotNull();
    }

    @Test
    void testDeleteComment() {
        Comment comment = commentService.addComment(new Comment(testUser.getId(), testPetition.getId(), "To delete"));
        commentService.deleteComment(comment.getId());
        assertThat(commentService.getComment(comment.getId())).isNull();
    }

    @Test
    void testGetComment() {
        Comment comment = commentService.addComment(new Comment(testUser.getId(), testPetition.getId(), "To get"));
        Comment found = commentService.getComment(comment.getId());
        assertThat(found).isNotNull();
        assertThat(found.getText()).isEqualTo("To get");
    }

    @Test
    void testGetAllComments() {
        commentService.addComment(new Comment(testUser.getId(), testPetition.getId(), "1"));
        commentService.addComment(new Comment(testUser.getId(), testPetition.getId(), "2"));
        List<Comment> all = commentService.getAllComments();
        assertThat(all).hasSize(2);
    }

    @Test
    void testGetCommentsByPetitionIdAndUserId() {
        commentService.addComment(new Comment(testUser.getId(), testPetition.getId(), "By both IDs"));
        List<Comment> list = commentService.getCommentsByPetitionIdAndUserId(testPetition.getId(), testUser.getId());
        assertThat(list).hasSize(1);
    }

    @Test
    void testGetCommentsByPetitionId() {
        commentService.addComment(new Comment(testUser.getId(), testPetition.getId(), "By petition"));
        List<Comment> list = commentService.getCommentsByPetitionId(testPetition.getId());
        assertThat(list).hasSize(1);
    }

    @Test
    void testGetCommentsByUserId() {
        commentService.addComment(new Comment(testUser.getId(), testPetition.getId(), "By user"));
        List<Comment> list = commentService.getCommentsByUserId(testUser.getId());
        assertThat(list).hasSize(1);
    }

    @Test
    void testDeleteCommentsByPetitionId() {
        commentService.addComment(new Comment(testUser.getId(), testPetition.getId(), "Del by petition"));
        commentService.deleteCommentsByPetitionId(testPetition.getId());
        assertThat(commentService.getCommentsByPetitionId(testPetition.getId())).isEmpty();
    }

    @Test
    void testDeleteCommentsByUserId() {
        commentService.addComment(new Comment(testUser.getId(), testPetition.getId(), "Del by user"));
        commentService.deleteCommentsByUserId(testUser.getId());
        assertThat(commentService.getCommentsByUserId(testUser.getId())).isEmpty();
    }

    
}
