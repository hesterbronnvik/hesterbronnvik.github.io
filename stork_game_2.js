document.addEventListener("DOMContentLoaded", () => {

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");

//
// IMAGES
//

const storkImg = new Image();
storkImg.src = "images/stork8bit.png";

const powerlineImg = new Image();
powerlineImg.src = "images/pylon8bit.png";

const stormImg = new Image();
stormImg.src = "images/storm8bit.png";

const wormImg = new Image();
wormImg.src = "images/worm8bit.png";

const fishImg = new Image();
fishImg.src = "images/fish8bit.png";

const insectImg = new Image();
insectImg.src = "images/insect8bit.png";

const thermalImg = new Image();
thermalImg.src = "images/thermal8bit.png";

//
// BACKGROUNDS
//

const bg = {
    farmland: new Image(),
    mountains: new Image(),
    sea: new Image(),
    desert: new Image()
};

bg.farmland.src = "images/bg_farmland_3.png";
bg.mountains.src = "images/bg_mountains_3.png";
bg.sea.src = "images/bg_sea_3.png";
bg.desert.src = "images/bg_desert_3.png";

//
// GAME STATES
//

const STATE = {
    START: "start",
    PLAYING: "playing",
    GAMEOVER: "gameover",
    VICTORY: "victory"
};

let gameState = STATE.START;

//
// WORLD
//

const WIN_DISTANCE = 4500;

let cameraX = 0;
let distance = 0;
let difficulty = 1;

//
// BIOMES
//

const biomeRoute = [
    { name: "farmland", length: 150 },
    { name: "mountains", length: 150 },
    { name: "farmland", length: 500 },
    { name: "mountains", length: 150 },
    { name: "farmland", length: 500 },
    { name: "sea", length: 140 },
    { name: "desert", length: 2910 }
];

let biomeIndex = 0;
let biomeProgress = 0;

//
// PLAYER
//

const player = {

    x: 120,

    y: 120,

    width: 42,
    height: 42,

    velocityY: 0,

    energy: 100,
    maxEnergy: 100
};

//
// FLIGHT
//

const flapStrength = -2.8;
const sinkRate = 0.10;
const maxRise = -3.5;
const maxSink = 2.2;

//
// SPEED
//

const distanceSpeed = 0.08;

//
// OBJECTS
//

let hazards = [];
let foods = [];
let thermals = [];

let hazardTimer = 0;
let foodTimer = 0;
let thermalTimer = 0;

//
// WEATHER
//

let weather = "clear";
let weatherTimer = 0;

let lightningFlash = 0;
let lightningTimer = 0;

//
// ATMOSPHERE
//

let fogAlpha = 0;

//
// UI
//

let milestoneMessage = "";
let milestoneTimer = 0;

//
// MILESTONES
//

const milestones = [
    { km: 150, text: "Reached the Alps" },
    { km: 800, text: "Reached France" },
    { km: 950, text: "Crossed the Pyrenees" },
    { km: 1450, text: "Reached Iberia" },
    { km: 1590, text: "Crossed the Mediterranean" },
    { km: 2590, text: "Reached North Africa" },
    { km: 3590, text: "Reached the Sahel" }
];

let milestoneIndex = 0;

//
// INPUT
//

function flap() {

    if (gameState === STATE.START) {
        gameState = STATE.PLAYING;
        return;
    }

    if (gameState === STATE.GAMEOVER ||
        gameState === STATE.VICTORY) {
        restart();
        return;
    }

    player.velocityY += flapStrength;

    if (player.velocityY < maxRise) {
        player.velocityY = maxRise;
    }
}

document.addEventListener("keydown", e => {

    if (e.code !== "Space" &&
        e.code !== "ArrowUp") return;

    e.preventDefault();

    flap();
});

//
// BIOME HELPER
//

function currentBiome() {
    return biomeRoute[biomeIndex].name;
}

//
// REGION TEXT
//

function getRegion(km) {

    if (km < 150) return "Central Europe";
    if (km < 300) return "The Alps";
    if (km < 800) return "France";
    if (km < 950) return "The Pyrenees";
    if (km < 1450) return "Iberia";
    if (km < 1590) return "Mediterranean Sea";
    if (km < 2590) return "North Africa";
    if (km < 3590) return "The Sahel";

    return "African Wintering Grounds";
}

//
// END MESSAGES
//
function getOutcome(distance) {

    if (distance < 650) {

        return {
            type: "FAIL",
            title: "Migration unsuccessful",
            text: "You did not reach the wintering grounds."
        };
    }

    if (distance <= 2650) {

        return {
            type: "PARTIAL_SUCCESS",
            title: "Partial success",
            text: "You can overwinter here."
        };
    }

    if (distance <= 4000) {

        return {
            type: "FAIL_DEEP_SOUTH",
            title: "Migration failed",
            text: "You died in the desert."
        };
    }

    return {
        type: "VICTORY",
        title: "Victory!",
        text: "You reached the ancestral wintering grounds."
    };
}
    
//
// RESTART
//

function restart() {

    gameState = STATE.PLAYING;

    cameraX = 0;
    distance = 0;
    difficulty = 1;

    biomeIndex = 0;
    biomeProgress = 0;

    hazards = [];
    foods = [];
    thermals = [];

    hazardTimer = 0;
    foodTimer = 0;
    thermalTimer = 0;

    player.y = 120;
    player.velocityY = 0;
    player.energy = 100;

    milestoneIndex = 0;
    milestoneTimer = 0;
    milestoneMessage = "";

    weather = "clear";
    weatherTimer = 0;

    lightningFlash = 0;
    lightningTimer = 0;
}

//----------------
// GAMEPLAY
//----------------

//
// SPAWNING
//

function spawnFood() {

    const biome = currentBiome();

    let sprite = wormImg;

    if (biome === "sea") sprite = fishImg;
    if (biome === "desert") sprite = insectImg;

    foods.push({

        x: cameraX + canvas.width + 100,

        y: 40 + Math.random() * 140,

        width: 26,
        height: 26,

        energy: 20,

        sprite
    });
}

function spawnThermal() {

    thermals.push({

        x: cameraX + canvas.width + 100,

        y: 60 + Math.random() * 120,

        width: 40,
        height: 60,

        energy: 15
    });
}

function spawnPowerline() {

    const groundY = canvas.height - 20;

    hazards.push({

        type: "powerline",

        x: cameraX + canvas.width + 100,

        y: groundY, // anchor point at ground

        width: 90,

        height: 120 // tall structure

    });
}

function spawnStorm() {

    hazards.push({

        type: "storm",

        x: cameraX + canvas.width + 100,

        y: 20 + Math.random() * 90,

        width: 90,
        height: 60,

        damage: 25,

        hit: false
    });
}

//
// SPAWN CONTROLLER
//

function updateSpawning() {

    const biome = currentBiome();

    hazardTimer++;
    foodTimer++;
    thermalTimer++;

    let hazardInterval = 120;
    let foodInterval = 180;
    let thermalInterval = 280;

    if (biome === "mountains") {

        thermalInterval = 180;
        hazardInterval = 100;
    }

    if (biome === "sea") {

        thermalInterval = 99999;
        foodInterval = 130;
    }

    if (biome === "desert") {

        thermalInterval = 320;
        hazardInterval = 90;
    }

    if (hazardTimer > hazardInterval / difficulty) {

        if (Math.random() < 0.55) {
            spawnPowerline();
        } else {
            spawnStorm();
        }

        hazardTimer = 0;
    }

    if (foodTimer > foodInterval) {

        spawnFood();
        foodTimer = 0;
    }

    if (thermalTimer > thermalInterval) {

        spawnThermal();
        thermalTimer = 0;
    }
}

//
// WEATHER
//

function updateWeather() {

    weatherTimer++;

    if (weatherTimer > 700) {

        weatherTimer = 0;

        const r = Math.random();

        if (r < 0.5) weather = "clear";
        else if (r < 0.8) weather = "cloudy";
        else weather = "storm";
    }

    if (weather === "storm") {

        lightningTimer++;

        if (lightningTimer > 90 + Math.random() * 120) {

            lightningFlash = 6;
            lightningTimer = 0;
        }
    }

    if (lightningFlash > 0) {
        lightningFlash--;
    }

    let targetFog = 0.06;

    if (weather === "cloudy") targetFog = 0.12;
    if (weather === "storm") targetFog = 0.18;

    fogAlpha += (targetFog - fogAlpha) * 0.02;
}

//
// COLLISION
//

function intersects(a, b) {

    return (

        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function playerBox() {

    return {

        x: player.x + 6,
        y: player.y + 6,

        width: player.width - 12,
        height: player.height - 12
    };
}

//
// COLLISIONS
//

function updateCollisions() {

    const p = playerBox();

    //
    // FOOD
    //

    foods = foods.filter(food => {

        const box = {

            x: food.x - cameraX,
            y: food.y,

            width: food.width,
            height: food.height
        };

        if (intersects(p, box)) {

            player.energy += food.energy;

            if (player.energy > player.maxEnergy) {
                player.energy = player.maxEnergy;
            }

            return false;
        }

        return true;
    });

    //
    // THERMALS
    //

    thermals = thermals.filter(thermal => {

        const box = {

            x: thermal.x - cameraX,
            y: thermal.y,

            width: thermal.width,
            height: thermal.height
        };

        if (intersects(p, box)) {

            player.energy += thermal.energy;

            if (player.energy > player.maxEnergy) {
                player.energy = player.maxEnergy;
            }

            return false;
        }

        return true;
    });

    //
    // HAZARDS
    //

    for (const h of hazards) {

        const box = {
        
            x: h.x - cameraX,
            y: h.y - h.height, // top of structure
        
            width: h.width,
            height: h.height
        };

        if (!intersects(p, box)) continue;

        //
        // POWERLINES = DEATH
        //

        if (h.type === "powerline") {

            gameState = STATE.GAMEOVER;
            return;
        }

        //
        // STORMS = ENERGY LOSS
        //

        if (h.type === "storm" && !h.hit) {

            player.energy -= h.damage;

            h.hit = true;

            if (player.energy < 0) {
                player.energy = 0;
            }
        }
    }
}

//
// MILESTONES
//

function updateMilestones() {

    if (milestoneIndex >= milestones.length) return;

    const m = milestones[milestoneIndex];

    if (distance >= m.km) {

        milestoneMessage = m.text;
        milestoneTimer = 240;

        milestoneIndex++;
    }

    if (milestoneTimer > 0) {
        milestoneTimer--;
    }
}

//
// UPDATE
//

function update() {

    cameraX += 5 * difficulty;

    distance += distanceSpeed;

    scoreEl.textContent =
        Math.floor(distance) + " km";

    difficulty =
        1 + Math.pow(distance / 600, 1.1);

    //
    // BIOME PROGRESSION
    //

    biomeProgress += distanceSpeed;

    if (
        biomeProgress >
        biomeRoute[biomeIndex].length
    ) {

        biomeProgress = 0;

        biomeIndex = Math.min(
            biomeIndex + 1,
            biomeRoute.length - 1
        );
    }

    //
    // FLIGHT MODEL
    //

    player.velocityY += sinkRate;

    if (player.velocityY > maxSink) {
        player.velocityY = maxSink;
    }

    player.y += player.velocityY;

    //
    // SKY LIMITS
    //

    if (player.y < 10) {

        player.y = 10;
        player.velocityY = 0;
    }

    if (player.y > canvas.height - 55) {

        player.y = canvas.height - 55;
        player.velocityY = 0;
    }

    //
    // ENERGY
    //

    player.energy -= 0.025;

    if (player.energy <= 0) {

        player.energy = 0;
        gameState = STATE.GAMEOVER;
    }

    //
    // CLEANUP
    //

    foods =
        foods.filter(
            f => f.x - cameraX > -100
        );

    thermals =
        thermals.filter(
            t => t.x - cameraX > -100
        );

    hazards =
        hazards.filter(
            h => h.x - cameraX > -150
        );

    updateSpawning();
    updateWeather();
    updateCollisions();
    updateMilestones();

    //
    // WIN CONDITION
    //

    //if (distance >= WIN_DISTANCE) {

    //    gameState = STATE.VICTORY;
    //}
}

    //---------------
    // WRAP-UP
    //---------------//
// BACKGROUND
//

function drawBiome(biome) {

    const speed = cameraX * 0.25;

    let img = bg.farmland;

    if (biome === "mountains") img = bg.mountains;
    if (biome === "sea") img = bg.sea;
    if (biome === "desert") img = bg.desert;

    const w = canvas.width;
    const h = canvas.height;

    const x = -(speed % w);

    ctx.drawImage(img, x, 0, w, h);
    ctx.drawImage(img, x + w, 0, w, h);
}

//
// UI
//

function drawEnergyBar() {

    const x = 20;
    const y = 20;

    const w = 180;
    const h = 18;

    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(x, y, w, h);

    const fillWidth =
        (player.energy / player.maxEnergy) * w;

    let color = "#6BBF59";

    if (player.energy < 60) color = "#D4B44A";
    if (player.energy < 30) color = "#C94B4B";

    ctx.fillStyle = color;
    ctx.fillRect(x, y, fillWidth, h);

    ctx.strokeStyle = "#222";
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = "#000";
    ctx.font = "12px Arial";
    ctx.fillText("Energy", x + 60, y + 13);
}

function drawProgressBar() {

    const w = 250;
    const h = 14;

    const x = canvas.width - w - 20;
    const y = 22;

    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(x, y, w, h);

    const progress =
        Math.min(distance / WIN_DISTANCE, 1);

    ctx.fillStyle = "#4A7FBF";
    ctx.fillRect(x, y, progress * w, h);

    ctx.strokeStyle = "#222";
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = "#000";
    ctx.font = "12px Arial";
    ctx.fillText(
        Math.floor(distance) + " / " + WIN_DISTANCE + " km",
        x + 55,
        y + 11
    );
}

function drawMilestone() {

    if (milestoneTimer <= 0) return;

    const alpha =
        Math.min(milestoneTimer / 40, 1);

    ctx.fillStyle =
        `rgba(0,0,0,${0.6 * alpha})`;

    ctx.fillRect(
        canvas.width / 2 - 160,
        40,
        320,
        45
    );

    ctx.fillStyle = "#FFF";
    ctx.font = "22px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        milestoneMessage,
        canvas.width / 2,
        70
    );

    ctx.textAlign = "left";
}

//
// RESOURCES
//

function drawFoods() {

    for (const food of foods) {

        ctx.drawImage(
            food.sprite,
            food.x - cameraX,
            food.y,
            food.width,
            food.height
        );
    }
}

function drawThermals() {

    for (const thermal of thermals) {

        const x = thermal.x - cameraX;

        ctx.drawImage(
            thermalImg,
            x,
            thermal.y,
            thermal.width,
            thermal.height
        );

        ctx.fillStyle =
            "rgba(255,255,255,0.15)";

        ctx.fillRect(
            x + 10,
            thermal.y - 10,
            20,
            thermal.height + 20
        );
    }
}

//
// HAZARDS
//

function drawHazards() {

    for (const h of hazards) {

        const x = h.x - cameraX;

        if (h.type === "powerline") {
        
            const x = h.x - cameraX;
        
            ctx.drawImage(
                powerlineImg,
                x,
                h.y - h.height, // draw upward from base
                h.width,
                h.height
            );
        }

        if (h.type === "storm") {

            ctx.drawImage(
                stormImg,
                x,
                h.y,
                h.width,
                h.height
            );
        }
    }
}

//
// PLAYER
//

function drawPlayer() {

    const bob =
        Math.sin(distance * 1.2) * 1.5;

    ctx.drawImage(
        storkImg,
        player.x,
        player.y + bob,
        player.width,
        player.height
    );
}

//
// WEATHER EFFECTS
//

function drawWeatherEffects() {

    let darkness = 0;

    if (weather === "cloudy") darkness = 0.05;
    if (weather === "storm") darkness = 0.15;

    ctx.fillStyle =
        `rgba(0,0,0,${darkness})`;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle =
        `rgba(255,255,255,${fogAlpha})`;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    if (lightningFlash > 0) {

        const intensity =
            lightningFlash / 6;

        ctx.fillStyle =
            `rgba(255,255,255,${0.8 * intensity})`;

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );
    }
}

//
// SCREENS
//

function drawStartScreen() {

    ctx.fillStyle =
        "rgba(255,255,255,0.7)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "#000";

    ctx.font = "28px Arial";
    ctx.fillText(
        "Time to migrate.",
        230,
        195
    );

    ctx.font = "18px Arial";

    ctx.fillText(
        "Press SPACE or UP to begin.",
        230,
        130
    );

    ctx.fillText(
        "Food and thermals restore energy.",
        230,
        130
    );

    ctx.fillText(
        "Storms drain energy. Pylons are deadly.",
        230,
        165
    );

    ctx.fillText(
        "Can you travel 4500 km to the ancestral wintering grounds?",
        230,
        90
    );
}

function drawGameOver() {

    const outcome = getOutcome(distance);

    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#FFF";

    ctx.font = "34px Arial";
    ctx.fillText(outcome.title, 220, 90);

    ctx.font = "20px Arial";
    ctx.fillText(
        Math.floor(distance) + " km",
        320,
        130
    );

    ctx.fillText(
        outcome.text,
        200,
        170
    );

    ctx.fillText(
        "Press SPACE to migrate again",
        240,
        220
    );
}
    
function drawVictory() {

    const outcome = getOutcome(distance);

    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#FFF";

    ctx.font = "34px Arial";
    ctx.fillText(outcome.title, 250, 90);

    ctx.font = "20px Arial";
    ctx.fillText(
        Math.floor(distance) + " km",
        320,
        130
    );

    ctx.fillText(
        outcome.text,
        140,
        170
    );

    ctx.fillText(
        "Press SPACE to migrate again",
        240,
        220
    );
}

//
// DRAW
//

function draw() {

    const biome =
        biomeRoute[biomeIndex].name;

    drawBiome(biome);

    drawFoods();
    drawThermals();
    drawHazards();
    drawPlayer();

    drawWeatherEffects();

    drawEnergyBar();
    drawProgressBar();
    drawMilestone();

    ctx.fillStyle =
        "rgba(0,0,0,0.5)";

    ctx.font = "16px Arial";

    ctx.fillText(
        biome.toUpperCase(),
        20,
        65
    );

    if (gameState === STATE.START) {
        drawStartScreen();
    }

    if (gameState === STATE.GAMEOVER) {
        drawGameOver();
    }

    if (gameState === STATE.VICTORY) {
        drawVictory();
    }
}

//
// LOOP
//

function loop() {

    if (gameState === STATE.PLAYING) {
        update();
    }

    draw();

    requestAnimationFrame(loop);
}

loop();

});



                          
