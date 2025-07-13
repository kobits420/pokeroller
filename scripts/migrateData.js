// Migration script to transfer localStorage data to backend
// This script helps users migrate their existing game data

import apiClient from '../utils/apiClient.js';

class DataMigrator {
    constructor() {
        this.oldData = null;
        this.newUser = null;
    }

    // Load old data from localStorage
    loadOldData() {
        try {
            const oldData = localStorage.getItem('pokeroller-data');
            if (!oldData) {
                throw new Error('No existing game data found in localStorage');
            }
            
            this.oldData = JSON.parse(oldData);
            console.log('Loaded old data:', this.oldData);
            return true;
        } catch (error) {
            console.error('Failed to load old data:', error);
            return false;
        }
    }

    // Create new user account
    async createUser(username, password) {
        try {
            const response = await apiClient.register(username, password);
            this.newUser = response.user;
            apiClient.setToken(response.token);
            console.log('Created new user account:', username);
            return true;
        } catch (error) {
            console.error('Failed to create user account:', error);
            return false;
        }
    }

    // Migrate user data
    async migrateUserData(username) {
        if (!this.oldData || !this.oldData.users) {
            console.error('No user data to migrate');
            return false;
        }

        const userData = this.oldData.users[username];
        if (!userData) {
            console.error(`User ${username} not found in old data`);
            return false;
        }

        try {
            // Prepare game data for migration
            const gameData = {
                username: username,
                avatar: userData.avatar || 'youngster.png',
                coins: userData.coins || 3,
                lastCoinTime: userData.lastCoinTime || Date.now(),
                lastLoginDate: userData.lastLoginDate || new Date().toDateString(),
                level: userData.level || 1,
                xp: userData.xp || 0,
                xpToNext: userData.xpToNext || 25,
                cardCounts: userData.cardCounts || {},
                packsOpened: userData.packsOpened || 0,
                claimedAchievements: userData.claimedAchievements || [],
                completedAchievements: userData.completedAchievements || [],
                equippedTitle: userData.equippedTitle || null,
                favorites: userData.favorites || [],
                inventory: userData.inventory || {}
            };

            // Save to backend
            await apiClient.saveGameProgress(gameData);
            console.log('Successfully migrated user data for:', username);
            return true;
        } catch (error) {
            console.error('Failed to migrate user data:', error);
            return false;
        }
    }

    // Get list of users from old data
    getOldUsers() {
        if (!this.oldData || !this.oldData.users) {
            return [];
        }
        return Object.keys(this.oldData.users);
    }

    // Backup old data
    backupOldData() {
        try {
            const backup = {
                timestamp: new Date().toISOString(),
                data: this.oldData
            };
            localStorage.setItem('pokeroller-backup', JSON.stringify(backup));
            console.log('Backup created successfully');
            return true;
        } catch (error) {
            console.error('Failed to create backup:', error);
            return false;
        }
    }

    // Clear old data after successful migration
    clearOldData() {
        try {
            localStorage.removeItem('pokeroller-data');
            console.log('Old data cleared successfully');
            return true;
        } catch (error) {
            console.error('Failed to clear old data:', error);
            return false;
        }
    }
}

// Migration UI functions
export function showMigrationUI() {
    const migrator = new DataMigrator();
    
    if (!migrator.loadOldData()) {
        alert('No existing game data found. You can start fresh with the new backend!');
        return;
    }

    const oldUsers = migrator.getOldUsers();
    if (oldUsers.length === 0) {
        alert('No users found in existing data.');
        return;
    }

    // Create migration dialog
    const dialog = document.createElement('div');
    dialog.className = 'migration-dialog';
    dialog.innerHTML = `
        <div class="migration-content">
            <h2>Migrate Your Data</h2>
            <p>We found existing game data. Would you like to migrate it to the new backend?</p>
            
            <div class="migration-form">
                <label for="migrate-username">Select User:</label>
                <select id="migrate-username">
                    ${oldUsers.map(user => `<option value="${user}">${user}</option>`).join('')}
                </select>
                
                <label for="migrate-password">New Password:</label>
                <input type="password" id="migrate-password" placeholder="Enter new password" minlength="6">
                
                <div class="migration-buttons">
                    <button id="migrate-confirm">Migrate Data</button>
                    <button id="migrate-skip">Skip Migration</button>
                </div>
            </div>
        </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .migration-dialog {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        }
        
        .migration-content {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            max-width: 400px;
            width: 90%;
        }
        
        .migration-form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .migration-form label {
            font-weight: bold;
        }
        
        .migration-form select,
        .migration-form input {
            padding: 0.5rem;
            border: 1px solid #ccc;
            border-radius: 5px;
        }
        
        .migration-buttons {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .migration-buttons button {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        
        #migrate-confirm {
            background: #4CAF50;
            color: white;
        }
        
        #migrate-skip {
            background: #f44336;
            color: white;
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(dialog);

    // Event listeners
    document.getElementById('migrate-confirm').addEventListener('click', async () => {
        const username = document.getElementById('migrate-username').value;
        const password = document.getElementById('migrate-password').value;

        if (!password || password.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }

        // Create backup
        migrator.backupOldData();

        // Create user and migrate data
        const success = await migrator.createUser(username, password);
        if (success) {
            const migrateSuccess = await migrator.migrateUserData(username);
            if (migrateSuccess) {
                migrator.clearOldData();
                alert('Migration completed successfully! You can now log in with your new account.');
                document.body.removeChild(dialog);
                // Refresh the page to start fresh
                window.location.reload();
            } else {
                alert('Migration failed. Your data has been backed up.');
            }
        } else {
            alert('Failed to create user account. Please try again.');
        }
    });

    document.getElementById('migrate-skip').addEventListener('click', () => {
        document.body.removeChild(dialog);
    });
}

// Export the migrator class for manual use
export { DataMigrator }; 