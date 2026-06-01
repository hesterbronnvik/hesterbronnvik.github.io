document.addEventListener("DOMContentLoaded", () => {

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    const gravity = 0.7;

    const player = {
        x: 50,
        y: 170,
        width: 40,
        height: 40,
        velocityY: 0,
        jumping: false
    };

    let obstacles = [];
    let obstacleTimer = 0;

    function jump() {
        if (!player.jumping) {
            player.velocityY = -12;
            player.jumping = true;
        }
    }

    document.addEventListener("keydown", (e) => {
        if (e.code === "Space" || e.code === "ArrowUp") {
            e.preventDefault();
            jump();
        }
    });

    function createObstacle() {
        obstacles.push({
            x: canvas.width,
            y: 170,
            width: 20,
            height: 40
        });
    }

    function update() {

        player.velocityY += gravity;
        player.y += player.velocityY;

        if (player.y > 170) {
            player.y = 170;
            player.velocityY = 0;
            player.jumping = false;
        }

        obstacleTimer++;

        if (obstacleTimer > 90) {
            createObstacle();
            obstacleTimer = 0;
        }

        obstacles.forEach(o => {
            o.x -= 6;
        });

        obstacles = obstacles.filter(o => o.x + o.width > 0);
    }

    function draw() {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // ground
        ctx.beginPath();
        ctx.moveTo(0, 210);
        ctx.lineTo(canvas.width, 210);
        ctx.stroke();

        // stork
        ctx.fillStyle = "#3a5a40";
        ctx.fillRect(
            player.x,
            player.y,
            player.width,
            player.height
        );

        // obstacles
        ctx.fillStyle = "#B7C44B";

        obstacles.forEach(o => {
            ctx.fillRect(
                o.x,
                o.y,
                o.width,
                o.height
            );
        });
    }

    function loop() {
        update(obstacles.forEach(o => {

    if (
        player.x < o.x + o.width &&
        player.x + player.width > o.x &&
        player.y < o.y + o.height &&
        player.y + player.height > o.y
    ) {
        alert("Migration failed!");
        location.reload();
    }

}););
        draw();
        requestAnimationFrame(loop);
    }

    loop();

});
