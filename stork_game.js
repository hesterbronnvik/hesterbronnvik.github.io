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
    // WORLD
    // -----------------------
    const groundY = 260;
    let cameraX = 0;

    // -----------------------
    // BIOME ROUTE (YOUR DESIGN)
    // -----------------------
    const biomeRoute = [
        { name: "farmland", length: 150 },
        { name: "mountains", length: 150 },
        { name: "farmland", length: 500 },
        { name: "mountains", length: 150 },
        { name: "farmland", length: 500 },
        { name: "sea", length: 140 },
        { name: "desert", length: 1000 },
        { name: "farmland", length: 1000 }
    ];

    let biomeIndex = 0;
    let biomeProgress = 0;

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

    // parallax
    let cloudsX = 0;
    let farLayerX = 0;

    const gravity = 0.7;
    const speed = 0.06;

    // -----------------------
    // PLAYER (FLYING STORK)
    // -----------------------
    const player = {
        x: 50,
        y: groundY - 90,
        width: 40,
        height: 40,
        velocityY: 0,
        jumping: false
    };

    // -----------------------
    // REGION SYSTEM (YOUR FUNCTION)
    // -----------------------
    function getRegion(distanceKm) {

        if (distanceKm < 150) return "Central Europe";
        if (distanceKm < 300) return "Alps";
        if (distanceKm < 800) return "France";
        if (distanceKm < 950) return "Pyrenees";
        if (distanceKm < 1450) return "Iberia";
        if (distanceKm < 1590) return "Mediterranean Sea";
        if (distanceKm < 2590) return "North Africa";
        if (distanceKm < 3590) return "Sahel";
        return "Deep Migration Route";
    }

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

        obstacles.push({
            type,
            x: cameraX + canvas.width + 200,
            y: type === "powerline" ? groundY - 60 : Math.random() * 80 + 20,
            width: type === "powerline" ? 80 : 90,
            height: type === "powerline" ? 20 : 60,
            hitbox: type === "powerline"
                ? { xOffset: 0, yOffset: -5, width: 80, height: 10 }
                : { xOffset: 10, yOffset: 10, width: 60, height: 40 }
        });
    }

    // -----------------------
    // RESTART
    // -----------------------
    function restart() {

        gameState = STATE.PLAYING;

        distance = 0;
        difficulty = 1;
        cameraX = 0;

        obstacles = [];
        obstacleTimer = 0;

        weather = "clear";
        weatherTimer = 0;
        lightningFlash = 0;
        lightningTimer = 0;

        biomeIndex = 0;
        biomeProgress = 0;

        player.y = groundY - 90;
        player.velocityY = 0;
        player.jumping = false;
    }

    // -----------------------
    // UPDATE
    // -----------------------
    function update() {

        // CAMERA movement
        const weatherSpeed = weather === "storm" ? 1.3 : weather === "cloudy" ? 1.1 : 1;
        cameraX += 6 * difficulty * weatherSpeed;

        // PLAYER physics (flying feel)
        player.velocityY += gravity;
        player.y += player.velocityY;

        const maxY = groundY - 90;

        if (player.y > maxY) {
            player.y = maxY;
            player.velocityY = 0;
            player.jumping = false;
        }

        // DISTANCE + SCORE
        distance += speed;
        scoreEl.textContent = Math.floor(distance) + " km";

        // 🔥 SLOW + CONTROLLED DIFFICULTY
        difficulty = 1 + Math.pow(distance / 220, 1.15);

        // BIOME ROUTE PROGRESSION
        biomeProgress += speed;

        if (biomeProgress > biomeRoute[biomeIndex].length) {
            biomeProgress = 0;
            biomeIndex++;

            if (biomeIndex >= biomeRoute.length) {
                biomeIndex = biomeRoute.length - 1;
            }
        }

        // PARALLAX
        cloudsX -= 0.2;
        farLayerX -= 0.6;

        // OBSTACLES
        obstacleTimer++;
        const spawnRate = Math.max(45, 110 / difficulty);

        if (obstacleTimer > spawnRate) {
            createObstacle();
            obstacleTimer = 0;
        }

        obstacles = obstacles.filter(o => (o.x - cameraX) < canvas.width + 300);

        // WEATHER
        weatherTimer++;
        if (weatherTimer > 700) {
            weatherTimer = 0;
            const r = Math.random();
            weather = r < 0.5 ? "clear" : r < 0.8 ? "cloudy" : "storm";
        }

        // LIGHTNING
        if (weather === "storm") {
            lightningTimer++;
            if (lightningTimer > 80 + Math.random() * 140) {
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
                x: (o.x - cameraX) + (h.xOffset || 0),
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
    // BIOME RENDERING
    // -----------------------
    function drawBiome(biome) {

        let sky = "#F8F9F2";

        if (biome === "farmland") sky = "#F2F7E6";
        if (biome === "mountains") sky = "#D6D3D1";
        if (biome === "sea") sky = "#A7D8FF";
        if (biome === "desert") sky = "#F5D7A1";

        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (biome === "farmland") {
            ctx.fillStyle = "#B7D07A";
            for (let i = 0; i < canvas.width; i += 40) {
                ctx.fillRect((i + farLayerX - cameraX * 0.2) % canvas.width, groundY, 20, 60);
            }
        }

        if (biome === "mountains") {
            ctx.fillStyle = "#9CA3AF";
            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                ctx.moveTo((i * 180 + farLayerX - cameraX * 0.1) % canvas.width, groundY);
                ctx.lineTo((i * 180 + 80 + farLayerX - cameraX * 0.1) % canvas.width, 140);
                ctx.lineTo((i * 180 + 160 + farLayerX - cameraX * 0.1) % canvas.width, groundY);
                ctx.fill();
            }
        }

        if (biome === "sea") {
            ctx.fillStyle = "#60A5FA";
            for (let i = 0; i < canvas.width; i += 30) {
                let waveY = groundY - 40 + Math.sin(i * 0.05) * 5;
                ctx.fillRect((i + farLayerX - cameraX * 0.15) % canvas.width, waveY, 20, 20);
            }
        }

        if (biome === "desert") {
            ctx.fillStyle = "#E7B66C";
            for (let i = 0; i < canvas.width; i += 80) {
                ctx.beginPath();
                ctx.arc((i + farLayerX - cameraX * 0.2) % canvas.width, groundY, 40, 0, Math.PI);
                ctx.fill();
            }
        }
    }

    // -----------------------
    // DRAW
    // -----------------------
    function draw() {

        const biome = biomeRoute[biomeIndex].name;

        drawBiome(biome);

        if (lightningFlash > 0) {
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        if (gameState === STATE.START) {
            ctx.fillStyle = "#000";
            ctx.font = "30px Arial";
            ctx.fillText("Press SPACE to Start", 200, 120);
            return;
        }

        if (gameState === STATE.GAMEOVER) {

            const region = getRegion(distance);

            ctx.fillStyle = "rgba(0,0,0,0.4)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#fff";
            ctx.font = "36px Arial";

            ctx.fillText(
                Math.floor(distance) + " km, " + region,
                120,
                120
            );

            ctx.font = "20px Arial";
            ctx.fillText("Press SPACE to Restart", 200, 160);
            return;
        }

        // PLAYER
        const flightBob = Math.sin(distance * 2) * 2;

        ctx.drawImage(
            storkImg,
            player.x,
            player.y + flightBob,
            player.width,
            player.height
        );

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
