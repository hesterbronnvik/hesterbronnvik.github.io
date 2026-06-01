document.addEventListener("DOMContentLoaded", () => {

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const scoreEl = document.getElementById("score");

    // -----------------------
    // IMAGES
    // -----------------------
    const storkImg = new Image();
    storkImg.src = "stork8bit.png";

    const powerlineImg = new Image();
    powerlineImg.src = "pylon8bit.png";

    const stormImg = new Image();
    stormImg.src = "storm8bit.png";

    // -----------------------
    // WORLD SETTINGS
    // -----------------------
    const groundY = 260; // 🐦 KEY FIX: world shifted down

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

    // parallax
    let cloudsX = 0;
    let farLayerX = 0;
    let midLayerX = 0;

    const gravity = 0.7;
    const speed = 0.06;

    // -----------------------
    // PLAYER (NOW FLYING ABOVE GROUND)
    // -----------------------
    const player = {
        x: 50,
        y: groundY - 90, // 🐦 flying height
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
                y: groundY - 60, // 🐦 anchored to ground
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

        player.y = groundY - 90; // 🐦 reset flying height
        player.velocityY = 0;
        player.jumping = false;
    }

    // -----------------------
    // UPDATE
    // -----------------------
    function update() {

        // PLAYER physics (flying above ground)
        player.velocityY += gravity;
        player.y += player.velocityY;

        const maxFlyHeight = groundY - 90;

        if (player.y > maxFlyHeight) {
            player.y = maxFlyHeight;
            player.velocityY = 0;
            player.jumping = false;
        }

        // SCORE
        distance += speed;
        scoreEl.textContent = Math.floor(distance) + " km";
        difficulty = 1 + distance / 100;

        // BIOMES
        biomeDistance += speed;
        if (biomeDistance > 80) {
            biomeDistance = 0;
            biomeIndex = (biomeIndex + 1) % biomes.length;
        }

        // PARALLAX
        cloudsX -= 0.2;
        farLayerX -= 0.6;
        midLayerX -= 1.2;

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
    // DRAW BIOMES (GROUND FIXED)
    // -----------------------
    function drawBiome(biome) {

        // SKY BASE
        let sky = "#F8F9F2";

        if (biome === "farmland") sky = "#F2F7E6";
        if (biome === "mountains") sky = "#D6D3D1";
        if (biome === "sea") sky = "#A7D8FF";
        if (biome === "desert") sky = "#F5D7A1";

        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // FARMLAND
        if (biome === "farmland") {

            ctx.fillStyle = "rgba(255,255,255,0.7)";
            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                ctx.arc((i * 140 + cloudsX * 10) % canvas.width, 60 + i * 8, 18, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = "#B7D07A";
            for (let i = 0; i < canvas.width; i += 40) {
                ctx.fillRect((i + farLayerX) % canvas.width, groundY, 20, 60);
            }
        }

        // MOUNTAINS
        if (biome === "mountains") {

            ctx.fillStyle = "#9CA3AF";
            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                ctx.moveTo((i * 180 + farLayerX) % canvas.width, groundY);
                ctx.lineTo((i * 180 + 80 + farLayerX) % canvas.width, 140);
                ctx.lineTo((i * 180 + 160 + farLayerX) % canvas.width, groundY);
                ctx.fill();
            }
        }

        // SEA
        if (biome === "sea") {

            ctx.fillStyle = "#60A5FA";
            for (let i = 0; i < canvas.width; i += 30) {
                let waveY = groundY - 40 + Math.sin((i + cloudsX) * 0.05) * 5;
                ctx.fillRect((i + farLayerX) % canvas.width, waveY, 20, 20);
            }
        }

        // DESERT
        if (biome === "desert") {

            ctx.fillStyle = "#E7B66C";
            for (let i = 0; i < canvas.width; i += 80) {
                ctx.beginPath();
                ctx.arc((i + farLayerX) % canvas.width, groundY, 40, 0, Math.PI);
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

        // START
        if (gameState === STATE.START) {
            ctx.fillStyle = "#000";
            ctx.font = "30px Arial";
            ctx.fillText("Press SPACE to Start", 200, 120);
            return;
        }

        // GAME OVER
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

        // PLAYER (flying feel)
        const flightBob = Math.sin(distance * 2) * 2;

        ctx.drawImage(
            storkImg,
            player.x,
            player.y + flightBob,
            player.width,
            player.height
        );

        // OBSTACLES
        for (let o of obstacles) {
            if (o.type === "powerline") {
                ctx.drawImage(powerlineImg, o.x, o.y - 60, o.width, 80);
            } else {
                ctx.drawImage(stormImg, o.x, o.y, o.width, o.height);
            }
        }

        // BIOME LABEL
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
