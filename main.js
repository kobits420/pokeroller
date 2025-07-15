document.addEventListener('DOMContentLoaded', init);

import { pokemonData } from './pokemonData.js';
import { openPack, generatePackCards } from './gameLogic.js';

// Make pokemonData available globally for achievements
window.pokemonData = pokemonData;
import {
    displayPackCards,
    openAnotherPack,
    updateGameUI,
    renderPokedex,
    filterPokedex,
    displayPackCardsOverlay,
    closeCardOverlay
} from './uiHandlers.js';
import { ELEMENT_IDS } from './config/gameConfig.js';
import {
    initUserManager,
    loadGameData,
    saveGameData,
    getCurrentUser,
    getGameData,
    handleLogin,
    handleRegister,
    handleLogout,
    showScreen,
    updateUserDisplay
} from './userManager.js';
import {
    setupAudioPlayer,
    setupMusicControl,
    startMusic,
    toggleMusic
} from './utils/audioManager.js';
import * as friendsManager from './friendsManager.js';
import { initChat } from './chat.js';


let isPackOpening = false;
let currentFriendsToken = null;
let unseenFriendRequests = 0;
let friendRequestPollInterval = null;
let notificationPollInterval = null;

function showFriendsNotificationBadge(show) {
    const badge = document.getElementById('friends-notification-badge');
    if (badge) {
        badge.classList.toggle('hidden', !show);
    }
}

async function pollFriendRequests() {
    const userToken = localStorage.getItem('token') || localStorage.getItem('auth-token');
    if (!userToken) return;
    try {
        const res = await friendsManager.fetchFriendRequests(userToken);
        if (res.friendRequests && res.friendRequests.length > 0) {
            unseenFriendRequests = res.friendRequests.length;
            showFriendsNotificationBadge(true);
        } else {
            unseenFriendRequests = 0;
            showFriendsNotificationBadge(false);
        }
    } catch (e) {
        // Ignore errors
    }
}

function startFriendRequestPolling() {
    if (friendRequestPollInterval) clearInterval(friendRequestPollInterval);
    pollFriendRequests();
    friendRequestPollInterval = setInterval(pollFriendRequests, 10000);
}

function stopFriendRequestPolling() {
    if (friendRequestPollInterval) clearInterval(friendRequestPollInterval);
    friendRequestPollInterval = null;
}

function showNotificationPopup(message) {
    // Simple popup, can be styled further
    const popup = document.createElement('div');
    popup.className = 'notification-popup';
    popup.textContent = message;
    document.body.appendChild(popup);
    setTimeout(() => {
        popup.classList.add('fade-out');
        setTimeout(() => popup.remove(), 1000);
    }, 3000);
}

async function pollNotifications() {
    const userToken = localStorage.getItem('token') || localStorage.getItem('auth-token');
    if (!userToken) return;
    try {
        const res = await friendsManager.fetchNotifications(userToken);
        if (res.notifications && res.notifications.length > 0) {
            res.notifications.forEach(msg => showNotificationPopup(msg));
        }
    } catch (e) {
        // Ignore errors
    }
}

function startNotificationPolling() {
    if (notificationPollInterval) clearInterval(notificationPollInterval);
    pollNotifications();
    notificationPollInterval = setInterval(pollNotifications, 10000);
}

function stopNotificationPolling() {
    if (notificationPollInterval) clearInterval(notificationPollInterval);
    notificationPollInterval = null;
}

// Start notification polling when the app loads
startNotificationPolling();

function resetPackOpeningState() {
    isPackOpening = false;
}

function handleFirstUserInteraction() {
    startMusic();
    document.removeEventListener('click', handleFirstUserInteraction);
}

async function init() {
    await initUserManager();
    setupEventListeners();
    showScreen(ELEMENT_IDS.LOGIN_SCREEN);
    
    setupAudioPlayer();
    document.addEventListener('click', handleFirstUserInteraction);
    setupMusicControl();
    
    populateShop();

}

function setupEventListeners() {
    console.log('Setting up event listeners');
    document.getElementById(ELEMENT_IDS.LOGIN_BTN).addEventListener('click', handleLogin);
    document.getElementById(ELEMENT_IDS.REGISTER_BTN).addEventListener('click', handleRegister);
    document.getElementById(ELEMENT_IDS.LOGOUT_BTN).addEventListener('click', handleLogout);
    
    // Hide registration success message when user starts typing
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    if (usernameInput) {
        usernameInput.addEventListener('input', () => {
            import('./userManager.js').then(module => {
                module.hideAllRegistrationMessages();
            });
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            import('./userManager.js').then(module => {
                module.hideAllRegistrationMessages();
            });
        });
    }
    
    const avatarSelectBtn = document.getElementById('avatar-select-btn');
    if (avatarSelectBtn) {
        avatarSelectBtn.addEventListener('click', () => {
            import('./userManager.js').then(module => {
                module.showAvatarSelection();
            });
        });
    }
    
    const adminAddCoinBtn = document.getElementById('admin-add-coin-btn');
    if (adminAddCoinBtn) {
        adminAddCoinBtn.addEventListener('click', () => {
            const currentUser = getCurrentUser();
            if (currentUser) {
                const gameData = getGameData();
                const userData = gameData.users[currentUser];
                if (userData) {
                    userData.coins += 1;
                    
                    const coinDisplay = document.getElementById('coin-display');
                    if (coinDisplay) {
                        coinDisplay.textContent = userData.coins;
                    }
                    
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
                    
                    import('./userManager.js').then(module => {
                        module.saveGameData();
                    });
                    
                    console.log('Admin: Added 1 coin. New balance:', userData.coins);
                }
            }
        });
    }
    
    setupRollButtonListeners();
    
    const continueBtn = document.getElementById(ELEMENT_IDS.CONTINUE_BTN);
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            closeCardOverlay();
        });
    }
    
    const openAnotherBtn = document.getElementById('open-another-btn');
    if (openAnotherBtn) {
        openAnotherBtn.addEventListener('click', () => {
            openAnotherPack();
            if (rollBtn) rollBtn.style.display = 'block';
            resetPackOpeningState();
        });
    }
    document.getElementById('view-pokedex-btn').addEventListener('click', () => {
        showScreen('pokedex-screen');
        // Set generation filter to 'all' and trigger filter
        const genFilter = document.getElementById('generation-filter');
        if (genFilter) {
            genFilter.value = 'all';
        }
        filterPokedex(getGameData(), getCurrentUser());
    });
    document.getElementById('back-to-game-btn').addEventListener('click', () => showScreen('game-screen'));
    
    document.getElementById('shop-btn').addEventListener('click', () => {
        showScreen('shop-screen');
        populateShop(); // Populate shop when the shop screen is shown
    });
    document.getElementById('back-to-game-from-shop-btn').addEventListener('click', () => showScreen('game-screen'));
    
    // Add shop category filtering
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            // Filter items
            const category = btn.getAttribute('data-category');
            filterShopItems(category);
        });
    });
    
    document.getElementById('inventory-btn').addEventListener('click', () => {
        showScreen('inventory-screen');
        updateInventoryDisplay();
    });
    document.getElementById('back-to-game-from-inventory-btn').addEventListener('click', () => showScreen('game-screen'));
    
    document.getElementById('achievements-btn').addEventListener('click', () => {
        showScreen('achievements-screen');
        import('./achievements.js').then(module => {
            module.renderAchievements(getGameData(), getCurrentUser());
        });
    });
    document.getElementById('back-to-game-from-achievements-btn').addEventListener('click', () => showScreen('game-screen'));
    
    // Feedback button
    document.getElementById('feedback-btn').addEventListener('click', () => {
        showScreen('feedback-screen');
    });
    document.getElementById('back-to-game-from-feedback-btn').addEventListener('click', () => showScreen('game-screen'));
    
    // Feedback form submission
    document.getElementById('feedback-form').addEventListener('submit', handleFeedbackSubmission);
    
    document.getElementById(ELEMENT_IDS.SEARCH_POKEMON).addEventListener('input', () => filterPokedex(getGameData(), getCurrentUser()));
    document.getElementById(ELEMENT_IDS.GENERATION_FILTER).addEventListener('change', () => filterPokedex(getGameData(), getCurrentUser()));
    document.getElementById(ELEMENT_IDS.RARITY_FILTER).addEventListener('change', () => filterPokedex(getGameData(), getCurrentUser()));
    document.getElementById(ELEMENT_IDS.SHOW_CAUGHT_ONLY).addEventListener('change', () => filterPokedex(getGameData(), getCurrentUser()));
    document.getElementById(ELEMENT_IDS.SHOW_FAVORITES_ONLY).addEventListener('change', () => filterPokedex(getGameData(), getCurrentUser()));
    
    document.getElementById('cards-collected-card').addEventListener('click', () => {
        import('./userManager.js').then(module => {
            module.toggleRarityBreakdown();
        });
    });
    
    const newOnlyToggle = document.getElementById('new-only-toggle');
    if (newOnlyToggle) {
        newOnlyToggle.addEventListener('change', () => {
            import('./userManager.js').then(module => {
                const userData = getGameData().users[getCurrentUser()];
                if (userData) {
                    module.updateRecentCatches(userData);
                }
            });
        });
    }
    
    setInterval(() => {
        if (getCurrentUser()) {
            import('./userManager.js').then(module => {
                module.updateCoinDisplay();
            });
        }
    }, 60000);
    
    const excludeShiniesToggle = document.getElementById('exclude-shinies-toggle');
    if (excludeShiniesToggle) {
        excludeShiniesToggle.addEventListener('change', () => {
            import('./userManager.js').then(module => {
                module.updateGameUI();
            });
        });
    }
    
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const category = btn.getAttribute('data-category');
            filterShopItems(category);
        });
    });
    
    const inventoryCategoryBtns = document.querySelectorAll('.inventory-category-btn');
    inventoryCategoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            inventoryCategoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const category = btn.getAttribute('data-category');
            filterInventoryItems(category);
        });
    });
    
    const buyBtns = document.querySelectorAll('.buy-btn');
    buyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const itemName = btn.getAttribute('data-item');
            const price = parseInt(btn.getAttribute('data-price'));
            handleShopPurchase(itemName, price);
        });
    });
    
    document.getElementById('username').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('Enter pressed in username field');
            handleLogin();
        }
    });
    document.getElementById('password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('Enter pressed in password field');
            handleLogin();
        }
    });
    
    const hoverSound = document.getElementById('button-hover-sound');
    const rollHoverSound = document.getElementById('roll-hover-sound');
    const rollBtn = document.getElementById(ELEMENT_IDS.ROLL_BTN);
    document.addEventListener('mouseover', (e) => {
        if (e.target.tagName === 'BUTTON' && e.target !== rollBtn) {
            if (hoverSound) {
                hoverSound.currentTime = 0;
                hoverSound.play();
            }
        }
    });
    if (rollBtn && rollHoverSound) {
        rollBtn.addEventListener('mouseover', () => {
            rollHoverSound.loop = true;
            rollHoverSound.currentTime = 0;
            rollHoverSound.play();
        });
        rollBtn.addEventListener('mouseleave', () => {
            rollHoverSound.loop = false;
            rollHoverSound.pause();
            rollHoverSound.currentTime = 0;
        });
    }

    // Friends modal logic
    const friendsBtn = document.getElementById('friends-btn');
    const friendsModal = document.getElementById('friends-modal');
    const closeFriendsModal = document.getElementById('close-friends-modal');
    const addFriendBtn = document.getElementById('add-friend-btn');
    const addFriendUsername = document.getElementById('add-friend-username');
    const addFriendMessage = document.getElementById('add-friend-message');
    const friendsList = document.getElementById('friends-list');
    const friendRequestsList = document.getElementById('friend-requests-list');

    if (friendsBtn && friendsModal && closeFriendsModal) {
        console.log('Friends button found, setting up event listener');
        friendsBtn.addEventListener('click', async () => {
            console.log('Friends button clicked');
            // Get token dynamically in case it was just set during login
            const userToken = localStorage.getItem('token') || localStorage.getItem('auth-token');
            currentFriendsToken = userToken;
            console.log('User token:', userToken);
            if (!userToken) {
                console.error('No user token found');
                alert('Please log in to use friends functionality');
                return;
            }
            friendsModal.classList.remove('hidden');
            showFriendsNotificationBadge(false); // Clear badge when modal is opened
            await renderFriendsUI(userToken);
            stopFriendRequestPolling(); // Stop polling while modal is open
        });
        closeFriendsModal.addEventListener('click', () => {
            friendsModal.classList.add('hidden');
            startFriendRequestPolling(); // Resume polling when modal is closed
        });
        // Start polling when the app loads
        startFriendRequestPolling();
    } else {
        console.error('Friends elements not found:', {
            friendsBtn: !!friendsBtn,
            friendsModal: !!friendsModal,
            closeFriendsModal: !!closeFriendsModal
        });
    }

    if (addFriendBtn && addFriendUsername) {
        console.log('Add friend button found, setting up event listener');
        addFriendBtn.addEventListener('click', async () => {
            console.log('Add friend button clicked');
            const username = addFriendUsername.value.trim();
            if (!username) {
                console.log('No username entered');
                return;
            }
            console.log('Sending friend request for username:', username);
            addFriendBtn.disabled = true;
            addFriendMessage.textContent = '';
            try {
                const res = await friendsManager.sendFriendRequest(username, currentFriendsToken);
                console.log('Friend request response:', res);
                addFriendMessage.textContent = res.message || res.error || '';
                addFriendBtn.disabled = false;
                addFriendUsername.value = '';
                await renderFriendsUI(currentFriendsToken);
            } catch (error) {
                console.error('Error sending friend request:', error);
                addFriendMessage.textContent = 'Error sending friend request';
                addFriendBtn.disabled = false;
            }
        });
    } else {
        console.error('Add friend elements not found:', {
            addFriendBtn: !!addFriendBtn,
            addFriendUsername: !!addFriendUsername
        });
    }

    async function renderFriendsUI(userToken) {
        console.log('Rendering friends UI with token:', userToken);
        try {
            // Fetch and display friends
            const friendsRes = await friendsManager.fetchFriends(userToken);
            console.log('Friends response:', friendsRes);
            friendsList.innerHTML = '';
            (friendsRes.friends || []).forEach(friend => {
            const li = document.createElement('li');
            li.textContent = friend.username;
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.onclick = async () => {
                await friendsManager.removeFriend(friend._id, userToken);
                await renderFriendsUI(userToken);
            };
            li.appendChild(removeBtn);
            friendsList.appendChild(li);
        });
        // Fetch and display friend requests
        const requestsRes = await friendsManager.fetchFriendRequests(userToken);
        friendRequestsList.innerHTML = '';
        (requestsRes.friendRequests || []).forEach(request => {
            const li = document.createElement('li');
            li.textContent = request.username;
            const acceptBtn = document.createElement('button');
            acceptBtn.textContent = 'Accept';
            acceptBtn.onclick = async () => {
                await friendsManager.acceptFriendRequest(request._id, userToken);
                await renderFriendsUI(userToken);
            };
            const declineBtn = document.createElement('button');
            declineBtn.textContent = 'Decline';
            declineBtn.onclick = async () => {
                await friendsManager.declineFriendRequest(request._id, userToken);
                await renderFriendsUI(userToken);
            };
            li.appendChild(acceptBtn);
            li.appendChild(declineBtn);
            friendRequestsList.appendChild(li);
        });
        } catch (error) {
            console.error('Error rendering friends UI:', error);
        }
    }
}

function setupRollButtonListeners() {
    const rollBtn = document.getElementById(ELEMENT_IDS.ROLL_BTN);
    if (rollBtn) {
        rollBtn.innerHTML = '<span class="pokeball-icon"></span><span class="roll-label">Roll</span>';
        const rollClickSound = document.getElementById('roll-click-sound');
        const rollShinySound = document.getElementById('roll-shiny-sound');
        const rollLegendarySound = document.getElementById('roll-legendary-sound');
        rollBtn.onclick = () => {
            if (isPackOpening) {
                return;
            }
            isPackOpening = true;
            const nextPack = generatePackCards();
            const hasShiny = nextPack.some(card => card.rarity === 'shiny');
            const hasLegendary = nextPack.some(card => card.rarity === 'legendary');
            rollBtn.classList.add('exploding');
            if (hasShiny && rollShinySound) {
                rollShinySound.currentTime = 0;
                rollShinySound.play();
            } else if (hasLegendary && rollLegendarySound) {
                rollLegendarySound.currentTime = 0;
                rollLegendarySound.play();
            } else if (rollClickSound) {
                rollClickSound.currentTime = 0;
                rollClickSound.play();
            }
            setTimeout(async () => {
                await openPack(
                    getCurrentUser(),
                    getGameData(),
                    saveGameData,
                    (cards) => displayPackCardsOverlay(nextPack, getGameData(), getCurrentUser()),
                    () => {
                        updateGameUI(getGameData(), getCurrentUser());
                        import('./userManager.js').then(module => {
                            module.updateCoinDisplay();
                        });
                    },
                    nextPack
                );
                setTimeout(() => {
                    rollBtn.classList.remove('exploding');
                    const icon = rollBtn.querySelector('.pokeball-icon');
                    if (icon) {
                        icon.style.opacity = '';
                        icon.style.transform = '';
                    }
                    isPackOpening = false; // Reset the flag to allow subsequent rolls
                }, 800);
            }, 400);
        };
        const rollHoverSound = document.getElementById('roll-hover-sound');
        rollBtn.onmouseover = () => {
            if (rollHoverSound) {
                rollHoverSound.loop = true;
                rollHoverSound.currentTime = 0;
                rollHoverSound.play();
            }
        };
        rollBtn.onmouseleave = () => {
            if (rollHoverSound) {
                rollHoverSound.loop = false;
                rollHoverSound.pause();
                rollHoverSound.currentTime = 0;
            }
        };
    }
}



function testPokemon() {
    const container = document.getElementById('floating-pokemon');
    if (!container) {
        console.error('Container not found');
        return;
    }
    
    const testEl = document.createElement('div');
    testEl.style.position = 'absolute';
    testEl.style.left = '50%';
    testEl.style.top = '50%';
    testEl.style.width = '100px';
    testEl.style.height = '100px';
    testEl.style.backgroundColor = 'red';
    testEl.style.border = '2px solid white';
    testEl.style.zIndex = '1000';
    testEl.textContent = 'TEST POKEMON';
    testEl.style.color = 'white';
    testEl.style.display = 'flex';
    testEl.style.alignItems = 'center';
    testEl.style.justifyContent = 'center';
    
    container.appendChild(testEl);
    console.log('Test Pokemon added to container');
    
    setTimeout(() => {
        if (testEl.parentNode) {
            testEl.parentNode.removeChild(testEl);
        }
    }, 5000);
}

window.debugFloatingPokemon = debugFloatingPokemon;
window.testPokemon = testPokemon;
window.resetPackOpeningState = resetPackOpeningState;
export { setupRollButtonListeners };

function filterShopItems(category) {
    const shopItems = document.querySelectorAll('.shop-item');
    
    shopItems.forEach(item => {
        const itemCategory = item.getAttribute('data-category');
        if (category === 'all' || itemCategory === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function handleShopPurchase(itemName, price) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('You must be logged in to make purchases.');
        return;
    }
    
    const gameData = getGameData();
    const userData = gameData.users[currentUser];
    
    if (!userData) {
        alert('User data not found.');
        return;
    }
    
    if (userData.coins < price) {
        alert(`Not enough coins! You need ${price} coins to buy this item.`);
        return;
    }
    
    userData.coins -= price;
    
    if (!userData.inventory) {
        userData.inventory = {};
    }
    
    if (!userData.inventory[itemName]) {
        userData.inventory[itemName] = 0;
    }
    userData.inventory[itemName]++;
    
    const coinDisplay = document.getElementById('coin-display');
    if (coinDisplay) {
        coinDisplay.textContent = userData.coins;
    }
    
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
    
    import('./userManager.js').then(module => {
        module.saveGameData();
    });
    
    alert(`Successfully purchased ${itemName}! You now have ${userData.inventory[itemName]} ${itemName}(s).`);
    
    console.log(`Shop: Purchased ${itemName} for ${price} coins. New balance: ${userData.coins}`);
}

function updateInventoryDisplay() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const gameData = getGameData();
    const userData = gameData.users[currentUser];
    
    if (!userData || !userData.inventory) {
        showEmptyInventory();
        return;
    }
    
    const inventoryItems = Object.keys(userData.inventory);
    if (inventoryItems.length === 0) {
        showEmptyInventory();
        return;
    }
    
    displayInventoryItems(userData.inventory);
}

function showEmptyInventory() {
    const inventoryItemsContainer = document.querySelector('.inventory-items');
    if (inventoryItemsContainer) {
        inventoryItemsContainer.innerHTML = `
            <div class="inventory-empty">
                <div class="empty-icon">🎒</div>
                <h3>Your inventory is empty</h3>
                <p>Purchase items from the shop to see them here!</p>
                <button class="go-to-shop-btn">Go to Shop</button>
            </div>
        `;
        
        // Add event listener to the button
        const goToShopBtn = inventoryItemsContainer.querySelector('.go-to-shop-btn');
        if (goToShopBtn) {
            goToShopBtn.addEventListener('click', () => {
                showScreen('shop-screen');
            });
        }
    }
}

function displayInventoryItems(inventory) {
    const inventoryItemsContainer = document.querySelector('.inventory-items');
    if (!inventoryItemsContainer) return;
    
    inventoryItemsContainer.innerHTML = '';
    
    Object.entries(inventory).forEach(([itemName, count]) => {
        if (count > 0) {
            const itemElement = createInventoryItemElement(itemName, count);
            inventoryItemsContainer.appendChild(itemElement);
        }
    });
}

function createInventoryItemElement(itemName, count) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'inventory-item';
    itemDiv.setAttribute('data-item', itemName);
    
    const itemDetails = getItemDetails(itemName);
    
    itemDiv.innerHTML = `
        <div class="inventory-item-image">
            <img src="${itemDetails.image}" alt="${itemDetails.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div class="inventory-item-fallback" style="display:none;">${itemDetails.fallback}</div>
        </div>
        <div class="inventory-item-info">
            <h3>${itemDetails.name}</h3>
            <p class="inventory-item-description">${itemDetails.description}</p>
            <div class="inventory-item-count">
                <span>Quantity:</span>
                <span class="count-number">${count}</span>
            </div>
        </div>
        <button class="use-btn" data-item="${itemName}">Use Item</button>
    `;
    
    // Add event listener for the use button
    const useBtn = itemDiv.querySelector('.use-btn');
    if (useBtn) {
        useBtn.addEventListener('click', () => {
            useInventoryItem(itemName);
        });
    }
    
    return itemDiv;
}

function getItemDetails(itemName) {
    const itemDatabase = {
        'poke-ball': {
            name: 'Poké Ball',
            description: 'A device for catching wild Pokémon.',
            image: 'sprites/items/poke-ball.png',
            fallback: '⚪'
        },
        'ultra-ball': {
            name: 'Ultra Ball',
            description: 'An even better Poké Ball with a very high catch rate.',
            image: 'sprites/items/ultra-ball.png',
            fallback: '🟡'
        },
        'master-ball': {
            name: 'Master Ball',
            description: 'The best Poké Ball. It will catch any wild Pokémon without fail.',
            image: 'sprites/items/master-ball.png',
            fallback: '🟣'
        },
        'potion': {
            name: 'Potion',
            description: 'Restores 20 HP to a Pokémon.',
            image: 'sprites/items/potion.png',
            fallback: '❤️'
        },
        'super-potion': {
            name: 'Super Potion',
            description: 'Restores 50 HP to a Pokémon.',
            image: 'sprites/items/super-potion.png',
            fallback: '💙'
        }
    };
    
    return itemDatabase[itemName] || {
        name: itemName,
        description: 'An item from the shop.',
        image: 'sprites/items/poke-ball.png',
        fallback: '📦'
    };
}

function filterInventoryItems(category) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const gameData = getGameData();
    const userData = gameData.users[currentUser];
    
    if (!userData || !userData.inventory) {
        showEmptyInventory();
        return;
    }
    
    const inventoryItems = document.querySelectorAll('.inventory-item');
    
    inventoryItems.forEach(item => {
        if (category === 'all') {
            item.style.display = 'block';
        } else {
            item.style.display = 'block';
        }
    });
}

function useInventoryItem(itemName) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('You must be logged in to use items.');
        return;
    }
    
    const gameData = getGameData();
    const userData = gameData.users[currentUser];
    
    if (!userData || !userData.inventory || !userData.inventory[itemName] || userData.inventory[itemName] <= 0) {
        alert('You don\'t have any of this item to use.');
        return;
    }
    
    userData.inventory[itemName]--;
    
    import('./userManager.js').then(module => {
        module.saveGameData();
    });
    
    updateInventoryDisplay();
    
    handleItemUsage(itemName);
    
    console.log(`Inventory: Used ${itemName}. Remaining: ${userData.inventory[itemName]}`);
}

function handleItemUsage(itemName) {
    const itemDetails = getItemDetails(itemName);
    alert(`Used ${itemDetails.name}! This item's effects will be implemented in future updates.`);
}

function handleFeedbackSubmission(event) {
    event.preventDefault();
    
    const subject = document.getElementById('feedback-subject').value.trim();
    const message = document.getElementById('feedback-message').value.trim();
    const type = document.querySelector('input[name="feedback-type"]:checked').value;
    
    if (!subject || !message) {
        alert('Please fill in both subject and message fields.');
        return;
    }
    
    // Disable submit button to prevent double submission
    const submitBtn = document.querySelector('.submit-feedback-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Sending...</span>';
    
    // Prepare feedback data
    const feedbackData = {
        type: type,
        subject: subject,
        message: message,
        user: getCurrentUser() || 'Anonymous',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        gameVersion: '1.0.0' // You can update this as needed
    };
    
    // Submit to Google Forms (you'll need to create this form and get the form URL)
    submitToGoogleForms(feedbackData)
        .then(() => {
            alert('Thank you for your feedback! Your submission has been received.');
            document.getElementById('feedback-form').reset();
            showScreen('game-screen');
        })
        .catch((error) => {
            console.error('Feedback submission failed:', error);
            alert('Sorry, there was an issue submitting your feedback. Please try again or use the email option.');
            
            // Fallback to email method
            const emailSubject = `[PokeRoller Feedback - ${type.toUpperCase()}] ${subject}`;
            const emailBody = `
Feedback Type: ${type}
Subject: ${subject}

Message:
${message}

---
Sent from PokeRoller Game
User: ${getCurrentUser() || 'Anonymous'}
Date: ${new Date().toISOString()}
            `.trim();
            
            const mailtoLink = `mailto:pokerollerdev@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
            window.open(mailtoLink);
        })
        .finally(() => {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="btn-icon">📤</span><span class="btn-text">Send Feedback</span>';
        });
}

function submitToGoogleForms(data) {
    // Option 1: Google Forms (requires setup)
    // Option 2: Formspree (free, easy setup)
    // Option 3: Netlify Forms (free, easy setup)
    
    // For now, we'll simulate a successful submission
    // To implement actual submission, choose one of the options below:
    
    return new Promise((resolve, reject) => {
        // Simulate network delay
        setTimeout(() => {
            // For demo purposes, we'll always succeed
            console.log('Feedback submitted:', data);
            resolve();
            
            // OPTION 1: Google Forms
            /*
            const formUrl = 'YOUR_GOOGLE_FORM_URL_HERE';
            const formData = new FormData();
            formData.append('entry.123456789', data.type);
            formData.append('entry.987654321', data.subject);
            formData.append('entry.111222333', data.message);
            formData.append('entry.444555666', data.user);
            formData.append('entry.777888999', data.timestamp);
            
            fetch(formUrl, {
                method: 'POST',
                body: formData,
                mode: 'no-cors'
            })
            .then(() => resolve())
            .catch(reject);
            */
            
            // OPTION 2: Formspree (recommended - free and easy)
            const formData = new FormData();
            formData.append('feedback_type', data.type);
            formData.append('subject', data.subject);
            formData.append('message', data.message);
            formData.append('user', data.user);
            formData.append('timestamp', data.timestamp);
            
            fetch('https://formspree.io/f/xdkzqrle', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) resolve();
                else reject(new Error('Form submission failed'));
            })
            .catch(reject);
            
            // OPTION 3: Netlify Forms
            /*
            const formData = new FormData();
            formData.append('feedback_type', data.type);
            formData.append('subject', data.subject);
            formData.append('message', data.message);
            formData.append('user', data.user);
            formData.append('timestamp', data.timestamp);
            
            fetch('/', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (response.ok) resolve();
                else reject(new Error('Form submission failed'));
            })
            .catch(reject);
            */
        }, 1000);
    });
}

function populateShop() {
    const shopItemsContainer = document.querySelector('.shop-items');
    if (!shopItemsContainer) return;
    
    const shopItems = [
        // Great Ball removed - shop is empty for now
    ];
    
    shopItemsContainer.innerHTML = '';
    
    shopItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'shop-item';
        itemElement.setAttribute('data-category', item.category);
        
        itemElement.innerHTML = `
            <div class="item-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <div class="item-fallback" style="display:none;">${item.fallback}</div>
            </div>
            <div class="item-info">
                <h3>${item.name}</h3>
                <p class="item-description">${item.description}</p>
                <p class="item-price">${item.price} 🪙</p>
            </div>
            <button class="buy-btn" data-item="${item.id}" data-price="${item.price}">Buy</button>
        `;
        
        // Add event listener for purchase
        const buyBtn = itemElement.querySelector('.buy-btn');
        buyBtn.addEventListener('click', () => {
            handleShopPurchase(item.id, item.price);
        });
        
        shopItemsContainer.appendChild(itemElement);
    });
}

window.showScreen = showScreen;
window.useInventoryItem = useInventoryItem;