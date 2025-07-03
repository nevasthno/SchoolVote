package com.example.demo.javaSrc.votingAndPetitions;

import org.springframework.stereotype.Service;

@Service
public class PetitionsService {
    private final PetitionsRepository petitionsRepository;

    public PetitionsService(PetitionsRepository petitionsRepository) {
        this.petitionsRepository = petitionsRepository;
    }

       
}
