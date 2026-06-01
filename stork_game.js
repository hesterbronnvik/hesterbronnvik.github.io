document.addEventListener("DOMContentLoaded", () => {

    console.log("stork_game.js loaded");

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    // -----------------------
    // IMAGES
    // -----------------------
    const storkImg = new Image();
    storkImg.src = "stork.png";

    const powerlineImg = new Image();
    powerlineImg.src = "tower.png";

    const stormImg = new Image();
    stormImg.src = "storm.png";

    // -----------------------
    // STATE
    // -----------------------
    let gameOver = false;
    let gameStarted = false;

    let distance = 0;
    const speed = 0.06;

    const scoreEl = document.getElementById("score");

    let obstacles = [];
    let obstacleTimer = 0;

    const gravity = 0.7;
    let difficulty = 1;

    let weather = "clear";
    let weatherTimer = 0;

    let lightningFlash = 0;
    let lightningTimer = 0;

    // -----------------------
    // PLAYER
    // -----------------------
    const player = {
        x: 50,
        y: 170,
        width: 40,
        height: 40,
        velocityY: 0,
        jumping: false
    };

    // -----------------------
    // INPUT
    // -----------------------
    document.addEventListener("keydown", (e) => {

        if (e.code === "Space" || e.code === "ArrowUp") {
            e.preventDefault();

            if (!gameStarted) {
                gameStarted = true;
                gameLoop();
                return;
            }

            if (gameOver) {
                restart();
            } else {
                jump();
            }
        }
    });

    function jump() {
        if (!player.jumping && !gameOver) {
            player.velocityY = -12;
            player.jumping = true;
        }
    }

    // -----------------------
    // OBSTACLES
    // -----------------------
    function createObstacle() {

        const types = ["powerline", "storm"];
        const type = types[Math.floor(Math.random() * types.length)];

        if (type === "powerline") {
            obstacles.push({
                type: "powerline",
                x: canvas.width,
                y: 180,
                width: 80,
                height: 20,
                hitbox: { xOffset: 0, yOffset: -5, width: 80, height: 10 }
            });
        } else {
            obstacles.push({
                type: "storm",
                x: canvas.width,
                y: Math.random() * 80 + 20,
                width: 90,
                height: 60,
                hitbox: { xOffset: 10, yOffset: 10, width: 60, height: 40 }
            });
        }
    }

    // -----------------------
    // RESTART
    // -----------------------
    function restart() {

        gameOver = false;
        distance = 0;

        player.y = 170;
        player.velocityY = 0;
        player.jumping = false;

        obstacles = [];
        obstacleTimer = 0;
    }

    // -----------------------
    // UPDATE
    // -----------------------
    function update() {

        // gravity
        player.velocityY += gravity;
        player.y += player.velocityY;

        if (player.y > 170) {
            player.y = 170;
            player.velocityY = 0;
            player.jumping = false;
        }

        // difficulty
        distance += speed;
        scoreEl.textContent = Math.floor(distance) + " km";
        difficulty = 1 + distance / 100;

        // spawn obstacles
        obstacleTimer++;
        if (obstacleTimer > Math.max(35, 90 / difficulty)) {
            createObstacle();
            obstacleTimer = 0;
        }

        // weather
        weatherTimer++;
        if (weatherTimer > 600) {
            weatherTimer = 0;
            const roll = Math.random();
            weather = roll < 0.5 ? "clear" : roll < 0.8 ? "cloudy" : "storm";
        }

        let weatherSpeed = weather === "storm" ? 1.3 : weather === "cloudy" ? 1.1 : 1;

        obstacles.forEach(o => o.x -= 6 * difficulty * weatherSpeed);
        obstacles = obstacles.filter(o => o.x + o.width > 0);

        // lightning
        if (weather === "storm") {
            lightningTimer++;
            if (lightningTimer > 60 + Math.random() * 120) {
                lightningFlash = 6;
                lightningTimer = 0;
            }
        }
        if (lightningFlash > 0) lightningFlash--;

        // collision
        const playerBox = {
            x: player.x + 10,
            y: player.y + 8,
            width: player.width - 20,
            height: player.height - 15
        };

        for (let o of obstacles) {

            const oBox = {
                x: o.x + (o.hitbox?.xOffset || 0),
                y: o.y + (o.hitbox?.yOffset || 0),
                width: o.hitbox?.width || o.width,
                height: o.hitbox?.height || o.height
            };

            if (
                playerBox.x < oBox.x + oBox.width &&
                playerBox.x + playerBox.width > oBox.x &&
                playerBox.y < oBox.y + oBox.height &&
                playerBox.y + playerBox.height > oBox.y
            ) {
                gameOver = true;
            }
        }
    }

    // -----------------------
    // DRAW
    // -----------------------
    function draw() {

        // BACKGROUND
        if (weather === "clear") ctx.fillStyle = "#F8F9F2";
        else if (weather === "cloudy") ctx.fillStyle = "#b8c6d6";
        else ctx.fillStyle = "#6b7c93";

        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (lightningFlash > 0) {
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // GAME OVER SCREEN
        if (gameOver) {
            ctx.fillStyle = "rgba(0,0,0,0.4)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#fff";
            ctx.font = "40px Arial";
            ctx.fillText("DEATH", 220, 120);

            ctx.font = "20px Arial";
            ctx.fillText("Press SPACE to Restart", 200, 160);
            return;
        }

        // START SCREEN
        if (!gameStarted) {
            ctx.fillStyle = "#000";
            ctx.font = "30px Arial";
            ctx.fillText("Press SPACE to Start", 200, 120);
            return;
        }

        // PLAYER
        ctx.drawImage(storkImg, player.x, player.y, player.width, player.height);

        // OBSTACLES
        for (let o of obstacles) {
            if (o.type === "powerline") {
                ctx.drawImage(powerlineImg, o.x, o.y - 60, o.width, 80);
            } else {
                ctx.drawImage(stormImg, o.x, o.y, o.width, o.height);
            }
        }
    }

    // -----------------------
    // LOOP
    // -----------------------
    function gameLoop() {

        if (!gameStarted) {
            draw();
            requestAnimationFrame(gameLoop);
            return;
        }

        if (!gameOver) {
            update();
            draw();
            requestAnimationFrame(gameLoop);
        } else {
            draw();
        }
    }

    // -----------------------
    // START
    // -----------------------
    Promise.all([
        new Promise(r => storkImg.onload = r),
        new Promise(r => powerlineImg.onload = r),
        new Promise(r => stormImg.onload = r)
    ]).then(() => {
        console.log("all images loaded");
        draw(); // show start screen
    });
});
