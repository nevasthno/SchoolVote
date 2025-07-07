import { renderVoteCreation, renderAvailableVotes } from './vote.js';
import { fetchWithAuth } from './api.js';


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

document.addEventListener("DOMContentLoaded", () => {

    const logoutBtn = document.getElementById("logoutButton");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
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
    } catch (e) {
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
renderAvailableVotes('available-votes-container');
renderVoteCreation('vote-create-container');



const $ = id => document.getElementById(id);

const translations = {
  ua: {
    langButton: "🌐 English",
    tabs: {
      users: "Користувачі",
      create: "Додавання/Статистика",
      profile: "Профіль"
    },
    users: {
      title: "Список користувачів",
      editTitle: "Редагувати користувача",
      save: "Зберегти",
      cancel: "Скасувати"
    },
    create: {
      school: "Школа:",
      class: "Клас:",
      createTitle: "Створити користувача",
      place: {
        first: "Ім’я",
        last: "Прізвище",
        email: "Email",
        pass: "Пароль",
        about: "Про себе",
        dob: "Дата народження"
      },
      role: {
        label: "Оберіть роль",
        teacher: "Вчитель",
        student: "Учень",
        parent: "Батьки"
      },
      btn: "Створити користувача",
      voteTitle: "Голосування"
    },
    profile: {
      title: "Інформація про профіль",
      update: "Оновити профіль",
      fields: {
        name: "Ім'я:",
        last: "Прізвище:",
        dob: "Дата народження:",
        about: "Про мене:",
        email: "Email:",
        role: "Роль:"
      },
      form: {
        newPass: "Новий пароль:",
        confirm: "Підтвердження пароля:",
        btn: "Оновити профіль"
      }
    }
  },
  en: {
    langButton: "🌐 Українська",
    tabs: {
      users: "Users",
      create: "Create/Stats",
      profile: "Profile"
    },
    users: {
      title: "User List",
      editTitle: "Edit User",
      save: "Save",
      cancel: "Cancel"
    },
    create: {
      school: "School:",
      class: "Class:",
      createTitle: "Create User",
      place: {
        first: "First Name",
        last: "Last Name",
        email: "Email",
        pass: "Password",
        about: "About Me",
        dob: "Date of Birth"
      },
      role: {
        label: "Select Role",
        teacher: "Teacher",
        student: "Student",
        parent: "Parent"
      },
      btn: "Create User",
      voteTitle: "Voting"
    },
    profile: {
      title: "Profile Info",
      update: "Update Profile",
      fields: {
        name: "Name:",
        last: "Surname:",
        dob: "Date of Birth:",
        about: "About Me:",
        email: "Email:",
        role: "Role:"
      },
      form: {
        newPass: "New Password:",
        confirm: "Confirm Password:",
        btn: "Update Profile"
      }
    }
  }
};

let currentLang = localStorage.getItem("lang") || "ua";

function applyLanguage(lang) {
  const t = translations[lang];

  if ($("toggleLangBtn")) $("toggleLangBtn").textContent = t.langButton;

  // Tabs
  if ($("tab-users")) $("tab-users").textContent = t.tabs.users;
  if ($("tab-create")) $("tab-create").textContent = t.tabs.create;
  if ($("tab-profile")) $("tab-profile").textContent = t.tabs.profile;

  // Users section
  const usersTitle = document.querySelector("#users-page h2");
  if (usersTitle) usersTitle.textContent = t.users.title;
  if ($("edit-user-section")) {
    $("edit-user-section").querySelector("h3").textContent = t.users.editTitle;
    $("edit-user-form").querySelector("button[type='submit']").textContent = t.users.save;
    $("cancel-edit").textContent = t.users.cancel;
  }

  // Create section
  const labels = document.querySelectorAll("#selection-section label");
  if (labels.length >= 2) {
    labels[0].childNodes[0].textContent = t.create.school + " ";
    labels[1].childNodes[0].textContent = t.create.class + " ";
  }
  const createTitle = document.querySelector("#create-page h2");
  if (createTitle) createTitle.textContent = t.create.createTitle;

  $("new-user-first").placeholder = t.create.place.first;
  $("new-user-last").placeholder = t.create.place.last;
  $("new-user-email").placeholder = t.create.place.email;
  $("new-user-pass").placeholder = t.create.place.pass;
  $("new-user-aboutMe").placeholder = t.create.place.about;
  $("new-user-dateOfBirth").placeholder = t.create.place.dob;

  const roleSelect = $("new-user-role");
  if (roleSelect) {
    roleSelect.options[0].text = t.create.role.label;
    roleSelect.options[1].text = t.create.role.teacher;
    roleSelect.options[2].text = t.create.role.student;
    roleSelect.options[3].text = t.create.role.parent;
  }

  $("create-user-button").textContent = t.create.btn;

  const voteH2 = document.querySelector("#create-page .info-card h2");
  if (voteH2) voteH2.textContent = t.create.voteTitle;

  // Profile
  const profileSection = $("profile-info");
  if (profileSection) {
    const spans = profileSection.querySelectorAll("p");
    spans[0].childNodes[0].textContent = t.profile.fields.name;
    spans[1].childNodes[0].textContent = t.profile.fields.last;
    spans[2].childNodes[0].textContent = t.profile.fields.dob;
    spans[3].childNodes[0].textContent = t.profile.fields.about;
    spans[4].childNodes[0].textContent = t.profile.fields.email;
    spans[5].childNodes[0].textContent = t.profile.fields.role;
  }

  const form = $("editProfileForm");
  if (form) {
    form.querySelector("label[for='edit-firstName']").textContent = t.profile.fields.name;
    form.querySelector("label[for='edit-lastName']").textContent = t.profile.fields.last;
    form.querySelector("label[for='edit-aboutMe']").textContent = t.profile.fields.about;
    form.querySelector("label[for='edit-dateOfBirth']").textContent = t.profile.fields.dob;
    form.querySelector("label[for='edit-email']").textContent = t.profile.fields.email;
    form.querySelector("label[for='edit-password']").textContent = t.profile.form.newPass;
    form.querySelector("label[for='confirm-password']").textContent = t.profile.form.confirm;
    form.querySelector("button[type='submit']").textContent = t.profile.form.btn;
  }

  const profTitles = document.querySelectorAll("#profile-section h2");
  if (profTitles.length >= 2) {
    profTitles[0].textContent = t.profile.title;
    profTitles[1].textContent = t.profile.update;
  }
}

function toggleLanguage() {
  currentLang = currentLang === "ua" ? "en" : "ua";
  localStorage.setItem("lang", currentLang);
  applyLanguage(currentLang);
}

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("toggleLangBtn")) {
    const btn = document.createElement("button");
    btn.id = "toggleLangBtn";
    btn.className = "lang-toggle-button";
    btn.style.marginLeft = "10px";
    btn.addEventListener("click", toggleLanguage);

    const logoutBtn = document.getElementById("logoutButton");
    if (logoutBtn && logoutBtn.parentElement) {
      logoutBtn.parentElement.appendChild(btn);
    }
  }

  applyLanguage(currentLang);
});
