const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const restartBtn = document.getElementById("restartBtn");

let scoreEl = document.getElementById("score");
let levelEl = document.getElementById("level");
let highScoreEl = document.getElementById("highScore");
let livesEl = document.getElementById("lives");

// Game state
let x, y, dx, dy, paddleX;
let ballRadius = 8;
let paddleWidth = 90;
const paddleHeight = 10;

let rightPressed = false;
let leftPressed = false;
let score = 0;
let level = 1;
let lives = 3;
let gameRunning = true;

let highScore = localStorage.getItem("highScore") || 0;
highScoreEl.textContent = highScore;

// Bricks
let bricks = [];
let brickRowCount = 3;
let brickColumnCount = 7;
let brickWidth = 70;
let brickHeight = 20;
let brickPadding = 10;
let brickOffsetTop = 40;
let brickOffsetLeft = 25;

function init() {
  x = canvas.width / 2;
  y = canvas.height - 50;
  dx = 3 + level * 0.5;
  dy = -(3 + level * 0.5);
  paddleX = (canvas.width - paddleWidth) / 2;
  score = 0;
  lives = 3;
  level = 1;
  gameRunning = true;
  restartBtn.style.display = "none";
  createBricks();
  draw();
}

function createBricks() {
  bricks = [];
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
  }
}

document.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") rightPressed = true;
  if (e.key === "ArrowLeft") leftPressed = true;
});
document.addEventListener("keyup", e => {
  if (e.key === "ArrowRight") rightPressed = false;
  if (e.key === "ArrowLeft") leftPressed = false;
});
restartBtn.addEventListener("click", init);

function drawBricks() {
  const colors = [
    "#00ffff",
    "#00ff99",
    "#ff00cc",
    "#ffcc00",
    "#ff0066",
    "#33ff33",
  ];
  const color = colors[level % colors.length];

  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;

        const gradient = ctx.createLinearGradient(brickX, brickY, brickX + brickWidth, brickY + brickHeight);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, "#000");

        ctx.beginPath();
        ctx.rect(brickX, brickY, brickWidth, brickHeight);
        ctx.fillStyle = gradient;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

function drawBall() {
  ctx.beginPath();
  const glow = ctx.createRadialGradient(x, y, 1, x, y, ballRadius * 2);
  glow.addColorStop(0, "#fff");
  glow.addColorStop(1, "#00ffff");
  ctx.fillStyle = glow;
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.beginPath();
  const grad = ctx.createLinearGradient(paddleX, 0, paddleX + paddleWidth, 0);
  grad.addColorStop(0, "#00ffff");
  grad.addColorStop(1, "#0077ff");
  ctx.fillStyle = grad;
  ctx.rect(paddleX, canvas.height - paddleHeight - 15, paddleWidth, paddleHeight);
  ctx.fill();
  ctx.closePath();
}

function drawHUD() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
  livesEl.textContent = lives;
}

function collisionDetection() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
          dy = -dy;
          b.status = 0;
          score += 10;
          if (checkLevelCleared()) nextLevel();
        }
      }
    }
  }
}

function checkLevelCleared() {
  return bricks.flat().every(b => b.status === 0);
}

function nextLevel() {
  level++;
  dx += 1;
  dy -= 1;
  brickRowCount++;
  if (brickRowCount > 6) brickRowCount = 6;
  createBricks();
}

function loseLife() {
  lives--;
  if (lives > 0) {
    x = canvas.width / 2;
    y = canvas.height - 50;
    dx = 3 + level * 0.5;
    dy = -(3 + level * 0.5);
  } else {
    gameOver();
  }
}

function updateHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
    highScoreEl.textContent = highScore;
  }
}

function gameOver() {
  updateHighScore();
  gameRunning = false;
  ctx.font = "28px Orbitron";
  ctx.fillStyle = "#ff0033";
  ctx.textAlign = "center";
  ctx.fillText("💀 GAME OVER 💀", canvas.width / 2, canvas.height / 2);
  restartBtn.style.display = "block";
}

function draw() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  drawHUD();
  collisionDetection();

  // Ball movement and wall collision
  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx;
  if (y + dy < ballRadius) dy = -dy;
  else if (y + dy > canvas.height - ballRadius - 15) {
    if (x > paddleX && x < paddleX + paddleWidth) {
      const hitPoint = x - (paddleX + paddleWidth / 2);
      const angle = (hitPoint / (paddleWidth / 2)) * Math.PI / 3;
      dx = 5 * Math.sin(angle);
      dy = -5 * Math.cos(angle);
    } else if (y + dy > canvas.height) {
      loseLife();
    }
  }

  if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 6;
  else if (leftPressed && paddleX > 0) paddleX -= 6;

  x += dx;
  y += dy;
  requestAnimationFrame(draw);
}

init();
