import { renderVoteCreation, renderAvailableVotes } from './vote.js';
import { fetchWithAuth } from './api.js';

const themeBtn = document.getElementById('toggleThemeButton');
  const savedTheme = localStorage.getItem('theme');


let schoolId = null, classId = null;
let currentMonth, currentYear;

// Tab/page switching logic
document.addEventListener("DOMContentLoaded", function () {
    const tabMain = document.getElementById("tab-main");
    const tabProfile = document.getElementById("tab-profile");
    const mainPage = document.getElementById("main-page");
    const profilePage = document.getElementById("profile-page");

    function showPage(page) {
        mainPage.classList.remove("active");
        profilePage.classList.remove("active");
        tabMain.classList.remove("active");
        tabProfile.classList.remove("active");
        if (page === "main") {
            mainPage.classList.add("active");
            tabMain.classList.add("active");
        } else {
            profilePage.classList.add("active");
            tabProfile.classList.add("active");
        }
    }

    if (tabMain && tabProfile && mainPage && profilePage) {
        tabMain.addEventListener("click", () => showPage("main"));
        tabProfile.addEventListener("click", () => showPage("profile"));
    }
});

document.addEventListener("DOMContentLoaded", () => {
    // Logout button
    const logoutBtn = document.getElementById("logoutButton");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            window.location.href = "login.html";
        });
    }

    // Go back button
    document.getElementById("goBackToMainButton")?.addEventListener("click", () => {
        if (document.referrer) {
            window.location.href = document.referrer;
        } else {
            window.location.href = "login.html";
        }
    });

    // Profile form submit
    document.getElementById('editProfileForm')?.addEventListener('submit', updateProfile);

    // Initialize selectors, invitations, calendar, and profile
    initSelectors();
    loadProfile();
});

async function initSelectors() {
    const schoolSel = document.getElementById("school-select");
    const classSel = document.getElementById("class-select");
    if (schoolSel && classSel) {
        const resS = await fetchWithAuth("/api/schools");
        const schools = await resS.json();
        schoolSel.innerHTML = `<option value=''>Оберіть школу</option>`;
        schools.forEach(s => {
            schoolSel.innerHTML += `<option value="${s.id}">${s.name}</option>`;
        });

        schoolSel.onchange = async () => {
            schoolId = schoolSel.value || null;
            classSel.innerHTML = `<option>Завантаження...</option>`;
            if (!schoolId) {
                classSel.innerHTML = `<option value=''>Усі класи</option>`;
                classId = null;
                await loadInvitations();
                await updateCalendar();
                return;
            }
            const resC = await fetchWithAuth(`/api/classes?schoolId=${schoolId}`);
            const classes = await resC.json();
            classSel.innerHTML = `<option value=''>Усі класи</option>`;
            classes.forEach(c => {
                classSel.innerHTML += `<option value="${c.id}">${c.name}</option>`;
            });
            classId = null;
            await loadInvitations();
            await updateCalendar();
        };

        classSel.onchange = async () => {
            classId = classSel.value || null;
            await loadInvitations();
            await updateCalendar();
        };
    }

    await loadInvitations();
    await initCalendar();
}


async function initCalendar() {
    const now = new Date();
    if (typeof currentMonth !== "number" || typeof currentYear !== "number") {
        currentMonth = now.getMonth();
        currentYear = now.getFullYear();
    }

    const prevBtn = document.getElementById("prev-month");
    const nextBtn = document.getElementById("next-month");
    if (prevBtn) prevBtn.onclick = () => changeMonth(-1);
    if (nextBtn) nextBtn.onclick = () => changeMonth(1);

    // Ensure calendar table and section are visible
    const calendarTable = document.getElementById("calendar-table");
    const calendarSection = document.getElementById("calendar-section");
    if (calendarTable) calendarTable.style.display = "table";
    if (calendarSection) calendarSection.style.display = "";

    await updateCalendar();
}

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    updateCalendar();
}

// --- Modal logic for event details ---
function showEventModal(event) {
    let modal = document.getElementById("event-modal");
    // Always reset modal content and display, even if it already exists
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "event-modal";
        document.body.appendChild(modal);
    }
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100vw";
    modal.style.height = "100vh";
    modal.style.background = "rgba(0,0,0,0.5)";
    modal.style.display = "flex";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";
    modal.style.zIndex = "9999";
    modal.innerHTML = `
        <div id="event-modal-content" style="background:#fff;color:#222;padding:24px 32px;border-radius:10px;min-width:320px;max-width:90vw;box-shadow:0 2px 16px rgba(0,0,0,0.25);position:relative;">
            <button id="event-modal-close" style="position:absolute;top:8px;right:12px;font-size:1.3em;background:none;border:none;color:#888;cursor:pointer;">×</button>
            <div id="event-modal-body"></div>
        </div>
    `;
    // Fill modal body
    const body = modal.querySelector("#event-modal-body");
    body.innerHTML = `
        <h2 style="color:#ff4c4c;">${event.title}</h2>
        <div><b>Дата:</b> ${event.start_event ? new Date(event.start_event).toLocaleString("uk-UA") : "-"}</div>
        ${event.location_or_link ? `<div><b>Місце/посилання:</b> ${event.location_or_link}</div>` : ""}
        ${event.content ? `<div><b>Опис:</b> ${event.content}</div>` : ""}
        ${event.event_type ? `<div><b>Тип:</b> ${event.event_type.name || event.event_type}</div>` : ""}
        ${event.duration ? `<div><b>Тривалість:</b> ${event.duration} хв</div>` : ""}
    `;
    // Close logic
    modal.querySelector("#event-modal-close").onclick = () => { modal.style.display = "none"; };
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };
    modal.style.display = "flex";
}


async function updateCalendar() {
    const qs = new URLSearchParams();
    if (schoolId) qs.set("schoolId", schoolId);
    if (classId) qs.set("classId", classId);

    const mm = document.getElementById("month-name");
    const body = document.getElementById("calendar-body");
    if (mm) mm.style.display = "";
    if (body) body.style.display = "";
    if (!mm || !body) return;


    body.innerHTML = "";
    mm.textContent = new Intl.DateTimeFormat("uk", { month: "long", year: "numeric" })
        .format(new Date(currentYear, currentMonth));

    let fd = new Date(currentYear, currentMonth, 1).getDay();
    fd = fd === 0 ? 6 : fd - 1;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let d = 1;
    for (let r = 0; r < 6; r++) {
        const tr = document.createElement("tr");
        for (let c = 0; c < 7; c++) {
            const td = document.createElement("td");
            if ((r === 0 && c < fd) || d > daysInMonth) {
                td.innerHTML = "&nbsp;";
            } else {
                td.textContent = d;
                const key = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                // Render all events for this day
                (eventsByDay[key] || []).forEach(ev => {
                    const sp = document.createElement("span");
                    sp.classList.add("event");
                    sp.textContent = ev.title;
                    if (ev.id) sp.setAttribute("data-event-id", ev.id);
                    sp.style.cursor = "pointer";
                    sp.onclick = (e) => {
                        e.stopPropagation();
                        showEventModal(ev);
                    };
                    td.appendChild(document.createElement("br"));
                    td.appendChild(sp);
                });
                d++;
            }
            tr.appendChild(td);
        }
        body.appendChild(tr);
    }
}

// Profile logic
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