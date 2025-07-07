package com.example.demo;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.example.demo.javaSrc.school.*;

@SpringBootTest
public class ClassRepositoryTest {
    @Autowired
    private ClassRepository classRepository;

    @Test
    void testFindBySchoolId(){
        classRepository.deleteAll();

        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setName("Math Class");
        schoolClass.setSchoolId(1L);
        classRepository.save(schoolClass);
        
        List<SchoolClass> classes = classRepository.findBySchoolId(1L);

        assertThat(classes).isNotEmpty();
        assertThat(classes.get(0).getName()).isEqualTo("Math Class");
        assertThat(classes.get(0).getSchoolId()).isEqualTo(1L);
        
    }
}
