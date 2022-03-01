'use strict';

import Game from './Game.js';
import {
    canLaunch,
    handleWelcomeArg,
    isAVisitor,
    keydown,
    keyup,
    updateVisitorAuthorisation,
    visitorAuthorized
} from "./pongHelper";

const init = () => {
    const theField = document.getElementById("field");
    const socket = io();
    const theGame = new Game(theField, socket);
    
    socket.on('welcome', (wArg) => handleWelcomeArg(wArg, theGame));
    socket.on('start_and_stop', (arg) => {
        started = arg.started;
        startAndStopGame(theGame, false)
    });

    document.querySelector('#privacy-btn').addEventListener('click', () => document.dispatchEvent(new CustomEvent('privacyChange', {detail:{socket:socket}})));
    document.addEventListener('privacyChange', (event) => changedPrivacy(event));
    document.getElementById('start').addEventListener('click', () => document.dispatchEvent(new CustomEvent('startAndStop')));
    document.addEventListener('startAndStop', () => startAndStopGame(theGame));

    document.addEventListener('keyup', (event) => keyup(event, theGame));
    document.addEventListener('keydown', (event) => keydown(event, theGame));

    document.addEventListener('incrementLeftPlayerScore', () => incrementScore(true, theGame));
    document.addEventListener('incrementRightPlayerScore', () => incrementScore(false, theGame));
}

window.addEventListener("load", init);

// true if game is started
let started = false;

/** start and stop a game
 * @param {Game} theGame - the game to start and stop
 * @param {boolean} emit - if the event should be emitted
 */
const startAndStopGame = (theGame, emit = true) => {
    if (isAVisitor) {
        alert("You can't start the game, you are a visitor...");
        return;
    }

    if (!canLaunch){
        alert("A player is lacking, please wait for the other player to be connected");
        return;
    }

    console.log(theGame.socket.id);
    if (emit)
        theGame.socket.emit('start_and_stop', {started});


    if (!started) {
        theGame.start();

        document.getElementById('start').value = 'stop';
    } else {
        document.getElementById('start').value = 'jouer';
        theGame.stop();
    }
    started = !started;
}


function incrementScore(isPlayerLeft, theGame) {
    console.log(`Incrementing score of ${isPlayerLeft ? 'left':'right'}.`);
    if (isPlayerLeft) {
        ++theGame.score.player1;
        document.querySelector('#leftPlayer').innerHTML = theGame.score.player1;

    } else {
        ++theGame.score.player2;
        document.querySelector('#rightPlayer').innerHTML = theGame.score.player2;

    }
}

export const stopGame = (game) => {
    if (!started) return;

    game.stop();
    document.getElementById('start').value = 'jouer';
    started = false;
}

function changedPrivacy(event) {
    updateVisitorAuthorisation(event.detail.isPublic);
    document.querySelector('#privacy-btn').value = visitorAuthorized ? 'public' : 'private';

    event.detail.socket?.emit('changePrivacy', visitorAuthorized) || console.log("Couldn't send");
}
