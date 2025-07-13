// Achievements data and logic
export const achievements = [
    {
        id: 'roll_50',
        name: 'Rolling Beginner',
        description: 'Roll 50 times',
        icon: '🎲',
        requirement: 50,
        reward: 2,
        type: 'rolls'
    },
    {
        id: 'roll_100',
        name: 'Rolling Enthusiast',
        description: 'Roll 100 times',
        icon: '🎯',
        requirement: 100,
        reward: 3,
        type: 'rolls'
    },
    {
        id: 'roll_200',
        name: 'Rolling Master',
        description: 'Roll 200 times',
        icon: '🏆',
        requirement: 200,
        reward: 5,
        type: 'rolls'
    },
    {
        id: 'roll_500',
        name: 'Rolling Legend',
        description: 'Roll 500 times',
        icon: '👑',
        requirement: 500,
        reward: 10,
        type: 'rolls'
    },
    {
        id: 'catch_100',
        name: 'Pokémon Collector',
        description: 'Catch 100 unique Pokémon',
        icon: '📚',
        requirement: 100,
        reward: 3,
        type: 'catches'
    },
    {
        id: 'catch_500',
        name: 'Pokémon Expert',
        description: 'Catch 500 unique Pokémon',
        icon: '📖',
        requirement: 500,
        reward: 5,
        type: 'catches'
    },
    {
        id: 'catch_1000',
        name: 'Pokémon Master',
        description: 'Catch 1000 unique Pokémon',
        icon: '📚',
        requirement: 1000,
        reward: 10,
        type: 'catches'
    },
    {
        id: 'shiny_10',
        name: 'Shiny Hunter',
        description: 'Catch 10 shiny Pokémon',
        icon: '✨',
        requirement: 10,
        reward: 5,
        type: 'shinies'
    },
    {
        id: 'shiny_50',
        name: 'Shiny Expert',
        description: 'Catch 50 shiny Pokémon',
        icon: '💎',
        requirement: 50,
        reward: 10,
        type: 'shinies'
    },
    {
        id: 'legendary_5',
        name: 'Legendary Hunter',
        description: 'Catch 5 legendary Pokémon',
        icon: '🌟',
        requirement: 5,
        reward: 5,
        type: 'legendaries'
    },
    {
        id: 'legendary_20',
        name: 'Legendary Master',
        description: 'Catch 20 legendary Pokémon',
        icon: '⭐',
        requirement: 20,
        reward: 10,
        type: 'legendaries'
    },
    {
        id: 'complete_dex',
        name: 'Keeper of the Dex',
        description: 'Catch all 1025 Pokémon',
        icon: '📖',
        requirement: 1025,
        reward: 50,
        type: 'complete_dex',
        title: 'Keeper of the Dex'
    },
    {
        id: 'complete_all',
        name: 'The Shimmering One',
        description: 'Catch all 2050 Pokémon (including shinies)',
        icon: '✨',
        requirement: 2050,
        reward: 100,
        type: 'complete_all',
        title: 'The Shimmering One'
    }
];

export function getAchievementProgress(userData) {
    const progress = {};
    
    achievements.forEach(achievement => {
        let current = 0;
        
        switch (achievement.type) {
            case 'rolls':
                current = userData.packsOpened || 0;
                break;
            case 'catches':
                current = Object.keys(userData.cardCounts || {}).filter(id => {
                    const count = userData.cardCounts[id] || 0;
                    return count > 0;
                }).length;
                break;
            case 'shinies':
                current = Object.keys(userData.cardCounts || {}).filter(id => {
                    const count = userData.cardCounts[id] || 0;
                    const pokemon = window.pokemonData?.find(p => p.id == id);
                    return count > 0 && pokemon && pokemon.rarity === 'shiny';
                }).length;
                break;
            case 'legendaries':
                current = Object.keys(userData.cardCounts || {}).filter(id => {
                    const count = userData.cardCounts[id] || 0;
                    const pokemon = window.pokemonData?.find(p => p.id == id);
                    return count > 0 && pokemon && pokemon.rarity === 'legendary';
                }).length;
                break;
            case 'complete_dex':
                // Count all unique Pokémon (excluding shinies)
                current = Object.keys(userData.cardCounts || {}).filter(id => {
                    const count = userData.cardCounts[id] || 0;
                    const pokemon = window.pokemonData?.find(p => p.id == id);
                    return count > 0 && pokemon && pokemon.rarity !== 'shiny';
                }).length;
                break;
            case 'complete_all':
                // Count all unique Pokémon (including shinies)
                current = Object.keys(userData.cardCounts || {}).filter(id => {
                    const count = userData.cardCounts[id] || 0;
                    return count > 0;
                }).length;
                break;
        }
        
        progress[achievement.id] = {
            current,
            completed: current >= achievement.requirement,
            claimed: userData.claimedAchievements?.includes(achievement.id) || false,
            readyToClaim: userData.completedAchievements?.includes(achievement.id) || false
        };
    });
    
    return progress;
}

export function checkAndAwardAchievements(userData, gameData, currentUser) {
    const progress = getAchievementProgress(userData);
    const newlyCompleted = [];
    
    achievements.forEach(achievement => {
        const achievementProgress = progress[achievement.id];
        
        if (achievementProgress.completed && !achievementProgress.claimed) {
            // Just mark as completed, don't award yet
            if (!userData.completedAchievements) {
                userData.completedAchievements = [];
            }
            if (!userData.completedAchievements.includes(achievement.id)) {
                userData.completedAchievements.push(achievement.id);
                newlyCompleted.push(achievement);
            }
        }
    });
    
    return newlyCompleted;
}

export function renderAchievements(gameData, currentUser) {
    const userData = gameData.users[currentUser];
    const progress = getAchievementProgress(userData);
    const achievementsGrid = document.getElementById('achievements-grid');
    
    if (!achievementsGrid) return;
    
    achievementsGrid.innerHTML = '';
    
    achievements.forEach(achievement => {
        const achievementProgress = progress[achievement.id];
        const isCompleted = achievementProgress.completed;
        const isClaimed = achievementProgress.claimed;
        const readyToClaim = achievementProgress.readyToClaim;
        const progressPercent = Math.min(100, (achievementProgress.current / achievement.requirement) * 100);
        
        const card = document.createElement('div');
        card.className = `achievement-card ${isCompleted ? 'completed' : ''} ${readyToClaim && !isClaimed ? 'ready-to-claim' : ''}`;
        
        let claimButton = '';
        if (readyToClaim && !isClaimed) {
            claimButton = `<button class="claim-btn" data-achievement="${achievement.id}" data-reward="${achievement.reward}">Claim ${achievement.reward} Rolls</button>`;
        } else if (isClaimed) {
            if (achievement.title) {
                const isEquipped = userData.equippedTitle === achievement.title;
                claimButton = `
                    <div class="claimed-badge">✓ Claimed</div>
                    <button class="equip-title-btn ${isEquipped ? 'equipped' : ''}" data-title="${achievement.title}">
                        ${isEquipped ? '✓ Equipped' : 'Equip Title'}
                    </button>
                `;
            } else {
            claimButton = `<div class="claimed-badge">✓ Claimed</div>`;
            }
        }
        
        card.innerHTML = `
            <div class="achievement-header">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <h3>${achievement.name}</h3>
                    <p>${achievement.description}</p>
                    <div class="reward">
                        <div class="reward-rolls">Reward: ${achievement.reward} rolls</div>
                        ${achievement.title ? `<div class="rewarded-title">Rewarded title: <span class="title-preview ${achievement.title === 'Keeper of the Dex' ? 'title-keeper' : 'title-shimmering'}">${achievement.title}</span></div>` : ''}
                    </div>
                </div>
            </div>
            <div class="achievement-progress">
                <div class="progress-bar-container">
                    <div class="achievement-progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <div class="achievement-progress-text">
                    ${isCompleted ? achievement.requirement : achievementProgress.current} / ${achievement.requirement}
                </div>
            </div>
            ${claimButton}
        `;
        
        achievementsGrid.appendChild(card);
        
        // Add event listener for claim button
        if (readyToClaim && !isClaimed) {
            const claimBtn = card.querySelector('.claim-btn');
            if (claimBtn) {
                claimBtn.addEventListener('click', () => {
                    claimAchievement(achievement.id, achievement.reward, gameData, currentUser);
                });
            }
        }
        
        // Add event listener for equip title button
        if (isClaimed && achievement.title) {
            const equipBtn = card.querySelector('.equip-title-btn');
            if (equipBtn) {
                equipBtn.addEventListener('click', () => {
                    equipTitle(achievement.title, gameData, currentUser);
                });
            }
        }
    });
}

export function claimAchievement(achievementId, reward, gameData, currentUser) {
    const userData = gameData.users[currentUser];
    
    if (!userData.claimedAchievements) {
        userData.claimedAchievements = [];
    }
    
    // Award the achievement
    userData.claimedAchievements.push(achievementId);
    
    // Award bonus rolls
    userData.coins = (userData.coins || 0) + reward;
    
    // Save the game data
    localStorage.setItem('pokeroller-data', JSON.stringify(gameData));
    
    // Update coin display
    const coinDisplay = document.getElementById('coin-display');
    if (coinDisplay) {
        coinDisplay.textContent = userData.coins;
    }
    
    // Update roll button state
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
    
    // Re-render achievements to show claimed state
    renderAchievements(gameData, currentUser);
    
    // Show success message
    const achievement = achievements.find(a => a.id === achievementId);
    if (achievement && achievement.title) {
        alert(`Achievement claimed! You earned ${reward} bonus rolls and the title "${achievement.title}"!`);
    } else {
    alert(`Achievement claimed! You earned ${reward} bonus rolls!`);
    }
}

export function equipTitle(title, gameData, currentUser) {
    const userData = gameData.users[currentUser];
    
    // Equip the title
    userData.equippedTitle = title;
    
    // Save the game data
    localStorage.setItem('pokeroller-data', JSON.stringify(gameData));
    
    // Re-render achievements to show equipped state
    renderAchievements(gameData, currentUser);
    
    // Show success message
    alert(`Title "${title}" equipped!`);
} 