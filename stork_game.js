document.addEventListener("DOMContentLoaded", () => {

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const scoreEl = document.getElementById("score");

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
    // GAME STATE (single source of truth)
    // -----------------------
    const STATE = {
        START: "start",
        PLAYING: "playing",
        GAMEOVER: "gameover"
    };

    let gameState = STATE.START;

    let distance = 0;
    let difficulty = 1;

    let obstacles = [];
    let obstacleTimer = 0;

    let weather = "clear";
    let weatherTimer = 0;

    let lightningFlash = 0;
    let lightningTimer = 0;

    const gravity = 0.7;
    const speed = 0.06;

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

        if (e.code !== "Space" && e.code !== "ArrowUp") return;

        e.preventDefault();

        if (gameState === STATE.START) {
            gameState = STATE.PLAYING;
            return;
        }

        if (gameState === STATE.GAMEOVER) {
            restart();
            return;
        }

        jump();
    });

    function jump() {
        if (!player.jumping && gameState === STATE.PLAYING) {
            player.velocityY = -12;
            player.jumping = true;
        }
    }

    // -----------------------
    // OBSTACLES
    // -----------------------
    function createObstacle() {

        const type = Math.random() < 0.5 ? "powerline" : "storm";

        if (type === "powerline") {
            obstacles.push({
                type,
                x: canvas.width,
                y: 180,
                width: 80,
                height: 20,
                hitbox: { xOffset: 0, yOffset: -5, width: 80, height: 10 }
            });
        } else {
            obstacles.push({
                type,
                x: canvas.width,
                y: Math.random() * 80 + 20,
                width: 90,
                height: 60,
                hitbox: { xOffset: 10, yOffset: 10, width: 60, height: 40 }
            });
        }
    }

    // -----------------------
    // RESTART (ONLY RESET STATE)
    // -----------------------
    function restart() {

        gameState = STATE.PLAYING;

        distance = 0;
        difficulty = 1;

        obstacles = [];
        obstacleTimer = 0;

        weather = "clear";
        weatherTimer = 0;

        lightningFlash = 0;
        lightningTimer = 0;

        player.y = 170;
        player.velocityY = 0;
        player.jumping = false;
    }

    // -----------------------
    // UPDATE
    // -----------------------
    function update() {

        // PLAYER physics
        player.velocityY += gravity;
        player.y += player.velocityY;

        if (player.y > 170) {
            player.y = 170;
            player.velocityY = 0;
            player.jumping = false;
        }

        // SCORE
        distance += speed;
        scoreEl.textContent = Math.floor(distance) + " km";
        difficulty = 1 + distance / 100;

        // OBSTACLES
        obstacleTimer++;
        const spawnRate = Math.max(35, 90 / difficulty);

        if (obstacleTimer > spawnRate) {
            createObstacle();
            obstacleTimer = 0;
        }

        // WEATHER
        weatherTimer++;
        if (weatherTimer > 600) {
            weatherTimer = 0;

            const r = Math.random();
            weather = r < 0.5 ? "clear" : r < 0.8 ? "cloudy" : "storm";
        }

        let weatherSpeed = weather === "storm" ? 1.3 : weather === "cloudy" ? 1.1 : 1;

        obstacles.forEach(o => o.x -= 6 * difficulty * weatherSpeed);
        obstacles = obstacles.filter(o => o.x + o.width > 0);

        // LIGHTNING
        if (weather === "storm") {
            lightningTimer++;
            if (lightningTimer > 60 + Math.random() * 120) {
                lightningFlash = 6;
                lightningTimer = 0;
            }
        }

        if (lightningFlash > 0) lightningFlash--;

        // COLLISION
        const p = {
            x: player.x + 10,
            y: player.y + 8,
            width: player.width - 20,
            height: player.height - 15
        };

        for (let o of obstacles) {

            const h = o.hitbox || o;

            const ob = {
                x: o.x + (h.xOffset || 0),
                y: o.y + (h.yOffset || 0),
                width: h.width,
                height: h.height
            };

            if (
                p.x < ob.x + ob.width &&
                p.x + p.width > ob.x &&
                p.y < ob.y + ob.height &&
                p.y + p.height > ob.y
            ) {
                gameState = STATE.GAMEOVER;
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

        // LIGHTNING FLASH
        if (lightningFlash > 0) {
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // START SCREEN
        if (gameState === STATE.START) {
            ctx.fillStyle = "#000";
            ctx.font = "30px Arial";
            ctx.fillText("Press SPACE to Start", 200, 120);
            return;
        }

        // GAME OVER SCREEN
        if (gameState === STATE.GAMEOVER) {
            ctx.fillStyle = "rgba(0,0,0,0.4)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#fff";
            ctx.font = "40px Arial";
            ctx.fillText("DEATH", 220, 120);

            ctx.font = "20px Arial";
            ctx.fillText("Press SPACE to Restart", 200, 160);
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
    // GAME LOOP (ONLY ONE EVER)
    // -----------------------
    function gameLoop() {

        if (gameState === STATE.PLAYING) {
            update();
        }

        draw();
        requestAnimationFrame(gameLoop);
    }

    // -----------------------
    // START GAME
    // -----------------------
    gameLoop();
});
