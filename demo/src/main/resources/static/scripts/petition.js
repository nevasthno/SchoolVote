import { fetchWithAuth } from './api.js';

export function initializePetitions(user) {
    const form = document.getElementById('create-petition-form');
    const list = document.getElementById('petition-list');

    async function load() {
        list.innerHTML = 'Завантаження…';
        try {
            const url = new URL(`/api/petitions/user/${user.id}`, window.location.origin);
            url.searchParams.set('schoolId', user.schoolId);
            if (user.classId != null) {
                url.searchParams.set('classId', user.classId);
            }

            const resp = await fetchWithAuth(url.pathname + url.search);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const petitions = await resp.json();
            renderList(petitions);
        } catch (err) {
            list.innerHTML = `<p>Не вдалося завантажити петиції: ${err.message}</p>`;
        }
    }

    function renderList(petitions) {
        if (!petitions.length) {
            list.innerHTML = '<p>Немає активних петицій.</p>';
            return;
        }
        list.innerHTML = petitions.map(p => {
            const ready = p.currentVotes >= p.threshold;
            return `
      <div class="aboutme-card">
        <h4>${p.title}</h4>
        <p>${p.description}</p>
        <p>Дедлайн: ${new Date(p.endDate).toLocaleString()}</p>
        <p>Підписали: ${p.currentVotes} / ${p.threshold}</p>
        ${!ready
                    ? `<button onclick="signPetition(${p.id})">Підписати</button>`
                    : p.approvedByDirector
                        ? `<span style="color:green">✅ Підписано директором</span>`
                        : `<button onclick="directorSign(${p.id})">Ухвалити директором</button>`}
      </div>`;
        }).join('');
    }

    window.signPetition = async id => {
        try {
            const resp = await fetchWithAuth(`/api/petitions/${id}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });
            if (!resp.ok) throw await resp.text();
            await load();
        } catch (e) {
            alert('Не вдалося підписати: ' + e);
        }
    };

    window.directorSign = async id => {
        if (!confirm('Підписати директором?')) return;
        try {
            const resp = await fetchWithAuth(`/api/petitions/${id}/director`, { method: 'POST' });
            if (!resp.ok) throw await resp.text();
            await load();
        } catch (e) {
            alert('Не вдалося ухвалити: ' + e);
        }
    };

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const title = form.querySelector('#petition-title').value.trim();
        const description = form.querySelector('#petition-description').value.trim();
        const level = form.querySelector('#petition-target').value;
        const dateStr = form.querySelector('#petition-deadline').value; // "YYYY-MM-DD"

        const startDate = new Date();
        const endDate = new Date(dateStr);
        endDate.setHours(23, 59, 59, 999);

        const payload = {
            title,
            description,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            schoolId: user.schoolId,
            classId: level === 'CLASS' ? user.classId : null
        };

        try {
            const resp = await fetchWithAuth('/api/createPetition', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!resp.ok) throw await resp.text();
            form.reset();
            await load();
        } catch (err) {
            alert('Помилка створення петиції: ' + err);
        }
    });
    load();
}