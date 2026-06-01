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

    function update() {

        player.velocityY += gravity;
        player.y += player.velocityY;

        if (player.y > 170) {
            player.y = 170;
            player.velocityY = 0;
            player.jumping = false;
        }
    }

    function draw() {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.moveTo(0, 210);
        ctx.lineTo(canvas.width, 210);
        ctx.stroke();

        ctx.fillStyle = "#3a5a40";
        ctx.fillRect(
            player.x,
            player.y,
            player.width,
            player.height
        );
    }

    function loop() {
        update();
        draw();
        requestAnimationFrame(loop);
    }

    loop();

});
