document.addEventListener("DOMContentLoaded", () => {

    console.log("stork_game.js loaded");

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    // =====================
    // LOAD SPRITE (optional)
    // =====================
    const storkImg = new Image();
    storkImg.src = "stork.svg"; // optional; game still works without it

    let frame = 0;
    let frameTick = 0;

    
    // =====================
    // LOAD OBSTACLES
    // =====================
    const towerImg = new Image();
    towerImg.src = "tower.png";
    
    // =====================
    // GAME STATE
    // =====================
    const gravity = 0.7;

    const player = {
        x: 50,
        y: 170,
        width: 64,
        height: 64,
        velocityY: 0,
        jumping: false
    };

    let obstacles = [];
    let obstacleTimer = 0;
    let gameOver = false;
    let score = 0;

    const scoreDisplay = document.getElementById("score");

    // =====================
    // INPUT
    // =====================
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

    function jump() {
        if (!player.jumping && !gameOver) {
            player.velocityY = -12;
            player.jumping = true;
        }
    }

    // =====================
    // OBSTACLES
    // =====================
   function createObstacle() {

    const types = ["powerline", "storm"];
    const type = types[Math.floor(Math.random() * types.length)];

    if (type === "powerline") {

        obstacles.push({
            type: "powerline",
            x: canvas.width,
            y: 180,
            width: 60,
            height: 10
        });

    } else if (type === "storm") {

         let stormWidth = 90;
         let stormHeight = 60;

        obstacles.push({
            type: "storm",
            x: canvas.width,
            y: Math.random() * 80 + 20, // floats in sky
            width: 70,
            height: 40
        });
    }
}

    // =====================
    // RESTART
    // =====================
    function restart() {
        obstacles = [];
        obstacleTimer = 0;
        score = 0;
        gameOver = false;

        player.y = 170;
        player.velocityY = 0;
        player.jumping = false;

        loop();
    }

    // =====================
    // UPDATE LOGIC
    // =====================
    function update() {

        // gravity
        player.velocityY += gravity;
        player.y += player.velocityY;

        // ground collision
        if (player.y > 170) {
            player.y = 170;
            player.velocityY = 0;
            player.jumping = false;
        }

        // spawn obstacles
        obstacleTimer++;
        if (obstacleTimer > 90) {
            createObstacle();
            obstacleTimer = 0;
        }

        // move obstacles
        obstacles.forEach(o => {
            o.x -= 6;
        });

        obstacles = obstacles.filter(o => o.x + o.width > 0);

        // =====================
        // COLLISION DETECTION (IMPORTANT PART)
        // =====================
        for (let o of obstacles) {

    if (
        player.x < o.x + o.width &&
        player.x + player.width > o.x &&
        player.y < o.y + o.height &&
        player.y + player.height > o.y
    ) {
        gameOver = true;
    }
}

        // score
        if (!gameOver) {
            score++;
            scoreDisplay.textContent = "Score: " + score;
        }
    }

    // =====================
    // DRAW
    // =====================
    function draw() {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // ground
        //ctx.beginPath();
        //ctx.moveTo(0, 210);
        //ctx.lineTo(canvas.width, 210);
        //ctx.stroke();

        // animate sprite frame
        frameTick++;
        if (frameTick > 10) {
            frame = (frame + 1) % 2;
            frameTick = 0;
        }

        // player (sprite OR fallback)
        if (storkImg.complete && storkImg.naturalWidth !== 0) {

            ctx.drawImage(
                storkImg,
                frame * 64,
                0,
                64,
                64,
                player.x,
                player.y,
                player.width,
                player.height
            );

        } else {
            ctx.fillStyle = "#3a5a40";
            ctx.fillRect(player.x, player.y, player.width, player.height);
        }

        // obstacles
        ctx.fillStyle = "#B7C44B";

        for (let o of obstacles) {

if (o.type === "powerline") {

    ctx.drawImage(towerImg, o.x, o.y - 60, 40, 80);
}

    if (o.type === "storm") {

        // cloud shape
        ctx.fillStyle = "rgba(120,120,120,0.8)";
        ctx.beginPath();
        ctx.arc(o.x + 20, o.y, 20, 0, Math.PI * 2);
        ctx.arc(o.x + 45, o.y + 5, 25, 0, Math.PI * 2);
        ctx.arc(o.x + 65, o.y, 18, 0, Math.PI * 2);
        ctx.fill();

        // lightning hint
        ctx.strokeStyle = "yellow";
        ctx.beginPath();
        ctx.moveTo(o.x + 40, o.y + 10);
        ctx.lineTo(o.x + 35, o.y + 35);
        ctx.lineTo(o.x + 45, o.y + 35);
        ctx.stroke();
    }
}

        // game over screen
        if (gameOver) {
            ctx.fillStyle = "black";
            ctx.font = "30px Arial";
            ctx.fillText("Migration failed", 260, 100);

            ctx.font = "16px Arial";
            ctx.fillText("Press Space to restart", 260, 140);
        }
    }

    // =====================
    // GAME LOOP
    // =====================
    function loop() {
        if (!gameOver) {
            update();
            draw();
            requestAnimationFrame(loop);
        } else {
            draw();
        }
    }

    // start game after image loads (safe)
    storkImg.onload = () => {
        loop();
    };

    // fallback if image not used
    setTimeout(() => {
        if (!storkImg.src) loop();
    }, 200);

});
