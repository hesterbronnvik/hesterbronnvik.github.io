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
    const groundY = 260;

    let cameraX = 0;

    function getRegion(distanceKm) {

    if (distanceKm < 80) return "Central Europe";
    if (distanceKm < 200) return "Alps";
    if (distanceKm < 700) return "France";
    if (distanceKm < 1700) return "Iberia";
    if (distanceKm < 2700) return "North Africa";
    if (distanceKm < 4200) return "Sahara";
    if (distanceKm < 6700) return "Central Africa";
    if (distanceKm < 9000) return "Southern Africa";
    return "Deep Migration Route";
}

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

    const gravity = 0.7;
    const speed = 0.06;

    // -----------------------
    // PLAYER
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
                x: cameraX + canvas.width + 200,
                y: groundY - 60,
                width: 80,
                height: 20,
                hitbox: { xOffset: 0, yOffset: -5, width: 80, height: 10 }
            });
        } else {
            obstacles.push({
                type,
                x: cameraX + canvas.width + 200,
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

        cameraX = 0;

        obstacles = [];
        obstacleTimer = 0;

        weather = "clear";
        weatherTimer = 0;

        lightningFlash = 0;
        lightningTimer = 0;

        biomeIndex = 0;
        biomeDistance = 0;

        player.y = groundY - 90;
        player.velocityY = 0;
        player.jumping = false;
    }

    // -----------------------
    // UPDATE
    // -----------------------
    function update() {

        // camera moves forward
        cameraX += 6 * difficulty * (weather === "storm" ? 1.3 : weather === "cloudy" ? 1.1 : 1);

        // physics
        player.velocityY += gravity;
        player.y += player.velocityY;

        const maxY = groundY - 90;

        if (player.y > maxY) {
            player.y = maxY;
            player.velocityY = 0;
            player.jumping = false;
        }

        // distance + UI
        distance += speed;
        scoreEl.textContent = Math.floor(distance) + " km";

        // 🔥 SLOWER DIFFICULTY CURVE (IMPORTANT FIX)
        difficulty = 1 + Math.pow(distance / 200, 1.2);

        // biome switching
        biomeDistance += speed;
        if (biomeDistance > 80) {
            biomeDistance = 0;
            biomeIndex = (biomeIndex + 1) % biomes.length;
        }

        // parallax
        cloudsX -= 0.2;
        farLayerX -= 0.6;

        // spawn
        obstacleTimer++;
        const spawnRate = Math.max(45, 110 / difficulty); // slower + more survivable

        if (obstacleTimer > spawnRate) {
            createObstacle();
            obstacleTimer = 0;
        }

        // weather
        weatherTimer++;
        if (weatherTimer > 700) {
            weatherTimer = 0;
            const r = Math.random();
            weather = r < 0.5 ? "clear" : r < 0.8 ? "cloudy" : "storm";
        }

        let weatherSpeed = weather === "storm" ? 1.3 : weather === "cloudy" ? 1.1 : 1;

        // collision move filter
        obstacles = obstacles.filter(o => (o.x - cameraX) < canvas.width + 300);

        // lightning
        if (weather === "storm") {
            lightningTimer++;
            if (lightningTimer > 80 + Math.random() * 140) {
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
    // BIOMES
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

        const biome = biomes[biomeIndex];

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
                ctx.font = "40px Arial";
                
                ctx.fillText(
                    Math.floor(distance) + " km, " + region,
                    120,
                    120
                );
                
                ctx.font = "20px Arial";
                ctx.fillText("Press SPACE to Restart", 200, 160);
                return;
        }

        const flightBob = Math.sin(distance * 2) * 2;

        ctx.drawImage(
            storkImg,
            player.x,
            player.y + flightBob,
            player.width,
            player.height
        );

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
