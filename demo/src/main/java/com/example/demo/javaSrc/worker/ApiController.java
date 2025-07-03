package com.example.demo.javaSrc.worker;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.javaSrc.people.People;
import com.example.demo.javaSrc.people.PeopleService;
import com.example.demo.javaSrc.school.School;
import com.example.demo.javaSrc.school.SchoolService;
import com.example.demo.javaSrc.school.SchoolClass;
import com.example.demo.javaSrc.school.ClassService;

@RestController
@RequestMapping("/api")
public class ApiController {


    private final PeopleService peopleService;
    private final PasswordEncoder passwordEncoder;
    private final SchoolService schoolService;
    private final ClassService classService;

    @Autowired
    public ApiController(
                         PeopleService peopleService,
                         PasswordEncoder passwordEncoder,
                         SchoolService schoolService,
                         ClassService classService) {
        
        this.peopleService   = peopleService;
        this.passwordEncoder = passwordEncoder;
        this.schoolService   = schoolService;
        this.classService    = classService;
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
            teachers.removeIf(p -> 
                !p.getFirstName().toLowerCase().contains(name.toLowerCase()) &&
                !p.getLastName().toLowerCase().contains(name.toLowerCase())
            );
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

        // Do NOT override schoolId/classId if present in request
        // Only check for null to avoid errors, but do not set to teacher's own
        if (newUser.getSchoolId() == null) {
            return ResponseEntity.badRequest().body(null);
        }
        // classId can be null (for school-wide users)

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
}
