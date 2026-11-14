
const el = id => document.getElementById(id);

let primaryPlayer = null;
let comparisonPlayer = null;

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


function renderComparison(playerOne, playerTwo) {
    const profileOne = playerOne.profile;
    const profileTwo = playerTwo.profile;

    const gameOne = profileOne.games?.cs2 || {};
    const gameTwo = profileTwo.games?.cs2 || {};

    const statsOne = playerOne.stats.lifetime || {};
    const statsTwo = playerTwo.stats.lifetime || {};

    // Player names
    setText('comparisonPlayerOne', profileOne.nickname);
    setText('comparisonPlayerTwo', profileTwo.nickname);

    // FACEIT ELO
    setText('compareEloOne', gameOne.faceit_elo);
    setText('compareEloTwo', gameTwo.faceit_elo);

    // Skill level
    setText('compareLevelOne', gameOne.skill_level);
    setText('compareLevelTwo', gameTwo.skill_level);

    // Average K/D
    setText('compareKdOne', statsOne['Average K/D Ratio']);
    setText('compareKdTwo', statsTwo['Average K/D Ratio']);

    // Win rate
    setText('compareWinrateOne', statsOne['Win Rate %'], '%');
    setText('compareWinrateTwo', statsTwo['Win Rate %'], '%');

    // Headshot percentage
    setText('compareHeadshotsOne', statsOne['Average Headshots %'], '%');
    setText('compareHeadshotsTwo', statsTwo['Average Headshots %'], '%');

    // Matches played
    setText('compareMatchesOne', statsOne['Matches']);
    setText('compareMatchesTwo', statsTwo['Matches']);
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

        primaryPlayer = data;
        comparisonPlayer = null;

        renderPlayer(primaryPlayer);
        el('comparisonSearch').hidden = false;

    } catch (error) {
        el('status').textContent = `Unable to load player: ${error.message}`;

    } finally {
        button.disabled = false;
        button.textContent = 'Search Player';
    }
    el('comparisonForm').addEventListener('submit', async event => {
        event.preventDefault();

        const username = el('comparisonUsername').value.trim();
        const status = el('comparisonStatus');
        const button = el('comparisonButton');

        if (!primaryPlayer || !username) {
            status.textContent = 'Search for a primary player first.';
            return;
        }

        if (username.toLowerCase() === primaryPlayer.profile.nickname.toLowerCase()) {
            status.textContent = 'You cannot compare a player against themselves.';
            return;
        }

        button.disabled = true;
        button.textContent = 'Searching...';
        status.textContent = '';

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
                throw new Error('Comparison player not found.');
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
                    'Comparison player data unavailable.'
                );
            }

            comparisonPlayer = data;
            status.textContent = '';
            renderComparison(primaryPlayer, comparisonPlayer);

            el('comparisonView').hidden = false;
            el('removeComparison').hidden = false;
        } catch (error) {
            status.textContent = `Unable to compare players: ${error.message}`;

        } finally {
            button.disabled = false;
            button.textContent = 'Compare Players';
        }
    });

    el('removeComparison').addEventListener('click', () => {
        comparisonPlayer = null;

        el('comparisonView').hidden = true;
        el('comparisonUsername').value = '';
        el('comparisonStatus').textContent = '';
        el('removeComparison').hidden = true;
    });

});

