class VsComp {
    constructor(player) {
        this.player = player;
        this.click = {};
        this.ctx = gameCanvas.getContext("2d");
        this.env = new Environment(player, null);
        this.score = {};
        this.discardBut = {};
        this.hDiscard = false;
        this.hGo = false;       
        this.proceed = {};
        this.hPro = false;
        this.forfeit = {};
        this.hForfeit = false;
        this.player1Name = {};
        this.player2Name = {};
        this.opponentHand = {};
        this.deck = {};
        this.pegCards = {};
        this.UIs = [];
        this.hCard = {};
        this.hDeck = false;
        this.chosenCard = [];
        this.cSize = {};
        this.gameStage = "initCut";
        this.init();
    }

    init() {
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
            pos: { x: 500, y: 200},
            size: { x: 100, y: 50 },
            text: "Procceed",
        }
        this.go = {
            pos: { x: 500, y: 280},
            size: { x: 100, y: 50 },
            text: "Go"
        }
        this.player1Name = {
            pos: { x: 500, y: 5 },
            size: { x: 100, y: 50 },
            text: this.player1.username,
            score: 0
        };
        this.player2Name = {
            pos:  { x: 500, y: 65 },
            size: { x: 100, y: 50 },
            text: this.player2.username,
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

    update() {
        this.switchStage();
        this.clickTime();
        this.userInput()
        this.render();
    }

    discard1() {
        if (this.chosenCard.length === 1) {
            let num = (this.chosenCard[0].rank > 10) ? 10 : this.chosenCard[0].rank;
            if (num + this.env.pegNum > 31) {
                chatText.innerHTML += '<div> Total card score exceeds 31, try a different card or click "Go" if no valid options available. </div>';
            }
            else {
                let hand = this.env.getPlayerHand1();
                hand.splice(this.chosenCard[0].i, 1);
                this.env.pegPoints(this.chosenCard[0]);
                this.chosenCard = [];
            }
        }
    }

    discard2() {
         if (this.chosenCard.length < 2) {
            chatText.innerHTML += '<div> You must click two cards to discard </div>';
         }
         else { 
            let handL = this.env.getPlayerHand1().length;
            if (handL === 6) {
                if (this.chosenCard[1].i < this.chosenCard[0].i) {
                    let dCard = this.chosenCard[0];
                    this.chosenCard[0] = this.chosenCard[1];
                    this.chosenCard[1] = dCard;
                }
                let c1 = this.chosenCard[1];
                let c2 = this.chosenCard[0];
                let hand = this.env.getPlayerHand1();
                hand.splice(this.chosenCard[1].i, 1);
                hand.splice(this.chosenCard[0].i, 1);
                this.env.sendToCrib(c1, c2);
                this.chosenCard = [];
            }
         }
    }

    switchStage() {
        if (this.gameStage === "initCut") {
            if (this.env.p1Cut !== -1 && this.env.p2Cut !== -1) {
                if (this.env.p1Cut.rank < this.env.p2Cut.rank) {
                    this.env.dealer = 1;
                    this.env.pTurn = 2;
                    chatText.innerHTML += '<div>' + this.player1.username + ' won the cut, it is their deal! </div>';
                    this.env.p1Cut = -1;
                    this.env.p2Cut = -1;
                    this.env.cutCard = null;
                    this.gameStage = "deal";
                }
                else if (this.env.p1Cut.rank > this.env.p2Cut.rank) {
                    this.env.dealer = 2;
                    this.env.pTurn = 1;
                    chatText.innerHTML += '<div>' + this.player2.username + ' won the cut, it is their deal! </div>';
                    this.env.p1Cut = -1;
                    this.env.p2Cut = -1;
                    this.env.cutCard = null;
                    this.gameStage = "deal";
                }
                else {
                    chatText.innerHTML += '<div> Both players cut a ' + this.env.cutCard.rank + ', cut again. </div>';
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
                this.env.dealCards();
                this.shuffled = false;
                chatText.innerHTML += '<div> Select two cards to send to the crib, then click the discard button. </div>';
                this.gameStage = "discard2";
            }
        }
        else if (this.gameStage === "discard2") {
            // wait for both players to discard 2 
            if (this.env.getCrib().length === 4) {
                let name = (this.env.dealer < 2) ? this.player2.username : this.player1.username;
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

    userInput() {
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
        gameCanvas.addEventListener('mouseup', (e) => {
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
                            this.chosenCard[0] = this.chosenCard[1];
                            this.chosenCard[1] = hand[this.hCard.i];
                            this.chosenCard[1].i = this.hCard.i;
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
                        if (this.playerNum < 2 && this.env.p1Cut === -1 || this.playerNum > 1 && this.env.p2Cut === -1) {
                            this.env.cutDeck();
                            socket.emit('initCut', {
                                p1: this.player1.id,
                                p2: this.player2.id,
                                card: this.env.cutCard,
                                pNum: this.playerNum
                            });
                        }
                    }
                    else if (this.gameStage === "getCut" && this.playerNum !== this.env.dealer) {
                        this.env.cutDeck();
                        socket.emit('cutDeck', {
                            p1: this.player1.id,
                            p2: this.player2.id,
                            cut: this.env.cutCard
                        });
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
                    socket.emit('proceed', {
                        p1: this.player1.id,
                        p2: this.player2.id,
                        n: this.playerNum
                    });
                }
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
                        socket.emit('gameOver', {
                            winner: winner,
                            loser: loser,
                            rsn: "forfeit",
                            wBH: wBH,
                            lBH: lBH
                        });
                    }
                }
            }
        });
    }


}