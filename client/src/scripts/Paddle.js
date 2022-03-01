import Mobile from "./Mobile";

const PADDLE_IMAGE_SRC = './images/paddle.png';
const SHIFT_X = 0;
const SHIFT_Y = 6;


export default class Paddle extends Mobile {
    static UP = -SHIFT_Y;
    static DOWN = SHIFT_Y;
    static IMG_WIDTH = 27;

    /**
     *
     * @param x {number}
     * @param y {number}
     * @param theGame {Game}
     * @param xAxis {string}
     */
    constructor(x, y, theGame, xAxis) {
        super(x, y, PADDLE_IMAGE_SRC, SHIFT_X, 0, theGame);
        this.xAxis = xAxis;
    }

    move() {
        if (// Trying to go above
            this.shiftY < 0 && this.y <= 0 ||
            // Trying to go below
            this.shiftY > 0 && this.y + this.img.height > this.theGame.canvas.height) {

            this.updateShift(0);
        }

        super.move();
    }

    #getPositionUpdateArgName() {
        return this.xAxis + '_paddle_update';
    }

    #getPositionUpdateArg() {
        return {newY: this.y, shift: this.shiftY}
    }

    updateShift(newShift, emit = true) {
        super.shiftY = newShift
        if (emit) {
            console.log(this.#getPositionUpdateArgName())
            this.theGame.socket.emit(this.#getPositionUpdateArgName(), this.#getPositionUpdateArg());
        }else console.log("Received from other");
    }
}
