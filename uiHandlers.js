import { pokemonData } from './pokemonData.js';
import { getCurrentUser, getGameData } from './userManager.js';
import { setupRollButtonListeners } from './main.js';

// Import rarity tracking functions from script.js
// These functions are defined in script.js and will be available globally

// Display the cards from a pack opening
function displayPackCards(cards, gameData, currentUser) {
    const userData = gameData.users[currentUser];
    const cardsContainer = document.getElementById('cards-container');
    cardsContainer.innerHTML = '';
    cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        const currentCount = userData.cardCounts[card.id] || 0;
        const isNew = currentCount === 1;
        if (isNew) cardEl.classList.add('new');
        if (card.rarity === 'shiny') cardEl.classList.add('shiny');
        // Add rarity class for color coding
        cardEl.classList.add(card.rarity);
        let spriteUrl;
        if (card.rarity === 'shiny' && card.originalId) {
            const paddedId = card.originalId.toString().padStart(3, '0');
            spriteUrl = `sprites/pokemon/shiny/${paddedId}.png`;
        } else {
            const paddedId = card.id.toString().padStart(3, '0');
            spriteUrl = `sprites/pokemon/${paddedId}.png`;
        }
        cardEl.innerHTML = `
            <img src="${spriteUrl}" alt="${card.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiA0OEMzMiA0NC42ODYzIDM0LjY4NjMgNDIgMzggNDJINDJDNDUuMzEzNyA0MiA0OCA0NC42ODYzIDQ4IDQ4VjUyQzQ4IDU1LjMxMzcgNDUuMzEzNyA1OCA0MiA1OEgzOEMzNC42ODYzIDU4IDMyIDU1LjMxMzcgMzIgNTJWNDhaIiBmaWxsPSIjOUI5QjlCIi8+CjwvZz4KPC9zdmc+Cg=='">
            <h4>${card.name}</h4>
            <p>#${card.originalId ? card.originalId.toString().padStart(3, '0') : card.id.toString().padStart(3, '0')}</p>
            <p>${card.type}</p>
            <p class="rarity">${card.rarity.toUpperCase()}</p>
            <p class="card-count">You have: ${currentCount}</p>
        `;
        // Auto-scale long names
        const nameEl = cardEl.querySelector('h4');
        if (card.name.length >= 10) {
            nameEl.classList.add('long-name');
        }
        cardsContainer.appendChild(cardEl);
    });
    document.getElementById('pack').style.display = 'none';
    document.getElementById('cards-reveal').classList.remove('hidden');
    // Hide roll button when cards are revealed
    const rollBtn = document.getElementById('roll-btn');
    if (rollBtn) rollBtn.style.display = 'none';
}

function openAnotherPack() {
    document.getElementById('pack').style.display = 'block';
    document.getElementById('cards-reveal').classList.add('hidden');
    // Show roll button again and restore its contents
    const rollBtn = document.getElementById('roll-btn');
    if (rollBtn) {
        rollBtn.innerHTML = '<span class="pokeball-icon"></span><span class="roll-label">Roll</span>';
        rollBtn.style.display = 'block';
        rollBtn.classList.remove('exploding');
        const icon = rollBtn.querySelector('.pokeball-icon');
        if (icon) {
            icon.style.opacity = '';
            icon.style.transform = '';
        }
        if (typeof isPackOpening !== 'undefined') isPackOpening = false;
        setupRollButtonListeners();
    }
}

function updateGameUI(gameData, currentUser) {
    if (!currentUser) return;
    const userData = gameData.users[currentUser];
    
    // Check if exclude shinies toggle is checked
    const excludeShiniesToggle = document.getElementById('exclude-shinies-toggle');
    const excludeShinies = excludeShiniesToggle && excludeShiniesToggle.checked;
    
    // Calculate counts based on toggle
    let uniqueCount, totalCount;
    if (excludeShinies) {
        // Exclude shinies from count - only count base Pokémon (not shiny)
        uniqueCount = Object.keys(userData.cardCounts).filter(id => {
            const pokemon = pokemonData.find(p => p.id == id);
            return userData.cardCounts[id] > 0 && pokemon && pokemon.rarity !== 'shiny';
        }).length;
        // Count total base Pokémon (non-shiny)
        totalCount = pokemonData.filter(p => p.rarity !== 'shiny').length;
    } else {
        // Include all Pokémon
        uniqueCount = Object.keys(userData.cardCounts).filter(id => userData.cardCounts[id] > 0).length;
        totalCount = pokemonData.length;
    }
    
    document.getElementById('caught-count').textContent = uniqueCount;
    document.getElementById('total-count').textContent = totalCount;
    document.getElementById('packs-opened').textContent = userData.packsOpened;
    document.getElementById('cards-collected').textContent = userData.cardsCollected;
    const progressPercentage = (uniqueCount / totalCount) * 100;
    document.getElementById('progress-fill').style.width = progressPercentage + '%';
    
    // Update rarity breakdown
    import('./userManager.js').then(module => {
        module.updateRarityBreakdown(userData);
    });
    // Update recent catches using the userManager function
    import('./userManager.js').then(module => {
        module.updateRecentCatches(userData);
    });
}

function renderPokedex(gameData, currentUser) {
    const pokedexGrid = document.getElementById('pokedex-grid');
    const searchTerm = document.getElementById('search-pokemon').value.toLowerCase();
    const generationFilter = document.getElementById('generation-filter').value;
    const rarityFilter = document.getElementById('rarity-filter').value;
    const showCaughtOnly = document.getElementById('show-caught-only').checked;
    const showFavoritesOnly = document.getElementById('show-favorites-only').checked;
    
    pokedexGrid.innerHTML = '';
    
    // Get user's favorites
    const userData = gameData.users[currentUser];
    const userFavorites = userData ? (userData.favorites || []) : [];
    
    let pokemonToShow = pokemonData;

    // --- FIXED FILTERING LOGIC ---
    if (generationFilter === 'all') {
        // Show only normal Pokémon (not shinies) for all generations 1–9
        pokemonToShow = pokemonData.filter(p => p.generation >= 1 && p.generation <= 9 && p.rarity !== 'shiny');
    } else if (generationFilter === 'shiny') {
        // Show all shiny Pokémon for gens 1–9
        pokemonToShow = pokemonData.filter(p => p.rarity === 'shiny');
    } else {
        // Show only normal Pokémon (not shinies) for the selected generation
        pokemonToShow = pokemonData.filter(p => p.generation == generationFilter && p.rarity !== 'shiny');
    }
    // --- END FIXED FILTERING LOGIC ---

    // Filter by rarity
    if (rarityFilter !== 'all') {
        pokemonToShow = pokemonToShow.filter(p => p.rarity === rarityFilter);
    }

    // Filter by search term
    if (searchTerm) {
        pokemonToShow = pokemonToShow.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            (p.originalId ? p.originalId.toString() : p.id.toString()).includes(searchTerm)
        );
    }

    // Filter by caught status
    if (showCaughtOnly && currentUser) {
        pokemonToShow = pokemonToShow.filter(p => {
            const currentCount = userData.cardCounts[p.id] || 0;
            return currentCount > 0;
        });
    }
    
    // Filter by favorites
    if (showFavoritesOnly && currentUser) {
        pokemonToShow = pokemonToShow.filter(p => {
            return userFavorites.includes(p.id);
        });
    }

    // Sort Pokémon by National Pokédex order
    pokemonToShow.sort((a, b) => {
        // For normal Pokémon, use their id
        // For shiny Pokémon, use their originalId
        const aOrder = a.rarity === 'shiny' ? a.originalId : a.id;
        const bOrder = b.rarity === 'shiny' ? b.originalId : b.id;
        return aOrder - bOrder;
    });

    // Render each Pokémon
    pokemonToShow.forEach(pokemon => {
        const cardEl = document.createElement('div');
        cardEl.className = 'pokedex-entry';
        
        // Get user's card count for this Pokémon
        const currentCount = userData ? (userData.cardCounts[pokemon.id] || 0) : 0;
        const isCaught = currentCount > 0;
        const isFavorited = userFavorites.includes(pokemon.id);
        
        // Add appropriate classes
        if (isCaught) cardEl.classList.add('caught');
        if (pokemon.rarity === 'shiny') cardEl.classList.add('shiny');
        if (isFavorited) cardEl.classList.add('favorited');
        // Add rarity class for color coding
        cardEl.classList.add(pokemon.rarity);
        
        let spriteUrl;
        if (pokemon.rarity === 'shiny' && pokemon.originalId) {
            const paddedId = pokemon.originalId.toString().padStart(3, '0');
            spriteUrl = `sprites/pokemon/shiny/${paddedId}.png`;
        } else {
            const paddedId = pokemon.id.toString().padStart(3, '0');
            spriteUrl = `sprites/pokemon/${paddedId}.png`;
        }
        
        cardEl.innerHTML = `
            <div class="favorite-heart"></div>
            <img src="${spriteUrl}" alt="${pokemon.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiA0OEMzMiA0NC42ODYzIDM0LjY4NjMgNDIgMzggNDJINDJDNDUuMzEzNyA0MiA0OCA0NC42ODYzIDQ4IDQ4VjUyQzQ4IDU1LjMxMzcgNDUuMzEzNyA1OCA0MiA1OEgzOEMzNC42ODYzIDU4IDMyIDU1LjMxMzcgMzIgNTJWNDhaIiBmaWxsPSIjOUI5QjlCIi8+CjwvZz4KPC9zdmc+Cg==';">
            <h4>${pokemon.name}</h4>
            <p>#${pokemon.originalId ? pokemon.originalId.toString().padStart(3, '0') : pokemon.id.toString().padStart(3, '0')}</p>
            <p>${pokemon.type}</p>
            <p class="rarity">${pokemon.rarity.toUpperCase()}</p>
            <p class="card-count">You have: ${currentCount}</p>
        `;
        
        // Auto-scale long names
        const nameEl = cardEl.querySelector('h4');
        if (pokemon.name.length >= 10) {
            nameEl.classList.add('long-name');
        }
        
        // Add double-click event for favoriting
        cardEl.addEventListener('dblclick', () => {
            toggleFavorite(pokemon.id, gameData, currentUser);
        });
        
        pokedexGrid.appendChild(cardEl);
    });
}

function toggleFavorite(pokemonId, gameData, currentUser) {
    if (!currentUser) return;
    
    const userData = gameData.users[currentUser];
    if (!userData.favorites) {
        userData.favorites = [];
    }
    
    const favoriteIndex = userData.favorites.indexOf(pokemonId);
    
    if (favoriteIndex === -1) {
        // Add to favorites
        userData.favorites.push(pokemonId);
    } else {
        // Remove from favorites
        userData.favorites.splice(favoriteIndex, 1);
    }
    
    // Save to localStorage
    localStorage.setItem('pokeroller-data', JSON.stringify(gameData));
    
    // Re-render the Pokédex to show updated state
    renderPokedex(gameData, currentUser);
}

function filterPokedex(gameData, currentUser) {
    renderPokedex(gameData, currentUser);
}

// Display the cards from a pack opening in the overlay
function displayPackCardsOverlay(cards, gameData, currentUser) {
    const userData = gameData.users[currentUser];
    const overlayContainer = document.getElementById('overlay-cards-container');
    const cardOverlay = document.getElementById('card-overlay');
    const continueBtn = document.getElementById('continue-btn');
    
    // Clear previous cards
    overlayContainer.innerHTML = '';
    
    // Create card elements
    cards.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'overlay-card';
        const currentCount = userData.cardCounts[card.id] || 0;
        const isNew = currentCount === 1;
        if (isNew) cardEl.classList.add('new');
        if (card.rarity === 'shiny') cardEl.classList.add('shiny');
        // Add rarity class for color coding
        cardEl.classList.add(card.rarity);
        
        let spriteUrl;
        if (card.rarity === 'shiny' && card.originalId) {
            const paddedId = card.originalId.toString().padStart(3, '0');
            spriteUrl = `sprites/pokemon/shiny/${paddedId}.png`;
        } else {
            const paddedId = card.id.toString().padStart(3, '0');
            spriteUrl = `sprites/pokemon/${paddedId}.png`;
        }
        
        cardEl.innerHTML = `
            ${isNew ? '<div class="new-badge jumpy">NEW</div>' : ''}
            <img src="${spriteUrl}" alt="${card.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiA0OEMzMiA0NC42ODYzIDM0LjY4NjMgNDIgMzggNDJINDJDNDUuMzEzNyA0MiA0OCA0NC42ODYzIDQ4IDQ4VjUyQzQ4IDU1LjMxMzcgNDUuMzEzNyA1OCA0MiA1OEgzOEMzNC42ODYzIDU4IDMyIDU1LjMxMzcgMzIgNTJWNDhaIiBmaWxsPSIjOUI5QjlCIi8+CjwvZz4KPC9zdmc+Cg==';">
            <h4>${card.name}</h4>
            <p>#${card.originalId ? card.originalId.toString().padStart(3, '0') : card.id.toString().padStart(3, '0')}</p>
            <p>${card.type}</p>
            <p class="rarity">${card.rarity.toUpperCase()}</p>
        `;
        
        // Auto-scale long names
        const nameEl = cardEl.querySelector('h4');
        if (card.name.length >= 10) {
            nameEl.classList.add('long-name');
        }
        
        overlayContainer.appendChild(cardEl);
    });
    
    // Show overlay
    cardOverlay.classList.remove('hidden');
    setTimeout(() => cardOverlay.classList.add('show'), 10);
    
    // Animate cards appearing one by one
    const cardElements = overlayContainer.querySelectorAll('.overlay-card');
    cardElements.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('show');
        }, 800 + (index * 400)); // Start after explosion, then each card every 400ms
    });
    
    // Show continue button after all cards have appeared
    setTimeout(() => {
        continueBtn.classList.remove('hidden');
        setTimeout(() => continueBtn.classList.add('show'), 10);
    }, 800 + (cardElements.length * 400) + 500);
    
    // Hide the roll button
    const rollBtn = document.getElementById('roll-btn');
    if (rollBtn) rollBtn.style.display = 'none';
}

function closeCardOverlay() {
    const cardOverlay = document.getElementById('card-overlay');
    const continueBtn = document.getElementById('continue-btn');
    const rollBtn = document.getElementById('roll-btn');
    
    cardOverlay.classList.remove('show');
    continueBtn.classList.remove('show');
    
    setTimeout(() => {
        cardOverlay.classList.add('hidden');
        continueBtn.classList.add('hidden');
        
        // Check for level up after roll completes
        if (window.lastLevelUp) {
            alert('Level up! You reached level ' + window.lastLevelUp.level + ' and earned 2 free rolls!');
            delete window.lastLevelUp; // Clear the flag
        }
        
        // Show roll button again and restore its contents
        if (rollBtn) {
            rollBtn.innerHTML = '<span class="pokeball-icon"></span><span class="roll-label">Roll</span>';
            rollBtn.style.display = 'block';
            rollBtn.classList.remove('exploding');
            const icon = rollBtn.querySelector('.pokeball-icon');
            if (icon) {
                icon.style.opacity = '';
                icon.style.transform = '';
            }
            // Re-setup the roll button listeners
            setupRollButtonListeners();
        }
        
        // Reset pack opening state to allow new pack openings
        if (window.resetPackOpeningState) {
            window.resetPackOpeningState();
        }
        
        // --- FIX: Update pokedex if visible ---
        const pokedexScreen = document.getElementById('pokedex-screen');
        if (pokedexScreen && !pokedexScreen.classList.contains('hidden')) {
            renderPokedex(gameData, currentUser);
        }
    }, 500);
}

export {
    displayPackCards,
    openAnotherPack,
    updateGameUI,
    renderPokedex,
    filterPokedex,
    displayPackCardsOverlay,
    closeCardOverlay
};
