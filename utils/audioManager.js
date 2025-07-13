import { AUDIO_CONFIG, ELEMENT_IDS } from '../config/gameConfig.js';

// Audio Player State
let audioPlayer;
let musicStarted = false;
let musicEnabled = true;

// Audio Player Setup
export function setupAudioPlayer() {
    audioPlayer = document.getElementById(ELEMENT_IDS.BACKGROUND_MUSIC);
    if (audioPlayer) {
        audioPlayer.volume = AUDIO_CONFIG.BACKGROUND_MUSIC_VOLUME;
        audioPlayer.addEventListener('ended', () => {
            // Audio will loop automatically due to the loop attribute
            console.log('Audio looped');
        });
        console.log('[AUDIO] Audio player ready:', audioPlayer);
    } else {
        console.error('[AUDIO] Background music element not found');
    }
}

// Music Control Functions
export function startMusic() {
    console.log('[AUDIO] startMusic called. musicStarted:', musicStarted, 'audioPlayer:', audioPlayer, 'musicEnabled:', musicEnabled);
    if (!musicStarted && audioPlayer && musicEnabled) {
        try {
            const playPromise = audioPlayer.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('[AUDIO] Background music started');
                }).catch((error) => {
                    console.error('[AUDIO] Could not start music (promise):', error);
                });
            } else {
                console.log('[AUDIO] Background music started (no promise)');
            }
            musicStarted = true;
        } catch (error) {
            console.error('[AUDIO] Could not start music (catch):', error);
        }
    } else {
        if (musicStarted) console.log('[AUDIO] Music already started');
        if (!audioPlayer) console.error('[AUDIO] No audio player');
        if (!musicEnabled) console.log('[AUDIO] Music not enabled');
    }
}

export function toggleMusic() {
    if (!audioPlayer) return;
    
    const musicBtn = document.getElementById(ELEMENT_IDS.MUSIC_TOGGLE);
    
    if (musicEnabled) {
        audioPlayer.pause();
        musicEnabled = false;
        musicBtn.classList.add('paused');
        musicBtn.textContent = '🔇';
    } else {
        audioPlayer.play();
        musicEnabled = true;
        musicStarted = true;
        musicBtn.classList.remove('paused');
        musicBtn.textContent = '🎵';
    }
}

// Setup music control
export function setupMusicControl() {
    // Music toggle button
    const musicToggle = document.getElementById(ELEMENT_IDS.MUSIC_TOGGLE);
    if (musicToggle) {
        musicToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering first interaction
            console.log('[AUDIO] Music toggle button clicked');
            toggleMusic();
        });
        console.log('[AUDIO] Music toggle button event listener added:', musicToggle);
    } else {
        console.error('[AUDIO] Music toggle button not found during setup');
    }
}

// Play sound effects
export function playSoundEffect(soundId) {
    const soundElement = document.getElementById(soundId);
    if (soundElement) {
        soundElement.currentTime = 0;
        soundElement.play();
    }
}

// Play roll sound based on pack contents
export function playRollSound(hasShiny, hasLegendary) {
    if (hasLegendary) {
        playSoundEffect(AUDIO_CONFIG.SOUND_EFFECTS.ROLL_LEGENDARY);
    } else if (hasShiny) {
        playSoundEffect(AUDIO_CONFIG.SOUND_EFFECTS.ROLL_SHINY);
    } else {
        playSoundEffect(AUDIO_CONFIG.SOUND_EFFECTS.ROLL_CLICK);
    }
} 