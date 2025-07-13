import { pokemonData } from '../pokemonData.js';

// Floating Pokemon Background
let floatingPokemonInterval;

export function startFloatingPokemon() {
    console.log('Starting floating Pokemon background...');
    
    // Check if container exists
    const container = document.getElementById('floating-pokemon');
    if (!container) {
        console.error('Floating Pokemon container not found!');
        return;
    }
    
    // Check if pokemonData is available
    if (!pokemonData || pokemonData.length === 0) {
        console.error('Pokemon data not available!');
        return;
    }
    
    // Clear any existing interval
    if (floatingPokemonInterval) {
        clearTimeout(floatingPokemonInterval);
        floatingPokemonInterval = null;
    }
    
    // Clear existing Pokemon
    container.innerHTML = '';
    
    // Start spawning Pokemon with random intervals (0.5-2 seconds for more density)
    const spawnPokemon = () => {
        spawnFloatingPokemon();
        const nextInterval = 500 + Math.random() * 1500; // 0.5-2 seconds
        floatingPokemonInterval = setTimeout(spawnPokemon, nextInterval);
    };
    
    // Start the spawning cycle
    spawnPokemon();
    
    // Spawn initial Pokemon with staggered timing (more initial Pokemon)
    for (let i = 0; i < 15; i++) {
        setTimeout(() => spawnFloatingPokemon(), Math.random() * 2000);
    }
    
    console.log('Floating Pokemon background started successfully!');
}

export function spawnFloatingPokemon() {
    const container = document.getElementById('floating-pokemon');
    if (!container) {
        console.error('Container not found in spawnFloatingPokemon');
        return;
    }
    
    // Get a random Pokemon (including some shinies for variety)
    const allPokemon = pokemonData.filter(p => p.id <= 1025); // Limit to actual Pokemon
    if (allPokemon.length === 0) {
        console.error('No Pokemon data available');
        return;
    }
    
    const randomPokemon = allPokemon[Math.floor(Math.random() * allPokemon.length)];
    
    // Create Pokemon element
    const pokemonEl = document.createElement('img');
    pokemonEl.className = 'floating-pokemon';
    
    // Randomly decide if it should be shiny (10% chance)
    const isShiny = Math.random() < 0.1;
    if (isShiny && randomPokemon.originalId) {
        const paddedId = randomPokemon.originalId.toString().padStart(3, '0');
        pokemonEl.src = `sprites/pokemon/shiny/${paddedId}.png`;
        pokemonEl.classList.add('shiny-sprite');
    } else {
        const paddedId = randomPokemon.id.toString().padStart(3, '0');
        pokemonEl.src = `sprites/pokemon/${paddedId}.png`;
    }
    pokemonEl.alt = randomPokemon.name;
    
    // Add error handling for image loading
    pokemonEl.onerror = function() {
        // Remove the element if image fails to load
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    };
    
    // Random direction (0-7 for 8 different directions)
    const direction = Math.floor(Math.random() * 8);
    const duration = 12 + Math.random() * 18; // 12-30 seconds
    const size = 20 + Math.random() * 60; // 20-80px for more variety
    
    // Calculate start and end positions based on direction
    let startX, startY, endX, endY;
    const margin = 100; // Distance from edge
    
    switch (direction) {
        case 0: // Bottom to Top
            startX = Math.random() * window.innerWidth;
            startY = window.innerHeight + margin;
            endX = Math.random() * window.innerWidth;
            endY = -margin;
            break;
        case 1: // Top to Bottom
            startX = Math.random() * window.innerWidth;
            startY = -margin;
            endX = Math.random() * window.innerWidth;
            endY = window.innerHeight + margin;
            break;
        case 2: // Left to Right
            startX = -margin;
            startY = Math.random() * window.innerHeight;
            endX = window.innerWidth + margin;
            endY = Math.random() * window.innerHeight;
            break;
        case 3: // Right to Left
            startX = window.innerWidth + margin;
            startY = Math.random() * window.innerHeight;
            endX = -margin;
            endY = Math.random() * window.innerHeight;
            break;
        case 4: // Bottom-Left to Top-Right
            startX = -margin;
            startY = window.innerHeight + margin;
            endX = window.innerWidth + margin;
            endY = -margin;
            break;
        case 5: // Top-Left to Bottom-Right
            startX = -margin;
            startY = -margin;
            endX = window.innerWidth + margin;
            endY = window.innerHeight + margin;
            break;
        case 6: // Bottom-Right to Top-Left
            startX = window.innerWidth + margin;
            startY = window.innerHeight + margin;
            endX = -margin;
            endY = -margin;
            break;
        case 7: // Top-Right to Bottom-Left
            startX = window.innerWidth + margin;
            startY = -margin;
            endX = -margin;
            endY = window.innerHeight + margin;
            break;
    }
    
    // Set initial position and size
    pokemonEl.style.left = startX + 'px';
    pokemonEl.style.top = startY + 'px';
    pokemonEl.style.width = size + 'px';
    pokemonEl.style.height = size + 'px';
    
    // Add random z-index for layering effect (smaller Pokemon in back, larger in front)
    const zIndex = Math.floor(size / 10) + Math.floor(Math.random() * 5);
    pokemonEl.style.zIndex = zIndex;
    
    // Create custom animation
    const animationName = `float-${Date.now()}-${Math.random()}`;
    const keyframes = `
        @keyframes ${animationName} {
            0% {
                transform: translate(0, 0) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 0.6;
            }
            90% {
                opacity: 0.6;
            }
            100% {
                transform: translate(${endX - startX}px, ${endY - startY}px) rotate(360deg);
                opacity: 0;
            }
        }
    `;
    
    // Add keyframes to document
    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);
    
    // Apply animation
    pokemonEl.style.animation = `${animationName} ${duration}s linear infinite, gentleFloat 3s ease-in-out infinite`;
    
    // Add to container
    container.appendChild(pokemonEl);
    
    // Remove after animation completes and clean up
    setTimeout(() => {
        if (pokemonEl.parentNode) {
            pokemonEl.parentNode.removeChild(pokemonEl);
        }
        // Remove the style element
        if (style.parentNode) {
            style.parentNode.removeChild(style);
        }
    }, duration * 1000);
}

export function stopFloatingPokemon() {
    if (floatingPokemonInterval) {
        clearTimeout(floatingPokemonInterval);
        floatingPokemonInterval = null;
    }
    
    const container = document.getElementById('floating-pokemon');
    if (container) {
        container.innerHTML = '';
    }
}

export function debugFloatingPokemon() {
    console.log('=== Floating Pokemon Debug ===');
    console.log('Container exists:', !!document.getElementById('floating-pokemon'));
    console.log('Pokemon data available:', !!pokemonData);
    console.log('Pokemon data length:', pokemonData ? pokemonData.length : 0);
    console.log('Current interval:', floatingPokemonInterval);
    console.log('Current screen:', document.querySelector('.screen:not(.hidden)')?.id);
    
    // Try to start manually
    startFloatingPokemon();
}

export function testPokemon() {
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
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (testEl.parentNode) {
            testEl.parentNode.removeChild(testEl);
        }
    }, 5000);
} 