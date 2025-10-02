// Zelda NES Web Game

// Setup canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let player = { x: 50, y: 50, width: 32, height: 32, health: 3 };
let enemies = [];
let collectibles = [];

// Player movement
document.addEventListener('keydown', (event) => {
    switch(event.key) {
        case 'ArrowUp': player.y -= 5; break;
        case 'ArrowDown': player.y += 5; break;
        case 'ArrowLeft': player.x -= 5; break;
        case 'ArrowRight': player.x += 5; break;
        case ' ': attack(); break;
    }
});

function attack() {
    console.log('Sword attack!');
    // Implement sword attack logic here
}

// Enemies
function spawnEnemies() {
    enemies.push({ x: 100, y: 100, type: 'octorok' });
    enemies.push({ x: 200, y: 150, type: 'moblin' });
}

// Collectibles
function spawnCollectibles() {
    collectibles.push({ x: 150, y: 200, type: 'heart' });
    collectibles.push({ x: 300, y: 250, type: 'rupee' });
}

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.height + rect1.y > rect2.y;
}

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(player.x, player.y, player.width, player.height); // Draw player
    // Draw enemies and collectibles
    requestAnimationFrame(gameLoop);
}

// Start the game
spawnEnemies();
spawnCollectibles();
gameLoop();
