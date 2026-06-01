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
    // GAME STATE
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

    // weather
    let weather = "clear";
    let weatherTimer = 0;
    let lightningFlash = 0;
    let lightningTimer = 0;

    // biomes
    const biomes = ["farmland", "mountains", "sea", "desert"];
    let biomeIndex = 0;
    let biomeDistance = 0;

    // parallax layers
    let cloudsX = 0;
    let farLayerX = 0;
    let midLayerX = 0;

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
    // RESTART
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

        biomeIndex = 0;
        biomeDistance = 0;

        cloudsX = 0;
        farLayerX = 0;
        midLayerX = 0;

        player.y = 170;
        player.velocityY = 0;
        player.jumping = false;
    }

    // -----------------------
    // UPDATE
    // -----------------------
    function update() {

        // physics
        player.velocityY += gravity;
        player.y += player.velocityY;

        if (player.y > 170) {
            player.y = 170;
            player.velocityY = 0;
            player.jumping = false;
        }

        // score
        distance += speed;
        scoreEl.textContent = Math.floor(distance) + " km";
        difficulty = 1 + distance / 100;

        // biome switching
        biomeDistance += speed;
        if (biomeDistance > 80) {
            biomeDistance = 0;
            biomeIndex = (biomeIndex + 1) % biomes.length;
        }

        // parallax motion
        cloudsX -= 0.2;
        farLayerX -= 0.6;
        midLayerX -= 1.2;

        // obstacle spawn
        obstacleTimer++;
        const spawnRate = Math.max(35, 90 / difficulty);

        if (obstacleTimer > spawnRate) {
            createObstacle();
            obstacleTimer = 0;
        }

        // weather
        weatherTimer++;
        if (weatherTimer > 600) {
            weatherTimer = 0;
            const r = Math.random();
            weather = r < 0.5 ? "clear" : r < 0.8 ? "cloudy" : "storm";
        }

        let weatherSpeed = weather === "storm" ? 1.3 : weather === "cloudy" ? 1.1 : 1;

        // obstacles move
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
                gameState = "gameover";
            }
        }
    }

    // -----------------------
    // DRAW BIOMES
    // -----------------------
    function drawBiome(biome) {

        if (biome === "farmland") {

            ctx.fillStyle = "#F2F7E6";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // clouds
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                ctx.arc((i * 140 + cloudsX * 10) % canvas.width, 60 + i * 8, 18, 0, Math.PI * 2);
                ctx.fill();
            }

            // fields
            ctx.fillStyle = "#B7D07A";
            for (let i = 0; i < canvas.width; i += 40) {
                ctx.fillRect((i + farLayerX) % canvas.width, 180, 20, 40);
            }
        }

        if (biome === "mountains") {

            ctx.fillStyle = "#D6D3D1";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#9CA3AF";
            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                ctx.moveTo((i * 180 + farLayerX) % canvas.width, 200);
                ctx.lineTo((i * 180 + 80 + farLayerX) % canvas.width, 120);
                ctx.lineTo((i * 180 + 160 + farLayerX) % canvas.width, 200);
                ctx.fill();
            }
        }

        if (biome === "sea") {

            ctx.fillStyle = "#A7D8FF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#60A5FA";
            for (let i = 0; i < canvas.width; i += 30) {
                let waveY = 180 + Math.sin((i + cloudsX) * 0.05) * 5;
                ctx.fillRect((i + farLayerX) % canvas.width, waveY, 20, 20);
            }
        }

        if (biome === "desert") {

            ctx.fillStyle = "#F5D7A1";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#E7B66C";
            for (let i = 0; i < canvas.width; i += 80) {
                ctx.beginPath();
                ctx.arc((i + farLayerX) % canvas.width, 200, 40, 0, Math.PI);
                ctx.fill();
            }
        }
    }

    // -----------------------
    // DRAW
    // -----------------------
    function draw() {

        const biome = biomes[biomeIndex];

        drawBiome(biome);

        if (lightningFlash > 0) {
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // start screen
        if (gameState === STATE.START) {
            ctx.fillStyle = "#000";
            ctx.font = "30px Arial";
            ctx.fillText("Press SPACE to Start", 200, 120);
            return;
        }

        // game over
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

        // player
        ctx.drawImage(storkImg, player.x, player.y, player.width, player.height);

        // obstacles
        for (let o of obstacles) {
            if (o.type === "powerline") {
                ctx.drawImage(powerlineImg, o.x, o.y - 60, o.width, 80);
            } else {
                ctx.drawImage(stormImg, o.x, o.y, o.width, o.height);
            }
        }

        // biome label
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.font = "16px Arial";
        ctx.fillText(biome.toUpperCase(), 20, 60);
    }

    // -----------------------
    // LOOP
    // -----------------------
    function loop() {
        if (gameState === STATE.PLAYING) update();
        draw();
        requestAnimationFrame(loop);
    }

    loop();
});
