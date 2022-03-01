import Mobile from './Mobile.js';
import {stopGame} from "./pong";


// default values for a Ball : image and shifts
const BALL_IMAGE_SRC = './images/balle24.png';

/**
 * a Ball is a mobile with a ball as image and that bounces in a Game (inside the game's canvas)
 */
export default class Ball extends Mobile {
    #speed;
    /**  build a ball
     *
     * @param  {number} x       the x coordinate
     * @param  {number} y       the y coordinate
     * @param  {Game} theGame   the Game this ball belongs to
     */
    constructor(x, y, theGame) {
        super(x, y, BALL_IMAGE_SRC, 0, 0, theGame);
        this.defaultX = x;
        this.defaultY = y;
        this.#speed = 0;
    }

    /**
     * Sets the ball speed data.
     */
    setInitialSpeedData(speedData) {
        this.#speed = speedData.speed;
        this.shiftX = speedData.shiftX;
        this.shiftY = speedData.shiftY;
    }

    /**
     * when moving a ball bounces inside the limit of its game's canvas
     */
    move() {
        if (this.y <= 0 || (this.y2 >= this.theGame.canvas.height)) {
            this.shiftY = -this.shiftY;    // rebond en haut ou en bas
        } else if (this.#isInPaddle(this.theGame.paddleLeft)) {
            this.#putOutsidePaddle(this.theGame.paddleLeft);
            this.#changeShiftAccordingToPaddle(this.theGame.paddleLeft);
            this.#sendDataUpdate(this.shiftX, this.shiftY, this.x, this.y)
        } else if (this.#isInPaddle(this.theGame.paddleRight)) {
            this.#putOutsidePaddle(this.theGame.paddleRight);
            this.#changeShiftAccordingToPaddle(this.theGame.paddleRight);
            this.#sendDataUpdate(this.shiftX, this.shiftY, this.x, this.y)
        } else if (this.#reachLeftWall()) {
            stopGame(this.theGame);
            this.theGame.toInitial();
            this.theGame.socket.emit('wall_hit', {wall: 'left'});
            // document.dispatchEvent(new CustomEvent('incrementRightPlayerScore', {detail: {canEmit:true}}));
        } else if (this.#reachRightWall()) {
            stopGame(this.theGame);
            this.theGame.toInitial();
            this.theGame.socket.emit('wall_hit', {wall: 'right'});
            // document.dispatchEvent(new CustomEvent('incrementLeftPlayerScore', {detail: {canEmit:true}}));
        }

        super.move();
    }

    /**
     *
     * @returns {boolean} whether the ball hit the left wall or not
     */
    #reachLeftWall() {
        return this.x <= 0
    }

    /**
     *
     * @returns {boolean} whether the ball hit the right wall or not
     */
    #reachRightWall() {
        return this.x2 >= this.theGame.canvas.width;
    }

    /**
     * Used to check if the ball collides with a paddle.
     * @param paddle the paddle to test
     * @returns {boolean} whether the ball collides with the paddle or not
     */
    #isInPaddle(paddle) {
        const p1x = Math.max(this.x, paddle.x);
        const p1y = Math.max(this.y, paddle.y);

        const p2x = Math.min(this.x2, paddle.x2);
        const p2y = Math.min(this.y2, paddle.y2);

        return p1x <= p2x && p1y <= p2y;
    }

    /**
     * Calculates where the ball hit the paddle then set the new shift.
     * @param paddle {Paddle}
     */
    #changeShiftAccordingToPaddle(paddle) {
        const paddleDivider = Math.round(this.#speed * 4 / 5);
        const top = paddle.y;
        const segLength = (paddle.y2 - top) / (paddleDivider * 2);
        let currentBoundCalc = 0;
        let continueIteration = true;
        const center = (this.y2 + this.y) / 2;

        while (continueIteration && currentBoundCalc < (paddleDivider * 2)) {
            const upperBound = segLength * currentBoundCalc + top;
            const lowerBound = segLength * (currentBoundCalc + 1) + top;
            if (center < lowerBound && center > upperBound) {
                continueIteration = false;
            } else {
                currentBoundCalc++;
            }
        }

        this.#calcNewShift(currentBoundCalc, paddleDivider);
    }

    /**
     * Sets the new shift for the ball according to where it hits the paddle.
     * @param currentBoundCalc {number} The segment hit by the ball.
     * @param paddleDivider    {number} The segment hit by the ball.
     */
    #calcNewShift(currentBoundCalc, paddleDivider) {
        const bound = currentBoundCalc % paddleDivider;
        const shift = currentBoundCalc < paddleDivider ? paddleDivider - bound : bound;
        let sign = this.shiftY > 0 ? 1 : -1;
        if (this.shiftY === 0)
            sign = currentBoundCalc > paddleDivider ? -1 : 1;
        const newShiftY = (shift - 1) * sign;
        this.shiftY = newShiftY;
        const xSign = this.shiftX <= 0 ? 1 : -1;
        this.shiftX = (this.#speed - Math.abs(newShiftY)) * xSign;
    }

    /**
     * Shifts the ball to avoid the ball hard locking when hitting the side of a paddle
     * @param paddle {Paddle}
     */
    #putOutsidePaddle(paddle) {
        const direction = this.shiftX > 0 ? -1 : 1;
        while (this.#isInPaddle(paddle))
            this.x += direction;
    }

    update(ballArg) {
        this.x = ballArg.ballX || this.defaultX;
        this.y = ballArg.ballY || this.defaultY;
        this.shiftX = ballArg.ballShiftX;
        this.shiftY = ballArg.ballShiftY;
    }

    #sendDataUpdate(newShiftX, newShiftY, newX, newY) {
        this.theGame.socket.emit('new_ball_position', {
            ballShiftX: newShiftX,
            ballShiftY: newShiftY,
            ballX: newX,
            ballY: newY
        });
    }
}
