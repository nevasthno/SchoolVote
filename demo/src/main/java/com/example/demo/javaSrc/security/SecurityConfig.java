package com.example.demo.javaSrc.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.example.demo.javaSrc.people.PeopleRepository;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(JwtUtils jwtUtils,
            UserDetailsService uds) {
        return new JwtAuthenticationFilter(jwtUtils, uds);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
            JwtAuthenticationFilter jwtFilter) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/", "/login.html",
                                "/styles/**", "/scripts/**", "/favicon.ico", "/profile.html", "/me")
                        .permitAll()
                        .requestMatchers("/teacher.html").hasRole("TEACHER")
                        .requestMatchers("/student.html").hasRole("STUDENT")
                        .requestMatchers("/parent.html").hasRole("PARENT")
                        .requestMatchers("/director.html").hasRole("DIRECTOR")
                        .requestMatchers(HttpMethod.POST, "/api/login").permitAll()
                        .requestMatchers(HttpMethod.POST,
                                "/api/users")
                        .hasRole("TEACHER")
                        .requestMatchers(HttpMethod.PUT, "/api/users/**").hasRole("TEACHER")
                        .anyRequest().authenticated())
                .addFilterBefore(jwtFilter,
                        UsernamePasswordAuthenticationFilter.class)
                .formLogin(form -> form
                        .loginPage("/login.html")
                        .permitAll());
        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg)
            throws Exception {
        return cfg.getAuthenticationManager();
    }

    @Bean
    public UserDetailsService userDetailsService(PeopleRepository repo) {
        return username -> repo.findByEmail(username)
                .map(person -> User.withUsername(person.getEmail())
                        .password(person.getPassword())
                        .authorities("ROLE_" + person.getRole())
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
