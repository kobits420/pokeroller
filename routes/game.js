const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Save game progress
router.post('/save', auth, async (req, res) => {
    try {
        const { gameData } = req.body;
        
        if (!gameData) {
            return res.status(400).json({ error: 'Game data is required' });
        }
        
        // Extract the current user's data from the gameData object
        console.log('Saving game data for user:', req.user.username);
        console.log('Game data structure:', Object.keys(gameData));
        console.log('Users in game data:', gameData.users ? Object.keys(gameData.users) : 'No users object');
        
        const currentUserData = gameData.users && gameData.users[req.user.username];
        
        if (!currentUserData) {
            console.error('User data not found for:', req.user.username);
            return res.status(400).json({ error: 'User data not found in game data' });
        }
        
        console.log('Current user data keys:', Object.keys(currentUserData));
        
        // Update user with their specific data
        req.user.updateGameData(currentUserData);
        await req.user.save();
        
        res.json({
            message: 'Game progress saved successfully',
            user: req.user.getGameData()
        });
        
    } catch (error) {
        console.error('Save game error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get game progress
router.get('/progress', auth, async (req, res) => {
    try {
        res.json({
            user: req.user.getGameData()
        });
    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Claim achievement
router.post('/achievements/claim', auth, async (req, res) => {
    try {
        const { achievementId, reward } = req.body;
        
        if (!achievementId || reward === undefined) {
            return res.status(400).json({ error: 'Achievement ID and reward are required' });
        }
        
        // Check if achievement is already claimed
        if (req.user.claimedAchievements.includes(achievementId)) {
            return res.status(400).json({ error: 'Achievement already claimed' });
        }
        
        // Check if achievement is completed
        if (!req.user.completedAchievements.includes(achievementId)) {
            return res.status(400).json({ error: 'Achievement not completed yet' });
        }
        
        // Award the achievement
        req.user.claimedAchievements.push(achievementId);
        req.user.coins = Math.min(24, req.user.coins + reward);
        
        await req.user.save();
        
        res.json({
            message: 'Achievement claimed successfully',
            user: req.user.getGameData()
        });
        
    } catch (error) {
        console.error('Claim achievement error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Equip title
router.post('/titles/equip', auth, async (req, res) => {
    try {
        const { title } = req.body;
        
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        
        // Check if user has the title (has claimed the achievement)
        const hasTitle = req.user.claimedAchievements.some(achievementId => {
            // This would need to be expanded based on your achievement system
            return achievementId === 'complete_dex' || achievementId === 'complete_all';
        });
        
        if (!hasTitle) {
            return res.status(400).json({ error: 'You do not have this title' });
        }
        
        req.user.equippedTitle = title;
        await req.user.save();
        
        res.json({
            message: 'Title equipped successfully',
            user: req.user.getGameData()
        });
        
    } catch (error) {
        console.error('Equip title error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update favorites
router.post('/favorites', auth, async (req, res) => {
    try {
        const { pokemonId, action } = req.body; // action: 'add' or 'remove'
        
        if (!pokemonId || !action) {
            return res.status(400).json({ error: 'Pokemon ID and action are required' });
        }
        
        if (action === 'add') {
            if (!req.user.favorites.includes(pokemonId)) {
                req.user.favorites.push(pokemonId);
            }
        } else if (action === 'remove') {
            req.user.favorites = req.user.favorites.filter(id => id !== pokemonId);
        } else {
            return res.status(400).json({ error: 'Invalid action. Use "add" or "remove"' });
        }
        
        await req.user.save();
        
        res.json({
            message: 'Favorites updated successfully',
            user: req.user.getGameData()
        });
        
    } catch (error) {
        console.error('Update favorites error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update inventory
router.post('/inventory', auth, async (req, res) => {
    try {
        const { itemName, quantity, action } = req.body; // action: 'add' or 'remove'
        
        if (!itemName || quantity === undefined || !action) {
            return res.status(400).json({ error: 'Item name, quantity, and action are required' });
        }
        
        const currentQuantity = req.user.inventory.get(itemName) || 0;
        
        if (action === 'add') {
            req.user.inventory.set(itemName, currentQuantity + quantity);
        } else if (action === 'remove') {
            const newQuantity = Math.max(0, currentQuantity - quantity);
            if (newQuantity === 0) {
                req.user.inventory.delete(itemName);
            } else {
                req.user.inventory.set(itemName, newQuantity);
            }
        } else {
            return res.status(400).json({ error: 'Invalid action. Use "add" or "remove"' });
        }
        
        await req.user.save();
        
        res.json({
            message: 'Inventory updated successfully',
            user: req.user.getGameData()
        });
        
    } catch (error) {
        console.error('Update inventory error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update avatar
router.post('/avatar', auth, async (req, res) => {
    try {
        const { avatar } = req.body;
        
        if (!avatar) {
            return res.status(400).json({ error: 'Avatar is required' });
        }
        
        req.user.avatar = avatar;
        await req.user.save();
        
        res.json({
            message: 'Avatar updated successfully',
            user: req.user.getGameData()
        });
        
    } catch (error) {
        console.error('Update avatar error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 