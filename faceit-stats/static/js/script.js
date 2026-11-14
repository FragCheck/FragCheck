
'use strict';

const el = (id) => document.getElementById(id);

let primaryPlayer = null;
let comparisonPlayer = null;
let primaryController = null;
let comparisonController = null;

const TAB_NAMES = ['overview', 'maps'];

function displayValue(value, suffix = '') {
    if (value === undefined || value === null || value === '') {
        return '—';
    }

    return `${value}${suffix}`;
}

function setText(id, value, suffix = '') {
    el(id).textContent = displayValue(value, suffix);
}

function setStatus(id, message = '') {
    el(id).textContent = message;
}

function setLoading(buttonId, isLoading, defaultText) {
    const button = el(buttonId);

    button.disabled = isLoading;
    button.textContent = isLoading ? 'Searching...' : defaultText;
}

function setTab(name, focusTab = false) {
    if (!TAB_NAMES.includes(name)) {
        return;
    }

    for (const tabName of TAB_NAMES) {
        const isSelected = tabName === name;
        const tab = el(`${tabName}Tab`);
        const panel = el(tabName);

        tab.setAttribute('aria-selected', String(isSelected));
        tab.tabIndex = isSelected ? 0 : -1;
        panel.hidden = !isSelected;
    }

    if (focusTab) {
        el(`${name}Tab`).focus();
    }
}

function handleTabKeydown(event) {
    const currentIndex = TAB_NAMES.findIndex(
        (name) => el(`${name}Tab`) === event.currentTarget
    );

    let nextIndex;

    switch (event.key) {
        case 'ArrowRight':
            nextIndex = (currentIndex + 1) % TAB_NAMES.length;
            break;

        case 'ArrowLeft':
            nextIndex =
                (currentIndex - 1 + TAB_NAMES.length) % TAB_NAMES.length;
            break;

        case 'Home':
            nextIndex = 0;
            break;

        case 'End':
            nextIndex = TAB_NAMES.length - 1;
            break;

        default:
            return;
    }

    event.preventDefault();
    setTab(TAB_NAMES[nextIndex], true);
}

function createMapCell(value, isRowHeading = false) {
    const cell = document.createElement(
        isRowHeading ? 'th' : 'td'
    );

    if (isRowHeading) {
        cell.scope = 'row';
    }

    cell.textContent = displayValue(value);

    return cell;
}

function renderMaps(segments) {
    const tbody = el('mapRows');
    tbody.replaceChildren();

    const maps = (Array.isArray(segments) ? segments : [])
        .filter((segment) => segment.type === 'Map')
        .sort(
            (a, b) =>
                Number(b.stats?.Matches || 0) -
                Number(a.stats?.Matches || 0)
        );

    if (maps.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');

        cell.colSpan = 6;
        cell.textContent = 'No map statistics available.';

        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    for (const map of maps) {
        const stats = map.stats || {};

        const values = [
            map.label,
            stats.Matches,
            stats['Average K/D Ratio'],
            displayValue(stats['Win Rate %'], '%'),
            stats['Average Kills'],
            displayValue(stats['Average Headshots %'], '%'),
        ];

        const row = document.createElement('tr');

        values.forEach((value, index) => {
            row.appendChild(createMapCell(value, index === 0));
        });

        tbody.appendChild(row);
    }
}

function renderPlayer(data) {
    const profile = data.profile;
    const stats = data.stats;
    const game = profile.games?.cs2 || {};
    const lifetime = stats.lifetime || {};

    setText('nickname', profile.nickname);

    const countryRegion = [
        profile.country?.toUpperCase(),
        game.region,
    ].filter(Boolean).join(' · ');

    setText('countryRegion', countryRegion);

    setText('level', displayValue(game.skill_level), '');
    el('level').textContent =
        `FACEIT Level ${displayValue(game.skill_level)}`;

    setText('elo', game.faceit_elo, ' ELO');

    setText('kd', lifetime['Average K/D Ratio']);
    setText('winrate', lifetime['Win Rate %'], '%');
    setText('headshots', lifetime['Average Headshots %'], '%');
    setText('matches', lifetime.Matches);

    el('winHint').textContent =
        `${displayValue(lifetime.Wins)} wins / ` +
        `${displayValue(lifetime.Matches)} matches`;

    setText('region', game.region);
    setText('skill', game.skill_level);
    setText('country', profile.country?.toUpperCase());
    setText('wins', lifetime.Wins);
    setText('streak', lifetime['Current Win Streak']);
    setText('longest', lifetime['Longest Win Streak']);

    const avatar = el('avatar');

    if (
        typeof profile.avatar === 'string' &&
        profile.avatar.startsWith('https://')
    ) {
        avatar.src = profile.avatar;
        avatar.hidden = false;
    } else {
        avatar.hidden = true;
        avatar.removeAttribute('src');
    }

    renderMaps(stats.segments);
}

function renderComparison(playerOne, playerTwo) {
    const profileOne = playerOne.profile;
    const profileTwo = playerTwo.profile;

    const gameOne = profileOne.games?.cs2 || {};
    const gameTwo = profileTwo.games?.cs2 || {};

    const statsOne = playerOne.stats.lifetime || {};
    const statsTwo = playerTwo.stats.lifetime || {};

    const comparisons = [
        ['comparisonPlayerOne', profileOne.nickname],
        ['comparisonPlayerTwo', profileTwo.nickname],
        ['compareEloOne', gameOne.faceit_elo],
        ['compareEloTwo', gameTwo.faceit_elo],
        ['compareLevelOne', gameOne.skill_level],
        ['compareLevelTwo', gameTwo.skill_level],
        ['compareKdOne', statsOne['Average K/D Ratio']],
        ['compareKdTwo', statsTwo['Average K/D Ratio']],
        ['compareWinrateOne', statsOne['Win Rate %'], '%'],
        ['compareWinrateTwo', statsTwo['Win Rate %'], '%'],
        ['compareHeadshotsOne', statsOne['Average Headshots %'], '%'],
        ['compareHeadshotsTwo', statsTwo['Average Headshots %'], '%'],
        ['compareMatchesOne', statsOne.Matches],
        ['compareMatchesTwo', statsTwo.Matches],
    ];

    for (const [id, value, suffix = ''] of comparisons) {
        setText(id, value, suffix);
    }
}

function clearComparison() {
    comparisonController?.abort();
    comparisonController = null;
    comparisonPlayer = null;

    el('comparisonView').hidden = true;
    el('removeComparison').hidden = true;
    el('comparisonUsername').value = '';

    setStatus('comparisonStatus');
    setLoading('comparisonButton', false, 'Compare Players');
}

function resetPrimaryPlayer() {
    primaryPlayer = null;
    clearComparison();

    el('comparisonSearch').hidden = true;
}

async function fetchPlayer(username, signal) {
    let response;

    try {
        response = await fetch('/search-player', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username }),
            signal,
        });
    } catch (error) {
        if (error.name === 'AbortError') {
            throw error;
        }

        throw new Error(
            'Unable to connect to the server. Please try again.'
        );
    }

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error(
            'The server returned an invalid response.'
        );
    }

    if (response.status === 404) {
        throw new Error(
            data?.error || 'Player not found. Please check the username.'
        );
    }

    if (
        !response.ok ||
        data?.error ||
        data?.profile?.error ||
        data?.stats?.error ||
        !data?.profile ||
        !data?.stats
    ) {
        throw new Error(
            data?.error ||
            data?.profile?.error ||
            data?.stats?.error ||
            'Player data is unavailable.'
        );
    }

    return data;
}

async function handlePrimarySearch(event) {
    event.preventDefault();

    const username = el('username').value.trim();

    if (!username) {
        setStatus('status', 'Please enter a FACEIT username.');
        return;
    }

    primaryController?.abort();
    comparisonController?.abort();

    const controller = new AbortController();
    primaryController = controller;

    setLoading('searchButton', true, 'Search Player');
    setStatus('status', 'Searching for player...');

    try {
        const data = await fetchPlayer(username, controller.signal);

        if (controller.signal.aborted) {
            return;
        }

        primaryPlayer = data;

        clearComparison();
        renderPlayer(primaryPlayer);

        el('comparisonSearch').hidden = false;
        setStatus('status');
    } catch (error) {
        if (controller.signal.aborted) {
            return;
        }

        resetPrimaryPlayer();

        setStatus(
            'status',
            `Unable to load player: ${error.message}`
        );
    } finally {
        if (primaryController === controller) {
            primaryController = null;
            setLoading('searchButton', false, 'Search Player');
        }
    }
}

async function handleComparisonSearch(event) {
    event.preventDefault();

    const username = el('comparisonUsername').value.trim();

    if (!primaryPlayer) {
        setStatus(
            'comparisonStatus',
            'Search for a primary player first.'
        );
        return;
    }

    if (!username) {
        setStatus(
            'comparisonStatus',
            'Please enter a username to compare.'
        );
        return;
    }

    if (
        username.toLowerCase() ===
        primaryPlayer.profile.nickname.toLowerCase()
    ) {
        setStatus(
            'comparisonStatus',
            'You cannot compare a player against themselves.'
        );
        return;
    }

    comparisonController?.abort();

    const controller = new AbortController();
    comparisonController = controller;

    const searchedPrimary = primaryPlayer;

    setLoading('comparisonButton', true, 'Compare Players');
    setStatus(
        'comparisonStatus',
        'Searching for comparison player...'
    );

    try {
        const data = await fetchPlayer(username, controller.signal);

        if (
            controller.signal.aborted ||
            primaryPlayer !== searchedPrimary
        ) {
            return;
        }

        comparisonPlayer = data;

        renderComparison(primaryPlayer, comparisonPlayer);

        el('comparisonView').hidden = false;
        el('removeComparison').hidden = false;

        setStatus('comparisonStatus');
    } catch (error) {
        if (controller.signal.aborted) {
            return;
        }

        setStatus(
            'comparisonStatus',
            `Unable to compare players: ${error.message}`
        );
    } finally {
        if (comparisonController === controller) {
            comparisonController = null;
            setLoading(
                'comparisonButton',
                false,
                'Compare Players'
            );
        }
    }
}

function initializeApp() {
    el('searchForm').addEventListener(
        'submit',
        handlePrimarySearch
    );

    el('comparisonForm').addEventListener(
        'submit',
        handleComparisonSearch
    );

    el('removeComparison').addEventListener(
        'click',
        clearComparison
    );

    for (const name of TAB_NAMES) {
        const tab = el(`${name}Tab`);

        tab.addEventListener('click', () => setTab(name));
        tab.addEventListener('keydown', handleTabKeydown);
    }

    setTab('overview');
}

initializeApp();


