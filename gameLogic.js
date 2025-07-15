import { pokemonData } from './pokemonData.js';

// Core game logic: open a pack and generate cards
async function openPack(currentUser, gameData, saveGameData, displayPackCards, updateGameUI, cards) {
    if (!currentUser) return;

    const userData = gameData.users[currentUser];
    
    // Anticheat: Rate limiting - prevent rapid rolls
    const now = Date.now();
    if (!userData.lastRollTime) {
        userData.lastRollTime = 0;
    }
    const timeSinceLastRoll = now - userData.lastRollTime;
    const minRollInterval = 100; // 100ms minimum between rolls (reduced from 1000ms)
    
    if (timeSinceLastRoll < minRollInterval) {
        console.warn('Roll rate limit exceeded');
        return;
    }
    
    // Check if user has enough coins
    if (userData.coins < 1) {
        alert('Not enough coins! You need 1 coin to roll.');
        return;
    }
    
    // Anticheat: Validate coin count isn't negative
    if (userData.coins < 0) {
        console.warn('Invalid coin count detected, resetting to 0');
        userData.coins = 0;
        await saveGameData();
        return;
    }
    
    // Deduct 1 coin for the roll
    userData.coins -= 1;
    
    // Anticheat: Record roll timestamp
    userData.lastRollTime = now;
    
    // Immediately update coin display
    const coinDisplay = document.getElementById('coin-display');
    if (coinDisplay) {
        coinDisplay.textContent = userData.coins;
    }
    
    // Update roll button state immediately
    const rollBtn = document.getElementById('roll-btn');
    if (rollBtn) {
        if (userData.coins < 1) {
            rollBtn.disabled = true;
            rollBtn.classList.add('disabled');
        } else {
            rollBtn.disabled = false;
            rollBtn.classList.remove('disabled');
        }
    }
    
    // Use provided cards or generate new ones
    if (!cards) {
        cards = generatePackCards();
    }

    // Update user stats
    userData.packsOpened++;
    userData.cardsCollected += cards.length;

    // XP and Level Up logic - moved to after roll completes
    userData.xp = (userData.xp || 0) + 1;
    let leveledUp = false;
    if (userData.xp >= (userData.xpToNext || 25)) {
        userData.level = (userData.level || 1) + 1;
        userData.xp = 0;
        userData.coins = (userData.coins || 0) + 2;
        leveledUp = true;
        await saveGameData();
        updateGameUI();
        // Level up dialog will be shown after roll completes
    }
    
    // Update XP bar immediately
    const levelDisplay = document.getElementById('level-display');
    const xpBarFill = document.getElementById('xp-bar-fill');
    const xpBarLabel = document.getElementById('xp-bar-label');
    if (levelDisplay && xpBarFill && xpBarLabel) {
        levelDisplay.textContent = `Level ${userData.level || 1}`;
        const xp = userData.xp || 0;
        const xpToNext = userData.xpToNext || 25;
        const percent = Math.min(100, Math.round((xp / xpToNext) * 100));
        xpBarFill.style.width = percent + '%';
        xpBarLabel.textContent = `${xp} / ${xpToNext} XP`;
    }
    
    // Initialize recentCatches array if it doesn't exist
    if (!userData.recentCatches) {
        userData.recentCatches = [];
    }
    
    // Process card counts
    let newCatches = 0;
    cards.forEach(card => {
        if (!userData.cardCounts[card.id]) {
            userData.cardCounts[card.id] = 0;
        }
        const wasNew = userData.cardCounts[card.id] === 0;
        userData.cardCounts[card.id]++;
        if (wasNew) {
            newCatches++;
        }
        
        // Add ALL catches to recentCatches (not just new ones)
        userData.recentCatches.unshift({
            id: card.id,
            name: card.name,
            type: card.type,
            count: userData.cardCounts[card.id],
            timestamp: Date.now(),
            wasNew: wasNew
        });
        
        // Keep only the last 20 catches
        if (userData.recentCatches.length > 20) {
            userData.recentCatches.pop();
        }
    });
    
    console.log('Recent catches after roll:', userData.recentCatches.length, 'items');
    console.log('First 5 recent catches:', userData.recentCatches.slice(0, 5).map(c => c.name));

    await saveGameData();
    
    // Store level up state for the overlay to check
    if (leveledUp) {
        window.lastLevelUp = {
            level: userData.level,
            timestamp: Date.now()
        };
    }
    
    // Check for achievements
    import('./achievements.js').then(async module => {
        const newlyCompleted = module.checkAndAwardAchievements(userData, gameData, currentUser);
        if (newlyCompleted.length > 0) {
            await saveGameData();
            updateGameUI();
            
            // Show achievement notification
            const achievementNames = newlyCompleted.map(a => a.name).join(', ');
            alert(`Achievement Unlocked! ${achievementNames}\nVisit the Achievements tab to claim your rewards!`);
        }
    });
    
    displayPackCards(cards);
    updateGameUI();
}

function generatePackCards() {
    const cards = [];
    
    // Anticheat: Validate that we're generating exactly 5 cards
    const expectedCardCount = 5;
    
    for (let i = 0; i < expectedCardCount; i++) {
        if (Math.random() < 0.01) {
            const shinyPokemon = pokemonData.filter(p => p.rarity === 'shiny');
            if (shinyPokemon.length > 0) {
                const randomShiny = shinyPokemon[Math.floor(Math.random() * shinyPokemon.length)];
                cards.push(randomShiny);
                continue;
            }
        }
        
        const rarityRolls = [
            'common', 'common', 'common', 'common', 'common',
            'uncommon', 'uncommon', 'uncommon',
            'rare', 'rare'
        ];
        
        if (Math.random() < 0.1) {
            rarityRolls.push('legendary');
        }
        const rarity = rarityRolls[Math.floor(Math.random() * rarityRolls.length)];
        const pokemonByRarity = pokemonData.filter(p => p.rarity === rarity);
        if (pokemonByRarity.length > 0) {
            const randomPokemon = pokemonByRarity[Math.floor(Math.random() * pokemonByRarity.length)];
            cards.push(randomPokemon);
        }
    }
    
    // Anticheat: Ensure we always return exactly 5 cards
    if (cards.length !== expectedCardCount) {
        console.warn('Invalid card count generated, regenerating...');
        return generatePackCards(); // Recursive call to regenerate
    }
    
    return cards;
}

export { openPack, generatePackCards };
