package com.example.demo;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.example.demo.javaSrc.people.People;
import com.example.demo.javaSrc.people.PeopleRepository;
import com.example.demo.javaSrc.school.ClassRepository;
import com.example.demo.javaSrc.school.SchoolClass;

@SpringBootTest
public class PeopleRepositoryTest {
    @Autowired
    private PeopleRepository peopleRepository;
    @Autowired
    private ClassRepository classRepository;

    @BeforeEach
    void setUp() {
        peopleRepository.deleteAll();
        classRepository.deleteAll();

    }

    @Test
    void testFindByEmail() {
        People person = new People();
        String email = "testemail@gmail.com";
        SchoolClass class1 = new SchoolClass();
        class1.setName("1A");
        class1.setSchoolId(1L);
        classRepository.save(class1);

        person.setSchoolId(1L);
        person.setClassId(class1.getId());
        person.setEmail("testemail@gmail.com");
        person.setPassword("password123");
        person.setFirstName("John");
        person.setLastName("Doe");
        person.setRole(People.Role.STUDENT);
        peopleRepository.save(person);

        peopleRepository.save(person);

        Optional<People> found = peopleRepository.findByEmail(email);

        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo(email);
    }


    @Test
    void testFindByRole() {
        SchoolClass class1 = new SchoolClass();
        class1.setName("1A");
        class1.setSchoolId(1L);
        classRepository.save(class1);

        People person = new People();
        person.setSchoolId(1L);
        person.setClassId(class1.getId());
        person.setEmail("testemail@gmail.com");
        person.setPassword("password123");
        person.setFirstName("John");
        person.setLastName("Doe");
        person.setRole(People.Role.STUDENT);
        peopleRepository.save(person);

        People person2 = new People();
        person2.setRole(People.Role.TEACHER);
        person2.setSchoolId(2L);
        person2.setClassId(class1.getId());
        person2.setEmail("testemail1@gmail.com");
        person2.setPassword("password123");
        person2.setFirstName("John");
        person2.setLastName("Doe");
        peopleRepository.save(person2);


        List<People> students = peopleRepository.findByRole(People.Role.STUDENT);
        List<People> teachers = peopleRepository.findByRole(People.Role.TEACHER);

        assertThat(students).hasSize(1);
        assertThat(teachers).hasSize(1);
    }    

   @Test
    void testFindBySchoolId() {
        SchoolClass class1 = new SchoolClass();
        class1.setName("1A");
        class1.setSchoolId(1L);
        classRepository.save(class1);

        SchoolClass class2 = new SchoolClass();
        class2.setName("2A");
        class2.setSchoolId(2L);
        classRepository.save(class2);

        People person = new People();
        person.setSchoolId(1L);
        person.setClassId(class1.getId());
        person.setEmail("testemail@gmail.com");
        person.setPassword("password123");
        person.setFirstName("John");
        person.setLastName("Doe");
        person.setRole(People.Role.STUDENT);
        peopleRepository.save(person);

        People person2 = new People();
        person2.setRole(People.Role.TEACHER);
        person2.setSchoolId(2L);
        person2.setClassId(class2.getId());
        person2.setEmail("testemail1@gmail.com");
        person2.setPassword("password123");
        person2.setFirstName("John");
        person2.setLastName("Doe");
        peopleRepository.save(person2);

        List<People> school1People = peopleRepository.findBySchoolId(1L);
        List<People> school2People = peopleRepository.findBySchoolId(2L);

        assertThat(school1People).hasSize(1);
        assertThat(school2People).hasSize(1);
    }

    @Test
    void testFindBySchoolIdAndClassId() {
        SchoolClass class1 = new SchoolClass();
        class1.setName("1A");
        class1.setSchoolId(1L);
        classRepository.save(class1);

        SchoolClass class2 = new SchoolClass();
        class2.setName("2A");
        class2.setSchoolId(2L);
        classRepository.save(class2);

        People person = new People();
        person.setSchoolId(1L);
        person.setClassId(class1.getId());
        person.setEmail("testemail@gmail.com");
        person.setPassword("password123");
        person.setFirstName("John");
        person.setLastName("Doe");
        person.setRole(People.Role.STUDENT);
        peopleRepository.save(person);

        People person2 = new People();
        person2.setRole(People.Role.TEACHER);
        person2.setSchoolId(2L);
        person2.setClassId(class2.getId());
        person2.setEmail("testemail1@gmail.com");
        person2.setPassword("password123");
        person2.setFirstName("John");
        person2.setLastName("Doe");
        peopleRepository.save(person2);

        List<People> class1People = peopleRepository.findBySchoolIdAndClassId(1L, class1.getId());
        List<People> class2People = peopleRepository.findBySchoolIdAndClassId(2L, class2.getId());

        assertThat(class1People).hasSize(1);
        assertThat(class2People).hasSize(1);
    }
}
