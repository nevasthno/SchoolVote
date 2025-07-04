// Tab/page switching logic
function addPollOption() {
    const input = document.createElement('input');
    input.className = 'poll-option';
    input.placeholder = `Варіант`;
    document.getElementById('poll-options').appendChild(input);
}

function submitPoll() {
    const question = document.getElementById('poll-question').value;
    const optionInputs = document.querySelectorAll('.poll-option');
    const options = Array.from(optionInputs).map(input => input.value).filter(opt => opt.trim());

    if (!question || options.length < 2) {
        alert('Введіть питання і хоча б два варіанти!');
        return;
    }

    const pollData = { question, options };

    localStorage.setItem('currentPoll', JSON.stringify(pollData)); // для демо, замінити API-запитом

    alert('Опитування створено!');
    document.getElementById('poll-question').value = '';
    document.getElementById('poll-options').innerHTML = `
        <input class="poll-option" placeholder="Варіант 1">
        <input class="poll-option" placeholder="Варіант 2">
    `;
}




  const themeToggleBtn = document.getElementById('toggleThemeButton');
  const isDark = localStorage.getItem('theme') === 'dark';

  if (isDark) {
    document.body.classList.add('dark-theme');
  }

  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isNowDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isNowDark ? 'dark' : 'light');
  });


document.addEventListener("DOMContentLoaded", function () {
    const tabUsers = document.getElementById("tab-users");
    const tabCreate = document.getElementById("tab-create");
    const tabProfile = document.getElementById("tab-profile");
    const usersPage = document.getElementById("users-page");
    const createPage = document.getElementById("create-page");
    const profileSection = document.getElementById("profile-section");

    function showPage(page) {
        usersPage.classList.remove("active");
        createPage.classList.remove("active");
        profileSection.classList.remove("active");
        tabUsers.classList.remove("active");
        tabCreate.classList.remove("active");
        tabProfile.classList.remove("active");
        if (page === "users") {
            usersPage.classList.add("active");
            tabUsers.classList.add("active");
        } else if (page === "create") {
            createPage.classList.add("active");
            tabCreate.classList.add("active");
        } else if (page === "profile") {
            profileSection.classList.add("active");
            tabProfile.classList.add("active");
        }
    }

    if (tabUsers && tabCreate && tabProfile && usersPage && createPage && profileSection) {
        tabUsers.addEventListener("click", () => showPage("users"));
        tabCreate.addEventListener("click", () => showPage("create"));
        tabProfile.addEventListener("click", () => showPage("profile"));
    }
});

async function fetchWithAuth(url, opts = {}) {
    const token = localStorage.getItem("jwtToken");
    opts.headers = {
        ...(opts.headers || {}),
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };
    return fetch(url, opts);
}

document.addEventListener("DOMContentLoaded", () => {

    const logoutBtn = document.getElementById("logoutButton");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("jwtToken");
            window.location.href = "login.html";
        });
    }


    loadStats();
    loadUsers();
    loadProfile();

    const goBackBtn = document.getElementById("goBackToMainButton");
    if (goBackBtn) {
        goBackBtn.addEventListener("click", () => {
            if (document.referrer) {
                window.location.href = document.referrer;
            } else {
                window.location.href = "login.html";
            }
        });
    }

    const editProfileForm = document.getElementById("editProfileForm");
    if (editProfileForm) {
        editProfileForm.addEventListener("submit", updateProfile);
    }


    const createUserBtn = document.getElementById("create-user-button");
    if (createUserBtn) {
        createUserBtn.addEventListener("click", async () => {
            const first = document.getElementById("new-user-first").value.trim();
            const last = document.getElementById("new-user-last").value.trim();
            const email = document.getElementById("new-user-email").value.trim();
            const pass = document.getElementById("new-user-pass").value;
            const aboutMe = document.getElementById("new-user-aboutMe").value.trim();
            const dateOfBirth = document.getElementById("new-user-dateOfBirth").value;
            const role = document.getElementById("new-user-role").value;
            const schoolId = document.getElementById("school-select")?.value;
            const classId = document.getElementById("class-select")?.value;

            if (!first || !last || !email || !pass || !role || !aboutMe || !dateOfBirth || !schoolId) {
                alert("Заповніть всі поля та оберіть школу.");
                return;
            }

            try {
                const payload = {
                    firstName: first,
                    lastName: last,
                    email,
                    password: pass,
                    aboutMe,
                    dateOfBirth,
                    role,
                    schoolId: Number(schoolId)
                };
                if (classId) payload.classId = Number(classId);

                const res = await fetchWithAuth("/api/users", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error(res.status);
                alert("Користувача створено!");
                loadUsers();
            } catch (e) {
                console.error("Помилка створення користувача:", e);
                alert("Не вдалося створити користувача.");
            }
        });
    }


    const createTaskBtn = document.getElementById("create-task-button");
    if (createTaskBtn) {
        createTaskBtn.addEventListener("click", async () => {
            const title = document.getElementById("task-title").value.trim();
            const content = document.getElementById("task-content").value.trim();
            const deadlineStr = document.getElementById("task-deadline").value;
            const schoolId = document.getElementById("school-select")?.value;
            const classId = document.getElementById("class-select")?.value;

            if (!title || !deadlineStr || !schoolId) {
                alert("Вкажіть назву, дедлайн та школу.");
                return;
            }

            try {
                const payload = {
                    title,
                    content,
                    deadline: new Date(deadlineStr).toISOString(),
                    schoolId: Number(schoolId)
                };
                if (classId) payload.classId = Number(classId);

                const res = await fetchWithAuth("/api/tasks", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error(res.status);
                alert("Завдання додано!");
            } catch (e) {
                console.error("Помилка додавання завдання:", e);
                alert("Не вдалося додати завдання.");
            }
        });
    }


    const createEventBtn = document.getElementById("create-event-button");
    if (createEventBtn) {
        createEventBtn.addEventListener("click", async () => {
            const userId = localStorage.getItem("userId");
            const title = document.getElementById("event-title").value.trim();
            const content = document.getElementById("event-content").value.trim();
            const loc = document.getElementById("event-location").value.trim();
            const startStr = document.getElementById("event-start").value;
            const duration = parseInt(document.getElementById("event-duration").value, 10);
            const type = document.getElementById("event-type").value;
            const schoolId = document.getElementById("school-select")?.value;
            const classId = document.getElementById("class-select")?.value;

            if (!title || !startStr || !duration || !type || !schoolId) {
                alert("Вкажіть обов’язкові поля та школу.");
                return;
            }

            try {
                const payload = {
                    title,
                    content,
                    location_or_link: loc,
                    start_event: new Date(startStr).toISOString(),
                    duration,
                    event_type: type,
                    schoolId: Number(schoolId)
                };
                if (classId) payload.classId = Number(classId);

                await fetchWithAuth("/api/events", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
                alert("Подію створено!");
            } catch (e) {
                console.error("Помилка створення події:", e);
                alert("Не вдалося створити подію.");
            }
        });
    }


    const editUserForm = document.getElementById("edit-user-form");
    if (editUserForm) {
        editUserForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const id = document.getElementById("edit-user-id").value;
            const firstName = document.getElementById("edit-firstName").value.trim();
            const lastName = document.getElementById("edit-lastName").value.trim();
            const aboutMe = document.getElementById("edit-aboutMe").value.trim();
            const dateOfBirth = document.getElementById("edit-dateOfBirth").value;

            if (!firstName || !lastName || !aboutMe || !dateOfBirth) {
                alert("Заповніть всі поля.");
                return;
            }

            try {
                const res = await fetchWithAuth(`/api/users/${id}`, {
                    method: "PUT",
                    body: JSON.stringify({ firstName, lastName, aboutMe, dateOfBirth })
                });

                if (!res.ok) throw new Error(res.status);
                alert("Профіль оновлено!");
                document.getElementById("edit-user-section").style.display = "none";
                loadUsers();
            } catch (e) {
                console.error("Помилка оновлення користувача:", e);
                alert("Не вдалося оновити профіль.");
            }
        });
    }

    // Add this block to initialize school/class selects and stats
    initSchoolClassSelectors();
});

async function initSchoolClassSelectors() {
    const schoolSel = document.getElementById("school-select");
    const classSel = document.getElementById("class-select");
    if (!schoolSel || !classSel) return;

    // Load schools
    try {
        const resS = await fetchWithAuth("/api/schools");
        if (!resS.ok) throw new Error(resS.status);
        const schools = await resS.json();
        schoolSel.innerHTML = `<option value=''>Оберіть школу</option>`;
        schools.forEach(s => {
            schoolSel.innerHTML += `<option value="${s.id}">${s.name}</option>`;
        });
    } catch (e) {
        schoolSel.innerHTML = `<option value=''>Не вдалося завантажити школи</option>`;
        classSel.innerHTML = `<option value=''>---</option>`;
        return;
    }

    // When school changes, load classes and update stats
    schoolSel.onchange = async () => {
        const schoolId = schoolSel.value;
        if (!schoolId) {
            classSel.innerHTML = `<option value=''>Оберіть школу</option>`;
            await loadStats();
            return;
        }
        classSel.innerHTML = `<option>Завантаження...</option>`;
        try {
            const resC = await fetchWithAuth(`/api/classes?schoolId=${schoolId}`);
            if (!resC.ok) throw new Error(resC.status);
            const classes = await resC.json();
            classSel.innerHTML = `<option value=''>Усі класи</option>`;
            classes.forEach(c => {
                classSel.innerHTML += `<option value="${c.id}">${c.name}</option>`;
            });
        } catch (e) {
            classSel.innerHTML = `<option value=''>Не вдалося завантажити класи</option>`;
        }
        await loadStats();
    };

    // When class changes, update stats
    classSel.onchange = async () => {
        await loadStats();
    };

    // Initial stats
    await loadStats();
}

async function loadStats() {
    try {
        const schoolSel = document.getElementById("school-select");
        const classSel = document.getElementById("class-select");
        let url = "/api/stats";
        const params = [];
        if (schoolSel && schoolSel.value) params.push(`schoolId=${schoolSel.value}`);
        if (classSel && classSel.value) params.push(`classId=${classSel.value}`);
        if (params.length) url += "?" + params.join("&");

        const res = await fetchWithAuth(url);
        if (!res.ok) throw new Error(res.status);
        const stats = await res.json();
        document.getElementById("stat-total-tasks").textContent = stats.totalTasks;
        document.getElementById("stat-completed-tasks").textContent = stats.completedTasks;
        document.getElementById("stat-total-events").textContent = stats.totalEvents;
    } catch (e) {
        document.getElementById("stat-total-tasks").textContent = "–";
        document.getElementById("stat-completed-tasks").textContent = "–";
        document.getElementById("stat-total-events").textContent = "–";
        console.error("Помилка завантаження статистики:", e);
    }
}

async function loadUsers() {
    try {
        const res = await fetchWithAuth("/api/loadUsers");
        if (!res.ok) throw new Error(res.status);
        const users = await res.json();

        const userList = document.getElementById("user-list");
        if (!userList) return;

        userList.innerHTML = "";
        users.forEach(user => {
            const li = document.createElement("li");
            li.textContent = `${user.firstName} ${user.lastName} (${user.email})`;

            const editBtn = document.createElement("button");
            editBtn.textContent = "Змінити профіль";
            editBtn.style.marginLeft = "10px";
            editBtn.addEventListener("click", () => openEditForm(user));

            li.appendChild(editBtn);
            userList.appendChild(li);
        });
    } catch (e) {
        console.error("Помилка завантаження користувачів:", e);
    }
}

function openEditForm(user) {
    document.getElementById("edit-user-section").style.display = "block";
    document.getElementById("edit-user-id").value = user.id;
    document.getElementById("edit-firstName").value = user.firstName;
    document.getElementById("edit-lastName").value = user.lastName;
    document.getElementById("edit-aboutMe").value = user.aboutMe;
    document.getElementById("edit-dateOfBirth").value = user.dateOfBirth;
}

async function loadProfile() {
    try {
        const res = await fetchWithAuth("/api/me");
        if (!res.ok) throw new Error(res.status);

        const user = await res.json();
        document.getElementById("profile-firstName").textContent = user.firstName || "-";
        document.getElementById("profile-lastName").textContent = user.lastName || "-";
        document.getElementById("profile-aboutMe").textContent = user.aboutMe || "-";
        document.getElementById("profile-dateOfBirth").textContent = user.dateOfBirth || "-";
        document.getElementById("profile-email").textContent = user.email || "-";
        document.getElementById("profile-role").textContent = user.role || "-";

        document.getElementById("edit-firstName").value = user.firstName || "";
        document.getElementById("edit-lastName").value = user.lastName || "";
        document.getElementById("edit-aboutMe").value = user.aboutMe || "";
        document.getElementById("edit-dateOfBirth").value = user.dateOfBirth || "";
        document.getElementById("edit-email").value = user.email || "";
    } catch (e) {
        console.error("Помилка завантаження профілю", e);
        alert("Не вдалося завантажити профіль. Спробуйте ще раз.");
    }
}

async function updateProfile(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    if (data.password !== data.confirmPassword) {
        alert("Паролі не збігаються!");
        return;
    }

    delete data.confirmPassword;
    if (!data.password) delete data.password;

    Object.keys(data).forEach(key => {
        if (data[key] === "") delete data[key];
    });

    try {
        const res = await fetchWithAuth("/api/me", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(res.status);
        alert("Профіль успішно оновлено!");
        loadProfile();
    } catch (e) {
        console.error("Помилка оновлення профілю", e);
        alert("Не вдалося оновити профіль.");
    }
}
