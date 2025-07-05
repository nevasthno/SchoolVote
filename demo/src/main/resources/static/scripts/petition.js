document.addEventListener("DOMContentLoaded", () => {
    const petitionForm = document.getElementById("create-petition-form");
    const petitionList = document.getElementById("petition-list");

    // Імітація кількості учнів у школі та класах
    const schoolData = {
        totalSchoolStudents: 300,
        classSizes: {
            "9-А": 28,
            "10-Б": 25,
            "11-В": 30
        }
    };

    function loadPetitions() {
        return JSON.parse(localStorage.getItem("petitions") || "[]");
    }

    function savePetitions(petitions) {
        localStorage.setItem("petitions", JSON.stringify(petitions));
    }

    function renderPetitions() {
        const petitions = loadPetitions();
        petitionList.innerHTML = "";

        if (petitions.length === 0) {
            petitionList.innerHTML = "<p>Немає активних петицій.</p>";
            return;
        }

        petitions.forEach(petition => {
            const div = document.createElement("div");
            div.className = "aboutme-card";

            div.innerHTML = `
                <h3>${petition.title}</h3>
                <p><strong>Автор:</strong> ${petition.creator}</p>
                <p>${petition.description}</p>
                <p><strong>Ціль:</strong> ${petition.targetType === "school" ? "Вся школа" : `Клас ${petition.targetClass}`}</p>
                <p><strong>Потрібно голосів:</strong> ${petition.threshold}</p>
                <p><strong>Підписали:</strong> ${petition.votes.length}</p>
                ${petition.signedByDirector ? `<p style="color:green;"><strong>✅ Підписано директором</strong></p>` : ""}
                <button ${petition.signedByDirector ? "disabled" : ""} onclick="signPetition(${petition.id})">Підписати</button>
                ${(petition.votes.length >= petition.threshold && !petition.signedByDirector)
                    ? `<button onclick="directorSign(${petition.id})">Підписати як директор</button>`
                    : ""}
            `;

            petitionList.appendChild(div);
        });
    }

    petitionForm?.addEventListener("submit", (e) => {
        e.preventDefault();

        const title = document.getElementById("petition-title").value.trim();
        const description = document.getElementById("petition-description").value.trim();
        const creator = document.getElementById("petition-author").value.trim();
        const target = document.getElementById("petition-target").value;

        let threshold = 0;
        let targetType = "class";
        let targetClass = null;

        if (target === "school") {
            threshold = Math.ceil(schoolData.totalSchoolStudents * 0.5);
            targetType = "school";
        } else if (schoolData.classSizes[target]) {
            threshold = Math.ceil(schoolData.classSizes[target] * 0.5);
            targetClass = target;
        } else {
            alert("Обраний клас не існує.");
            return;
        }

        if (!title || !description || !creator) {
            alert("Будь ласка, заповніть усі поля.");
            return;
        }

        const petitions = loadPetitions();

        const newPetition = {
            id: Date.now(),
            title,
            description,
            creator,
            targetType,
            targetClass,
            threshold,
            votes: [],
            signedByDirector: false
        };

        petitions.push(newPetition);
        savePetitions(petitions);
        petitionForm.reset();
        renderPetitions();
    });

    // Підпис учнем
    window.signPetition = (id) => {
        const petitions = loadPetitions();
        const email = prompt("Введіть свій email для підпису:");

        if (!email || !email.includes("@")) {
            alert("Некоректний email.");
            return;
        }

        const petition = petitions.find(p => p.id === id);
        if (petition.votes.includes(email)) {
            alert("Ви вже підписали цю петицію.");
            return;
        }

        petition.votes.push(email);
        savePetitions(petitions);
        renderPetitions();
    };

    // Підпис директором
    window.directorSign = (id) => {
        const confirmSign = confirm("Підписати цю петицію як директор?");
        if (!confirmSign) return;

        const petitions = loadPetitions();
        const petition = petitions.find(p => p.id === id);

        petition.signedByDirector = true;
        savePetitions(petitions);
        renderPetitions();
    };

    renderPetitions();
});
