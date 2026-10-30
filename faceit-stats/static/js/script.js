
const el = id => document.getElementById(id);

function setText(id, value, suffix = '') {
    el(id).textContent = value === undefined || value === null || value === ''
        ? '—'
        : `${value}${suffix}`;
}

function setTab(name) {
    const isOverview = name === 'overview';

    el('overview').hidden = !isOverview;
    el('maps').hidden = isOverview;

    el('overviewTab').setAttribute('aria-selected', String(isOverview));
    el('mapsTab').setAttribute('aria-selected', String(!isOverview));
}

el('overviewTab').addEventListener('click', () => setTab('overview'));
el('mapsTab').addEventListener('click', () => setTab('maps'));

function renderPlayer(data) {
    const profile = data.profile;
    const stats = data.stats;
    const game = profile.games?.cs2 || {};
    const lifetime = stats.lifetime || {};

    setText('nickname', profile.nickname);
    setText(
        'countryRegion',
        [profile.country?.toUpperCase(), game.region].filter(Boolean).join(' · ')
    );

    el('level').textContent = `FACEIT Level ${game.skill_level ?? '—'}`;
    setText('elo', game.faceit_elo, ' ELO');

    setText('kd', lifetime['Average K/D Ratio']);
    setText('winrate', lifetime['Win Rate %'], '%');
    setText('headshots', lifetime['Average Headshots %'], '%');
    setText('matches', lifetime['Matches']);

    el('winHint').textContent =
        `${lifetime['Wins'] ?? '—'} wins / ${lifetime['Matches'] ?? '—'} matches`;

    setText('region', game.region);
    setText('skill', game.skill_level);
    setText('country', profile.country?.toUpperCase());
    setText('wins', lifetime['Wins']);
    setText('streak', lifetime['Current Win Streak']);
    setText('longest', lifetime['Longest Win Streak']);

    const avatar = el('avatar');

    if (profile.avatar?.startsWith('https://')) {
        avatar.src = profile.avatar;
        avatar.hidden = false;
    } else {
        avatar.hidden = true;
        avatar.removeAttribute('src');
    }

    const tbody = el('mapRows');
    tbody.replaceChildren();

    const maps = (Array.isArray(stats.segments) ? stats.segments : [])
        .filter(x => x.type === 'Map')
        .sort((a, b) =>
            Number(b.stats?.Matches || 0) - Number(a.stats?.Matches || 0)
        );

    if (!maps.length) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');

        td.colSpan = 6;
        td.textContent = 'No map statistics available.';

        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    for (const map of maps) {
        const s = map.stats || {};

        const values = [
            map.label,
            s.Matches,
            s['Average K/D Ratio'],
            s['Win Rate %'] == null ? null : `${s['Win Rate %']}%`,
            s['Average Kills'],
            s['Average Headshots %'] == null
                ? null
                : `${s['Average Headshots %']}%`
        ];

        const tr = document.createElement('tr');

        for (const value of values) {
            const td = document.createElement('td');
            td.textContent = value ?? '—';
            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    }
}

el('searchForm').addEventListener('submit', async event => {
    event.preventDefault();

    const username = el('username').value.trim();

    if (!username) {
        return;
    }

    const button = el('searchButton');

    button.disabled = true;
    button.textContent = 'Searching...';
    el('status').textContent = '';

    try {
        const response = await fetch('/search-player', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });

        const data = await response.json();
        if (response.status === 404) {
          throw new Error("Player not found. Please check the username.");
        }


        if (
            !response.ok ||
            data.error ||
            data.profile?.error ||
            data.stats?.error ||
            !data.profile ||
            !data.stats
        ) {
            throw new Error(
                data.error ||
                data.profile?.error ||
                data.stats?.error ||
                'Player data unavailable'
            );
        }

        renderPlayer(data);

    } catch (error) {
        el('status').textContent = `Unable to load player: ${error.message}`;

    } finally {
        button.disabled = false;
        button.textContent = 'Search Player';
    }
});
