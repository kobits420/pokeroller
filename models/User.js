const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    avatar: {
        type: String,
        default: 'youngster.png'
    },
    coins: {
        type: Number,
        default: 3,
        min: 0,
        max: 24
    },
    lastCoinTime: {
        type: Date,
        default: Date.now
    },
    lastLoginDate: {
        type: String,
        default: () => new Date().toDateString()
    },
    level: {
        type: Number,
        default: 1,
        min: 1
    },
    xp: {
        type: Number,
        default: 0,
        min: 0
    },
    xpToNext: {
        type: Number,
        default: 25
    },
    cardCounts: {
        type: Map,
        of: Number,
        default: {}
    },
    packsOpened: {
        type: Number,
        default: 0
    },
    cardsCollected: {
        type: Number,
        default: 0
    },
    claimedAchievements: [{
        type: String
    }],
    completedAchievements: [{
        type: String
    }],
    equippedTitle: {
        type: String,
        default: null
    },
    favorites: [{
        type: String
    }],
    inventory: {
        type: Map,
        of: Number,
        default: {}
    },
    notifications: [{
        type: String,
        default: []
    }],
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: []
    }],
    friendRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: []
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Update timestamp on save
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to get user data for game
userSchema.methods.getGameData = function() {
    return {
        username: this.username,
        avatar: this.avatar,
        coins: this.coins,
        lastCoinTime: this.lastCoinTime,
        lastLoginDate: this.lastLoginDate,
        level: this.level,
        xp: this.xp,
        xpToNext: this.xpToNext,
        cardCounts: Object.fromEntries(this.cardCounts),
        packsOpened: this.packsOpened,
        cardsCollected: this.cardsCollected,
        claimedAchievements: this.claimedAchievements,
        completedAchievements: this.completedAchievements,
        equippedTitle: this.equippedTitle,
        favorites: this.favorites,
        inventory: Object.fromEntries(this.inventory)
    };
};

// Method to update game data
userSchema.methods.updateGameData = function(gameData) {
    if (gameData.coins !== undefined) this.coins = gameData.coins;
    if (gameData.lastCoinTime !== undefined) this.lastCoinTime = gameData.lastCoinTime;
    if (gameData.lastLoginDate !== undefined) this.lastLoginDate = gameData.lastLoginDate;
    if (gameData.level !== undefined) this.level = gameData.level;
    if (gameData.xp !== undefined) this.xp = gameData.xp;
    if (gameData.xpToNext !== undefined) this.xpToNext = gameData.xpToNext;
    if (gameData.cardCounts !== undefined) this.cardCounts = new Map(Object.entries(gameData.cardCounts));
    if (gameData.packsOpened !== undefined) this.packsOpened = gameData.packsOpened;
    if (gameData.cardsCollected !== undefined) this.cardsCollected = gameData.cardsCollected;
    if (gameData.claimedAchievements !== undefined) this.claimedAchievements = gameData.claimedAchievements;
    if (gameData.completedAchievements !== undefined) this.completedAchievements = gameData.completedAchievements;
    if (gameData.equippedTitle !== undefined) this.equippedTitle = gameData.equippedTitle;
    if (gameData.favorites !== undefined) this.favorites = gameData.favorites;
    if (gameData.inventory !== undefined) this.inventory = new Map(Object.entries(gameData.inventory));
};

module.exports = mongoose.model('User', userSchema); 