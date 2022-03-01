import Ball from './Ball.js';
import Paddle from "./Paddle.js";

const UP_ARROW = 38;
const DOWN_ARROW = 40;

/**
 * a Game animates a ball bouncing in a canvas
 */
export default class Game {

    /**
     * build a Game
     *
     * @param  {Canvas} canvas the canvas of the game
     * @param {Socket} socket the socket associated to this client
     */
    constructor(canvas, socket) {
        this.raf = null;
        this.canvas = canvas;
        this.ball = new Ball(this.canvas.width / 2, this.canvas.height / 2, this);
        this.paddleLeft = new Paddle(this.getPaddleX(), this.canvas.height / 2.3, this, 'left')
        this.paddleRight = new Paddle(this.getPaddleX() * 19 - Paddle.IMG_WIDTH, this.canvas.height / 2.3, this, 'right');
        this.play = false;
        this.score = {player1: 0, player2: 0};

        this.bindedPaddle = null;

        this.socket = socket;
    }

    /** start this game animation */
    start() {
        this.play = true;
        this.animate();
    }

    /** stop this game animation */
    stop() {
        this.play = false;
        window.cancelAnimationFrame(this.raf);
    }

    toInitial() {
        this.paddleLeft.x = this.getPaddleX();
        this.paddleRight.x = this.getPaddleX() * 19 - Paddle.IMG_WIDTH;
        this.paddleLeft.y = this.canvas.height / 2.3;
        this.paddleRight.y = this.canvas.height / 2.3;
    }

    /** animate the game : move and draw */
    animate() {
        if (this.play) {
            this.moveAndDraw();
            this.raf = window.requestAnimationFrame(this.animate.bind(this));
        }
    }

    /** move then draw the bouncing ball */
    moveAndDraw() {
        const ctxt = this.canvas.getContext("2d");
        ctxt.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // draw and move the ball
        this.ball.move();
        this.ball.draw(ctxt);

        this.paddleLeft.move();
        this.paddleLeft.draw(ctxt);
        this.paddleRight.move();
        this.paddleRight.draw(ctxt);
    }

    handleKeyUpEventForPaddle(_event) {
        this.bindedPaddle?.updateShift(0);
    }

    handleKeyDownEventForPaddle(event) {
        // event.preventDefault();

        switch (event.which) {
            case UP_ARROW:
                this.bindedPaddle?.updateShift(Paddle.UP);
                break;
            case DOWN_ARROW:
                this.bindedPaddle?.updateShift(Paddle.DOWN);
                break;
        }

    }

    bindLeftPaddle() {
        this.bindedPaddle = this.paddleLeft;
    }

    bindRightPaddle() {
        this.bindedPaddle = this.paddleRight;
    }

    bindBase() {
        this.socket.on('new_ball_position', (ballArg) => this.ball.update(ballArg));
    }

    getPaddleX() {
        return this.canvas.width / 20;
    }

    onRightPaddleUpdated(updateData) {
        console.log('onRightPaddleUpdated');
        this.paddleRight.y = updateData.newY;
        this.paddleRight.updateShift(updateData.shift, false)
    }

    onLeftPaddleUpdated(updateData) {
        console.log('onLeftPaddleUpdated');
        this.paddleLeft.y = updateData.newY;
        this.paddleLeft.updateShift(updateData.shift, false)
    }
}
