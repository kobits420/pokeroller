const fs = require('fs');

// Read the current pokemonData.js file
let content = fs.readFileSync('pokemonData.js', 'utf8');

// Find the end of the normal Pokémon (before the shiny section)
const normalEndIndex = content.indexOf('    // Generation 1 Shiny Pokemon');
if (normalEndIndex === -1) {
    console.error('Could not find shiny section marker');
    process.exit(1);
}

// Get the existing shiny entries to see what's missing
const existingShinies = [];
const shinySection = content.substring(normalEndIndex);
const shinyMatches = shinySection.match(/{id: (\d+), name: "Shiny ([^"]+)", type: "[^"]+", generation: (\d+), rarity: "shiny", originalId: (\d+)}/g);
shinyMatches.forEach(match => {
    const idMatch = match.match(/originalId: (\d+)/);
    if (idMatch) {
        existingShinies.push(parseInt(idMatch[1]));
    }
});

// Find missing originalIds (1-1025)
const missingShinies = [];
for (let i = 1; i <= 1025; i++) {
    if (!existingShinies.includes(i)) {
        missingShinies.push(i);
    }
}

console.log(`Missing ${missingShinies.length} shiny Pokémon:`, missingShinies.slice(0, 20), '...');

// Get the normal Pokémon data to create shiny entries
const normalPokemon = [];
const normalMatches = content.match(/{id: (\d+), name: "([^"]+)", type: "[^"]+", generation: (\d+), rarity: "[^"]+"}/g);
normalMatches.forEach(match => {
    const idMatch = match.match(/id: (\d+)/);
    const nameMatch = match.match(/name: "([^"]+)"/);
    const typeMatch = match.match(/type: "([^"]+)"/);
    const genMatch = match.match(/generation: (\d+)/);
    if (idMatch && nameMatch && typeMatch && genMatch) {
        const id = parseInt(idMatch[1]);
        const name = nameMatch[1];
        const type = typeMatch[1];
        const generation = parseInt(genMatch[1]);
        normalPokemon.push({ id, name, type, generation });
    }
});

// Create missing shiny entries
let shinyEntries = '';
let shinyId = 11000; // Start with a high ID to avoid conflicts

missingShinies.forEach(originalId => {
    const normalPoke = normalPokemon.find(p => p.id === originalId);
    if (normalPoke) {
        shinyEntries += `    {id: ${shinyId}, name: "Shiny ${normalPoke.name}", type: "${normalPoke.type}", generation: ${normalPoke.generation}, rarity: "shiny", originalId: ${originalId}},\n`;
        shinyId++;
    }
});

// Insert the missing shiny entries before the existing shiny section
const insertPoint = content.indexOf('    // Generation 1 Shiny Pokemon');
const beforeShiny = content.substring(0, insertPoint);
const afterShiny = content.substring(insertPoint);

const newContent = beforeShiny + shinyEntries + afterShiny;

// Write the updated file
fs.writeFileSync('pokemonData.js', newContent);

console.log(`Added ${missingShinies.length} missing shiny Pokémon entries`);
console.log('Updated pokemonData.js successfully'); 