document.addEventListener('DOMContentLoaded', () => {
    const pollData = JSON.parse(localStorage.getItem('currentPoll'));
    if (!pollData) return;

    document.getElementById('poll-question-text').innerText = pollData.question;
    const optionsDiv = document.getElementById('poll-options-list');
    optionsDiv.innerHTML = '';

    pollData.options.forEach((opt, i) => {
        const label = document.createElement('label');
        label.innerHTML = `
            <input type="radio" name="poll-option" value="${opt}">
            ${opt}
        `;
        optionsDiv.appendChild(label);
        optionsDiv.appendChild(document.createElement('br'));
    });

    document.getElementById('poll-form').style.display = 'block';
});

document.getElementById('poll-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const selected = document.querySelector('input[name="poll-option"]:checked');
    if (!selected) {
        alert('Оберіть варіант!');
        return;
    }
    alert(`Ваша відповідь "${selected.value}" прийнята. Дякуємо!`);
    // Тут можна зберігати відповідь, наприклад, у локальному сховищі або надсилати на сервер
});




const toggleButton = document.getElementById('toggleThemeButton');
  const body = document.body;

  // Проверим, сохранена ли тема
  if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('dark-theme');
  }

  toggleButton.addEventListener('click', () => {
    body.classList.toggle('dark-theme');
    const isDark = body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });




document.getElementById('poll-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const selected = document.querySelector('input[name="pollOption"]:checked');
    if (selected) {
        // Здесь можно добавить отправку на сервер
        document.getElementById('poll-result').style.display = 'block';
        this.style.display = 'none';
    }
});
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
        tabProfile.addEventListener("click", () => {
            showPage("profile");
            loadProfile(); // <-- force reload profile when tab is shown
        });
    }
});

function logout() {
    localStorage.removeItem("jwtToken");
    window.location.href = "login.html";
}

async function fetchWithAuth(url, opts = {}) {
    const token = localStorage.getItem("jwtToken");
    opts.headers = {
        ...(opts.headers || {}),
        "Authorization": `Bearer ${token}`
    };
    return fetch(url, opts);
}

let currentMonth, currentYear, currentDay, currentView = "month";
let calendarUserId = null; // null = self

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("logoutButton");
    if (btn) btn.addEventListener("click", logout);

    initCalendar();
    loadTeachers();
    loadEvents();
    loadProfile();

    const editForm = document.getElementById('editProfileForm');
    if (editForm) {
        editForm.addEventListener('submit', updateProfile);
    }

    const goBackBtn = document.getElementById("goBackToMainButton");
    if (goBackBtn) {
        goBackBtn.addEventListener("click", () => {
            window.location.href = document.referrer || "login.html";
        });
    }

    const titleInput = document.getElementById("searchTitle");
    const dateInput = document.getElementById("searchDate");
    const statusSelect = document.getElementById("filterStatus");
    const timeSelect = document.getElementById("filterTime");

    [titleInput, dateInput, statusSelect, timeSelect].forEach(el => {
        if (el) el.addEventListener("input", loadEvents);
    });

    // Calendar view buttons
    document.getElementById("calendar-view-day").addEventListener("click", () => switchCalendarView("day"));
    document.getElementById("calendar-view-week").addEventListener("click", () => switchCalendarView("week"));
    document.getElementById("calendar-view-month").addEventListener("click", () => switchCalendarView("month"));
    document.getElementById("calendar-view-year").addEventListener("click", () => switchCalendarView("year"));

    // Calendar navigation
    document.getElementById("prev-period").addEventListener("click", () => changePeriod(-1));
    document.getElementById("next-period").addEventListener("click", () => changePeriod(1));

    // User selector
    loadCalendarUserSelector();
    document.getElementById("calendar-user-select").addEventListener("change", function () {
        calendarUserId = this.value || null;
        updateCalendar();
    });

    initCalendar();
});

function switchCalendarView(view) {
    currentView = view;
    document.getElementById("calendar-view-day").classList.toggle("active", view === "day");
    document.getElementById("calendar-view-week").classList.toggle("active", view === "week");
    document.getElementById("calendar-view-month").classList.toggle("active", view === "month");
    document.getElementById("calendar-view-year").classList.toggle("active", view === "year");
    updateCalendar();
}

function changePeriod(delta) {
    if (currentView === "month") {
        currentMonth += delta;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    } else if (currentView === "week") {
        const date = new Date(currentYear, currentMonth, currentDay || 1);
        date.setDate(date.getDate() + delta * 7);
        currentYear = date.getFullYear();
        currentMonth = date.getMonth();
        currentDay = date.getDate();
    } else if (currentView === "day") {
        const date = new Date(currentYear, currentMonth, currentDay || 1);
        date.setDate(date.getDate() + delta);
        currentYear = date.getFullYear();
        currentMonth = date.getMonth();
        currentDay = date.getDate();
    } else if (currentView === "year") {
        currentYear += delta;
    }
    updateCalendar();
}

function initCalendar() {
    const now = new Date();
    currentMonth = now.getMonth();
    currentYear = now.getFullYear();
    currentDay = now.getDate();
    currentView = "month";
    updateCalendar();
}

async function loadCalendarUserSelector() {
    const sel = document.getElementById("calendar-user-select");
    if (!sel) return;
    try {
        const res = await fetchWithAuth("/api/loadUsers");
        if (!res.ok) throw new Error(res.status);
        const users = await res.json();
        // Only show students and parents
        sel.innerHTML = `<option value="">Я</option>`;
        users
            .filter(u => u.role === "STUDENT" || u.role === "PARENT")
            .forEach(u => {
                sel.innerHTML += `<option value="${u.id}">${u.firstName} ${u.lastName} (${u.email})</option>`;
            });
    } catch (e) {
        sel.innerHTML = `<option value="">Я</option>`;
    }
}

async function loadTeachers() {
    const list = document.getElementById("teachers-list");
    if (!list) return;
    list.innerHTML = "";
    try {
        const res = await fetchWithAuth("/api/teachers");
        if (!res.ok) throw new Error(res.status);
        const teachers = await res.json();
        teachers.forEach(t => {
            const li = document.createElement("li");
            li.textContent = `${t.firstName} ${t.lastName} (${t.email})`;
            list.appendChild(li);
        });
    } catch (e) {
        console.error("Помилка завантаження викладачів:", e);
    }
}

async function updateCalendar() {
    let events = [];
    let url = "/api/getEvents";
    if (calendarUserId) {
        url = `/api/getEvents?userId=${calendarUserId}`;
    }
    try {
        const res = await fetchWithAuth(url);
        if (!res.ok) throw new Error(res.status);
        events = await res.json();
    } catch (e) {
        events = [];
    }

    // Hide all views
    document.getElementById("calendar-table").style.display = "none";
    document.getElementById("calendar-day-view").style.display = "none";
    document.getElementById("calendar-week-view").style.display = "none";
    document.getElementById("calendar-year-view").style.display = "none";

    if (currentView === "month") {
        renderMonthView(events);
    } else if (currentView === "week") {
        renderWeekView(events);
    } else if (currentView === "day") {
        renderDayView(events);
    } else if (currentView === "year") {
        renderYearView(events);
    }
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

// --- Attach click handlers to event spans ---
function attachEventClickHandlers(events, parent) {
    if (!parent) return;
    // Map events by id for fast lookup
    const byId = {};
    events.forEach(ev => { if (ev.id) byId[ev.id] = ev; });
    parent.querySelectorAll("span.event[data-event-id]").forEach(span => {
        span.onclick = (e) => {
            e.stopPropagation();
            const id = span.getAttribute("data-event-id");
            if (byId[id]) showEventModal(byId[id]);
        };
    });
}

function renderMonthView(events) {
    const mm = document.getElementById("period-name");
    const body = document.getElementById("calendar-body");
    document.getElementById("calendar-table").style.display = "";
    if (!mm || !body) return;
    body.innerHTML = "";

    mm.textContent = new Intl.DateTimeFormat("uk", {
        month: "long", year: "numeric"
    }).format(new Date(currentYear, currentMonth));

    let fd = new Date(currentYear, currentMonth, 1).getDay();
    fd = (fd === 0 ? 6 : fd - 1);

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let d = 1;

    for (let r = 0; r < 6; r++) {
        const tr = document.createElement("tr");
        for (let c = 0; c < 7; c++) {
            const td = document.createElement("td");
            if (!(r === 0 && c < fd) && d <= daysInMonth) {
                td.textContent = d;
                const key = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                events
                    .filter(e => (e.start_event || "").split("T")[0] === key)
                    .forEach(ev => {
                        const sp = document.createElement("span");
                        sp.classList.add("event");
                        sp.textContent = ev.title;
                        if (ev.id) sp.setAttribute("data-event-id", ev.id);
                        sp.style.cursor = "pointer";
                        sp.onclick = (e) => {
                            e.stopPropagation();
                            showEventModal(ev);
                        };
                        td.appendChild(sp);
                    });
                d++;
            }
            tr.appendChild(td);
        }
        body.appendChild(tr);
        if (d > daysInMonth) break;
    }
}

function renderDayView(events) {
    const container = document.getElementById("calendar-day-view");
    container.style.display = "";
    document.getElementById("period-name").textContent = new Date(currentYear, currentMonth, currentDay).toLocaleDateString("uk-UA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    container.innerHTML = "";
    const key = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(currentDay).padStart(2, "0")}`;
    const dayEvents = events.filter(e => (e.start_event || "").split("T")[0] === key);
    if (dayEvents.length === 0) {
        container.innerHTML = "<div style='color:#bbb;text-align:center;'>Подій немає</div>";
    } else {
        dayEvents.forEach(ev => {
            const div = document.createElement("div");
            div.className = "event-card";
            div.innerHTML = `<div class="event-title">${ev.title}</div>
                <div class="event-date">${ev.start_event ? new Date(ev.start_event).toLocaleString("uk-UA") : ""}</div>
                ${ev.location_or_link ? `<div><b>Місце/посилання:</b> ${ev.location_or_link}</div>` : ""}
                ${ev.content ? `<div>${ev.content}</div>` : ""}
                ${ev.event_type ? `<div><b>Тип:</b> ${ev.event_type.name || ev.event_type}</div>` : ""}`;
            div.style.cursor = "pointer";
            div.onclick = (e) => {
                e.stopPropagation();
                showEventModal(ev);
            };
            container.appendChild(div);
        });
    }
}

function renderWeekView(events) {
    const container = document.getElementById("calendar-week-view");
    container.style.display = "";
    container.innerHTML = "";

    // Find Monday of current week
    const date = new Date(currentYear, currentMonth, currentDay);
    const dayOfWeek = (date.getDay() + 6) % 7; // Monday=0
    const monday = new Date(date);
    monday.setDate(date.getDate() - dayOfWeek);

    document.getElementById("period-name").textContent =
        "Тиждень: " +
        monday.toLocaleDateString("uk-UA", { day: "numeric", month: "short" }) +
        " - " +
        new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6).toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "numeric" });

    // Flex row for week days
    const weekRow = document.createElement("div");
    weekRow.style.display = "flex";
    weekRow.style.gap = "14px";
    weekRow.style.justifyContent = "space-between";

    for (let i = 0; i < 7; i++) {
        const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const dayCol = document.createElement("div");
        dayCol.style.flex = "1";
        dayCol.style.background = "#333";
        dayCol.style.color = "#fff";
        dayCol.style.borderRadius = "8px";
        dayCol.style.padding = "10px";
        dayCol.style.minWidth = "120px";
        dayCol.style.boxShadow = "0 1px 4px rgba(0,0,0,0.07)";
        dayCol.style.display = "flex";
        dayCol.style.flexDirection = "column";
        dayCol.style.alignItems = "stretch";
        dayCol.style.minHeight = "140px";

        // Day header
        const dayHeader = document.createElement("div");
        dayHeader.style.fontWeight = "bold";
        dayHeader.style.color = "#ff4c4c";
        dayHeader.style.marginBottom = "6px";
        dayHeader.textContent = d.toLocaleDateString("uk-UA", { weekday: "short", day: "numeric" });
        dayCol.appendChild(dayHeader);

        // Events
        const dayEvents = events.filter(e => (e.start_event || "").split("T")[0] === key);
        if (dayEvents.length === 0) {
            const noEv = document.createElement("div");
            noEv.style.color = "#bbb";
            noEv.style.textAlign = "center";
            noEv.textContent = "—";
            dayCol.appendChild(noEv);
        } else {
            dayEvents.forEach(ev => {
                const div = document.createElement("div");
                div.className = "event-card";
                div.style.marginBottom = "8px";
                div.innerHTML = `<div class="event-title">${ev.title}</div>
                    <div class="event-date">${ev.start_event ? new Date(ev.start_event).toLocaleTimeString("uk-UA", { hour: '2-digit', minute: '2-digit' }) : ""}</div>
                    ${ev.location_or_link ? `<div><b>Місце/посилання:</b> ${ev.location_or_link}</div>` : ""}
                    ${ev.content ? `<div>${ev.content}</div>` : ""}
                    ${ev.event_type ? `<div><b>Тип:</b> ${ev.event_type.name || ev.event_type}</div>` : ""}`;
                div.style.cursor = "pointer";
                div.onclick = () => showEventModal(ev);
                dayCol.appendChild(div);
            });
        }
        weekRow.appendChild(dayCol);
    }
    container.appendChild(weekRow);
}

function renderYearView(events) {
    const container = document.getElementById("calendar-year-view");
    container.style.display = "";
    container.innerHTML = "";
    document.getElementById("period-name").textContent = `Рік: ${currentYear}`;

    // 12 months, 3 per row
    const monthsPerRow = 3;
    for (let row = 0; row < 4; row++) {
        const rowDiv = document.createElement("div");
        rowDiv.style.display = "flex";
        rowDiv.style.gap = "16px";
        for (let m = row * monthsPerRow; m < (row + 1) * monthsPerRow; m++) {
            const monthDiv = document.createElement("div");
            monthDiv.style.flex = "1";
            monthDiv.style.background = "#eee";
            monthDiv.style.color = "#222";
            monthDiv.style.borderRadius = "8px";
            monthDiv.style.padding = "8px";
            monthDiv.style.minWidth = "180px";
            monthDiv.style.marginBottom = "16px";
            monthDiv.style.boxShadow = "0 1px 4px rgba(0,0,0,0.07)";

            monthDiv.innerHTML = `<div style="font-weight:bold;color:#ff4c4c;text-align:center;">${new Date(currentYear, m).toLocaleString("uk-UA", { month: "long" })}</div>`;

            // Month calendar table
            const table = document.createElement("table");
            table.style.width = "100%";
            table.style.background = "#fff";
            table.style.marginTop = "4px";
            const thead = document.createElement("thead");
            const trHead = document.createElement("tr");
            ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"].forEach(day => {
                const th = document.createElement("th");
                th.textContent = day;
                th.style.fontSize = "0.85em";
                trHead.appendChild(th);
            });
            thead.appendChild(trHead);
            table.appendChild(thead);

            const tbody = document.createElement("tbody");
            let fd = new Date(currentYear, m, 1).getDay();
            fd = (fd === 0 ? 6 : fd - 1);
            const daysInMonth = new Date(currentYear, m + 1, 0).getDate();
            let d = 1;
            for (let r = 0; r < 6; r++) {
                const tr = document.createElement("tr");
                for (let c = 0; c < 7; c++) {
                    const td = document.createElement("td");
                    if (!(r === 0 && c < fd) && d <= daysInMonth) {
                        td.textContent = d;
                        const key = `${currentYear}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                        const dayEvents = events.filter(e => (e.start_event || "").split("T")[0] === key);
                        if (dayEvents.length > 0) {
                            td.style.background = "#dbeafe";
                            td.style.borderRadius = "4px";
                            dayEvents.forEach(ev => {
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
                        }
                        d++;
                    } else {
                        td.innerHTML = "&nbsp;";
                    }
                    tr.appendChild(td);
                }
                tbody.appendChild(tr);
                if (d > daysInMonth) break;
            }
            table.appendChild(tbody);
            monthDiv.appendChild(table);
            rowDiv.appendChild(monthDiv);
        }
        container.appendChild(rowDiv);
    }
}

async function loadEvents() {
    const container = document.getElementById("eventsContainer");
    if (!container) return;
    container.innerHTML = "Завантаження...";

    const titleSearch = (document.getElementById("searchTitle")?.value || "").toLowerCase();
    const dateSearch = document.getElementById("searchDate")?.value || "";
    const statusFilter = document.getElementById("filterStatus")?.value || "ALL";
    const timeFilter = document.getElementById("filterTime")?.value || "ALL";

    try {
        const res = await fetchWithAuth("/api/getEvents");
        if (!res.ok) throw new Error(res.status);

        const events = await res.json();
        const filteredEvents = events.filter(event => {
            const matchesTitle = event.title.toLowerCase().includes(titleSearch);
            const matchesDate = !dateSearch || event.start_event.startsWith(dateSearch);
            const matchesStatus = statusFilter === "ALL" || event.status === statusFilter;
            const matchesTime = timeFilter === "ALL" || event.time === timeFilter;

            return matchesTitle && matchesDate && matchesStatus && matchesTime;
        });

        container.innerHTML = "";
        if (filteredEvents.length === 0) {
            container.innerHTML = "<div style='color:#bbb;text-align:center;'>Подій не знайдено</div>";
        }
        filteredEvents.forEach(event => {
            const div = document.createElement("div");
            div.className = "event-card";
            div.innerHTML = `
                <div class="event-title">${event.title}</div>
                <div class="event-date">${event.start_event ? new Date(event.start_event).toLocaleString("uk-UA") : ""}</div>
                ${event.location_or_link ? `<div><b>Місце/посилання:</b> ${event.location_or_link}</div>` : ""}
                ${event.content ? `<div>${event.content}</div>` : ""}
                ${event.event_type ? `<div><b>Тип:</b> ${event.event_type.name || event.event_type}</div>` : ""}
            `;
            container.appendChild(div);
        });
    } catch (e) {
        console.error("Помилка завантаження подій:", e);
        container.innerHTML = "Не вдалося завантажити події.";
    }
}

async function loadProfile() {
    try {
        const res = await fetchWithAuth("/api/me");
        if (!res.ok) throw new Error(res.status);

        const user = await res.json();

        // Set text for spans (display)
        [
            ["profile-firstName", user.firstName],
            ["profile-lastName", user.lastName],
            ["profile-aboutMe", user.aboutMe],
            ["profile-dateOfBirth", user.dateOfBirth],
            ["profile-email", user.email],
            ["profile-role", user.role]
        ].forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el && el.tagName !== "INPUT" && el.tagName !== "TEXTAREA") {
                el.textContent = value && value !== "" ? value : "-";
            }
        });

        // Set value for inputs (edit form)
        [
            ["edit-firstName", user.firstName],
            ["edit-lastName", user.lastName],
            ["edit-aboutMe", user.aboutMe],
            ["edit-dateOfBirth", user.dateOfBirth],
            ["edit-email", user.email]
        ].forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
                el.value = value && value !== "" ? value : "";
            }
        });
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

    // Remove confirmPassword from payload
    delete data.confirmPassword;

    // Remove password if empty
    if (!data.password) delete data.password;

    // Remove dateOfBirth if empty
    if (!data.dateOfBirth) delete data.dateOfBirth;

    // Remove aboutMe if empty
    if (!data.aboutMe) delete data.aboutMe;

    // Remove any other empty fields
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
