async function fetchWithAuth(url, opts = {}) {
    const token = localStorage.getItem("jwtToken");
    opts.headers = {
        ...(opts.headers || {}),
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };
    return fetch(url, opts);
}

async function renderClassDropdown(extraDiv, schoolId, userClassId, onChangeCb) {
    extraDiv.innerHTML = "Завантаження класів...";
    try {
        const resp = await fetchWithAuth(`/api/classes?schoolId=${schoolId}`);
        const classes = await resp.json();
        if (!classes.length) {
            extraDiv.innerHTML = "<div>Немає класів для вибору.</div>";
            return;
        }
        extraDiv.innerHTML = `
            <label>Клас:
                <select name="classId" id="vote-class-select" required>
                    <option value="">Всі класи</option>
                    ${classes.map(c => `<option value="${c.id}" ${userClassId && c.id === userClassId ? "selected" : ""}>${c.name}</option>`).join("")}
                </select>
            </label>
        `;
        if (onChangeCb) {
            document.getElementById('vote-class-select').addEventListener('change', onChangeCb);
        }
    } catch {
        extraDiv.innerHTML = "<div>Не вдалося завантажити класи.</div>";
    }
}

async function renderUserCheckboxes(extraDiv, schoolId, classId, userType) {
    const container = extraDiv.querySelector('#user-checkboxes');
    container.innerHTML = "Завантаження...";
    let url = userType === 'teachers'
        ? `/api/teachers?schoolId=${schoolId}`
        : `/api/users?schoolId=${schoolId}`;
    if (classId) url += `&classId=${classId}`;
    try {
        const resp = await fetchWithAuth(url);
        const list = await resp.json();
        if (!list.length) {
            container.innerHTML = "<div>Немає користувачів для вибору.</div>";
            return;
        }
        container.innerHTML = list.map(u =>
            `<label style="display:block;">
                <input type="checkbox" class="participant-checkbox" value="${u.id}">
                ${u.firstName} ${u.lastName} (${u.email})
            </label>`
        ).join("");
    } catch {
        container.innerHTML = "<div>Не вдалося завантажити користувачів.</div>";
    }
}

function renderVoteCreation(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `
        <section id="vote-create-section">
            <h2>Створити голосування</h2>
            <form id="vote-create-form">
                <input name="title" placeholder="Назва голосування" required><br>
                <textarea name="description" placeholder="Опис"></textarea><br>
                <label>Рівень:
                    <select name="level" id="vote-level">
                        <option value="SCHOOL">Вся школа</option>
                        <option value="CLASS">Клас</option>
                        <option value="TEACHERS_GROUP">Група вчителів</option>
                        <option value="SELECTED">Вибрані учасники</option>
                    </select>
                </label><br>
                <div id="vote-level-extra"></div>
                <label>Початок: <input type="datetime-local" name="startDate" required></label><br>
                <label>Дедлайн: <input type="datetime-local" name="endDate" required></label><br>
                <label><input type="checkbox" name="multipleChoice"> Дозволити декілька відповідей</label><br>
                <div id="vote-options-list">
                    <input class="vote-option" name="option" placeholder="Варіант 1" required>
                    <input class="vote-option" name="option" placeholder="Варіант 2" required>
                </div>
                <button type="button" id="add-vote-option">Додати варіант</button><br>
                <button type="submit">Створити голосування</button>
            </form>
            <div id="vote-create-result"></div>
        </section>
    `;
    document.getElementById('add-vote-option').onclick = function () {
        const list = document.getElementById('vote-options-list');
        const input = document.createElement('input');
        input.className = 'vote-option';
        input.name = 'option';
        input.placeholder = `Варіант`;
        list.appendChild(input);
    };
    document.getElementById('vote-level').onchange = async function (e) {
        const extra = document.getElementById('vote-level-extra');
        const val = e.target.value;
        let user;
        try {
            const resp = await fetchWithAuth("/api/me");
            user = await resp.json();
        } catch {
            extra.innerHTML = "<div>Не вдалося отримати дані користувача.</div>";
            return;
        }
        const need = val === 'TEACHERS_GROUP' || val === 'SELECTED';
        if (val === 'CLASS') {
            await renderClassDropdown(extra, user.schoolId, user.classId, null);
        } else if (need) {
            extra.innerHTML = '';
            await renderClassDropdown(extra, user.schoolId, user.classId, async function () {
                const classId = this.value || null;
                await renderUserCheckboxes(extra, user.schoolId, classId, val === 'TEACHERS_GROUP' ? 'teachers' : 'users');
            });
            extra.insertAdjacentHTML('beforeend', `<div id="user-checkboxes" style="margin-top:8px;">Оберіть клас вище</div>`);
            const sel = document.getElementById('vote-class-select');
            const cid = sel ? sel.value : null;
            await renderUserCheckboxes(extra, user.schoolId, cid, val === 'TEACHERS_GROUP' ? 'teachers' : 'users');
        } else {
            extra.innerHTML = '';
        }
    };
    document.getElementById('vote-level').dispatchEvent(new Event('change'));
    document.getElementById('vote-create-form').onsubmit = async function (e) {
        e.preventDefault();
        const form = e.target;
        let user;
        try {
            const resp = await fetchWithAuth("/api/me");
            user = await resp.json();
        } catch {
            document.getElementById('vote-create-result').innerText = 'Не вдалося отримати дані користувача.';
            return;
        }
        const levelMap = { SCHOOL: "SCHOOL", CLASS: "ACLASS", TEACHERS_GROUP: "TEACHERS_GROUP", SELECTED: "SELECTED_USERS" };
        const data = {
            schoolId: user.schoolId,
            classId: null,
            title: form.title.value,
            description: form.description.value,
            startDate: new Date(form.startDate.value).toISOString(),
            endDate: new Date(form.endDate.value).toISOString(),
            createdBy: user.id,
            multipleChoice: form.multipleChoice.checked,
            votingLevel: levelMap[form.level.value] || "SCHOOL",
            status: "OPEN",
            variants: Array.from(form.querySelectorAll('.vote-option')).map(i => ({ text: i.value })).filter(v => v.text.trim())
        };
        if (data.votingLevel === 'ACLASS') {
            const cs = form.querySelector('[name="classId"]');
            data.classId = cs ? cs.value : user.classId || null;
        }
        if (data.variants.length < 2) {
            document.getElementById('vote-create-result').innerText = 'Додайте хоча б два варіанти.';
            return;
        }
        if (data.votingLevel === 'TEACHERS_GROUP' || data.votingLevel === 'SELECTED_USERS') {
            const checked = Array.from(document.querySelectorAll('#vote-level-extra .participant-checkbox:checked')).map(cb => cb.value);
            if (!checked.length) {
                document.getElementById('vote-create-result').innerText = 'Оберіть хоча б одного учасника.';
                return;
            }
            data.participants = checked.map(id => ({ userId: Number(id) }));
        }
        try {
            const resp = await fetchWithAuth('/api/createVoting', { method: 'POST', body: JSON.stringify(data) });
            if (resp.ok) {
                document.getElementById('vote-create-result').innerText = 'Голосування створено!';
                form.reset();
                document.getElementById('vote-level').dispatchEvent(new Event('change'));
            } else {
                const err = await resp.text();
                document.getElementById('vote-create-result').innerText = 'Помилка: ' + err;
            }
        } catch {
            document.getElementById('vote-create-result').innerText = 'Помилка з’єднання.';
        }
    };
}

async function renderAvailableVotes(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "<div>Завантаження голосувань...</div>";
    let user;
    try {
        const resp = await fetchWithAuth("/api/me");
        user = await resp.json();
    } catch {
        container.innerHTML = "<div>Не вдалося отримати інформацію про користувача.</div>";
        return;
    }
    let votes = [];
    try {
        const url = `/api/voting/user/${user.id}?schoolId=${user.schoolId}${user.classId ? `&classId=${user.classId}` : ""}`;
        const resp = await fetchWithAuth(url);
        votes = await resp.json();
    } catch {
        container.innerHTML = "<div>Не вдалося завантажити голосування.</div>";
        return;
    }
    if (!votes.length) {
        container.innerHTML = "<div>Немає доступних голосувань.</div>";
        return;
    }
    container.innerHTML = "";
    votes.forEach(vote => {
        const section = document.createElement("section");
        section.className = "vote-section";
        section.innerHTML = `
            <h3>${vote.title}</h3>
            <p>${vote.description || ""}</p>
            <form class="vote-form" data-vote-id="${vote.id}">
                ${vote.variants.map(variant =>
            `<label>
                        <input type="${vote.multipleChoice ? "checkbox" : "radio"}" name="variant" value="${variant.id}">
                        ${variant.text}
                    </label><br>`
        ).join("")}
                <button type="submit">Проголосувати</button>
                <span class="vote-result"></span>
            </form>
        `;
        container.appendChild(section);
    });
    container.querySelectorAll(".vote-form").forEach(form => {
        form.onsubmit = async function (e) {
            e.preventDefault();
            const voteId = form.getAttribute("data-vote-id");
            const selected = Array.from(form.querySelectorAll('input[name="variant"]:checked')).map(i => Number(i.value));
            if (!selected.length) {
                form.querySelector(".vote-result").textContent = "Оберіть варіант!";
                return;
            }
            try {
                const resp = await fetchWithAuth(`/api/voting/${voteId}/vote`, { method: "POST", body: JSON.stringify({ variants: selected.map(id => ({ id })) }) });
                if (resp.ok) {
                    form.querySelector(".vote-result").textContent = "Голос зараховано!";
                    form.querySelector("button[type=submit]").disabled = true;
                } else {
                    const err = await resp.text();
                    form.querySelector(".vote-result").textContent = "Помилка: " + err;
                }
            } catch {
                form.querySelector(".vote-result").textContent = "Помилка з’єднання.";
            }
        };
    });
}

const levelMap = {
    SCHOOL: "school",
    CLASS: "aclass",
    TEACHERS_GROUP: "teachers_group",
    SELECTED: "selected_users"
};

export { fetchWithAuth, renderVoteCreation, renderAvailableVotes, levelMap };