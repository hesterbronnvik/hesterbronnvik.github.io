document.addEventListener("DOMContentLoaded", () => {

    console.log("stork_game.js loaded");

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    const player = {
        x: 50,
        y: 170,
        width: 40,
        height: 40
    };

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
    }

    draw();

});
