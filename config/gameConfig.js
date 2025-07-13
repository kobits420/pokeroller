// Game Configuration Constants

// Audio Settings
export const AUDIO_CONFIG = {
    BACKGROUND_MUSIC_VOLUME: 0.3,
    SOUND_EFFECTS: {
        ROLL_CLICK: 'roll-click-sound',
        ROLL_SHINY: 'roll-shiny-sound', 
        ROLL_LEGENDARY: 'roll-legendary-sound',
        HOVER: 'hover-sound',
        BUY: 'buy-sound',
        INCREASE: 'increase-sound',
        CONFIRM: 'confirm-sound',
        LOGIN: 'login-sound'
    }
};

// Game Settings
export const GAME_CONFIG = {
    PACK_SIZE: 5,
    SHINY_CHANCE: 0.01,
    LEGENDARY_CHANCE: 0.1,
    RARITY_WEIGHTS: {
        common: 5,
        uncommon: 3,
        rare: 2,
        legendary: 1
    },
    RECENT_CATCHES_LIMIT: 10,
    FLOATING_POKEMON: {
        SPAWN_INTERVAL: 3000,
        MAX_POKEMON: 5,
        FADE_DURATION: 5000
    }
};

// Local Storage Keys
export const STORAGE_KEYS = {
    GAME_DATA: 'pokeroller-data'
};

// DOM Element IDs
export const ELEMENT_IDS = {
    // Screens
    LOGIN_SCREEN: 'login-screen',
    GAME_SCREEN: 'game-screen',
    POKEDEX_SCREEN: 'pokedex-screen',
    
    // Game Elements
    ROLL_BTN: 'roll-btn',
    PACK: 'pack',
    CARDS_CONTAINER: 'cards-container',
    CARDS_REVEAL: 'cards-reveal',
    CONTINUE_BTN: 'continue-btn',
    
    // Stats
    CAUGHT_COUNT: 'caught-count',
    TOTAL_COUNT: 'total-count',
    PACKS_OPENED: 'packs-opened',
    CARDS_COLLECTED: 'cards-collected',
    PROGRESS_FILL: 'progress-fill',
    
    // Audio
    BACKGROUND_MUSIC: 'background-music',
    MUSIC_TOGGLE: 'music-toggle',
    
    // Pokédex
    POKEDEX_GRID: 'pokedex-grid',
    SEARCH_POKEMON: 'search-pokemon',
    GENERATION_FILTER: 'generation-filter',
    RARITY_FILTER: 'rarity-filter',
    SHOW_CAUGHT_ONLY: 'show-caught-only',
    SHOW_FAVORITES_ONLY: 'show-favorites-only',
    
    // Login
    LOGIN_BTN: 'login-btn',
    REGISTER_BTN: 'register-btn',
    LOGOUT_BTN: 'logout-btn'
}; 