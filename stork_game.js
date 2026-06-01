document.addEventListener("DOMContentLoaded", () => {

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const scoreEl = document.getElementById("score");

    // -----------------------
    // IMAGES
    // -----------------------
    const storkImg = new Image();
    storkImg.src = "stork8bit.png";

    const storkSilhouetteImg = new Image();
    storkSilhouetteImg.src = "stork8bit_black.png";

    const powerlineImg = new Image();
    powerlineImg.src = "pylon8bit.png";

    const stormImg = new Image();
    stormImg.src = "storm8bit.png";

    // BIOME BACKGROUNDS
    const bg = {
        farmland: new Image(),
        mountains: new Image(),
        sea: new Image(),
        desert: new Image()
    };

    bg.farmland.src = "bg_farmland.png";
    bg.mountains.src = "bg_mountains.png";
    bg.sea.src = "bg_sea.png";
    bg.desert.src = "bg_desert.png";

    // -----------------------
    // WORLD
    // -----------------------
    const groundY = 260;
    let cameraX = 0;

    // -----------------------
    // BIOME ROUTE
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
    // STATE
    // -----------------------
    const STATE = { START: "start", PLAYING: "playing", GAMEOVER: "gameover" };
    let gameState = STATE.START;

    let distance = 0;
    let difficulty = 1;

    let obstacles = [];
    let obstacleTimer = 0;

    // -----------------------
    // WEATHER
    // -----------------------
    let weather = "clear";
    let weatherTimer = 0;
    let lightningFlash = 0;
    let lightningTimer = 0;

    // -----------------------
    // ATMOSPHERE
    // -----------------------
    let fogAlpha = 0;

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

    const gravity = 0.7;
    const speed = 0.06;

    // -----------------------
    // REGION SYSTEM
    // -----------------------
    function getRegion(km) {

        if (km < 150) return "you remained in Central Europe";
        if (km < 300) return "you reached the Alps";
        if (km < 800) return "you reached France";
        if (km < 950) return "you reached the Pyrenees";
        if (km < 1450) return "you reached Iberia!";
        if (km < 1590) return "you Mediterranean Sea";
        if (km < 2590) return "you reached North Africa!";
        if (km < 3590) return "you reached the Sahel!";
        return "Deep Migration Route";
    }

    // -----------------------
    // INPUT
    // -----------------------
    document.addEventListener("keydown", (e) => {
        if (e.code !== "Space" && e.code !== "ArrowUp") return;
        e.preventDefault();

        if (gameState === STATE.START) gameState = STATE.PLAYING;
        else if (gameState === STATE.GAMEOVER) restart();
        else jump();
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

        cameraX += 6 * difficulty;

        player.velocityY += gravity;
        player.y += player.velocityY;

        const maxY = groundY - 90;
        if (player.y > maxY) {
            player.y = maxY;
            player.velocityY = 0;
            player.jumping = false;
        }

        distance += speed;
        scoreEl.textContent = Math.floor(distance) + " km";

        difficulty = 1 + Math.pow(distance / 220, 1.15);

        biomeProgress += speed;
        if (biomeProgress > biomeRoute[biomeIndex].length) {
            biomeProgress = 0;
            biomeIndex = Math.min(biomeIndex + 1, biomeRoute.length - 1);
        }

        obstacleTimer++;
        if (obstacleTimer > Math.max(45, 110 / difficulty)) {
            createObstacle();
            obstacleTimer = 0;
        }

        obstacles = obstacles.filter(o => o.x - cameraX < canvas.width + 300);

        // WEATHER
        weatherTimer++;
        if (weatherTimer > 700) {
            weatherTimer = 0;
            const r = Math.random();
            weather = r < 0.5 ? "clear" : r < 0.8 ? "cloudy" : "storm";
        }

        if (weather === "storm") {
            lightningTimer++;
            if (lightningTimer > 90 + Math.random() * 120) {
                lightningFlash = 6;
                lightningTimer = 0;
            }
        }
        if (lightningFlash > 0) lightningFlash--;

        let targetFog = 0.08;
        if (weather === "cloudy") targetFog = 0.12;
        if (weather === "storm") targetFog = 0.18;
        if (lightningFlash > 0) targetFog += 0.12;

        fogAlpha += (targetFog - fogAlpha) * 0.02;

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
    // BIOME BACKGROUND
    // -----------------------
    function drawBiome(biome) {

        let sky = "#F8F9F2";

        if (biome === "farmland") sky = "#F2F7E6";
        if (biome === "mountains") sky = "#D6D3D1";
        if (biome === "sea") sky = "#A7D8FF";
        if (biome === "desert") sky = "#F5D7A1";

        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // -----------------------
    // DRAW
    // -----------------------
    function draw() {

        const biome = biomeRoute[biomeIndex].name;

        drawBiome(biome);

        // FOG
        ctx.fillStyle = `rgba(255,255,255,${fogAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // LIGHTNING FLASH (global)
        if (lightningFlash > 0) {
            const i = lightningFlash / 6;
            ctx.fillStyle = `rgba(255,255,255,${0.85 * i})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        if (gameState === STATE.START) {
            ctx.fillStyle = "#000";
            ctx.font = "30px Arial";
            ctx.fillText("Press SPACE to Start", 200, 120);
            return;
        }

        if (gameState === STATE.GAMEOVER) {\

            const region = getRegion(distance);
            
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#fff";
            ctx.font = "36px Arial";
            ctx.fillText(Math.floor(distance) + " km:",  + region, 120, 120);

            ctx.font = "20px Arial";
            ctx.fillText("Press SPACE to Restart", 200, 160);
            return;
        }

        // PLAYER (silhouette swap)
        //const flightBob = Math.sin(distance * 2) * 2;
        //const y = player.y + flightBob;

        //const currentStork =
          //  lightningFlash > 0 ? storkSilhouetteImg : storkImg;

        //ctx.drawImage(currentStork, player.x, y, player.width, player.height);

        // OBSTACLES
        for (let o of obstacles) {
            const x = o.x - cameraX;

            if (o.type === "powerline") {
                ctx.drawImage(powerlineImg, x, o.y - 60, o.width, 80);
            } else {
                ctx.drawImage(stormImg, x, o.y, o.width, o.height);
            }
        }

        // BIOME LABEL
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.font = "16px Arial";
        ctx.fillText(biome.toUpperCase(), 20, 50);
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
