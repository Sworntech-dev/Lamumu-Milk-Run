const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const width = canvas.width;
const height = canvas.height;

// Karakter
const player = {
  x: width/2 - 20,
  y: height - 80,
  width: 40,
  height: 40,
  color: '#fff', // Lamumu beyazı
  speed: 5
};

// Engel ve süt şişeleri
let obstacles = [];
let milks = [];
let score = 0;
let gameOver = false;

// Tuş kontrol
const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

// Engel ve süt şişesi oluştur
function spawnItem() {
  if (Math.random() < 0.02) {
    obstacles.push({
      x: Math.random()*(width-40),
      y: -40,
      width: 40,
      height: 40,
      color: 'brown'
    });
  }
  if (Math.random() < 0.02) {
    milks.push({
      x: Math.random()*(width-20),
      y: -20,
      width: 20,
      height: 20,
      color: 'yellow'
    });
  }
}

// Çarpışma kontrolü
function checkCollision(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

// Oyun döngüsü
function gameLoop() {
  if (gameOver) return alert('Oyun Bitti! Puan: ' + score);

  ctx.clearRect(0,0,width,height);

  // Karakter hareket
  if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
  if (keys['ArrowRight'] && player.x < width - player.width) player.x += player.speed;
  if (keys['ArrowUp'] && player.y > 0) player.y -= player.speed;
  if (keys['ArrowDown'] && player.y < height - player.height) player.y += player.speed;

  // Engel ve süt şişeleri
  spawnItem();
  obstacles.forEach((obs,i) => {
    obs.y += 3;
    ctx.fillStyle = obs.color;
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

    if (checkCollision(player, obs)) gameOver = true;
    if (obs.y > height) obstacles.splice(i,1);
  });

  milks.forEach((milk,i) => {
    milk.y += 3;
    ctx.fillStyle = milk.color;
    ctx.fillRect(milk.x, milk.y, milk.width, milk.height);

    if (checkCollision(player, milk)) {
      score++;
      document.getElementById('score').innerText = score;
      milks.splice(i,1);
    }
    if (milk.y > height) milks.splice(i,1);
  });

  // Karakter çiz
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  requestAnimationFrame(gameLoop);
}

gameLoop();
