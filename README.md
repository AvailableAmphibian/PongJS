# Practical 3
## Pong

To make this work you need to :

In the client folder :
```
npm run build
```

Then in the server folder :
```
nodemon
```

The route to play is : `<host>/public/c-dist/index.html`


### Setup - v0

Nothing special to say about this part.

### WebPack - v1

Most of the Webpack related work has been made in this version, to check it out, you can do the following command :

```
git checkout tp3-webpack
```

### The Wall - v2

Here I handled everything related to the base game. To check out what's been made until this point :

```
git checkout tp3-wall
```

### That's what I call Pong ! - v3

To check out a first working version, have a look at this tag :

```
git checkout tp3-pong
```

### It's even better distributed... - v4

The final version, you can cast a glance at this tag :

```
git checkout tp3-distributed
```

## My Work

First thing first, I chose to keep things simple for me and decided to 
keep a "right" and "left" clients, doing it this way was easier in the 
case I wanted to add spectators... Which is actually possible ! The 
game is private by default but the lobby can easily be made public (and 
put back to private) by simply clicking the input button labeled `private`.

> You can note that when the lobby is private and a third client tries to 
connect to it, an alert is being sent to them and the client is disconnected 
> from the server.
>
> ---
>
> Meanwhile, when a game is public both buttons are being locked away from
> the spectators.
> > There might be some issues with the spectators, I didn't have time to fully
> > try it out...

---

The players can also start thew game by pressing the `Enter` key rather than 
pressing the button labeled with `jouer`.  
Both paddles are automatically set back to the center of their field once the
ball hit a wall. Speaking of the ball, rather than making it start always from 
the first player, it looked fairer and funnier if it was starting from the 
center of the field.

---

At first, I was creating the speed from the clients but clients weren't 
synchronized when starting off, so I decided to put the function that creates 
the default speed of rounds in the server-side.

---

Here I chose to make a promise because it was easier to read and to maintain
than classic sequential code...

Sometimes the event emission lagged when it was not using this promise form.
By using a promise, we are seeing a possible evolution of the server using
fully asynchronous code (Rather than `event` / `reactive` synchronicity )

```js
class SocketController {

    /* a bunch of omitted code */

    #verifyPlayersAreConnected() {
        console.log("Verifying...")
        if (this.#leftSocket !== null && this.#rightSocket !== null) {
            Promise.resolve(() => console.log("Emitting to sockets"))
                .then(() => this.#rightSocket.emit('can_start'), () => console.log("Not sent to right"))
                .then(() => this.#leftSocket.emit('can_start'), () => console.log("Not sent to left"))

            console.log("... OK!")
        }
    }
}
```

---

Finally, the last thing I have to talk about in my implementation is the 
score synchronization, I had to think about it a long time before finding
a convenient way to do this and I kept the following :
> Every client in the lobby emits a `wall_hit` event and the server waits 
> for both players to send the event and then synchronizes the score by 
> sending a `direction_score_up` event to every client. 

#### Something more...

> Every idea I'm talking about in this part have been aborted because of
> unfortunate news that took me a lot of time to handle...

We could have enhanced this project easily by adding some of the following
things :

- Lobbies
> That was actually on the way... But I didn't have the time to fully make it.
> The final idea would have been rather than having a list of clients in the
> [`socketController.js`](./server/controllers/socketController.js) to have a
> list of `lobbies` that could have been joined with maybe a link or  a code.  
> This idea of lobby was the reason why game can have spectators (and lobbies
> be private / public).

- A chat 
> Can be made easily with `socket.io`, a sample code would have been this :
> ```js
> class Server {
>   #clients; // [Socket]
>   
>   /* other stuff */
>   
>   #setupListeners(socket) { 
>       /* other event receivers */
>       socket.on('send_message', (message) => this.#clients.forEach(
>           client => client.emit('message_sent', message)
>       ));
>       /* other event receivers */
>   }
> 
>   /* other stuff*/
> }
> 
> class Client {
>   #socket;
>   
>   /* other stuff */
> 
>   #setupListeners() {
>       /* other receivers */
> 
>       this.#socket.on(
>           'message_sent', 
>           document.dispatchEvent(
>               new CustomEvent('message_received', {
>                   detail: {message: message}
>               })));
>
>       /* other receivers */
>   }
> }
> ```
> But it was long to do because I needed to make a chat and modify the HTML 
> / CSS a bunch... This idea could have been linked with the next idea.

- A leaderboard
> This could have been something nice to add, but it was also a lot of inconvenience 
> as I needed to create some system of accounts (to store different users) and 
> a database (which is fully covered by the next project). 
> 
> > The link between this idea and the previous would have been about giving a
> > name to the player speaking and maybe storing the X last messages sent in a 
> > lobby.

- Custom EventEmission 
> Another aborted idea because I lack time to refactor things, it could have 
> actually been a cool thing to make the client side fully use the "power" of
> reactive programming by using the `EventEmitter` API provided by `Node` or
> the RxJs library for the whole "ball hit something" part. 

- Two players is fun... But I like to play with the crew !
> A fun thing to do would have been to make the game playable by more than 2
> players (by giving access to the upper and the bottom walls for example)... 
> It would have been actually easy to make by using the `Lobbies` and 
> `Custom EventEmission` ideas I talked about before.
