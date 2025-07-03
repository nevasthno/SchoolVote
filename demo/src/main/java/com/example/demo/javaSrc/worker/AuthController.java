package com.example.demo.javaSrc.worker;

import com.example.demo.javaSrc.people.People;
import com.example.demo.javaSrc.people.PeopleService;
import com.example.demo.javaSrc.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtUtils jwtUtils;
    private final PeopleService peopleService;

    @Autowired
    public AuthController(AuthenticationManager authManager,
                          JwtUtils jwtUtils,
                          PeopleService peopleService) {
        this.authManager   = authManager;
        this.jwtUtils      = jwtUtils;
        this.peopleService = peopleService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest req) {
        try {
            Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
            );
            People u = peopleService.findByEmail(req.getEmail());
            if (u == null) {
                throw new UsernameNotFoundException("User not found");
            }
            if (!u.getRole().name().equalsIgnoreCase(req.getRole())) {
                return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Role mismatch"));
            }
            String token = jwtUtils.generateToken(auth);
            return ResponseEntity.ok(Map.of(
                "token", token,
                "role", u.getRole().name()
            ));
        } catch (BadCredentialsException ex) {
            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid email or password"));
        }
    }
    
}
