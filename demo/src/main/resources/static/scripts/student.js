import { renderAvailableVotes, renderVoteCreation } from './vote.js';
import { fetchWithAuth } from './api.js';
import { initializePetitions } from './petition.js';

function logout() {
  window.location.href = "login.html";
}

let currentMonth, currentYear, currentDay, currentView = "month";
let calendarUserId = null;

function switchCalendarView(view) {
  currentView = view;
  document.getElementById("calendar-view-week").classList.toggle("active", view === "week");
  document.getElementById("calendar-view-month").classList.toggle("active", view === "month");
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
  } else {
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
    const users = await res.json();
    sel.innerHTML = `<option value="">Я</option>`;
    users.filter(u => u.role === "STUDENT" || u.role === "PARENT")
         .forEach(u => sel.innerHTML += `<option value="${u.id}">${u.firstName} ${u.lastName}</option>`);
  } catch {
    sel.innerHTML = `<option value="">Я</option>`;
  }
}

async function updateCalendar() {
  let events = [];
  try {
    events = await res.json();
  } catch {
    events = [];
  }
  document.getElementById("calendar-table").style.display = "none";
  if (currentView === "month") renderMonthView(events);
}

function showEventModal(event) {
  let modal = document.getElementById("event-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "event-modal";
    document.body.appendChild(modal);
  }
  modal.style = "position:fixed;top:0;left:0;width:100vw;height:100vh;"
              + "background:rgba(0,0,0,0.5);display:flex;align-items:center;"
              + "justify-content:center;z-index:9999";
  modal.innerHTML = `
    <div id="event-modal-content" style="background:#fff;color:#222;padding:24px;border-radius:10px;position:relative;">
      <button id="event-modal-close" style="position:absolute;top:8px;right:12px;background:none;border:none;">×</button>
      <div id="event-modal-body"></div>
    </div>`;
  const body = modal.querySelector("#event-modal-body");
  body.innerHTML = `
    <h2>${event.title}</h2>
    <div><b>Дата:</b> ${event.start_event ? new Date(event.start_event).toLocaleString("uk-UA") : "-"}</div>
    ${event.location_or_link ? `<div><b>Місце/посилання:</b> ${event.location_or_link}</div>` : ""}
    ${event.content ? `<div><b>Опис:</b> ${event.content}</div>` : ""}`;
  modal.querySelector("#event-modal-close").onclick = () => modal.style.display = "none";
  modal.onclick = e => { if (e.target === modal) modal.style.display = "none"; };
  modal.style.display = "flex";
}

function attachEventClickHandlers(events, parent) {
  if (!parent) return;
  const byId = {};
  events.forEach(ev => { if (ev.id) byId[ev.id] = ev; });
  parent.querySelectorAll("span.event[data-event-id]").forEach(span => {
    span.onclick = e => {
      e.stopPropagation();
      const id = span.getAttribute("data-event-id");
      if (byId[id]) showEventModal(byId[id]);
    };
  });
}

function renderMonthView(events) {
  document.getElementById("calendar-table").style.display = "";
  const mm = document.getElementById("period-name");
  const body = document.getElementById("calendar-body");
  mm.textContent = new Intl.DateTimeFormat("uk-UA", { month: "long", year: "numeric" })
                   .format(new Date(currentYear, currentMonth));
  body.innerHTML = "";
  let firstDay = new Date(currentYear, currentMonth, 1).getDay();
  firstDay = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  let d = 1;
  for (let r = 0; r < 6; r++) {
    const tr = document.createElement("tr");
    for (let c = 0; c < 7; c++) {
      const td = document.createElement("td");
      if (!(r === 0 && c < firstDay) && d <= daysInMonth) {
        td.textContent = d;
        const key = `${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        events.filter(e => e.start_event?.startsWith(key)).forEach(ev => {
          const sp = document.createElement("span");
          sp.className = "event";
          sp.textContent = ev.title;
          sp.setAttribute("data-event-id", ev.id);
          td.appendChild(sp);
        });
        d++;
      }
      tr.appendChild(td);
    }
    body.appendChild(tr);
    if (d > daysInMonth) break;
  }
  attachEventClickHandlers(events, body);
}

async function loadProfile() {
  try {
    const res = await fetchWithAuth("/api/me");
    const user = await res.json();
    [
      ["profile-firstName", user.firstName],
      ["profile-lastName",  user.lastName],
      ["profile-dateOfBirth", user.dateOfBirth],
      ["profile-aboutMe",    user.aboutMe],
      ["profile-email",      user.email],
      ["profile-role",       user.role]
    ].forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value || "-";
    });
    [
      ["edit-firstName", user.firstName],
      ["edit-lastName",  user.lastName],
      ["edit-dateOfBirth", user.dateOfBirth],
      ["edit-aboutMe",    user.aboutMe],
      ["edit-email",      user.email]
    ].forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.value = value || "";
    });
    return user;
  } catch {
    return null;
  }
}

async function updateProfile(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  if (data.password && data.password !== data.confirmPassword) {
    alert("Паролі не співпадають");
    return;
  }
  delete data.confirmPassword;
  Object.keys(data).forEach(k => { if (!data[k]) delete data[k]; });
  try {
    await fetchWithAuth("/api/me", {
      method: "PUT",
      body: JSON.stringify(data)
    });
    alert("Профіль оновлено");
    await loadProfile();
  } catch {
    alert("Помилка оновлення");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // --- кнопки та тема ---
  document.getElementById("logoutButton")?.addEventListener("click", logout);
  document.getElementById("toggleThemeButton")?.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", document.body.classList.contains("dark-theme") ? "dark" : "light");
  });

  // --- календар ---
  ["calendar-view-day","calendar-view-week","calendar-view-month","calendar-view-year"]
    .forEach(id => document.getElementById(id)
      ?.addEventListener("click", () => switchCalendarView(id.split("-")[2]))
    );
  document.getElementById("prev-period")?.addEventListener("click", () => changePeriod(-1));
  document.getElementById("next-period")?.addEventListener("click", () => changePeriod(1));
  document.getElementById("calendar-user-select")
    ?.addEventListener("change", e => { calendarUserId = e.target.value; updateCalendar(); });
  initCalendar();
  loadCalendarUserSelector();

  // --- профіль ---
  const me = await loadProfile();
  document.getElementById("editProfileForm")
    ?.addEventListener("submit", updateProfile);

  // --- голосування ---
  if (document.getElementById('available-votes-container')) {
    renderAvailableVotes('available-votes-container');
  }
  if (document.getElementById('vote-create-container')) {
    renderVoteCreation('vote-create-container');
  }

  // --- петиції ---
  if (me) {
    initializePetitions(me);
  }

  // --- таби ---
  const tabButtons = document.querySelectorAll(".nav-tabs button");
  const pageSections = document.querySelectorAll(".page-section");
  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      tabButtons.forEach(btn => btn.classList.remove("active"));
      pageSections.forEach(sec => sec.classList.remove("active"));
      button.classList.add("active");
      switch (button.id) {
        case "tab-main": document.getElementById("main-page").classList.add("active"); break;
        case "tab-profile": document.getElementById("profile-page").classList.add("active"); break;
        case "tab-about-system": document.getElementById("about_system_page").classList.add("active"); break;
        case "create": document.getElementById("create_page").classList.add("active"); break;
      }
    });
  });
});



const translations = {
  uk: {
    '🙍‍♂️ Student Page 🙍‍♂️': '🙍‍♂️ Сторінка учня 🙍‍♂️',
    'Welcome to the voting system': 'Вітаємо у системі голосування',
    '🏠 Main Information 🏠': '🏠 Головна інформація 🏠',
    '⯑ About the system ⯑': '⯑ Про систему ⯑',
    '🛈 My Information 🛈': '🛈 Інформація про мене 🛈',
    '⊕ Create ⊕': '⊕ Створити ⊕',
    'Event Calendar': 'Календар подій',
    "View user's calendar:": 'Переглянути календар користувача:',
    'Me': 'Я',
    'Voting': 'Голосування',
    'Student Info': 'Інформація про учня',
    'First name:': "Ім'я:",
    'Last name:': 'Прізвище:',
    'Date of Birth:': 'Дата народження:',
    'About me:': 'Про мене:',
    'Email:': 'Email:',
    'Role:': 'Роль:',
    'Update Info': 'Оновити інформацію',
    'New password:': 'Новий пароль:',
    'Confirm password:': 'Підтвердження пароля:',
    '🛈 About the system': '🛈 Про систему',
    'This system allows organizing and conducting student voting, viewing events, and updating your profile.': 'Ця система дозволяє організовувати та проводити голосування серед учнів школи, переглядати події та оновлювати інформацію про себе.',
    '⯑ How to use': '⯑ Як користуватись',
    'Login to the system.': 'Авторизуйтесь у системі.',
    'Go to "My Information" to edit your profile.': 'Перейдіть до "Інформація про мене" для редагування профілю.',
    'View events in the calendar.': 'Переглядайте події у календарі.',
    'Vote in active polls.': 'Голосуйте в активних опитуваннях.',
    'Logout': 'Вийти',
    '🌐 УКР': '🌐 EN',
  },
  en: {
    '🙍‍♂️ Сторінка учня 🙍‍♂️': '🙍‍♂️ Student Page 🙍‍♂️',
    'Вітаємо у системі голосування': 'Welcome to the voting system',
    '🏠 Головна інформація 🏠': '🏠 Main Information 🏠',
    '⯑ Про систему ⯑': '⯑ About the system ⯑',
    '🛈 Інформація про мене 🛈': '🛈 My Information 🛈',
    '⊕ Створити ⊕': '⊕ Create ⊕',
    'Календар подій': 'Event Calendar',
    'Переглянути календар користувача:': "View user's calendar:",
    'Я': 'Me',
    'Голосування': 'Voting',
    'Інформація про учня': 'Student Info',
    "Ім'я:": 'First name:',
    'Прізвище:': 'Last name:',
    'Дата народження:': 'Date of Birth:',
    'Про мене:': 'About me:',
    'Email:': 'Email:',
    'Роль:': 'Role:',
    'Оновити інформацію': 'Update Info',
    'Новий пароль:': 'New password:',
    'Підтвердження пароля:': 'Confirm password:',
    '🛈 Про систему': '🛈 About the system',
    'Ця система дозволяє організовувати та проводити голосування серед учнів школи, переглядати події та оновлювати інформацію про себе.': 'This system allows organizing and conducting student voting, viewing events, and updating your profile.',
    '⯑ Як користуватись': '⯑ How to use',
    'Авторизуйтесь у системі.': 'Login to the system.',
    'Перейдіть до "Інформація про мене" для редагування профілю.': 'Go to "My Information" to edit your profile.',
    'Переглядайте події у календарі.': 'View events in the calendar.',
    'Голосуйте в активних опитуваннях.': 'Vote in active polls.',
    'Вийти': 'Logout',
    '🌐 EN': '🌐 УКР',
  },
};

let currentLang = 'uk';

function translateText(text) {
  const dict = translations[currentLang];
  return dict[text] || text;
}

function translatePage() {
  const dict = translations[currentLang];

  document.querySelectorAll('*:not(script):not(style)').forEach(el => {
    // Переводимо текст
    if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
      const originalText = el.innerText.trim();
      if (dict[originalText]) el.innerText = dict[originalText];
    }

    // Переводимо placeholder, title, value, alt
    ['placeholder', 'title', 'value', 'alt'].forEach(attr => {
      const val = el.getAttribute(attr);
      if (val && dict[val]) {
        el.setAttribute(attr, dict[val]);
      }
    });
  });

  // Оновити текст кнопки мови
  const btn = document.getElementById('langToggleButton');
  if (btn) {
    btn.textContent = currentLang === 'uk' ? '🌐 EN' : '🌐 УКР';
  }
}

function toggleLanguage() {
  currentLang = currentLang === 'uk' ? 'en' : 'uk';
  translatePage();
}

// Додати кнопку
window.addEventListener('DOMContentLoaded', () => {
  const btn = document.createElement('button');
  btn.id = 'langToggleButton';
  btn.className = 'lang-toggle-button';
  btn.textContent = '🌐 EN';
  btn.onclick = toggleLanguage;

  const container = document.querySelector('.header-buttons') || document.body;
  container.appendChild(btn);
});





const toggleButton = document.getElementById('themeToggle');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && prefersDark)) {
    document.body.classList.add('dark-theme');
    toggleButton.textContent = '☀️';
  }

  toggleButton.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    toggleButton.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });