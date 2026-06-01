console.log("stork_game.js loaded");
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Stork Game</title>

<style>
body {
    margin: 0;
    background: #f5f5f5;
    font-family: Arial, sans-serif;
    display: flex;
    justify-content: center;
    padding-top: 40px;
}

#gameContainer {
    text-align: center;
}

canvas {
    border: 2px solid #333;
    background: white;
}

#score {
    margin-top: 10px;
    font-size: 24px;
}
</style>
</head>

<body>

<div id="gameContainer">
    <canvas id="game" width="800" height="250"></canvas>
    <div id="score">Score: 0</div>
</div>

<script>
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreDisplay = document.getElementById("score");

let gameOver = false;
let score = 0;

const gravity = 0.7;

const player = {
    x: 50,
    y: 170,
    width: 40,
    height: 40,
    velocityY: 0,
    jumping: false
};

let obstacles = [];
let obstacleTimer = 0;

function createObstacle() {
    obstacles.push({
        x: canvas.width,
        y: 170,
        width: 20,
        height: 40
    });
}

function jump() {
    if (!player.jumping && !gameOver) {
        player.velocityY = -12;
        player.jumping = true;
    }
}

document.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();

        if (gameOver) {
            restart();
        } else {
            jump();
        }
    }
});

function restart() {
    gameOver = false;
    score = 0;

    player.y = 170;
    player.velocityY = 0;
    player.jumping = false;

    obstacles = [];

    requestAnimationFrame(gameLoop);
}

function update() {

    player.velocityY += gravity;
    player.y += player.velocityY;

    if (player.y > 170) {
        player.y = 170;
        player.velocityY = 0;
        player.jumping = false;
    }

    obstacleTimer++;

    if (obstacleTimer > 90) {
        createObstacle();
        obstacleTimer = 0;
    }

    obstacles.forEach(obstacle => {
        obstacle.x -= 6;
    });

    obstacles = obstacles.filter(o => o.x + o.width > 0);

    obstacles.forEach(obstacle => {
        if (
            player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y
        ) {
            gameOver = true;
        }
    });

    score++;
    scoreDisplay.textContent = "Score: " + score;
}

function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ground
    ctx.beginPath();
    ctx.moveTo(0, 210);
    ctx.lineTo(canvas.width, 210);
    ctx.stroke();

    // Player
    ctx.fillStyle = "green";
    ctx.fillRect(
        player.x,
        player.y,
        player.width,
        player.height
    );

    // Obstacles
    ctx.fillStyle = "red";

    obstacles.forEach(obstacle => {
        ctx.fillRect(
            obstacle.x,
            obstacle.y,
            obstacle.width,
            obstacle.height
        );
    });

    if (gameOver) {
        ctx.fillStyle = "black";
        ctx.font = "40px Arial";
        ctx.fillText("GAME OVER", 280, 100);

        ctx.font = "20px Arial";
        ctx.fillText(
            "Press Space to Restart",
            290,
            140
        );
    }
}

function gameLoop() {

    if (!gameOver) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    } else {
        draw();
    }
}

gameLoop();
</script>

</body>
</html>
