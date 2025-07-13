const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        res.json({
            user: req.user.getGameData()
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { username, avatar } = req.body;
        
        // Update username if provided
        if (username) {
            if (username.length < 3 || username.length > 20) {
                return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
            }
            
            // Check if username is already taken
            const existingUser = await User.findOne({ username });
            if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            
            req.user.username = username;
        }
        
        // Update avatar if provided
        if (avatar) {
            req.user.avatar = avatar;
        }
        
        await req.user.save();
        
        res.json({
            message: 'Profile updated successfully',
            user: req.user.getGameData()
        });
        
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Change password
router.put('/password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters long' });
        }
        
        // Verify current password
        const isMatch = await req.user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }
        
        // Update password
        req.user.password = newPassword;
        await req.user.save();
        
        res.json({
            message: 'Password changed successfully'
        });
        
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get leaderboard (top users by packs opened)
router.get('/leaderboard', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        const leaderboard = await User.find({})
            .select('username avatar packsOpened level')
            .sort({ packsOpened: -1, level: -1 })
            .limit(limit);
        
        res.json({
            leaderboard: leaderboard.map(user => ({
                username: user.username,
                avatar: user.avatar,
                packsOpened: user.packsOpened,
                level: user.level
            }))
        });
        
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user statistics
router.get('/stats', auth, async (req, res) => {
    try {
        const user = req.user;
        
        // Calculate statistics
        const totalPokemon = Object.keys(user.cardCounts).length;
        const totalCards = Object.values(user.cardCounts).reduce((sum, count) => sum + count, 0);
        
        // Count by rarity (this would need to be expanded based on your Pokemon data)
        const rarityStats = {
            common: 0,
            uncommon: 0,
            rare: 0,
            legendary: 0,
            shiny: 0
        };
        
        // This is a simplified version - you'd need to integrate with your Pokemon data
        for (const [pokemonId, count] of user.cardCounts) {
            if (count > 0) {
                // This would need to be expanded based on your Pokemon rarity system
                rarityStats.common += count; // Placeholder
            }
        }
        
        res.json({
            stats: {
                totalPokemon,
                totalCards,
                packsOpened: user.packsOpened,
                level: user.level,
                xp: user.xp,
                xpToNext: user.xpToNext,
                coins: user.coins,
                rarityStats
            }
        });
        
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user account
router.delete('/account', auth, async (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ error: 'Password is required to delete account' });
        }
        
        // Verify password
        const isMatch = await req.user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Password is incorrect' });
        }
        
        // Delete user
        await User.findByIdAndDelete(req.user._id);
        
        res.json({
            message: 'Account deleted successfully'
        });
        
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get current user's friends list
router.get('/friends', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('friends', 'username avatar');
        res.json({ friends: user.friends });
    } catch (error) {
        console.error('Get friends error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Send a friend request
router.post('/friends/request', auth, async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) return res.status(400).json({ error: 'Username is required' });
        if (username === req.user.username) return res.status(400).json({ error: 'Cannot add yourself as a friend' });
        const target = await User.findOne({ username });
        if (!target) return res.status(404).json({ error: 'User not found' });
        if (target.friends.includes(req.user._id)) return res.status(400).json({ error: 'Already friends' });
        if (target.friendRequests.includes(req.user._id)) return res.status(400).json({ error: 'Friend request already sent' });
        // Prevent duplicate requests in the other direction
        if (req.user.friendRequests.includes(target._id)) return res.status(400).json({ error: 'You already have a pending request from this user' });
        // Prevent duplicate requests if already pending in either direction
        if (req.user.friends.includes(target._id)) return res.status(400).json({ error: 'Already friends' });
        target.friendRequests.push(req.user._id);
        await target.save();
        res.json({ message: 'Friend request sent' });
    } catch (error) {
        console.error('Send friend request error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get pending friend requests
router.get('/friends/requests', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('friendRequests', 'username avatar');
        res.json({ friendRequests: user.friendRequests });
    } catch (error) {
        console.error('Get friend requests error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Accept a friend request
router.post('/friends/accept', auth, async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'User ID is required' });
        const requester = await User.findById(userId);
        if (!requester) return res.status(404).json({ error: 'User not found' });
        if (!req.user.friendRequests.includes(userId)) return res.status(400).json({ error: 'No friend request from this user' });
        // Add each other as friends
        req.user.friends.push(userId);
        requester.friends.push(req.user._id);
        // Remove the friend request
        req.user.friendRequests = req.user.friendRequests.filter(id => id.toString() !== userId);
        // Add notification to requester
        requester.notifications.push(`${req.user.username} accepted your friend request!`);
        await req.user.save();
        await requester.save();
        res.json({ message: 'Friend request accepted' });
    } catch (error) {
        console.error('Accept friend request error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Fetch and clear notifications
router.get('/notifications', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const notifications = user.notifications || [];
        user.notifications = [];
        await user.save();
        res.json({ notifications });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Decline a friend request
router.post('/friends/decline', auth, async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'User ID is required' });
        if (!req.user.friendRequests.includes(userId)) return res.status(400).json({ error: 'No friend request from this user' });
        req.user.friendRequests = req.user.friendRequests.filter(id => id.toString() !== userId);
        await req.user.save();
        res.json({ message: 'Friend request declined' });
    } catch (error) {
        console.error('Decline friend request error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Remove a friend
router.post('/friends/remove', auth, async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'User ID is required' });
        // Remove from current user's friends
        req.user.friends = req.user.friends.filter(id => id.toString() !== userId);
        await req.user.save();
        // Remove from the other user's friends
        const other = await User.findById(userId);
        if (other) {
            other.friends = other.friends.filter(id => id.toString() !== req.user._id.toString());
            await other.save();
        }
        res.json({ message: 'Friend removed' });
    } catch (error) {
        console.error('Remove friend error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 