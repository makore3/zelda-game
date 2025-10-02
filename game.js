// Configuración del canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 48;
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;

// Colores estilo NES
const COLORS = {
    grass: '#107c10',
    darkGrass: '#0a5c0a',
    wall: '#8b4513',
    darkWall: '#654321',
    player: '#00ff00',
    playerTunic: '#228b22',
    enemy: '#ff4444',
    heart: '#ff0000',
    rupee: '#00ff00',
    sword: '#c0c0c0',
    black: '#000000'
};

let keys = {};
let gameRunning = true;
let currentRoom = 0;

const player = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    width: 32,
    height: 32,
    speed: 3,
    health: 6,
    maxHealth: 6,
    rupees: 0,
    direction: 'down',
    attacking: false,
    attackTimer: 0,
    invulnerable: false,
    invulnerableTimer: 0
};

let enemies = [];
let items = [];

const rooms = [
    {
        walls: [
            { x: 0, y: 0, width: GAME_WIDTH, height: 48 },
            { x: 0, y: GAME_HEIGHT - 48, width: GAME_WIDTH, height: 48 },
            { x: 0, y: 0, width: 48, height: GAME_HEIGHT },
            { x: GAME_WIDTH - 48, y: 0, width: 48, height: GAME_HEIGHT },
            { x: 240, y: 192, width: 96, height: 96 },
            { x: 432, y: 192, width: 96, height: 96 }
        ],
        enemies: [
            { x: 200, y: 150, type: 'octorok' },
            { x: 500, y: 400, type: 'octorok' },
            { x: 350, y: 300, type: 'moblin' }
        ],
        items: [
            { x: 300, y: 500, type: 'rupee' }
        ]
    },
    {
        walls: [
            { x: 0, y: 0, width: GAME_WIDTH, height: 48 },
            { x: 0, y: GAME_HEIGHT - 48, width: GAME_WIDTH, height: 48 },
            { x: 0, y: 0, width: 48, height: GAME_HEIGHT },
            { x: GAME_WIDTH - 48, y: 0, width: 48, height: GAME_HEIGHT }
        ],
        enemies: [
            { x: 300, y: 200, type: 'moblin' },
            { x: 450, y: 350, type: 'octorok' }
        ],
        items: [
            { x: 380, y: 300, type: 'heart' }
        ]
    }
];

function loadRoom(roomIndex) {
    currentRoom = roomIndex;
    const room = rooms[roomIndex];
    
    enemies = room.enemies.map(e => ({
        x: e.x,
        y: e.y,
        width: 32,
        height: 32,
        speed: e.type === 'octorok' ? 1.5 : 1,
        health: e.type === 'octorok' ? 2 : 3,
        type: e.type,
        direction: Math.random() > 0.5 ? 1 : -1,
        moveTimer: 0,
        movePattern: Math.random()
    }));
    
    items = room.items.map(i => ({
        x: i.x,
        y: i.y,
        width: 24,
        height: 24,
        type: i.type,
        collected: false
    }));
}

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' && !player.attacking) {
        player.attacking = true;
        player.attackTimer = 15;
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function updatePlayer() {
    const prevX = player.x;
    const prevY = player.y;
    
    if (!player.attacking) {
        if (keys['ArrowUp']) {
            player.y -= player.speed;
            player.direction = 'up';
        }
        if (keys['ArrowDown']) {
            player.y += player.speed;
            player.direction = 'down';
        }
        if (keys['ArrowLeft']) {
            player.x -= player.speed;
            player.direction = 'left';
        }
        if (keys['ArrowRight']) {
            player.x += player.speed;
            player.direction = 'right';
        }
    }
    
    const room = rooms[currentRoom];
    for (let wall of room.walls) {
        if (checkCollision(player, wall)) {
            player.x = prevX;
            player.y = prevY;
        }
    }
    
    player.x = Math.max(48, Math.min(GAME_WIDTH - 48 - player.width, player.x));
    player.y = Math.max(48, Math.min(GAME_HEIGHT - 48 - player.height, player.y));
    
    if (player.attacking) {
        player.attackTimer--;
        if (player.attackTimer <= 0) {
            player.attacking = false;
        }
    }
    
    if (player.invulnerable) {
        player.invulnerableTimer--;
        if (player.invulnerableTimer <= 0) {
            player.invulnerable = false;
        }
    }
    
    if (player.x < 48) {
        if (currentRoom > 0) {
            loadRoom(currentRoom - 1);
            player.x = GAME_WIDTH - 80;
        }
    } else if (player.x > GAME_WIDTH - 80) {
        if (currentRoom < rooms.length - 1) {
            loadRoom(currentRoom + 1);
            player.x = 48;
        }
    }
    
    updateHUD();
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        enemy.moveTimer++;
        if (enemy.moveTimer > 60) {
            enemy.direction = Math.random() > 0.5 ? 1 : -1;
            enemy.movePattern = Math.random();
            enemy.moveTimer = 0;
        }
        
        const prevX = enemy.x;
        const prevY = enemy.y;
        
        if (enemy.movePattern < 0.5) {
            enemy.x += enemy.speed * enemy.direction;
        } else {
            enemy.y += enemy.speed * enemy.direction;
        }
        
        const room = rooms[currentRoom];
        for (let wall of room.walls) {
            if (checkCollision(enemy, wall)) {
                enemy.x = prevX;
                enemy.y = prevY;
                enemy.direction *= -1;
            }
        }
        
        if (enemy.x < 48 || enemy.x > GAME_WIDTH - 80) {
            enemy.x = prevX;
            enemy.direction *= -1;
        }
        if (enemy.y < 48 || enemy.y > GAME_HEIGHT - 80) {
            enemy.y = prevY;
            enemy.direction *= -1;
        }
        
        if (player.attacking) {
            const swordHitbox = getSwordHitbox();
            if (checkCollision(enemy, swordHitbox)) {
                enemy.health--;
                if (enemy.health <= 0) {
                    enemies.splice(i, 1);
                    if (Math.random() > 0.5) {
                        items.push({
                            x: enemy.x,
                            y: enemy.y,
                            width: 24,
                            height: 24,
                            type: Math.random() > 0.7 ? 'heart' : 'rupee',
                            collected: false
                        });
                    }
                }
            }
        }
        
        if (!player.invulnerable && checkCollision(player, enemy)) {
            player.health--;
            player.invulnerable = true;
            player.invulnerableTimer = 60;
            updateHUD();
            
            if (player.health <= 0) {
                gameRunning = false;
                alert('Game Over! Puntuación: ' + player.rupees);
                resetGame();
            }
        }
    }
}

function updateItems() {
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        
        if (!item.collected && checkCollision(player, item)) {
            if (item.type === 'heart') {
                player.health = Math.min(player.maxHealth, player.health + 2);
            } else if (item.type === 'rupee') {
                player.rupees++;
            }
            items.splice(i, 1);
            updateHUD();
        }
    }
}

function getSwordHitbox() {
    const hitbox = { width: 24, height: 24 };
    
    switch (player.direction) {
        case 'up':
            hitbox.x = player.x + 4;
            hitbox.y = player.y - 24;
            break;
        case 'down':
            hitbox.x = player.x + 4;
            hitbox.y = player.y + player.height;
            break;
        case 'left':
            hitbox.x = player.x - 24;
            hitbox.y = player.y + 4;
            break;
        case 'right':
            hitbox.x = player.x + player.width;
            hitbox.y = player.y + 4;
            break;
    }
    
    return hitbox;
}

function checkCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function draw() {
    ctx.fillStyle = COLORS.grass;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    ctx.fillStyle = COLORS.darkGrass;
    for (let x = 0; x < GAME_WIDTH; x += TILE_SIZE) {
        for (let y = 0; y < GAME_HEIGHT; y += TILE_SIZE) {
            if ((x + y) % (TILE_SIZE * 2) === 0) {
                ctx.fillRect(x + 10, y + 10, 8, 8);
            }
        }
    }
    
    const room = rooms[currentRoom];
    ctx.fillStyle = COLORS.wall;
    for (let wall of room.walls) {
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        ctx.fillStyle = COLORS.darkWall;
        ctx.fillRect(wall.x + 4, wall.y + 4, wall.width - 8, wall.height - 8);
        ctx.fillStyle = COLORS.wall;
    }
    
    for (let item of items) {
        if (item.type === 'heart') {
            ctx.fillStyle = COLORS.heart;
            ctx.beginPath();
            ctx.arc(item.x + 8, item.y + 8, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(item.x + 16, item.y + 8, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(item.x, item.y + 8, 24, 12);
        } else if (item.type === 'rupee') {
            ctx.fillStyle = COLORS.rupee;
            ctx.beginPath();
            ctx.moveTo(item.x + 12, item.y);
            ctx.lineTo(item.x + 24, item.y + 12);
            ctx.lineTo(item.x + 12, item.y + 24);
            ctx.lineTo(item.x, item.y + 12);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    for (let enemy of enemies) {
        ctx.fillStyle = COLORS.enemy;
        if (enemy.type === 'octorok') {
            ctx.fillRect(enemy.x + 4, enemy.y + 8, 24, 20);
            ctx.fillRect(enemy.x + 8, enemy.y, 16, 16);
            ctx.fillStyle = COLORS.black;
            ctx.fillRect(enemy.x + 10, enemy.y + 4, 4, 4);
            ctx.fillRect(enemy.x + 18, enemy.y + 4, 4, 4);
        } else {
            ctx.fillRect(enemy.x, enemy.y, 32, 32);
            ctx.fillStyle = COLORS.black;
            ctx.fillRect(enemy.x + 8, enemy.y + 8, 6, 6);
            ctx.fillRect(enemy.x + 18, enemy.y + 8, 6, 6);
        }
    }
    
    if (!player.invulnerable || Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.fillStyle = COLORS.playerTunic;
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.fillStyle = COLORS.player;
        ctx.fillRect(player.x + 8, player.y + 8, 16, 8);
        ctx.fillStyle = '#ffdbac';
        ctx.fillRect(player.x + 10, player.y + 4, 12, 12);
        ctx.fillStyle = COLORS.black;
        ctx.fillRect(player.x + 12, player.y + 8, 2, 2);
        ctx.fillRect(player.x + 18, player.y + 8, 2, 2);
    }
    
    if (player.attacking) {
        ctx.fillStyle = COLORS.sword;
        const swordHitbox = getSwordHitbox();
        if (player.direction === 'up' || player.direction === 'down') {
            ctx.fillRect(swordHitbox.x, swordHitbox.y, 8, 24);
        } else {
            ctx.fillRect(swordHitbox.x, swordHitbox.y, 24, 8);
        }
    }
}

function updateHUD() {
    const healthDiv = document.getElementById('health');
    healthDiv.innerHTML = '❤️'.repeat(Math.ceil(player.health / 2));
    
    const rupeeCount = document.getElementById('rupeeCount');
    rupeeCount.textContent = player.rupees;
}

function resetGame() {
    player.x = GAME_WIDTH / 2;
    player.y = GAME_HEIGHT / 2;
    player.health = 6;
    player.rupees = 0;
    player.attacking = false;
    player.invulnerable = false;
    currentRoom = 0;
    loadRoom(0);
    gameRunning = true;
    updateHUD();
}

function gameLoop() {
    if (gameRunning) {
        updatePlayer();
        updateEnemies();
        updateItems();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

loadRoom(0);
updateHUD();
gameLoop();