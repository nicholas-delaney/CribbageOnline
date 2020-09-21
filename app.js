// mongoDB
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://nicholasdelaney:" + process.env.DB_PASSWORD + "@nickdb-vlvu9.mongodb.net/NickDB?retryWrites=true&w=majority";
const dbName = "NickDB";
// express
const express = require('express');
const app = express();
const http = require('http').createServer(app);
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));
let port = process.env.PORT;
if (port == null || port == "") {
  port = 2000;
}
http.listen(port);
// globals
let socketList = [];
let playerList = [];
let you = null;
// on socket connection
const io = require('socket.io')(http); 
io.sockets.on('connection', (socket) => {
    
    socketList.push(socket);
    socket.emit('yourSocketInfo', {
        id: socket.id,
    });
    // send msg to everyone in chat box
    socket.on('sendMsg', (data) => {
        io.emit('addToChat', {
            name: data.name,
            msg: data.msg
        });
    });
    // send msg to the player you are in a game with
    socket.on('gameMsg', (data) => {
        io.to(data.p1.id).to(data.p2.id).emit('addToChat', {
            name: data.name,
            msg: data.msg
        });
    })
    // update stats on game over vs player
    socket.on('gameOver', (data) => {
        updateGameOver(data.winner, data.loser, data.wBH, data.lBH);
        io.to(data.winner.id).to(data.loser.id).emit('handleGameOver', {
            winner: data.winner,
            loser: data.loser,
            rsn: data.rsn
        });
    });
    // update stats on game over vs computer
    socket.on('compGameOver', (data) => {
        updateCompGameOver(data.win, data.player, data.bH);
    });
    // send go info to both players in a game
    socket.on('go', (data) => {
        io.to(data.p1).to(data.p2).emit('handleGo', {
            p1Go: data.p1Go,
            p2Go: data.p2Go,
            p1Score: data.p1Score,
            p2Score: data.p2Score,
            pTurn: data.pTurn,
            pegNum: data.pegNum,
            pegCards: data.pegCards,
            msg: data.msg,
            sMsg: data.sMsg
        });
    });
    // send proceed info to both players
    socket.on('proceed', (data) => {
        io.to(data.p1).to(data.p2).emit('handleProceed', {
            n: data.n
        });
    });
    // send pegging turn results to both players 
    socket.on('pegResult', (data) => {
        io.to(data.p1).to(data.p2).emit('handlePegResults', {
            n: data.n,
            p1S: data.p1S,
            p2S: data.p2S,
            p1H: data.p1H,
            p2H: data.p2H,
            pCs: data.pCs,
            aPC: data.aPC,
            pN: data.pN,
            msg: data.msg
        });
    });
    // send records of each players score to other player
    socket.on('checkScore', (data) => {
        io.to(data.p1).to(data.p2).emit('handleCheckScore', {
           p1Score: data.p1Score,
           p2Score: data.p2Score
        });
    })
    // send cards sent to crib to both players
    socket.on('sendToCrib', (data) => {
        io.to(data.p1).to(data.p2).emit('sharedCrib', {
            c1: data.c1,
            c2: data.c2,
            p1H: data.p1H,
            p2H: data.p2H
        });
    });
    // send cut card info to both players
    socket.on('cutDeck', (data) => {
        io.to(data.p1).to(data.p2).emit('sharedCut', {
            cut: data.cut
        });
    });
    socket.on('initCut', (data) => {
        io.to(data.p1).to(data.p2).emit('sharedInitCut', {
            pNum: data.pNum,
            card: data.card
        });
    });
    // send random deck order info to both players
    socket.on('shuffleDeck', (data) => {
        io.to(data.p1).to(data.p2).emit('sharedDeck', {
            deck: data.deck
        });
    });
    // send challenge request to intended player
    socket.on('challengeRequest', (data) => {
        io.to(data.receiver.id).emit('displayChallenge', {
            sender: data.sender,
        });
    });
    // send challenge response back to challenger
    socket.on('challengeResponse', (data) => {
        if (data.response) {
            io.to(data.receiver.id).to(data.sender.id).emit('startGame', {
                p1: data.sender,
                p2: data.receiver,
            });
        }
    });
    // update whether to show a player in the lobby or not
    socket.on('inOutLobby', (data) => {
        if (data.p2) {
            for (let i = 0; i < playerList.length; i++) {
                if (playerList[i].username === data.p1.username || playerList[i].username === data.p2.username) {
                    playerList[i].inLobby = data.inLobby;
                    playerList[i].challenger = (playerList[i].username === data.p1.username) ? data.p2 : data.p1;
                }
            }
        }
        else {
            for (let i = 0; i < playerList.length; i++) {
                if (playerList[i].username === data.p1.username) {
                    playerList[i].inLobby = data.inLobby;
                    playerList[i].challenger = null;
                }
            }
        }
    });
    // handle when a player disconnects from the game
    socket.on('disconnect', () => {
        let i = socketList.indexOf(socket);
        if (i !== -1) {
            socketList.splice(i, 1);
        }
        for (let i in playerList) {
            if (playerList[i].id === socket.id) {
                if (!playerList[i].inLobby) {
                    if (playerList[i].challenger) {
                        io.to(playerList[i].challenger.id).emit('handleGameOver', {
                            winner: playerList[i].challenger,
                            loser: playerList[i],
                            rsn: "disconnect",
                        });
                    }
                }
                playerList.splice(i, 1);
                break;
            }
        }
    });
    // send sign in result back to player
    socket.on('signIn', (data) => {
        (async function () {
            let result = await isValidPassword(data);
            if (result.isValid) {
                socket.emit('signInResponse', {
                    msg: result.msg,
                    success: true,
                    players: playerList,
                    you: you,
                });
            }
            else {
                socket.emit('signInResponse', {
                    success: false,
                    msg: result.msg
                });
            }
        })();
    });
    // send sign up results back to player
    socket.on('signUp', (data) => {
        (async function () {
            if (await addAccount(data)) {
                socket.emit('signUpResponse', {
                    success: true,
                    msg: "Account Created"
                });
            }
            else {
                socket.emit('signUpResponse', {
                    success: false,
                    msg: "Username Taken"
                });
            }
        })();
    });
});
// update loop - send info about all current players online
setInterval(() => {
    io.sockets.emit('playersInfo', {
        players: playerList,
    });
}, 1000);
// update db wins/loses after game
async function updateGameOver(winner, loser, wBH, lBH) {
    try {
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        await client.db(dbName).collection("profiles").updateOne(
            { username: winner.username },
            {
                $inc: { wins: 1 },
            }
        );
        await client.db(dbName).collection("profiles").updateOne(
            { username: loser.username },
            {
                $inc: { losses: 1 },
            }
        );
        if (wBH.updated) {
            await client.db(dbName).collection("profiles").updateOne(
                { username: winner.username },
                {
                    $set: { bestHand: { score: wBH.score, hand: wBH.hand } }
                }
            );
        }
        if (lBH.updated) {
            await client.db(dbName).collection("profiles").updateOne(
                { username: loser.username },
                {
                    $set: { bestHand: { score: lBH.score, hand: lBH.hand } }
                }
            );
        }
    } catch (err) {
        console.log(err.stack);
    }

}
// update stats after game against the computer
async function updateCompGameOver(win, player, bH) {
    try {
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        if (win) {
            await client.db(dbName).collection("profiles").updateOne(
                { username: player.username },
                {
                    $inc: { "vsComp.wins": 1 },
                }
            );
        }
        else {
            await client.db(dbName).collection("profiles").updateOne(
                { username: player.username },
                {
                    $inc: { "vsComp.losses": 1 },
                }
            );
        }
        if (bH.updated) {
            await client.db(dbName).collection("profiles").updateOne(
                { username: player.username },
                {
                    $set: { bestHand: { score: bH.score, hand: bH.hand } }
                }
            );
        }
    }
    catch (err) {
        console.log(err.stack);
    }
}
// sign-up / sign-in functions
async function addAccount(data) {
    try {
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const result = await client.db(dbName).collection("profiles").findOne({ username: data.username });
        if (result) {
            await client.close();
            return false;
        }
        else {
            data.wins = 0;
            data.losses = 0;
            data.bestHand = { score: 0, hand: [] };
            data.vsComp = { wins: 0, losses: 0 };
            const result = await client.db(dbName).collection("profiles").insertOne(data);
            await client.close();
            return true;
        }
    } catch (err) {
        console.log(err.stack);
    }
}
async function isValidPassword(data) {
    try {
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const result = await client.db(dbName).collection("profiles").findOne({ username: data.username });
        await client.close();
        if (result) {
            let alreadyLoggedIn = false;
            for (let i = 0; i < playerList.length; i++) {
                if (result.username === playerList[i].username) {
                    alreadyLoggedIn = true;
                }
            }
            if (!alreadyLoggedIn && result.password === data.password) {
                result.id = data.id;
                result.inLobby = true;
                delete result.password;
                playerList.push(result);
                you = result;
                return {
                    isValid: true,
                    msg: "Sign-in Successful!"
                };
            }
            else if (alreadyLoggedIn) {
                return {
                    isValid: false,
                    msg: "Username already logged in."
                };
            }
            else {
                return {
                    isValid: false,
                    msg: "Invalid Password."
                };
            }
        }
        else {
            return {
                isValid: false,
                msg: "Username not found."
            };
        }
    } catch (err) {
        console.log(err.stack);
    }
}
