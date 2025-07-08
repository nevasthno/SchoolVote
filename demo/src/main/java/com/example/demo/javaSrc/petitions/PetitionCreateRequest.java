package com.example.demo.javaSrc.petitions;

import java.time.LocalDateTime;

public record PetitionCreateRequest(
    String title,
    String description,
    LocalDateTime startDate,
    LocalDateTime endDate,
    Long classId
) {}
