import { STORAGE_KEYS, ELEMENT_IDS } from '../config/gameConfig.js';
import { pokemonData } from '../pokemonData.js';

// Game State
let currentUser = null;
let gameData = {
    users: {},
    pokemon: []
};

// Load game data from localStorage
export function loadGameData() {
    const savedData = localStorage.getItem(STORAGE_KEYS.GAME_DATA);
    if (savedData) {
        gameData = JSON.parse(savedData);
        
        // Migrate old data format to new format
        for (const username in gameData.users) {
            const user = gameData.users[username];
            if (user.caughtPokemon && typeof Object.values(user.caughtPokemon)[0] === 'boolean') {
                // Convert boolean caught status to card counts
                const newCardCounts = {};
                for (const pokemonId in user.caughtPokemon) {
                    if (user.caughtPokemon[pokemonId]) {
                        newCardCounts[pokemonId] = 1; // Give them 1 card for each previously caught Pokemon
                    }
                }
                user.cardCounts = newCardCounts;
                delete user.caughtPokemon; // Remove old format
            }
        }
    }
    
    // Always force refresh Pokemon data to ensure all 151 are loaded
    gameData.pokemon = pokemonData;
    
    // Save the updated data
    saveGameData();
}

// Save game data to localStorage
export function saveGameData() {
    localStorage.setItem(STORAGE_KEYS.GAME_DATA, JSON.stringify(gameData));
}

// Get current user
export function getCurrentUser() {
    return currentUser;
}

// Get game data
export function getGameData() {
    return gameData;
}

// Handle login
export function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }
    
    if (gameData.users[username] && gameData.users[username].password === password) {
        currentUser = username;
        showScreen(ELEMENT_IDS.GAME_SCREEN);
        updateGameUI();
    } else {
        alert('Invalid username or password');
    }
}

// Handle register
export function handleRegister() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }
    
    if (gameData.users[username]) {
        alert('Username already exists');
        return;
    }
    
    // Create new user
    gameData.users[username] = {
        password: password,
        packsOpened: 0,
        cardsCollected: 0,
        cardCounts: {},
        recentCatches: [],
        favorites: []
    };
    
    saveGameData();
    currentUser = username;
    showScreen(ELEMENT_IDS.GAME_SCREEN);
    updateGameUI();
}

// Handle logout
export function handleLogout() {
    currentUser = null;
    showScreen(ELEMENT_IDS.LOGIN_SCREEN);
    clearLoginForm();
}

// Clear login form
export function clearLoginForm() {
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// Show screen
export function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
    
    // Handle floating Pokemon background
    if (screenId === 'login-screen') {
        // Add a small delay to ensure the screen is visible
        setTimeout(() => {
            // Import and call startFloatingPokemon dynamically to avoid circular dependency
            import('./floatingPokemon.js').then(module => {
                module.startFloatingPokemon();
            });
        }, 50);
    } else {
        // Import and call stopFloatingPokemon dynamically to avoid circular dependency
        import('./floatingPokemon.js').then(module => {
            module.stopFloatingPokemon();
        });
    }
    
    // Special handling for game screen
    if (screenId === ELEMENT_IDS.GAME_SCREEN) {
        updateGameUI();
    } else if (screenId === ELEMENT_IDS.POKEDEX_SCREEN) {
        // Import and call renderPokedex dynamically to avoid circular dependency
        import('../uiHandlers.js').then(module => {
            module.renderPokedex(getGameData(), getCurrentUser());
        });
    }
}

// Update game UI
export function updateGameUI() {
    if (!currentUser) return;
    const userData = gameData.users[currentUser];
    const uniqueCount = Object.keys(userData.cardCounts).filter(id => userData.cardCounts[id] > 0).length;
    const totalCount = pokemonData.length;
    document.getElementById(ELEMENT_IDS.CAUGHT_COUNT).textContent = uniqueCount;
    document.getElementById(ELEMENT_IDS.TOTAL_COUNT).textContent = totalCount;
    document.getElementById(ELEMENT_IDS.PACKS_OPENED).textContent = userData.packsOpened;
    document.getElementById(ELEMENT_IDS.CARDS_COLLECTED).textContent = userData.cardsCollected;
    const progressPercentage = (uniqueCount / totalCount) * 100;
    document.getElementById(ELEMENT_IDS.PROGRESS_FILL).style.width = progressPercentage + '%';
    
    // Update rarity breakdown
    updateRarityBreakdown(userData);
    const recentCatchesContainer = document.getElementById('recent-catches');
    recentCatchesContainer.innerHTML = '';
    userData.recentCatches.forEach(pokemon => {
        const currentCount = userData.cardCounts[pokemon.id] || 0;
        const catchEl = document.createElement('div');
        catchEl.className = 'recent-catch';
        const pokeData = pokemonData.find(p => p.id === pokemon.id);
        let spriteUrl;
        if (pokeData && pokeData.rarity === 'shiny' && pokeData.originalId) {
            const paddedId = pokeData.originalId.toString().padStart(3, '0');
            spriteUrl = `sprites/pokemon/shiny/${paddedId}.png`;
            catchEl.classList.add('shiny');
        } else {
            const paddedId = pokemon.id.toString().padStart(3, '0');
            spriteUrl = `sprites/pokemon/${paddedId}.png`;
        }
        // Add rarity class for color coding
        if (pokeData) {
            catchEl.classList.add(pokeData.rarity);
        }
        catchEl.innerHTML = `
            <img src="${spriteUrl}" alt="${pokemon.name}"
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEwIiBmaWxsPSIjOUI5QjlCIi8+Cjwvc3ZnPgo='">
            <div>
                <h5>${pokemon.name}</h5>
                <p>#${pokeData && pokeData.originalId ? pokeData.originalId.toString().padStart(3, '0') : pokemon.id.toString().padStart(3, '0')} - ${pokemon.type}</p>
                <p class="count">Count: ${currentCount}</p>
            </div>
        `;
        recentCatchesContainer.appendChild(catchEl);
    });
}

// Calculate rarity stats
export function calculateRarityStats(userData) {
    const rarityCounts = {
        common: { collected: 0, total: 0 },
        uncommon: { collected: 0, total: 0 },
        rare: { collected: 0, total: 0 },
        legendary: { collected: 0, total: 0 },
        shiny: { collected: 0, total: 0 }
    };
    
    // Count total and collected for each rarity
    pokemonData.forEach(pokemon => {
        const rarity = pokemon.rarity;
        if (rarityCounts[rarity]) {
            rarityCounts[rarity].total++;
            if (userData.cardCounts[pokemon.id] && userData.cardCounts[pokemon.id] > 0) {
                rarityCounts[rarity].collected++;
            }
        }
    });
    
    return rarityCounts;
}

// Update rarity breakdown
export function updateRarityBreakdown(userData) {
    const rarityStats = calculateRarityStats(userData);
    
    // Update the rarity count displays
    document.getElementById('common-count').textContent = `${rarityStats.common.collected}/${rarityStats.common.total}`;
    document.getElementById('uncommon-count').textContent = `${rarityStats.uncommon.collected}/${rarityStats.uncommon.total}`;
    document.getElementById('rare-count').textContent = `${rarityStats.rare.collected}/${rarityStats.rare.total}`;
    document.getElementById('legendary-count').textContent = `${rarityStats.legendary.collected}/${rarityStats.legendary.total}`;
    document.getElementById('shiny-count').textContent = `${rarityStats.shiny.collected}/${rarityStats.shiny.total}`;
}

// Toggle rarity breakdown
export function toggleRarityBreakdown() {
    const breakdown = document.getElementById('rarity-breakdown');
    const isVisible = !breakdown.classList.contains('hidden');
    
    if (isVisible) {
        // Hide the breakdown
        breakdown.classList.remove('show');
        setTimeout(() => {
            breakdown.classList.add('hidden');
        }, 300);
    } else {
        // Show the breakdown
        breakdown.classList.remove('hidden');
        setTimeout(() => {
            breakdown.classList.add('show');
        }, 10);
    }
}

 