document.addEventListener("DOMContentLoaded", () => {

    console.log("stork_game.js loaded");

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    // -----------------------
    // ADD IMAGES
    // -----------------------
    const storkImg = new Image();
    storkImg.onload = () => console.log("stork loaded");
    storkImg.onerror = () => console.error("stork FAILED");
    storkImg.src = "stork.png";
    
    const powerlineImg = new Image();
    powerlineImg.onload = () => console.log("tower loaded");
    powerlineImg.onerror = () => console.error("tower FAILED");
    powerlineImg.src = "tower.png";
    
    const stormImg = new Image();
    stormImg.onload = () => console.log("storm loaded");
    stormImg.onerror = () => console.error("storm FAILED");
    stormImg.src = "storm.png";

    // -----------------------
    // GAME STATE
    // -----------------------
    let gameOver = false;
    let gameStarted = false;

    let distance = 0;
    const speed = 0.06; // km per frame
    const scoreEl = document.getElementById("score");

    let obstacles = [];
    let obstacleTimer = 0;

    const gravity = 0.7;

    let difficulty = 1;

    // -----------------------
    // PLAYER (STORK)
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
            gameLoop(); // start the game manually
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

                hitbox: {
                    xOffset: 0,
                    yOffset: -5,
                    width: 80,
                    height: 10
                }
            });

        } else {

            obstacles.push({
                type: "storm",
                x: canvas.width,
                y: Math.random() * 80 + 20,
                width: 90,
                height: 60,

                hitbox: {
                    xOffset: 10,
                    yOffset: 10,
                    width: 60,
                    height: 40
                }
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

        gameLoop();
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

        // spawn obstacles
        obstacleTimer++;
        if (obstacleTimer > Math.max(35, 90 / difficulty)) {
            createObstacle();
            obstacleTimer = 0;
        }

        // move obstacles
        obstacles.forEach(o => o.x -= 6 * difficulty);

        obstacles = obstacles.filter(o => o.x + o.width > 0);

        // distance
        distance += speed;
        scoreEl.textContent = Math.floor(distance) + " km";

        difficulty = 1 + distance / 100;

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

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // ground
        //ctx.beginPath();
        //ctx.moveTo(0, 210);
        //ctx.lineTo(canvas.width, 210);
        //ctx.stroke();

        // player 
        ctx.drawImage(
            storkImg,
            player.x,
            player.y,
            player.width,
            player.height
        );

        // obstacles
        for (let o of obstacles) {

           if (o.type === "powerline") {

                    ctx.drawImage(
                        powerlineImg,
                        o.x,
                        o.y - 60,
                        o.width,
                        80
                    );
                }
            
                if (o.type === "storm") {
                
                    ctx.drawImage(
                        stormImg,
                        o.x,
                        o.y,
                        o.width,
                        o.height
                    );
                }
        }

        // UI text
        
        if (!gameStarted) {
        ctx.fillStyle = "#000";
        ctx.font = "30px Arial";
        ctx.fillText("Press SPACE to Start", 200, 120);
        return;
    }
        
        if (gameOver) {
            ctx.font = "40px Arial";
            ctx.fillText("DEATH", 250, 120);

            ctx.font = "20px Arial";
            ctx.fillText("Press Space to Restart", 250, 160);
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

            Promise.all([
            new Promise(resolve => storkImg.onload = resolve),
            new Promise(resolve => powerlineImg.onload = resolve),
            new Promise(resolve => stormImg.onload = resolve)
        ]).then(() => {
            console.log("all images loaded");
            draw(); // show start screen
        });
});
