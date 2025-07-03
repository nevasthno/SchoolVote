package com.example.demo.javaSrc.worker;

import com.example.demo.javaSrc.people.People;
import com.example.demo.javaSrc.people.PeopleService;
import com.example.demo.javaSrc.security.JwtUtils;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    public ResponseEntity<?> login(@RequestBody AuthRequest authRequest,
                                HttpServletResponse response) {
        try {
            Authentication authentication = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getEmail(), authRequest.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            String token = jwtUtils.generateToken(authentication);

            Cookie jwtCookie = new Cookie("JWT", token);
            jwtCookie.setHttpOnly(true);
            jwtCookie.setSecure(true);  // Включати лише якщо працюєш з HTTPS
            jwtCookie.setPath("/");
            jwtCookie.setMaxAge((int)(jwtUtils.getJwtExpirationMs() / 1000)); 

            response.addCookie(jwtCookie);


            People u = peopleService.findByEmail(authRequest.getEmail());
            if (u == null) {
                throw new UsernameNotFoundException("User not found");
            }
            if (!u.getRole().name().equalsIgnoreCase(authRequest.getRole())) {
                return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Role mismatch"));
            }
            return ResponseEntity.ok(Map.of(
                "role", u.getRole().name()
            ));
        } catch (BadCredentialsException ex) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Невірний email або пароль"));
        }
    }

    
}
