package com.example.demo.javaSrc.people;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.javaSrc.people.People.Role;


@Repository
public interface PeopleRepository extends JpaRepository<People, Long> {
    Optional<People> findByEmail(String email);
    List<People> findByRole(People.Role role);
    List<People> findBySchoolId(Long schoolId);
    List<People> findBySchoolIdAndClassId(Long schoolId, Long classId);
    List<People> findByRoleAndSchoolId(Role role, Long schoolId);
    List<People> findByRoleAndSchoolIdAndClassId(Role student, Long schoolId, Long classId);
    Optional<People> findById(Long id);
}
