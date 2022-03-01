export const ENTER = 13;

export let canLaunch = false;
export let visitorAuthorized = false;
export let isAVisitor = false;

export const keyup = (event, theGame) => {
    switch (event.which) {
        case ENTER:
            document.dispatchEvent(new CustomEvent('startAndStop'));
            break;
        default:
            theGame.handleKeyUpEventForPaddle(event);
    }
}
export const keydown = (event, theGame) => {
    theGame.handleKeyDownEventForPaddle(event);
}


function bindToLeft(game) {
    game.socket.on('can_start', () => canLaunch = true);
    game.socket.on('not_starting_anymore', () => canLaunch = false);
    commonUpdate(game);
    game.bindLeftPaddle();
}

function bindToRight(game) {
    game.socket.on('can_start', () => canLaunch = true);
    game.socket.on('not_starting_anymore', () => canLaunch = false);
    commonUpdate(game);
    game.bindRightPaddle();
}

/**
 * Or how to recreate a `var`...
 * @param isPublic
 */
export function updateVisitorAuthorisation(isPublic) {
    visitorAuthorized = isPublic !== undefined ? isPublic : !visitorAuthorized;
}

function bindToVisitor(game) {
    if (visitorAuthorized) {
        isAVisitor = true;
        commonUpdate(game);
    } else {
        game.socket.emit('visitor_unauthorized', {});

        alert("You are unauthorized. Begone.");
    }
}

function commonUpdate(game) {
    game.socket.on('changePrivacy', (isPublic) => document.dispatchEvent(new CustomEvent('privacyChange', {detail:{isPublic:isPublic}})));

    game.socket.on('left_wall_hit', () => document.dispatchEvent(new CustomEvent('incrementRightPlayerScore')));
    game.socket.on('right_wall_hit', () => document.dispatchEvent(new CustomEvent('incrementLeftPlayerScore')));

    game.socket.on('left_paddle_update', (update) => {game.onLeftPaddleUpdated(update)});
    game.socket.on('right_paddle_update', (update) => {game.onRightPaddleUpdated(update)});

    game.socket.on('new_speed', (newSpeed) => game.ball.update({ballShiftX:newSpeed.initialShiftX,ballShiftY:newSpeed.initialShiftY}));
    game.bindBase()

    bindGameUpdates(game)
}

function bindGameUpdates(game) {

}


export function handleWelcomeArg(wArg, game) {
    console.log(wArg);
    document.dispatchEvent(new CustomEvent('privacyChange', {detail: {isPublic:wArg.public}}));
    switch (wArg.playerSpot) {
        case 'leftPlayer':
            bindToLeft(game);
            break;
        case 'rightPlayer':
            bindToRight(game);
            break;
        default:
            bindToVisitor(game);
            break;
    }

    game.ball.setInitialSpeedData({
        speed: wArg.speed,
        shiftX: wArg.initialSpeed.initialShiftX,
        shiftY: wArg.initialSpeed.initialShiftY
    });
}



