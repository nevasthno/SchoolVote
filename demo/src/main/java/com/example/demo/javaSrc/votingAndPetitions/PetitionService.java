package com.example.demo.javaSrc.votingAndPetitions;

import org.springframework.stereotype.Service;

@Service
public class PetitionService {
    private final PetitionRepository petitionsRepository;

    public PetitionService(PetitionRepository petitionsRepository) {
        this.petitionsRepository = petitionsRepository;
    }

       
}
