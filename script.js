const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let currentLevel = 'kolay';
let isRunning = false;
let bullets = [];

const config = {
    kolay: { hp: 4200, react: 1000, acc: 0.5, speed: 3, icon: '🌱', color: '#00f2ff', desc: 'Başlangıç' },
    orta: { hp: 5000, react: 600, acc: 0.7, speed: 5, icon: '🔥', color: '#ffaa00', desc: 'Deneyimli' },
    zor: { hp: 6000, react: 300, acc: 0.85, speed: 7, icon: '💀', color: '#ff4400', desc: 'Profesyonel' },
    efsane: { hp: 8000, react: 100, acc: 0.98, speed: 9, icon: '👑', color: '#aa00ff', desc: 'Master (Aimbot Aktif)' }
};

const player = { x: canvas.width/2, y: canvas.height - 120, hp: 5600, speed: 6, radius: 25, vx: 0 };
const bot = { x: canvas.width/2, y: 120, hp: 4200, speed: 4, radius: 25, lastShot: 0 };

function updateSelection(lvl) {
    currentLevel = lvl;
    const c = config[lvl];
    document.getElementById('l-name').innerText = lvl.toUpperCase();
    document.getElementById('l-icon').innerText = c.icon;
    document.getElementById('l-icon').style.background = c.color;
    document.getElementById('st-hp').innerText = c.hp;
    document.getElementById('st-react').innerText = c.react + 'ms';
    document.getElementById('st-acc').innerText = '%' + (c.acc * 100);
    document.getElementById('l-desc').innerText = c.desc;
    const btn = document.querySelector('.start-btn');
    btn.innerText = lvl.toUpperCase() + 'I BAŞLAT';
    btn.style.background = c.color;
    
    if(lvl === 'efsane') {
        document.getElementById('special-feat').innerText = "FULL AIMBOT & DODGE";
        document.getElementById('special-feat').style.color = "#ff00ff";
    }
}

function initGame() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-controls').classList.remove('hidden');
    bot.hp = config[currentLevel].hp;
    bot.speed = config[currentLevel].speed;
    isRunning = true;
    requestAnimationFrame(gameLoop);
}

function shoot(from, targetX, targetY, isBot = false) {
    let count = 0;
    const burst = setInterval(() => {
        const angle = Math.atan2(targetY - from.y, targetX - from.x);
        bullets.push({
            x: from.x, y: from.y,
            vx: Math.cos(angle) * 14,
            vy: Math.sin(angle) * 14,
            owner: isBot ? 'bot' : 'player',
            color: isBot ? '#ff4444' : '#fff'
        });
        count++;
        if (count >= 6) clearInterval(burst);
    }, 70);
}

// Efsane Bot Yapay Zekası
function runBotAI() {
    const cfg = config[currentLevel];
    
    // AIMBOT: Oyuncunun gelecekteki konumunu tahmin et
    const predictionFactor = currentLevel === 'efsane' ? 15 : 0;
    const predictX = player.x + (player.vx * predictionFactor);
    
    if (Date.now() - bot.lastShot > cfg.react) {
        shoot(bot, predictX, player.y, true);
        bot.lastShot = Date.now();
    }

    // DODGE: Gelen mermilerden kaç
    bullets.forEach(b => {
        if (b.owner === 'player' && Math.abs(b.y - bot.y) < 250) {
            bot.x += b.x > bot.x ? -cfg.speed : cfg.speed;
        }
    });

    // Sınır Kontrolü
    bot.x = Math.max(50, Math.min(canvas.width - 50, bot.x));
}

function drawAimLine(from, toX, toY, color) {
    ctx.beginPath();
    ctx.setLineDash([10, 15]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 15;
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.setLineDash([]);
}

function gameLoop() {
    if(!isRunning) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Arka Plan Çizgileri
    ctx.strokeStyle = '#162636';
    for(let i=0; i<canvas.width; i+=50) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); ctx.stroke(); }

    // Bot Mantığı ve Aim Çubuğu
    runBotAI();
    if(currentLevel === 'efsane') {
        drawAimLine(bot, bot.x, canvas.height, 'rgba(255, 0, 0, 0.2)');
    }
    
    // Oyuncu Aim Çubuğu (Mouse/Touch yönüne)
    drawAimLine(player, player.x, 0, 'rgba(255, 255, 255, 0.1)');

    // Karakterleri Çiz
    ctx.fillStyle = config[currentLevel].color;
    ctx.beginPath(); ctx.arc(bot.x, bot.y, bot.radius, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#00f2ff';
    ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI*2); ctx.fill();

    // Mermileri Güncelle
    bullets.forEach((b, i) => {
        b.x += b.vx; b.y += b.vy;
        ctx.fillStyle = b.color;
        ctx.shadowBlur = 10; ctx.shadowColor = b.color;
        ctx.fillRect(b.x-2, b.y-5, 5, 15);
        ctx.shadowBlur = 0;

        // Hit Kontrolü
        if(b.owner === 'player' && Math.hypot(b.x-bot.x, b.y-bot.y) < 30) {
            bot.hp -= 210; bullets.splice(i, 1);
        } else if(b.owner === 'bot' && Math.hypot(b.x-player.x, b.y-player.y) < 30) {
            player.hp -= 210; bullets.splice(i, 1);
        }
    });

    document.getElementById('p-hp-ui').innerText = player.hp;
    if(bot.hp <= 0) { alert("Efsaneyi Yendin!"); location.reload(); }
    if(player.hp <= 0) { alert("Bot Kazandı!"); location.reload(); }

    requestAnimationFrame(gameLoop);
}

// Kontroller (Klavye Desteği)
window.addEventListener('keydown', e => {
    if(e.key === 'a') player.vx = -1;
    if(e.key === 'd') player.vx = 1;
});
window.addEventListener('keyup', () => player.vx = 0);
window.addEventListener('mousedown', (e) => {
    if(isRunning) shoot(player, e.clientX, e.clientY);
});
