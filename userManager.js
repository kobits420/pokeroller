import { STORAGE_KEYS, ELEMENT_IDS } from './config/gameConfig.js';
import { pokemonData } from './pokemonData.js';
import { initChat } from './chat.js';
import apiClient from './utils/apiClient.js';

// Game State
let currentUser = null;
let gameData = {
    users: {},
    pokemon: []
};

// Avatar selection state
let availableAvatars = [];
let selectedAvatar = null;

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
            
            // Initialize avatar if not set
            if (!user.avatar) {
                user.avatar = 'youngster.png'; // Default avatar
            }
            
            // Initialize coins if not set
            if (user.coins === undefined) {
                user.coins = 3;
                user.lastCoinTime = Date.now();
            }
            
            // Initialize level/xp if not set
            if (user.level === undefined) user.level = 1;
            if (user.xp === undefined) user.xp = 0;
            if (user.xpToNext === undefined) user.xpToNext = 25;
            
            // Anticheat: Validate and sanitize user data
            if (typeof user.coins !== 'number' || user.coins < 0) {
                console.warn('Invalid coin count detected, resetting to 3');
                user.coins = 3;
                user.lastCoinTime = Date.now();
            }
            
            if (typeof user.lastCoinTime !== 'number' || user.lastCoinTime > Date.now()) {
                console.warn('Invalid lastCoinTime detected, resetting');
                user.lastCoinTime = Date.now();
            }
            
            // Initialize lastLoginDate if not set
            if (!user.lastLoginDate) {
                console.log('Initializing lastLoginDate for user:', username);
                // Set to yesterday so they can claim today's bonus
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                user.lastLoginDate = yesterday.toDateString();
                console.log('Set lastLoginDate to yesterday:', user.lastLoginDate);
            }
            
            // Debug: Log the user's lastLoginDate
            console.log(`User ${username} lastLoginDate:`, user.lastLoginDate);
        }
    }
    
    // Always force refresh Pokemon data to ensure all 151 are loaded
    gameData.pokemon = pokemonData;
    
    // Save the updated data
    saveGameData();
    
    // Fix existing users who might have today's date incorrectly set
    fixExistingUsersLastLoginDate();
}

// Save game data to localStorage and backend
export async function saveGameData() {
    // Save to localStorage for immediate access
    localStorage.setItem(STORAGE_KEYS.GAME_DATA, JSON.stringify(gameData));
    
    // Also save to backend if user is logged in
    const token = localStorage.getItem('token') || localStorage.getItem('auth-token');
    if (token && currentUser) {
        try {
            await apiClient.saveGameProgress(gameData);
            console.log('Game data saved to backend successfully');
        } catch (error) {
            console.error('Failed to save game data to backend:', error);
            // Don't throw error - localStorage save is still successful
        }
    }
}

// Get current user
export function getCurrentUser() {
    return currentUser;
}

// Get game data
export function getGameData() {
    return gameData;
}

// Load available avatars from sprites/trainers directory
export async function loadAvailableAvatars() {
    try {
        // Load the trainer index to get all available sprites
        const response = await fetch('sprites/trainers/trainer-index.json');
        const trainerIndex = await response.json();
        
        // Extract all trainer sprite filenames from the index
        availableAvatars = Object.keys(trainerIndex.trainers).map(trainerKey => {
            const path = trainerIndex.trainers[trainerKey];
            return path.split('/').pop(); // Get just the filename
        });
        
        return availableAvatars;
    } catch (error) {
        console.error('Error loading avatars:', error);
        // Fallback to a basic list if the index fails to load
        availableAvatars = [
            'youngster.png', 'lass.png', 'hiker.png', 'beauty.png', 'pokemaniac.png',
            'gentleman.png', 'skier.png', 'school_kid.png', 'picnicker.png', 'fisherman.png',
            'swimmer_m.png', 'swimmer_f.png', 'sailor.png', 'super_nerd.png', 'guitarist.png',
            'black_belt.png', 'scientist.png', 'boarder.png', 'cooltrainer_m.png', 'cooltrainer_f.png',
            'bug_catcher.png', 'psychic.png', 'firebreather.png', 'pokefan_m.png', 'pokefan_f.png',
            'ruin_maniac.png', 'juggler.png', 'sage.png', 'medium.png', 'school_kid_f.png',
            'kimono_girl.png', 'twins.png', 'pokefan_f2.png', 'red.png', 'blue.png',
            'oak.png', 'youngster2.png', 'lass2.png', 'camper.png', 'picnicker2.png',
            'bug_catcher2.png', 'pokemaniac2.png', 'super_nerd2.png', 'hiker2.png', 'biker.png',
            'burglar.png', 'engineer.png', 'couple.png', 'fisherman2.png', 'swimmer_m2.png',
            'swimmer_f2.png', 'sailor2.png', 'scientist2.png', 'boarder2.png', 'cooltrainer_m2.png',
            'cooltrainer_f2.png', 'bug_catcher2.png', 'psychic2.png', 'firebreather2.png',
            'pokefan_m2.png', 'pokefan_f2.png', 'ruin_maniac2.png', 'juggler2.png', 'sage2.png',
            'medium2.png', 'school_kid_f2.png', 'kimono_girl2.png', 'twins2.png', 'pokefan_f3.png'
        ];
        return availableAvatars;
    }
}

// Get available avatars
export function getAvailableAvatars() {
    return availableAvatars;
}

// Set selected avatar
export function setSelectedAvatar(avatar) {
    selectedAvatar = avatar;
}

// Get selected avatar
export function getSelectedAvatar() {
    return selectedAvatar;
}

// Check and give daily login bonus
export function checkDailyLoginBonus(userData) {
    const today = new Date().toDateString();
    
    console.log('Checking daily login bonus...');
    console.log('Today:', today);
    console.log('Last login date:', userData.lastLoginDate);
    console.log('User coins before check:', userData.coins);
    
    // If this is the first login of the day
    if (userData.lastLoginDate !== today) {
        console.log('Daily bonus eligible! Giving bonus...');
        console.log('Previous coins:', userData.coins);
        const bonusCoins = 2;
        userData.coins += bonusCoins;
        userData.lastLoginDate = today;
        console.log('New coins:', userData.coins);
        console.log('Updated lastLoginDate:', userData.lastLoginDate);
        
        // Ensure we don't exceed the 24 coin limit
        const maxCoins = 24;
        if (userData.coins > maxCoins) {
            userData.coins = maxCoins;
        }
        
        console.log('User coins after bonus:', userData.coins);
        saveGameData();
        
        // Show bonus notification
        showDailyBonusNotification(bonusCoins);
        
        return true; // Bonus was given
    } else {
        console.log('Daily bonus already claimed today');
    }
    
    return false; // No bonus given
}

// Debug function to reset daily login bonus (for testing)
export function resetDailyLoginBonus() {
    if (!currentUser) return;
    
    const userData = gameData.users[currentUser];
    userData.lastLoginDate = null;
    saveGameData();
    console.log('Daily login bonus reset for testing');
}

// Fix existing users who have today's date set as lastLoginDate
export function fixExistingUsersLastLoginDate() {
    const today = new Date().toDateString();
    let fixedCount = 0;
    
    Object.keys(gameData.users).forEach(username => {
        const user = gameData.users[username];
        if (user.lastLoginDate === today) {
            // Set to yesterday so they can claim today's bonus
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            user.lastLoginDate = yesterday.toDateString();
            fixedCount++;
            console.log(`Fixed lastLoginDate for user: ${username}`);
        }
    });
    
    if (fixedCount > 0) {
        saveGameData();
        console.log(`Fixed ${fixedCount} users' lastLoginDate`);
    }
    
    return fixedCount;
}

// Show daily bonus notification
function showDailyBonusNotification(bonusCoins) {
    // Create background overlay
    const overlay = document.createElement('div');
    overlay.className = 'daily-bonus-overlay';
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'daily-bonus-notification';
    notification.innerHTML = `
        <div class="bonus-content">
            <span class="bonus-icon">🎁</span>
            <span class="bonus-text">Daily Login Bonus!</span>
            <span class="bonus-coins">+${bonusCoins} 🪙</span>
        </div>
    `;
    
    // Add overlay and notification to page
    document.body.appendChild(overlay);
    document.body.appendChild(notification);

    // Click-to-skip handler
    function removeBonusElements() {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (notification.parentNode) notification.parentNode.removeChild(notification);
        document.removeEventListener('mousedown', removeBonusElements, true);
        overlay.removeEventListener('mousedown', removeBonusElements, true);
        notification.removeEventListener('mousedown', removeBonusElements, true);
    }
    overlay.addEventListener('mousedown', removeBonusElements, true);
    notification.addEventListener('mousedown', removeBonusElements, true);
    document.addEventListener('mousedown', removeBonusElements, true);

    // Remove after 4 seconds (slightly longer for the more prominent display)
    setTimeout(removeBonusElements, 4000);
}

// Handle login
export async function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }

    try {
        const data = await apiClient.login(username, password);
                    // Store JWT token
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('auth-token', data.token); // Also store as auth-token for consistency
            
            // Set current user
            currentUser = data.user.username;
            
            // Load game data from backend
            try {
                const gameProgress = await apiClient.getGameProgress();
                console.log('Backend game progress:', gameProgress);
                
                if (gameProgress && gameProgress.user) {
                    // Use backend data as the source of truth
                    const backendUserData = gameProgress.user;
                    
                    // Initialize or update user data with backend data
                    gameData.users[currentUser] = {
                        username: backendUserData.username || data.user.username,
                        avatar: backendUserData.avatar || 'youngster.png',
                        coins: backendUserData.coins || 3,
                        lastCoinTime: backendUserData.lastCoinTime || Date.now(),
                        lastLoginDate: backendUserData.lastLoginDate || new Date().toDateString(),
                        level: backendUserData.level || 1,
                        xp: backendUserData.xp || 0,
                        xpToNext: backendUserData.xpToNext || 25,
                        cardCounts: backendUserData.cardCounts || {},
                        packsOpened: backendUserData.packsOpened || 0,
                        cardsCollected: backendUserData.cardsCollected || 0,
                        claimedAchievements: backendUserData.claimedAchievements || [],
                        completedAchievements: backendUserData.completedAchievements || [],
                        equippedTitle: backendUserData.equippedTitle || null,
                        favorites: backendUserData.favorites || [],
                        inventory: backendUserData.inventory || {},
                        recentCatches: backendUserData.recentCatches || []
                    };
                    
                    console.log('Game data loaded from backend successfully');
                    console.log('User data after backend load:', gameData.users[currentUser]);
                } else {
                    // Fallback to local data if backend doesn't have data
                    if (!gameData.users[currentUser]) {
                        gameData.users[currentUser] = {
                            username: data.user.username,
                            avatar: data.user.avatar || 'youngster.png',
                            coins: data.user.coins || 3,
                            lastCoinTime: data.user.lastCoinTime || Date.now(),
                            lastLoginDate: data.user.lastLoginDate || new Date().toDateString(),
                            level: data.user.level || 1,
                            xp: data.user.xp || 0,
                            xpToNext: data.user.xpToNext || 25,
                            cardCounts: data.user.cardCounts || {},
                            packsOpened: data.user.packsOpened || 0,
                            cardsCollected: data.user.cardsCollected || 0,
                            claimedAchievements: data.user.claimedAchievements || [],
                            completedAchievements: data.user.completedAchievements || [],
                            equippedTitle: data.user.equippedTitle || null,
                            favorites: data.user.favorites || [],
                            inventory: data.user.inventory || {},
                            recentCatches: data.user.recentCatches || []
                        };
                    }
                }
            } catch (error) {
                console.error('Failed to load game data from backend:', error);
                // Fallback to local data if backend fails
                if (!gameData.users[currentUser]) {
                    gameData.users[currentUser] = {
                        username: data.user.username,
                        avatar: data.user.avatar || 'youngster.png',
                        coins: data.user.coins || 3,
                        lastCoinTime: data.user.lastCoinTime || Date.now(),
                        lastLoginDate: data.user.lastLoginDate || new Date().toDateString(),
                        level: data.user.level || 1,
                        xp: data.user.xp || 0,
                        xpToNext: data.user.xpToNext || 25,
                        cardCounts: data.user.cardCounts || {},
                        packsOpened: data.user.packsOpened || 0,
                        cardsCollected: data.user.cardsCollected || 0,
                        claimedAchievements: data.user.claimedAchievements || [],
                        completedAchievements: data.user.completedAchievements || [],
                        equippedTitle: data.user.equippedTitle || null,
                        favorites: data.user.favorites || [],
                        inventory: data.user.inventory || {},
                        recentCatches: data.user.recentCatches || []
                    };
                }
            }
            
            // Save the loaded data to localStorage (but don't overwrite backend data)
            localStorage.setItem(STORAGE_KEYS.GAME_DATA, JSON.stringify(gameData));
            showScreen(ELEMENT_IDS.GAME_SCREEN);
            updateGameUI();
        }
    } catch (error) {
        alert('Network error');
        console.error('Login network error:', error);
    }
}

export async function handleRegister() {
    console.log('handleRegister function called');
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    console.log('Register attempt for username:', username);
    
    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }

    // Send registration request to backend
    try {
        const data = await apiClient.register(username, password);
            // Show success message
            const successElement = document.getElementById('registration-success');
            if (successElement) {
                successElement.classList.remove('hidden');
                console.log('Success message shown');
                setTimeout(() => {
                    successElement.classList.add('hidden');
                    console.log('Success message auto-hidden');
                }, 4000);
            }
            // Clear the form fields manually
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            selectedAvatar = null;
    } catch (error) {
        // Show error message
        const errorElement = document.getElementById('registration-error');
        const successElement = document.getElementById('registration-success');
        if (successElement) successElement.classList.add('hidden');
        if (errorElement) {
            errorElement.classList.remove('hidden');
            errorElement.querySelector('.error-text').textContent = 'Network error';
            setTimeout(() => {
                errorElement.classList.add('hidden');
            }, 4000);
        }
        console.error('Registration network error:', error);
    }
}

// Handle logout
export function handleLogout() {
    localStorage.removeItem('token');
    currentUser = null;
    selectedAvatar = null;
    // Reset pack opening state when logging out
    if (window.resetPackOpeningState) {
        window.resetPackOpeningState();
    }
    showScreen(ELEMENT_IDS.LOGIN_SCREEN);
    clearLoginForm();
}

// Clear login form
export function clearLoginForm() {
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    // Hide all registration messages when clearing form
    hideAllRegistrationMessages();
}

// Hide registration success message
export function hideRegistrationSuccess() {
    const successElement = document.getElementById('registration-success');
    if (successElement) {
        successElement.classList.add('hidden');
        console.log('Registration success message hidden');
    } else {
        console.log('Success element not found when trying to hide');
    }
}

// Hide registration error message
export function hideRegistrationError() {
    const errorElement = document.getElementById('registration-error');
    if (errorElement) {
        errorElement.classList.add('hidden');
        console.log('Registration error message hidden');
    } else {
        console.log('Error element not found when trying to hide');
    }
}

// Hide all registration messages
export function hideAllRegistrationMessages() {
    hideRegistrationSuccess();
    hideRegistrationError();
}

// Calculate coins based on time passed
export function calculateCoins(userData) {
    const now = Date.now();
    const timePassed = now - userData.lastCoinTime;
    const hoursPassed = timePassed / (1000 * 60 * 60); // Convert to hours
    
    // Anticheat: Prevent time manipulation
    if (timePassed < 0) {
        console.warn('Time manipulation detected, resetting lastCoinTime');
        userData.lastCoinTime = now;
        saveGameData();
        return userData.coins;
    }
    
    // Anticheat: Limit maximum coins that can be gained at once (prevent massive time jumps)
    const maxHoursGain = 24; // Max 24 hours worth of coins at once
    const actualHoursPassed = Math.min(hoursPassed, maxHoursGain);
    
    if (actualHoursPassed >= 1) {
        const coinsToAdd = Math.floor(actualHoursPassed);
        userData.coins += coinsToAdd;
        userData.lastCoinTime = now - (timePassed % (1000 * 60 * 60)); // Keep remainder
        saveGameData();
    }
    
    // Anticheat: Cap maximum coins to prevent overflow
    const maxCoins = 24;
    if (userData.coins > maxCoins) {
        userData.coins = maxCoins;
        saveGameData();
    }
    
    return userData.coins;
}

// Update user display with avatar
export function updateUserDisplay() {
    if (!currentUser) return;
    
    const userData = gameData.users[currentUser];
    const usernameDisplay = document.getElementById('username-display');
    const avatarContainer = document.getElementById('user-avatar');
    const titleDisplay = document.getElementById('user-title-display');
    
    console.log('updateUserDisplay called for user:', currentUser, 'avatar:', userData.avatar);
    console.log('Found avatarContainer:', avatarContainer);
    
    if (usernameDisplay) {
        usernameDisplay.textContent = currentUser;
    }
    
    if (avatarContainer) {
        avatarContainer.innerHTML = '';
        const avatarImg = document.createElement('img');
        avatarImg.src = `sprites/trainers/${userData.avatar}`;
        avatarImg.alt = 'User Avatar';
        avatarImg.className = 'user-avatar-img';
        avatarImg.onerror = function() {
            // Fallback to default avatar if image fails to load
            this.src = 'sprites/trainers/youngster.png';
        };
        avatarContainer.appendChild(avatarImg);
        
        // Force a reflow to ensure the image updates
        avatarContainer.offsetHeight;
        
        console.log('Avatar image set to:', avatarImg.src);
    } else {
        console.log('Avatar container not found!');
    }
    
    // Update title display
    if (titleDisplay) {
        titleDisplay.innerHTML = '';
        if (userData.equippedTitle) {
            const titleElement = document.createElement('div');
            titleElement.textContent = userData.equippedTitle;
            
            if (userData.equippedTitle === 'Keeper of the Dex') {
                titleElement.className = 'title-keeper';
            } else if (userData.equippedTitle === 'The Shimmering One') {
                titleElement.className = 'title-shimmering';
            }
            
            titleDisplay.appendChild(titleElement);
        }
    }
}

// Show avatar selection modal
export function showAvatarSelection() {
    // Set selectedAvatar to current user's avatar if not already set
    if (!selectedAvatar && currentUser) {
        selectedAvatar = gameData.users[currentUser].avatar || 'youngster.png';
    }
    
    const modal = document.createElement('div');
    modal.className = 'avatar-modal';
    modal.innerHTML = `
        <div class="avatar-modal-content">
            <div class="avatar-modal-header">
                <h3>Choose Your Trainer Avatar</h3>
                <button class="close-btn" onclick="this.closest('.avatar-modal').remove()">&times;</button>
            </div>
            <div class="avatar-grid">
                ${availableAvatars.map(avatar => `
                    <div class="avatar-option ${selectedAvatar === avatar ? 'selected' : ''}" 
                         onclick="window.userManager.selectAvatar('${avatar}', this)">
                        <img src="sprites/trainers/${avatar}" alt="Trainer Avatar" 
                             onerror="this.src='sprites/trainers/youngster.png'">
                    </div>
                `).join('')}
            </div>
            <div class="avatar-modal-footer">
                <button class="pokemon-btn" onclick="window.userManager.confirmAvatarSelection()" style="display: ${selectedAvatar ? 'block' : 'none'};">Confirm Selection</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add click outside to close
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Select avatar
export function selectAvatar(avatar, element) {
    selectedAvatar = avatar;
    
    // Update visual selection
    document.querySelectorAll('.avatar-option').forEach(option => {
        option.classList.remove('selected');
    });
    element.classList.add('selected');
    
    // Show confirm button when an avatar is selected
    const confirmBtn = document.querySelector('.avatar-modal-footer .pokemon-btn');
    if (confirmBtn) {
        confirmBtn.style.display = 'block';
        confirmBtn.textContent = 'Confirm Selection';
    }
}

// Update user's avatar
export function updateUserAvatar(avatar) {
    if (!currentUser) return;
    
    console.log('Updating avatar for user:', currentUser, 'to:', avatar);
    gameData.users[currentUser].avatar = avatar;
    saveGameData();
    updateUserDisplay();
}

// Confirm avatar selection
export function confirmAvatarSelection() {
    if (selectedAvatar && currentUser) {
        console.log('Confirming avatar selection:', selectedAvatar, 'for user:', currentUser);
        // Update the user's avatar immediately
        gameData.users[currentUser].avatar = selectedAvatar;
        saveGameData();
        updateUserDisplay();
        
        // Force a re-render of the avatar display
        setTimeout(() => {
            updateUserDisplay();
        }, 100);
    }
    
    // Close the modal
    const modal = document.querySelector('.avatar-modal');
    if (modal) {
        modal.remove();
    }
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
            import('./utils/floatingPokemon.js').then(module => {
                module.startFloatingPokemon();
            });
        }, 50);
    } else {
        // Import and call stopFloatingPokemon dynamically to avoid circular dependency
        import('./utils/floatingPokemon.js').then(module => {
            module.stopFloatingPokemon();
        });
    }
    
    // Chat UI logic
    const chatWindow = document.getElementById('chat-window');
    const chatToggle = document.getElementById('chat-toggle');
    if (chatWindow && chatToggle) {
        if (screenId === ELEMENT_IDS.GAME_SCREEN) {
            chatWindow.classList.add('hidden');
            chatToggle.classList.remove('hidden');
            initChat();
        } else {
            chatWindow.classList.add('hidden');
            chatToggle.classList.add('hidden');
        }
    }
    // Special handling for game screen
    if (screenId === ELEMENT_IDS.GAME_SCREEN) {
        updateGameUI();
        updateUserDisplay();
    } else if (screenId === ELEMENT_IDS.POKEDEX_SCREEN) {
        // Import and call renderPokedex dynamically to avoid circular dependency
        import('./uiHandlers.js').then(module => {
            module.renderPokedex(getGameData(), getCurrentUser());
        });
    }
}

// Update coin display
export function updateCoinDisplay() {
    if (!currentUser) return;
    const userData = gameData.users[currentUser];
    
    // Calculate coins based on time passed
    const currentCoins = calculateCoins(userData);
    
    // Update coin display
    const coinDisplay = document.getElementById('coin-display');
    if (coinDisplay) {
        coinDisplay.textContent = currentCoins;
    }
    
    // Update roll button state
    const rollBtn = document.getElementById('roll-btn');
    if (rollBtn) {
        if (currentCoins < 1) {
            rollBtn.disabled = true;
            rollBtn.classList.add('disabled');
        } else {
            rollBtn.disabled = false;
            rollBtn.classList.remove('disabled');
        }
    }
}

// Update game UI
export function updateGameUI() {
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
    
    document.getElementById(ELEMENT_IDS.CAUGHT_COUNT).textContent = uniqueCount;
    document.getElementById(ELEMENT_IDS.TOTAL_COUNT).textContent = totalCount;
    document.getElementById(ELEMENT_IDS.PACKS_OPENED).textContent = userData.packsOpened;
    document.getElementById(ELEMENT_IDS.CARDS_COLLECTED).textContent = userData.cardsCollected;
    const progressPercentage = (uniqueCount / totalCount) * 100;
    document.getElementById(ELEMENT_IDS.PROGRESS_FILL).style.width = progressPercentage + '%';
    
    // Update rarity breakdown
    updateRarityBreakdown(userData);
    // Force update of recent catches immediately
    updateRecentCatches(userData);
    // Force a re-render after a small delay to ensure visual update
    setTimeout(() => {
        updateRecentCatches(userData);
    }, 100);
        
    // Update coin display
    updateCoinDisplay();

    // Update level and XP bar
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
}

// Update recent catches display
export function updateRecentCatches(userData) {
    const recentCatchesContainer = document.getElementById('recent-catches');
    const newOnlyToggle = document.getElementById('new-only-toggle');
    
    if (!recentCatchesContainer) return;
    
    recentCatchesContainer.innerHTML = '';
    
    // Filter catches based on toggle
    let catchesToShow;
    if (newOnlyToggle && newOnlyToggle.checked) {
        catchesToShow = userData.recentCatches.filter(pokemon => pokemon.wasNew).slice(0, 10);
        console.log('New Only mode - showing:', catchesToShow.length, 'new catches');
    } else {
        catchesToShow = userData.recentCatches.slice(0, 10);
        console.log('All catches mode - showing:', catchesToShow.length, 'catches');
        console.log('Recent catches available:', userData.recentCatches.length);
    }
    
    catchesToShow.forEach(pokemon => {
        const currentCount = userData.cardCounts[pokemon.id] || 0;
        const catchEl = document.createElement('div');
        catchEl.className = 'recent-catch';
        if (pokemon.wasNew) {
            catchEl.classList.add('new-catch');
        }
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

// Initialize user manager
export async function initUserManager() {
    await loadAvailableAvatars();
    loadGameData();
}

// Make functions available globally for event handlers
window.userManager = {
    handleLogin,
    handleRegister,
    handleLogout,
    showAvatarSelection,
    selectAvatar,
    updateUserAvatar,
    confirmAvatarSelection,
    toggleRarityBreakdown
}; 