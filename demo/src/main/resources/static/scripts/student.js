import { renderVoteCreation, renderAvailableVotes } from './vote.js';

function logout() {
  localStorage.removeItem("jwtToken");
  window.location.href = "login.html";
}

async function fetchWithAuth(url, opts = {}) {
  const token = localStorage.getItem("jwtToken");
  opts.headers = {
    ...(opts.headers || {}),
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };
  return fetch(url, opts);
}

let currentMonth, currentYear, currentDay, currentView = "month";
let calendarUserId = null;

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
  let url = "/api/getEvents";
  if (calendarUserId) url += `?userId=${calendarUserId}`;
  try {
    const res = await fetchWithAuth(url);
    events = await res.json();
  } catch {
    events = [];
  }
  document.getElementById("calendar-table").style.display = "none";
  document.getElementById("calendar-day-view").style.display = "none";
  document.getElementById("calendar-week-view").style.display = "none";
  document.getElementById("calendar-year-view").style.display = "none";
  if (currentView === "month") renderMonthView(events);
  if (currentView === "week") renderWeekView(events);
  if (currentView === "day") renderDayView(events);
  if (currentView === "year") renderYearView(events);
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

function renderDayView(events) {
  const container = document.getElementById("calendar-day-view");
  container.style.display = "";
  const key = `${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${String(currentDay).padStart(2,"0")}`;
  const dayEvents = events.filter(e => e.start_event?.startsWith(key));
  container.innerHTML = dayEvents.length
    ? dayEvents.map(ev => `<div class="event-card">${ev.title}</div>`).join("")
    : "<div>Подій немає</div>";
}

function renderWeekView(events) {
  const container = document.getElementById("calendar-week-view");
  container.style.display = "";
  const date = new Date(currentYear, currentMonth, currentDay);
  const dayOfWeek = (date.getDay()+6)%7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - dayOfWeek);
  container.innerHTML = "";
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate()+i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const col = document.createElement("div");
    col.innerHTML = `<b>${d.toLocaleDateString("uk-UA",{weekday:"short",day:"numeric"})}</b>`;
    events.filter(e => e.start_event?.startsWith(key)).forEach(ev => {
      const div = document.createElement("div");
      div.className = "event-card";
      div.textContent = ev.title;
      col.appendChild(div);
    });
    container.appendChild(col);
  }
}

function renderYearView(events) {
  const container = document.getElementById("calendar-year-view");
  container.style.display = "";
  for (let m = 0; m < 12; m++) {
    const monthDiv = document.createElement("div");
    monthDiv.innerHTML = `<b>${new Date(currentYear,m).toLocaleString("uk-UA",{month:"long"})}</b>`;
    container.appendChild(monthDiv);
  }
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
  } catch {}
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
    loadProfile();
  } catch {
    alert("Помилка оновлення");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logoutButton")?.addEventListener("click", logout);
  document.getElementById("toggleThemeButton")?.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", document.body.classList.contains("dark-theme") ? "dark" : "light");
  });

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
      loadProfile();
    }
  }
  tabMain.addEventListener("click", () => showPage("main"));
  tabProfile.addEventListener("click", () => showPage("profile"));

  ["calendar-view-day","calendar-view-week","calendar-view-month","calendar-view-year"]
    .forEach(id => document.getElementById(id)
    ?.addEventListener("click", () => switchCalendarView(id.split("-")[2])));
  document.getElementById("prev-period")?.addEventListener("click", () => changePeriod(-1));
  document.getElementById("next-period")?.addEventListener("click", () => changePeriod(1));
  document.getElementById("calendar-user-select")
    ?.addEventListener("change", e => { calendarUserId = e.target.value; updateCalendar(); });

  initCalendar();
  loadCalendarUserSelector();
  loadProfile();
  document.getElementById("editProfileForm")
    ?.addEventListener("submit", updateProfile);

  renderAvailableVotes('available-votes-container');
  renderVoteCreation('vote-create-container');
});
