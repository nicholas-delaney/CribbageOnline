class Gamestate {
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;
        this.playerNum = null;
        this.click = {};
        this.ctx = gameCanvas.getContext("2d");
        this.env = null;
        this.score = {};
        this.discardBut = {};
        this.proceed = {};
        this.forfeit = {};
        this.hForfeit = false;
        this.player1Name = {};
        this.player2Name = {};
        this.hPro = false;
        this.p1Pro = false;
        this.p2Pro = false;
        this.hand = {};
        this.opponentHand = {};
        this.deck = {};
        this.pegCards = {};
        this.UIs = [];
        this.go = {};
        this.hGo = false;
        this.hDiscard = false;
        this.hCard = {};
        this.hDeck = false;
        this.chosenCard = [];
        this.cSize = {};
        this.shuffled = null;
        this.gameStage = "initCut";
        this.init();
    }

    init() {
        this.env = new Environment(this.player1, this.player2);
        this.hCard = {
            isH: false,
            i: null,
        };
        this.click = {
            clicking: false,
            start: 0,
            time: 300
        };
        this.discardBut = {
            pos: { x: 500, y: 340 },
            size: { x: 100, y: 50 },
            text: "Discard"
        };
        this.forfeit = {
            pos: { x: 610, y: 340 },
            size: { x: 100, y: 50 },
            text: "Leave/Forfeit"
        };
        this.proceed = {
            pos: { x: 500, y: 200 },
            size: { x: 100, y: 50 },
            text: "Procceed",
        }
        this.go = {
            pos: { x: 500, y: 280 },
            size: { x: 100, y: 50 },
            text: "Go"
        }
        this.player1Name = {
            pos: { x: 500, y: 5 },
            size: { x: 100, y: 50 },
            text: this.player1.username,
            score: 0
        };
        let name = (this.player2) ? this.player2.username : "Computer";
        this.player2Name = {
            pos: { x: 500, y: 65 },
            size: { x: 100, y: 50 },
            text: name,
            score: 0
        };
        this.cutCard = {
            pos: { x: 102, y: 140 }
        };
        this.hand = {
            pos: { x: 50, y: 280 }
        };
        this.opponentHand = {
            pos: { x: 50, y: 10 }
        };
        this.crib = {
            pos: { x: 50, y: 140 }
        }
        this.deck = {
            pos: { x: 100, y: 140 }
        };
        this.pegCards = {
            pos: { x: 186, y: 140 }
        };
        this.pegScore = {
            pos: { x: 500, y: 125 },
            size: { x: 100, y: 50 },
            text: "Pegging Total"
        }
        this.cSize = { x: 66, y: 100 };
        this.UIs = [this.discardBut, this.player1Name, this.player2Name];
        if (this.player2) {
            this.playerNum = (this.player1.username === yourInfo.username) ? 1 : 2;
        }
        else {
            this.playerNum = 1;
        }
        this.shuffled = (this.player2) ? false : true;
        this.p2Pro = (this.player2) ? false : true;
        chatText.innerHTML += '<div> Cut the deck to see who goes first! </div>';
    }

    // check if you can click again
    clickTime() {
        if (this.click.clicking) {
            let t = new Date().getTime();
            let elapsed = t - this.click.start;
            if (elapsed >= this.click.time) {
                this.click.clicking = false;
            }
        }
    }

    // main game update loop
    update() {
        this.switchStage();
        if (!this.player2) {
            this.computerAI();
        }
        this.clickTime();
        this.userInput()
        this.render();
    }

    // lay down 1 card in the pegging stage
    discard1() {
        if (this.chosenCard.length === 1 && this.playerNum === this.env.pTurn) {
            let num = (this.chosenCard[0].rank > 10) ? 10 : this.chosenCard[0].rank;
            if (num + this.env.pegNum > 31) {
                chatText.innerHTML += '<div> Total card score exceeds 31, try a different card or click "Go" if no valid options available. </div>';
            }
            else {
                let hand = (this.playerNum < 2) ? this.env.getPlayerHand1() : this.env.getPlayerHand2();
                hand.splice(this.chosenCard[0].i, 1);
                this.env.pegPoints(this.chosenCard[0]);
                this.chosenCard = [];
            }
        }
    }

    // discard 2 cards and send them to the crib hand
    discard2() {
        // make sure two cards are picked
        if (this.chosenCard.length !== 2) {
            chatText.innerHTML += '<div> You must click two cards to discard </div>';
        }
        else {
            // send two cards to the crib
            let handL = (this.playerNum < 2) ? this.env.getPlayerHand1().length : this.env.getPlayerHand2().length;
            if (handL === 6) {
                if (this.chosenCard[1].i < this.chosenCard[0].i) {
                    let dCard = this.chosenCard[0];
                    this.chosenCard[0] = this.chosenCard[1];
                    this.chosenCard[1] = dCard;
                }
                let c1 = this.chosenCard[1];
                let c2 = this.chosenCard[0];
                let hand = (this.playerNum < 2) ? this.env.getPlayerHand1() : this.env.getPlayerHand2();
                hand.splice(this.chosenCard[1].i, 1);
                hand.splice(this.chosenCard[0].i, 1);
                this.env.sendToCrib(c1, c2);
                this.chosenCard = [];
            }
        }
    }

    // computer actions based on what stage of the game the play is in
    computerAI() {
        if (this.gameStage === "discard2") {
            if (this.env.playerHand2.length === 6) {
                this.env.greedyDiscard();
            }
        }
        else if (this.gameStage === "getCut" && this.env.dealer === 1) {
            this.env.handleCut(this.env.deck.splice(Math.floor(Math.random() * this.env.deck.length), 1)[0]);
        }
        else if (this.gameStage === "pegging" && this.env.pTurn === 2) {
            this.env.greedyPegging();
        }
        else if (this.gameStage === "count") {
            if (this.p1Pro) {
                this.p1Pro = false;
                this.env.cutCard = null;
                this.gameStage = "deal";
            }
        }
    }

    // update game based on which stage of the game the play is in
    switchStage() {
        if (this.gameStage === "initCut") {
            if (this.env.p1Cut !== -1 && this.env.p2Cut !== -1) {
                let name1 = this.player1.username;
                let name2 = (this.player2) ? this.player2.username : "Computer";
                chatText.innerHTML += '<div>' + name1 + ' cut a ' + this.env.p1Cut.rank + ' and ' + name2 + ' cut a ' + this.env.p2Cut.rank + '! </div>';
                if (this.env.p1Cut.rank < this.env.p2Cut.rank) {
                    this.env.dealer = 1;
                    this.env.pTurn = 2;
                    chatText.innerHTML += '<div>' + name1 + ' won the cut, it is their deal! </div>';
                    this.env.p1Cut = -1;
                    this.env.p2Cut = -1;
                    this.env.cutCard = null;
                    this.gameStage = "deal";
                }
                else if (this.env.p1Cut.rank > this.env.p2Cut.rank) {
                    this.env.dealer = 2;
                    this.env.pTurn = 1;
                    chatText.innerHTML += '<div>' + name2 + ' won the cut, it is their deal! </div>';
                    this.env.p1Cut = -1;
                    this.env.p2Cut = -1;
                    this.env.cutCard = null;
                    this.gameStage = "deal";
                }
                else {
                    chatText.innerHTML += '<div> Both player cut a ' + this.env.cutCard.rank + ', cut again. </div>';
                    this.env.p1Cut = -1;
                    this.env.p2Cut = -1;
                    this.env.cutCard = null;
                }
            }
        }
        else if (this.gameStage === "deal") {
            if (!this.shuffled) {
                this.env.shuffleDeck();
            }
            else {
                if (!this.player2) {
                    this.env.shuffleDeck();
                }
                this.env.dealCards();
                this.shuffled = (!this.player2) ? true : false;
                let name = (this.env.dealer === 1) ? this.player1.username : (this.player2) ? this.player2.username : "Computer";
                chatText.innerHTML += '<div> Select two cards to send to ' + name + 's crib, then click the discard button. </div>';
                this.gameStage = "discard2";
            }
        }
        else if (this.gameStage === "discard2") {
            // wait for both players to discard 2 
            if (this.env.getCrib().length === 4) {
                let name = (this.env.dealer === 2) ? this.player1.username : (this.player2) ? this.player2.username : "Computer";
                chatText.innerHTML += '<div> Both players have discared two cards to the crib, ' + name + 's turn to cut the deck! </div>';
                this.gameStage = "getCut";
                this.chosenCard = [];
            }
        }
        else if (this.gameStage === "getCut") {
            if (this.env.cutCard) {
                chatText.innerHTML += '<div> Time to start the pegging round! </div>'
                this.gameStage = "pegging";
            }
        }
        else if (this.gameStage === "pegging") {
            if (this.env.playerHand1.length === 0 && this.env.playerHand2.length === 0) {
                this.hGo = false;
                this.gameStage = "count";
                this.env.countCards();
                if (this.env.dealer === 1) {
                    this.env.dealer = 2;
                    this.env.pTurn = 1;
                }
                else {
                    this.env.dealer = 1;
                    this.env.pTurn = 2;
                }
                chatText.innerHTML += '<div> Round over! Click the proceed button to continue to the next hand. </div>';
            }
        }
        this.player1Name.score = this.env.p1Score;
        this.player2Name.score = this.env.p2Score;
    }

    // handle user input via mouse
    userInput() {
        // check if hovering something important
        gameCanvas.addEventListener('mousemove', (e) => {
            // get x/y mouse coords 
            let rect = lobbyCanvas.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;
            let hovered = false;
            // check if mouse hovering over discard button
            let s = this.discardBut.size;
            let p = this.discardBut.pos;
            if (x >= p.x && x <= p.x + s.x && y >= p.y && y <= p.y + s.y) {
                this.hDiscard = true;
                hovered = true;
            }
            else {
                this.hDiscard = false;
            }
            // check if hovering proceed button in count stage
            if (!hovered && this.gameStage === "count") {
                s = this.proceed.size;
                p = this.proceed.pos;
                if (x >= p.x && x <= p.x + s.x && y >= p.y && y <= p.y + s.y) {
                    this.hPro = true;
                    hovered = true;
                }
                else {
                    this.hPro = false;
                }
            }
            // check if mouse hovering over go button
            if (!hovered && this.gameStage === "pegging") {
                s = this.go.size;
                p = this.go.pos;
                if (x >= p.x && x <= p.x + s.x && y >= p.y && y <= p.y + s.y) {
                    this.hGo = true;
                    hovered = true;
                }
                else {
                    this.hGo = false;
                }
            }
            // check if mouse hovering over deck
            if (!hovered) {
                s = this.cSize;
                p = this.deck.pos;
                if (x >= p.x && x <= p.x + s.x && y >= p.y && y <= p.y + s.y) {
                    this.hDeck = true;
                    hovered = true;
                }
                else {
                    this.hDeck = false;
                }
            }
            // check if hovering over a card in your hand
            if (!hovered) {
                p = this.hand.pos;
                let l = (this.playerNum < 2) ? this.env.getPlayerHand1().length : this.env.getPlayerHand2().length;
                for (let i = 0; i < l; i++) {
                    if (x >= p.x + i * 67 && x <= p.x + i * 67 + s.x && y >= p.y && y <= p.y + s.y) {
                        this.hCard.isH = true;
                        this.hCard.i = i;
                        hovered = true;
                    }
                }
                if (!hovered) {
                    this.hCard.isH = false;
                }
            }
            // check if hovering forfeit button
            if (!hovered) {
                p = this.forfeit.pos;
                s = this.forfeit.size;
                if (x >= p.x && x <= p.x + s.x && y >= p.y && y <= p.y + s.y) {
                    this.hForfeit = true;
                    hovered = true;
                }
                else {
                    this.hForfeit = false;
                }
            }
        });
        // check if clicking something important
        gameCanvas.addEventListener('mousedown', (e) => {
            if (!this.click.clicking) {
                this.click.clicking = true;
                this.click.start = new Date().getTime();
                // check if clicking one of your cards
                if (this.hCard.isH) {
                    let hand = (this.playerNum < 2) ? this.env.getPlayerHand1() : this.env.getPlayerHand2();
                    if (this.gameStage === "pegging") {
                        this.chosenCard[0] = hand[this.hCard.i];
                        this.chosenCard[0].i = this.hCard.i;
                    }
                    else {
                        if (this.chosenCard.length > 1) {
                            if (this.chosenCard[0] !== hand[this.hCard.i]) {
                                this.chosenCard[0] = this.chosenCard[1];
                                this.chosenCard[1] = hand[this.hCard.i];
                                this.chosenCard[1].i = this.hCard.i;
                            }
                        }
                        else if (this.chosenCard.length > 0) {
                            this.chosenCard[1] = hand[this.hCard.i];
                            this.chosenCard[1].i = this.hCard.i;
                        }
                        else {
                            this.chosenCard.push(hand[this.hCard.i]);
                            this.chosenCard[0].i = this.hCard.i;
                        }
                    }
                }
                // check if clicking deck
                else if (this.hDeck) {
                    if (this.gameStage === "initCut") {
                        if (this.playerNum === 1 && this.env.p1Cut === -1 || this.playerNum === 2 && this.env.p2Cut === -1) {
                            this.env.cutDeck();
                            if (this.player2) {
                                socket.emit('initCut', {
                                    p1: this.player1.id,
                                    p2: this.player2.id,
                                    card: this.env.cutCard,
                                    pNum: this.playerNum
                                });
                            }
                        }
                    }
                    else if (this.gameStage === "getCut" && this.playerNum !== this.env.dealer) {
                        this.env.cutDeck();
                        if (this.player2) {
                            socket.emit('cutDeck', {
                                p1: this.player1.id,
                                p2: this.player2.id,
                                cut: this.env.cutCard
                            });
                        }
                    }
                }
                // check if clicking discard button 
                else if (this.hDiscard) {
                    if (this.gameStage === "discard2") {
                        this.discard2();
                    }
                    else if (this.gameStage === "pegging") {
                        this.discard1();
                    }
                }
                // check if clicking go button
                else if (this.hGo && this.playerNum === this.env.pTurn) {
                    this.env.go(this.playerNum);
                }
                // check if clicking proceed button
                else if (this.hPro) {
                    if (this.player2) {
                        socket.emit('proceed', {
                            p1: this.player1.id,
                            p2: this.player2.id,
                            n: this.playerNum
                        });
                    }
                    else {
                        this.p1Pro = true;
                    }
                }
                // clicking leave / forfeit button
                else if (this.hForfeit) {
                    let answer = confirm("Are you sure you want to leave and forfeit the game?");
                    if (answer) {
                        let winner = null;
                        let loser = null;
                        let wBH = null;
                        let lBH = null;
                        if (this.playerNum === 1) {
                            winner = this.player2;
                            loser = this.player1;
                            wBH = this.env.p2BestHand;
                            lBH = this.env.p1BestHand;
                        }
                        else {
                            winner = this.player1;
                            loser = this.player2;
                            wBH = this.env.p1BestHand;
                            lBH = this.env.p2BestHand;
                        }
                        if (this.player2) {
                            socket.emit('gameOver', {
                                winner: winner,
                                loser: loser,
                                rsn: "forfeit",
                                wBH: wBH,
                                lBH: lBH
                            });
                        }
                        else {
                            this.env.gameOver(this.player2, this.player1);
                        }
                    }
                }
            }
        });
    }

    render() {
        // start new frame
        this.ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        this.ctx.font = "14px Epilogue";
        let s = this.cSize;
        // draw discard button 
        this.ctx.fillStyle = (this.hDiscard) ? "black" : "orange";
        this.ctx.fillRect(this.discardBut.pos.x, this.discardBut.pos.y, this.discardBut.size.x, this.discardBut.size.y);
        this.ctx.fillStyle = (this.hDiscard) ? "orange" : "black";
        this.ctx.fillText(this.discardBut.text, this.discardBut.pos.x + 26, this.discardBut.pos.y + 27);
        // draw go button
        this.ctx.fillStyle = (this.hGo) ? "black" : "orange";
        this.ctx.fillRect(this.go.pos.x, this.go.pos.y, this.go.size.x, this.go.size.y);
        this.ctx.fillStyle = (this.hGo) ? "orange" : "black";
        this.ctx.fillText(this.go.text, this.go.pos.x + 40, this.go.pos.y + 28);
        // draw procceed button
        if (this.gameStage === "count") {
            this.ctx.fillStyle = (this.hPro) ? "white" : "blue";
            this.ctx.fillRect(this.proceed.pos.x, this.proceed.pos.y, this.proceed.size.x, this.proceed.size.y);
            this.ctx.fillStyle = (this.hPro) ? "blue" : "white";
            this.ctx.fillText(this.proceed.text, this.proceed.pos.x + 16, this.proceed.pos.y + 29);
        }
        // draw leave/forfeit button
        this.ctx.fillStyle = (this.hForfeit) ? "black" : "orange";
        this.ctx.fillRect(this.forfeit.pos.x, this.forfeit.pos.y, this.forfeit.size.x, this.forfeit.size.y);
        this.ctx.fillStyle = (this.hForfeit) ? "orange" : "black";
        this.ctx.fillText(this.forfeit.text, this.forfeit.pos.x + 5, this.forfeit.pos.y + 28);
        // draw player names and scores
        let l = this.UIs.length;
        let waiting = false;
        for (let i = 1; i < l; i++) {
            waiting = (this.env.pTurn === i) ? false : true;
            if (i === 1) {
                if (this.gameStage === "initCut") {
                    waiting = (this.env.p1Cut === -1) ? false : true;
                }
                else if (this.gameStage === "count") {
                    waiting = (this.p1Pro) ? true : false;
                }
                else if (this.gameStage === "discard2") {
                    waiting = (this.env.playerHand1.length < 6) ? true : false;
                }
            }
            else {
                if (this.gameStage === "initCut") {
                    waiting = (this.env.p2Cut === -1) ? false : true;
                }
                else if (this.gameStage === "count") {
                    waiting = (this.p2Pro) ? true : false;
                }
                else if (this.gameStage === "discard2") {
                    waiting = (this.env.playerHand2.length < 6) ? true : false;
                }
            }
            this.ctx.fillStyle = (waiting) ? "green" : "red";
            this.ctx.fillRect(this.UIs[i].pos.x, this.UIs[i].pos.y, this.UIs[i].size.x, this.UIs[i].size.y);
            this.ctx.fillStyle = "black";
            this.ctx.fillText(this.UIs[i].text, this.UIs[i].pos.x + 20, this.UIs[i].pos.y + 15);
            this.ctx.fillText(this.UIs[i].score, this.UIs[i].pos.x + 45, this.UIs[i].pos.y + 35);
        }
        // draw pegging round total
        if (this.gameStage === "pegging") {
            this.ctx.fillStyle = "orange";
            this.ctx.fillRect(this.pegScore.pos.x, this.pegScore.pos.y, this.pegScore.size.x, this.pegScore.size.y);
            this.ctx.fillStyle = "black";
            this.ctx.fillText(this.pegScore.text, this.pegScore.pos.x + 5, this.pegScore.pos.y + 15);
            this.ctx.fillText(this.env.pegNum, this.pegScore.pos.x + 45, this.pegScore.pos.y + 35);
        }
        // indicate hovered deck (if it's hovered)
        if (this.hDeck) {
            this.ctx.fillStyle = "orange";
            this.ctx.fillRect(this.deck.pos.x - 1, this.deck.pos.y - 1, s.x + 2, s.y + 2);
        }
        // draw deck
        let cInfo = assets.getHiddenCard();
        this.ctx.drawImage(cInfo.img, cInfo.sx, cInfo.sy, cInfo.sW, cInfo.sH, this.deck.pos.x, this.deck.pos.y, s.x, s.y);
        // draw cut card
        if (this.env.cutCard) {
            cInfo = assets.getCard(this.env.cutCard.rank, this.env.cutCard.suit);
            this.ctx.drawImage(cInfo.img, cInfo.sx, cInfo.sy, cInfo.sW, cInfo.sH, this.cutCard.pos.x, this.cutCard.pos.y, s.x, s.y);
        }
        // indicate selected card(s) (if it/they exist(s))
        if (this.chosenCard.length > 0) {
            this.ctx.fillStyle = "blue";
            for (let i = 0; i < this.chosenCard.length; i++) {
                this.ctx.fillRect(this.hand.pos.x + this.chosenCard[i].i * 67 - 1, this.hand.pos.y - 11, s.x + 2, s.y + 4);
            }
        }
        // indicate hovered card (if it exists)
        if (this.hCard.isH) {
            this.ctx.fillStyle = "orange";
            let valid = true;
            for (let c in this.chosenCard) {
                if (this.hCard.i === this.chosenCard[c].i) {
                    valid = false;
                }
            }
            if (valid) {
                this.ctx.fillRect(this.hand.pos.x + this.hCard.i * 67 - 1, this.hand.pos.y - 1, s.x + 2, s.y + 2);
            }
        }
        // draw your hand 
        let dHand = (this.playerNum < 2) ? this.env.getPlayerHand1() : this.env.getPlayerHand2();
        let h = this.hand;
        l = dHand.length;
        if (l > 0) {
            for (let i = 0; i < l; i++) {
                cInfo = assets.getCard(dHand[i].rank, dHand[i].suit);
                let space = (i === 4 && this.gameStage === "count") ? 77 : 67;
                let posY = h.pos.y;
                for (let c in this.chosenCard) {
                    posY = (this.chosenCard[c].i === i) ? posY - 10 : posY;
                }
                this.ctx.drawImage(cInfo.img, cInfo.sx, cInfo.sy, cInfo.sW, cInfo.sH, h.pos.x + i * space, posY, s.x, s.y);
            }
        }
        // draw opponent hand
        dHand = (this.playerNum < 2) ? this.env.getPlayerHand2() : this.env.getPlayerHand1();
        l = dHand.length;
        h = this.opponentHand;
        if (l > 0) {
            for (let i = 0; i < l; i++) {
                cInfo = (this.gameStage === "count") ? assets.getCard(dHand[i].rank, dHand[i].suit) : assets.getHiddenCard();
                let space = (i === 4 && this.gameStage === "count") ? 77 : 67;
                this.ctx.drawImage(cInfo.img, cInfo.sx, cInfo.sy, cInfo.sW, cInfo.sH, h.pos.x + i * space, h.pos.y, s.x, s.y);
            }
        }
        // draw crib hand in count stage
        if (this.gameStage === "count") {
            dHand = this.env.cribHand;
            l = dHand.length;
            h = this.crib;
            for (let i = 0; i < l; i++) {
                cInfo = assets.getCard(dHand[i].rank, dHand[i].suit);
                let space = (i === 4) ? 77 : 67;
                this.ctx.drawImage(cInfo.img, cInfo.sx, cInfo.sy, cInfo.sW, cInfo.sH, h.pos.x + i * space, h.pos.y, s.x, s.y);
            }
        }
        // draw pegging cards
        if (this.gameStage === "pegging" && this.env.pegCards.length > 0) {
            dHand = this.env.pegCards;
            l = dHand.length;
            h = this.pegCards;
            for (let i = 0; i < l; i++) {
                cInfo = assets.getCard(dHand[i].rank, dHand[i].suit);
                this.ctx.drawImage(cInfo.img, cInfo.sx, cInfo.sy, cInfo.sW, cInfo.sH, h.pos.x + i * 28, h.pos.y, s.x, s.y);
            }
        }
    }
}