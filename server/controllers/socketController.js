const BALL_SPEED = 12;

/**
 * Used to give the ball a proper shift speed. Scales on the BALL_SPEED const.
 * @returns {{initialShiftX: number, initialShiftY: number}}
 */
function calcBallInitialShift() {
    const initialShiftX = Math.round(Math.random() * (BALL_SPEED * 2 / 3) + BALL_SPEED / 2) * (Math.random() < 0.5 ? -1 : 1);
    const initialShiftY = (BALL_SPEED - Math.abs(initialShiftX))  * (Math.random() < 0.5 ? -1 : 1);
    return {initialShiftX, initialShiftY}
}

export default class SocketController {
    #io;
    #clients;
    #currentValue;
    #leftSocket;
    #rightSocket;
    #public;
    #initialSpeed;
    #leftOk;
    #rightOk;

    constructor(io) {
        this.#io = io;
        this.#clients = [];
        this.#currentValue = 0;
        this.#leftSocket = null;
        this.#rightSocket = null;
        this.#public = false;
        this.#initialSpeed = calcBallInitialShift();

        this.#leftOk = false;
        this.#rightOk = false;
    }

    register(socket) {
        this.#welcome(socket);
        this.#setupListeners(socket);
        this.#assignPaddle(socket);
        this.#clients.push(socket);
    }

    #welcome(socket) {
        this.#emitToClients(socket, 'welcome_other', {id: socket.id});
    }

    #setupListeners(socket) {
        console.log(`connection done by ${socket.id}`);

        socket.on('start_and_stop', arg => this.startStop(socket, arg));

        socket.on('changePrivacy', arg => this.#changePrivacy(socket, arg));

        socket.on('right_paddle_update', (updateData) => this.#dispatchRightPaddleUpdate(socket, updateData));
        socket.on('left_paddle_update', (updateData) => this.#dispatchLeftPaddleUpdate(socket, updateData));

        socket.on('leftScoreUp', () => this.#notifyLeftScoreUp(socket));
        socket.on('rightScoreUp', () => this.#notifyRightScoreUp(socket));

        socket.on('new_ball_position', (ballData) => this.#dispatchBallData(socket, ballData));
        socket.on('visitor_unauthorized', () => this.#disconnectSocket(socket/*, true*/));
        socket.on('disconnect', () => this.#disconnectSocket(socket));

        socket.on('wall_hit', (data) => this.#handleWallHit(socket, data));

        return socket.id;
    }

    #disconnectSocket(socket/*, unauthorizedVisitor = false*/) {
        console.log(`Socket ${socket.id} just disconnected.`);
        this.#removeFromClients(socket);

        if (socket.id === this.#leftSocket?.id) {
            this.#leftSocket = null;
            this.#rightSocket?.emit('not_starting_anymore');
        }
        if (socket.id === this.#rightSocket?.id) {
            this.#rightSocket = null;
            this.#leftSocket?.emit('not_starting_anymore');
        }
        socket.disconnect(true);
    }

    #dispatchRightPaddleUpdate(socket, updateData) {
        this.#emitToClients(socket, 'right_paddle_update', updateData);
    }

    #dispatchLeftPaddleUpdate(socket, updateData) {
        this.#emitToClients(socket, 'left_paddle_update', updateData);
    }

    #dispatchBallData(socket, ballData) {
        this.#emitToClients(socket, 'new_ball_position', ballData);
    }

    #assignPaddle(socket) {
        let welcomeArg;
        if (this.#leftSocket === null) {
            console.log(`${socket.id} is assigned left`);
            this.#leftSocket = socket;
            welcomeArg = 'leftPlayer';
            this.#verifyPlayersAreConnected();
        } else if (this.#rightSocket === null) {
            this.#rightSocket = socket;
            welcomeArg = 'rightPlayer';
            console.log(`${socket.id} is assigned right`);
            this.#verifyPlayersAreConnected();
        } else {
            console.log(`You (${socket.id}) are a visitor. Begone.`);
            welcomeArg = 'leftover';
        }
        socket.emit('welcome', {playerSpot: welcomeArg, public: this.#public, initialSpeed: this.#initialSpeed, speed: BALL_SPEED});
    }

    #verifyPlayersAreConnected() {
        console.log("Verifying...")
        if (this.#leftSocket !== null && this.#rightSocket !== null){
            Promise.resolve(() => console.log("Emitting to sockets"))
                .then(() => this.#rightSocket.emit('can_start'), () => console.log("Not sent to right"))
                .then(() =>this.#leftSocket.emit('can_start'), () => console.log("Not sent to left"))

            console.log("... OK!")
        }
    }

    #removeFromClients(socket) {
        const index = this.#clients.indexOf(socket);
        this.#clients.splice(index, 1);
    }

    #emitToClients(socket, message, arg) {
        this.#clients.filter((sock) => sock.id !== socket.id)
            .forEach(sock => sock.emit(message, arg))
    }

    startStop(socket, arg) {
        this.#emitToClients(socket, 'start_and_stop', arg);
    }

    #notifyLeftScoreUp(socket) {
        this.#emitToClients(socket, 'leftScoreUp');

        this.#notifyNewSpeed();
    }

    #notifyRightScoreUp(socket) {
        this.#emitToClients(socket, 'rightScoreUp');

        this.#notifyNewSpeed();
    }

    #changePrivacy(socket) {
        if(socket === this.#leftSocket || this.#rightSocket === socket) {
            this.#public = !this.#public;
            this.#emitToClients(socket, 'changePrivacy', this.#public);
        }
    }

    #notifyNewSpeed() {
        const newSpeed = calcBallInitialShift();
        this.#clients.forEach(client => client.emit('new_speed', newSpeed));
    }

    #handleWallHit(socket, data) {
        if (this.#leftSocket !== undefined && socket.id === this.#leftSocket.id)
            this.#leftOk = true;
        if (this.#rightSocket !== undefined && socket.id === this.#rightSocket.id)
            this.#rightOk = true;

        if (this.#leftOk && this.#rightOk) {
            const event_to_emit = data.wall + '_wall_hit';

            this.#clients.forEach(
                client => client.emit(event_to_emit)
            );
            this.#leftOk = false;
            this.#rightOk = false;

            this.#notifyNewSpeed()
        }
    }
}