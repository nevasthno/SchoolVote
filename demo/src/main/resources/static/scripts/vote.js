// vote.js - Voting logic for all user types

// Utility: fetch with JWT
async function fetchWithAuth(url, opts = {}) {
    const token = localStorage.getItem("jwtToken");
    opts.headers = {
        ...(opts.headers || {}),
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };
    return fetch(url, opts);
}

// Show vote creation form (call this to render the form anywhere)
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

    // Add option logic
    document.getElementById('add-vote-option').onclick = function () {
        const list = document.getElementById('vote-options-list');
        const input = document.createElement('input');
        input.className = 'vote-option';
        input.name = 'option';
        input.placeholder = `Варіант`;
        list.appendChild(input);
    };

    // Level-specific UI
    document.getElementById('vote-level').onchange = function (e) {
        const extra = document.getElementById('vote-level-extra');
        const val = e.target.value;
        if (val === 'CLASS') {
            extra.innerHTML = '<input name="classId" placeholder="ID класу" required>';
        } else if (val === 'TEACHERS_GROUP') {
            extra.innerHTML = '<input name="teacherIds" placeholder="ID вчителів (через кому)" required>';
        } else if (val === 'SELECTED') {
            extra.innerHTML = '<input name="participantIds" placeholder="ID учасників (через кому)" required>';
        } else {
            extra.innerHTML = '';
        }
    };

    // Form submit
    document.getElementById('vote-create-form').onsubmit = async function (e) {
        e.preventDefault();
        const form = e.target;
        const data = {
            title: form.title.value,
            description: form.description.value,
            level: form.level.value,
            startDate: new Date(form.startDate.value).toISOString(),
            endDate: new Date(form.endDate.value).toISOString(),
            multipleChoice: form.multipleChoice.checked,
            options: Array.from(form.querySelectorAll('.vote-option')).map(i => i.value).filter(v => v.trim())
        };
        if (data.options.length < 2) {
            document.getElementById('vote-create-result').innerText = 'Додайте хоча б два варіанти.';
            return;
        }
        // Level-specific fields
        if (data.level === 'CLASS') data.classId = form.classId.value;
        if (data.level === 'TEACHERS_GROUP') data.teacherIds = form.teacherIds.value.split(',').map(s => s.trim());
        if (data.level === 'SELECTED') data.participantIds = form.participantIds.value.split(',').map(s => s.trim());
        // Send to backend
        try {
            const resp = await fetchWithAuth('/api/votes', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            if (resp.ok) {
                document.getElementById('vote-create-result').innerText = 'Голосування створено!';
                form.reset();
            } else {
                const err = await resp.text();
                document.getElementById('vote-create-result').innerText = 'Помилка: ' + err;
            }
        } catch (e) {
            document.getElementById('vote-create-result').innerText = 'Помилка з’єднання.';
        }
    };
}

// Example: to use, call renderVoteCreation('some-container-id') on any page
