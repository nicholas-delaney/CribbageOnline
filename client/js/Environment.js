class Environment {
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
        this.p1Score = 0;
        this.p2Score = 0;
        this.p1Cut = -1;
        this.p2Cut = -1;
        this.p1Go = false;
        this.p2Go = false;
        this.p1BestHand = {};
        this.p2BestHand = {};
        this.deck = [];
        this.playerHand1 = [];
        this.playerHand2 = [];
        this.countHands = [];
        this.cribHand = [];
        this.actions = [];
        this.winnerDeclared = false;
        this.cutCard = null;
        this.dealer = null;
        this.pTurn = null;
        this.allPegCards = [];
        this.pegCards = [];
        this.pegNum = 0;
        this.suits = 4;
        this.ranks = 13;
        this.deckSize = 52;
        this.init();
    }

    init() {
        // init actions and deck
        for (let i = 0; i < 5; i++) {
            for (let j = i + 1; j < 6; j++) {
                this.actions.push({ a: i, b: j });
            }
        }
        for (let i = 0; i < this.suits; i++) {
            for (let j = 0; j < this.ranks; j++) {
                this.deck.push({ rank: j + 1, suit: i + 1 });
            }
        }
        this.p1BestHand = this.p1.bestHand;
        this.p1BestHand.updated = false;
        if (this.p2) {
            this.p2BestHand = this.p2.bestHand;
            this.p2BestHand.updated = false;
        }
    }

    getActions() {
        return this.actions;
    }

    getDeck() {
        return this.deck;
    }

    getPlayerHand1() {
        return this.playerHand1;
    }

    getPlayerHand2() {
        return this.playerHand2;
    }

    getCrib() {
        return this.cribHand;
    }

    // sends two cards to the crib
    sendToCrib(c1, c2) {
        if (this.p2) {
            socket.emit('sendToCrib', {
                p1: this.p1.id,
                p2: this.p2.id,
                p1H: this.playerHand1,
                p2H: this.playerHand2,
                c1: c1,
                c2: c2
            });
        }
        else {
            this.cribHand.push(c1, c2);
        }
    }

    // recieve cards for the crib from both players
    handleSharedCrib(data) {
        this.cribHand.push(data.c1, data.c2);
        this.playerHand1 = data.p1H;
        this.playerHand2 = data.p2H;
    }

    // share cut card
    handleCut(cut) {
        this.cutCard = cut;
        // get 2 points for cutting the jack
        if (cut.rank === 11) {
            if (this.dealer === 2) {
                this.p2Score += 2;
                let name = (this.p2) ? this.p2.username : "Computer";
                chatText.innerHTML += '<div>' + name + ' scores 2 points for cutting the jack! </div>';
            }
            else {
                this.p1Score += 2;
                chatText.innerHTML += '<div>' + this.p1.username + ' scores 2 points for cutting the jack! </div>';
            }
        }
        if (this.p2 && !this.winnerDeclared) {
            if (this.p1Score >= 121) {
                this.winnerDeclared = true;
                socket.emit('gameOver', {
                    winner: this.p1,
                    loser: this.p2,
                    rsn: "",
                    wBH: this.p1BestHand,
                    lBH: this.p2BestHand,
                });
            }
            else if (this.p2Score >= 121) {
                this.winnerDeclared = true;
                socket.emit('gameOver', {
                    winner: this.p2,
                    loser: this.p1,
                    rsn: "",
                    lBH: this.p1BestHand,
                    wBH: this.p2BestHand,
                });
            }
        }
        else {
            if (this.p1Score >= 121) {
                this.gameOver(this.p1, this.p2);
            }
            else if (this.p2Score >= 121) {
                this.gameOver(this.p2, this.p1);
            }
        }
    }

    // Fisher-Yates Method
    shuffleDeck() {
        this.deck = [];
        for (let i = 0; i < this.suits; i++) {
            for (let j = 0; j < this.ranks; j++) {
                this.deck.push({ rank: j + 1, suit: i + 1 });
            }
        }
        for (let i = this.deck.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * i);
            let k = this.deck[i];
            this.deck[i] = this.deck[j];
            this.deck[j] = k;
        }
        if (this.p2) {
            socket.emit('shuffleDeck', {
                p1: this.p1.id,
                p2: this.p2.id,
                deck: this.deck
            });
        }
    }

    cutDeck() {
        if (this.p2) {
            this.cutCard = this.deck.splice(Math.floor(Math.random() * this.deck.length), 1)[0];
        }
        else {
            this.cutCard = this.deck.splice(Math.floor(Math.random() * this.deck.length), 1)[0];
            if (game.gameStage === "getCut") {
                this.handleCut(this.cutCard);
            }
            else {
                this.p1Cut = this.cutCard;
                this.p2Cut = this.deck.splice(Math.floor(Math.random() * this.deck.length), 1)[0];
            }
        }
    }

    dealCards() {
        this.playerHand1 = [];
        this.playerHand2 = [];
        this.cribHand = [];
        for (let i = 0; i < 6; i++) {
            this.playerHand1.push(this.deck.pop());
            this.playerHand2.push(this.deck.pop());
        }
    }

    countCards() {
        // set up hands for counting
        this.pegCards = [];
        this.pegNum = 0;
        for (let i = 0; i < this.allPegCards.length; i++) {
            if (this.allPegCards[i].owner === 1) {
                this.playerHand1.push(this.allPegCards[i]);
            }
            else {
                this.playerHand2.push(this.allPegCards[i]);
            }
        }
        this.allPegCards = [];
        this.playerHand1.push(this.cutCard);
        this.playerHand2.push(this.cutCard);
        this.cribHand.push(this.cutCard);
        let score = null;
        if (this.dealer === 1) {
            // non-dealer first count
            score = this.getHandScore(this.playerHand2);
            if (this.p2) {
                if (score > this.p2BestHand.score) {
                    this.p2BestHand.hand = this.playerHand2;
                    this.p2BestHand.score = score;
                    this.p2BestHand.updated = true;
                }
            }
            this.p2Score += score;
            let name = (this.p2) ? this.p2.username : "Computer";
            chatText.innerHTML += '<div>' + name + 's hand scored ' + score + ' points!</div>';
            if (this.p2Score >= 121 && !this.winnerDeclared) {
                if (this.p2) {
                    this.winnerDeclared = true;
                    socket.emit('gameOver', {
                        winner: this.p2,
                        loser: this.p1,
                        rsn: "",
                        lBH: this.p1BestHand,
                        wBH: this.p2BestHand
                    });
                }
                else {
                    this.gameOver(this.p2, this.p1);
                }
            }
            // dealer's count
            score = this.getHandScore(this.playerHand1);
            if (score > this.p1BestHand.score) {
                this.p1BestHand.hand = this.playerHand1;
                this.p1BestHand.score = score;
                this.p1BestHand.updated = true;
            }
            this.p1Score += score;
            chatText.innerHTML += '<div>' + this.p1.username + 's hand scored ' + score + ' points!</div>';
            // dealer's crib
            score = this.getHandScore(this.cribHand);
            this.p1Score += score;
            chatText.innerHTML += '<div>' + this.p1.username + 's crib scored ' + score + ' points!</div>';
            if (this.p1Score >= 121 && !this.winnerDeclared) {
                if (this.p2) {
                    this.winnerDeclared = true;
                    socket.emit('gameOver', {
                        winner: this.p1,
                        loser: this.p2,
                        rsn: "",
                        wBH: this.p1BestHand,
                        lBH: this.p2BestHand,
                    });
                }
                else {
                    this.gameOver(this.p1, this.p2);
                }
            }
        }
        else {
            // non-dealer first count
            score = this.getHandScore(this.playerHand1);
            this.p1Score += score;
            if (score > this.p1BestHand.score) {
                this.p1BestHand.hand = this.playerHand1;
                this.p1BestHand.score = score;
                this.p1BestHand.updated = true;
            }
            chatText.innerHTML += '<div>' + this.p1.username + 's hand scored ' + score + ' points!</div>';
            if (this.p1Score >= 121 && !this.winnerDeclared) {
                if (this.p2) {
                    this.winnerDeclared = true;
                    socket.emit('gameOver', {
                        winner: this.p1,
                        loser: this.p2,
                        rsn: "",
                        wBH: this.p1BestHand,
                        lBH: this.p2BestHand,
                    });
                }
                else {
                    this.gameOver(this.p1, this.p2);
                }
            }
            // dealer's count
            score = this.getHandScore(this.playerHand2);
            if (this.p2) {
                if (score > this.p2BestHand.score) {
                    this.p2BestHand.hand = this.playerHand2;
                    this.p2BestHand.score = score;
                    this.p2BestHand.updated = true;
                }
            }
            this.p2Score += score;
            let name = (this.p2) ? this.p2.username : "Computer";
            chatText.innerHTML += '<div>' + name + 's hand scored ' + score + ' points!</div>';
            // dealer's crib
            score = this.getHandScore(this.cribHand);
            this.p2Score += score;
            chatText.innerHTML += '<div>' + name + 's crib scored ' + score + ' points!</div>';
            if (this.p2Score >= 121 && !this.winnerDeclared) {
                if (this.p2) {
                    this.winnerDeclared = true;
                    socket.emit('gameOver', {
                        winner: this.p2,
                        loser: this.p1,
                        rsn: "",
                        lBH: this.p1BestHand,
                        wBH: this.p2BestHand,
                    });
                }
                else {
                    this.gameOver(this.p2, this.p1);
                }
            }
        }
    }

    // get score for gos
    go(n) {
        let hand = (n > 1) ? this.playerHand2 : this.playerHand1;
        let validGo = true;
        for (let i = 0; i < hand.length; i++) {
            if (hand[i].rank + this.pegNum <= 31) {
                validGo = false;
            }
        }
        if (validGo) {
            let name = (n === 1) ? this.p1.username : (this.p2) ? this.p2.username : "Computer";
            let msg = '<div>' + name + ' says "Go!" </div>';
            let sMsg = '';
            if (this.pTurn === 1) {
                this.pTurn = 2;
                if (this.p2Go) {
                    this.p1Score += 1;
                    sMsg = '<div>' + name + ' gets a go for 1 </div>';
                    this.p2Go = false;
                    this.pegNum = 0;
                    this.pegCards = [];
                }
                else {
                    this.p1Go = true;
                }
            }
            else {
                this.pTurn = 1;
                if (this.p1Go) {
                    this.p2Score += 1;
                    sMsg = '<div>' + name + ' gets a go for 1 </div>';
                    this.p1Go = false;
                    this.pegNum = 0;
                    this.pegCards = [];
                }
                else {
                    this.pTurn = 1;
                    this.p2Go = true;
                }
            }
            if (this.p1Score >= 121 && !this.winnerDeclared) {
                if (this.p2) {
                    this.winnerDeclared = true;
                    socket.emit('gameOver', {
                        winner: this.p1,
                        loser: this.p2,
                        rsn: "",
                        wBH: this.p1BestHand,
                        lBH: this.p2BestHand,
                    });
                }
                else {
                    this.gameOver(this.p1, this.p2);
                }
            }
            else if (this.p2Score >= 121 && !this.winnerDeclared) {
                if (this.p2) {
                    this.winnerDeclared = true;
                    socket.emit('gameOver', {
                        winner: this.p2,
                        loser: this.p1,
                        rsn: "",
                        lBH: this.p1BestHand,
                        wBH: this.p2BestHand,
                    });
                }
                else {
                    this.gameOver(this.p2, this.p1);
                }
            }
            if (this.p2) {
                socket.emit('go', {
                    p1: this.p1.id,
                    p2: this.p2.id,
                    p1Go: this.p1Go,
                    p2Go: this.p2Go,
                    p1Score: this.p1Score,
                    p2Score: this.p2Score,
                    pTurn: this.pTurn,
                    pegNum: this.pegNum,
                    pegCards: this.pegCards,
                    msg: msg,
                    sMsg: sMsg
                });
            }
            else {
                chatText.innerHTML += msg;
                chatText.innerHTML += sMsg;
            }
        }
        else {
            chatText.innerHTML += '<div> There is a valid card in your hand for you to lay! </div>';
        }
    }

    handleGo(data) {
        this.p1Go = data.p1Go;
        this.p2Go = data.p2Go;
        this.p1Score = data.p1Score;
        this.p2Score = data.p2Score;
        this.pegNum = data.pegNum;
        this.pegCards = data.pegCards;
        this.pTurn = data.pTurn;
        chatText.innerHTML += data.msg;
        chatText.innerHTML += data.sMsg;
    }

    // get score for laying a card in the pegging round
    pegPoints(c) {
        let name = (this.pTurn === 1) ? this.p1.username : (this.p2) ? this.p1.username : "Computer";
        let msg = [];
        c.owner = this.pTurn;
        this.allPegCards.push(c);
        this.pegCards.push(c);
        let l = this.pegCards.length;
        let recent = this.pegCards[l - 1];
        this.pegNum = (recent.rank >= 10) ? this.pegNum + 10 : this.pegNum + recent.rank;
        if (this.pegCards.length > 1) {
            let points = 0;
            // 15s
            if (this.pegNum === 15) {
                msg.push('<div>' + name + ' gets "15 for 2!" </div>');
                points += 2;
            }
            // pairs 
            let pairFound = true;
            let pairs = 0;
            let i = l - 1;
            while (pairFound && i > 0) {
                if (this.pegCards[i].rank === this.pegCards[i - 1].rank) {
                    pairs++;
                    i--;
                }
                else {
                    pairFound = false;
                }
            }
            points += pairs * (pairs + 1);
            if (pairs > 0) {
                if (pairs === 1) {
                    msg.push('<div>' + name + ' gets a pair for 2! </div>');
                }
                else if (pairs === 2) {
                    msg.push('<div>' + name + ' gets 3 of a kind for 6! </div>');
                }
                else if (pairs === 3) {
                    msg.push('<div>' + name + ' gets 4 of a kind for 12! </div>');
                }
            }
            // runs
            if (l > 2 && pairs === 0) {
                let runLength = 1;
                let bestRun = 2;
                let runs = [];
                let runFound = true;
                runs.push(this.pegCards[l - 1].rank, this.pegCards[l - 2].rank);
                for (let j = l - 3; j >= 0; j--) {
                    runs.push(this.pegCards[j].rank);
                    runs.sort((a, b) => { return a - b });
                    runLength = 1;
                    runFound = true;
                    for (let i = 0; i < runs.length - 1; i++) {
                        if (runs[i] + 1 === runs[i + 1]) {
                            runLength++;
                        }
                        else {
                            runFound = false;
                            break;
                        }
                    }
                    if (runFound && runLength > bestRun) {
                        bestRun = runLength;
                    }
                }
                if (bestRun > 2) {
                    points += bestRun;
                    msg.push('<div>' + name + ' gets a run of ' + bestRun + ' for ' + bestRun + '!</div>');
                }
            }

            // 31
            if (this.pegNum === 31) {
                points += 2;
                msg.push('<div>' + name + ' gets "31 for 2!" </div>');
                this.pegNum = 0;;
                this.pegCards = [];
            }
            // last card
            if (this.playerHand2.length === 0 && this.playerHand1.length === 0) {
                msg.push('<div>' + name + ' lays the last card for 1 </div>');
                points += 1;
            }

            if (this.pTurn === 1) {
                this.p1Score += points;
                this.pTurn = 2;
            }
            else {
                this.p2Score += points;
                this.pTurn = 1;
            }
        }
        else {
            this.pTurn = (this.pTurn === 1) ? 2 : 1;
        }
        if (this.p2 && !this.winnerDeclared) {
            if (this.p1Score >= 121) {
                this.winnerDeclared = true;
                socket.emit('gameOver', {
                    winner: this.p1,
                    loser: this.p2,
                    rsn: "",
                    wBH: this.p1BestHand,
                    lBH: this.p2BestHand,
                });
            }
            else if (this.p2Score >= 121) {
                this.winnerDeclared = true;
                socket.emit('gameOver', {
                    winner: this.p2,
                    loser: this.p1,
                    rsn: "",
                    lBH: this.p1BestHand,
                    wBH: this.p2BestHand,
                });
            }
            socket.emit('pegResult', {
                p1: this.p1.id,
                p2: this.p2.id,
                p1H: this.playerHand1,
                p2H: this.playerHand2,
                p1S: this.p1Score,
                p2S: this.p2Score,
                pN: this.pegNum,
                n: this.pTurn,
                pCs: this.pegCards,
                aPC: this.allPegCards,
                msg: msg
            });
        }
        else {
            for (let i = 0; i < msg.length; i++) {
                chatText.innerHTML += msg[i];
            }
            if (this.p1Score >= 121) {
                this.gameOver(this.p1, this.p2);
            }
            else if (this.p2Score >= 121) {
                this.gameOver(this.p2, this.p1);
            }

        }
    }

    handlePegResults(data) {
        this.playerHand1 = data.p1H;
        this.playerHand2 = data.p2H;
        this.pegCards = data.pCs;
        this.p1Score = data.p1S;
        this.p2Score = data.p2S
        this.pTurn = data.n;
        this.pegNum = data.pN;
        this.allPegCards = data.aPC;
        for (let i = 0; i < data.msg.length; i++) {
            chatText.innerHTML += data.msg[i];
        }
    }

    // return the score for the hand passed in
    getHandScore(hand) {
        let pairs = 0;
        let fifteens = 0;
        let flushes = 0;
        let jackson = 0;
        let crib = false;
        let flush = true;
        let runs = [];
        let fHand = [];
        let l = hand.length;
        let pairRank = null;

        // convert hand for counting 15s and runs
        for (let i = 0; i < l; i++) {
            let value = (hand[i].rank >= 10) ? 10 : hand[i].rank;
            fHand.push(value);
            runs.push(hand[i].rank);
        }

        // check for jackson point 
        if (l > 4) {
            for (let i = 0; i < l - 1; i++) {
                if (hand[i].rank === 11 && hand[i].suit === hand[4].suit) {
                    jackson = 1;
                }
            }
        }

        // check for flush
        for (let i = 1; i < 4; i++) {
            if (hand[i].suit !== hand[0].suit) {
                flush = false;
            }
        }
        if (flush) {
            flushes = 4;
            if (l > 4 && hand[4].suit === hand[0].suit) {
                flushes = 5;
            } else if (crib) {
                flushes = 0;
            }
        }

        // check for 4 card (or 5) sum of 15
        let sum = 0;
        for (let i = 0; i < l; i++) {
            sum += fHand[i];
        }
        if (sum === 15) {
            fifteens++;
        }

        for (let i = 0; i < l - 1; i++) {
            for (let j = i + 1; j < l; j++) {
                // check for pairs
                if (hand[i].rank === hand[j].rank) {
                    pairs++;
                    pairRank = hand[i].rank;
                }
                //check for 15s (2 card sum)
                if (fHand[i] + fHand[j] === 15) {
                    fifteens++;
                }
                for (let k = j + 1; k < l; k++) {
                    //check for 15s (3 card sum)
                    if (fHand[i] + fHand[j] + fHand[k] === 15) {
                        fifteens++;
                    }
                    if (l > 4) {
                        for (let n = k + 1; n < l; n++) {
                            // check for 15s (4 card sum)
                            if (15 === fHand[i] + fHand[j] + fHand[k] + fHand[n]) {
                                fifteens++;
                            }
                        }
                    }
                }
            }
        }
        //check for runs
        runs.sort((a, b) => { return a - b });
        let runSize = 1;
        let bestRun = 1;
        let card = runs[0];
        let runFound = [];
        runFound.push(card);
        for (let i = 1; i < l; i++) {
            if (card === runs[i] - 1) {
                runSize++;
                bestRun = runSize;
                runFound.push(runs[i]);
            }
            else if (card !== runs[i]) {
                runSize = 1;
                if (bestRun < 3) {
                    runFound = [];
                    runFound.push(runs[i]);
                }
            }
            card = runs[i];
        }
        // run points for 4 card count
        let runPoints = (bestRun > 2) ? bestRun * (pairs + 1) : 0;

        // run points for 5 card count
        if (l > 4 && bestRun > 2) {
            let doubleRunOf3 = false;
            for (let i = 0; i < runFound.length; i++) {
                if (runFound[i] === pairRank) {
                    doubleRunOf3 = true;
                }
            }
            // double run of 4
            if (bestRun === 4 && pairs === 1) {
                runPoints = 8;
            }
            // triple run of 3
            else if (bestRun === 3 && pairs === 3) {
                runPoints = 9;
            }
            // quad run of 3
            else if (bestRun === 3 && pairs === 2) {
                runPoints = 12;
            }
            // double run of 3
            else if (doubleRunOf3) {
                runPoints = 6;
            }
            // single run
            else if (bestRun > 2) {
                runPoints = bestRun;
            }
        }
        return (2 * pairs) + (2 * fifteens) + flushes + runPoints + jackson;
    }

    // remove the right cards 
    greedyDiscard() {
        let hand = this.playerHand2;
        let highscore = -1;
        let score = 0;
        let discards = [];
        let card1 = {};
        let card2 = {};

        for (let i = 0; i < this.actions.length; i++) {
            card1 = hand[this.actions[i].a];
            card2 = hand[this.actions[i].b];
            hand.splice(this.actions[i].b, 1);
            hand.splice(this.actions[i].a, 1);
            score = this.getHandScore(hand);
            if (score > highscore) {
                highscore = score;
                discards[0] = this.actions[i].a;
                discards[1] = this.actions[i].b;
            }
            hand.splice(this.actions[i].a, 0, card1);
            hand.splice(this.actions[i].b, 0, card2);
        }
        this.cribHand.push(this.playerHand2[discards[0]]);
        this.cribHand.push(this.playerHand2[discards[1]]);
        this.playerHand2.splice(discards[1], 1);
        this.playerHand2.splice(discards[0], 1);
    }

    randomDiscard() {
        let hand = this.playerHand2;
        let discards = this.actions[Math.floor(Math.random() * this.actions.length)];
        return discards;
    }


    greedyPegging() {
        // check for go 
        let go = true;
        for (let i = 0; i < this.playerHand2.length; i++) {
            if (this.playerHand2[i].rank + this.pegNum <= 31) {
                go = false;
            }
        }
        if (go || this.playerHand2.length === 0) {
            this.go(2);
        }
        // pick card to lay
        else {
            let cardToLay = null;
            let n = null;
            if (this.pegCards.length > 0) {
                let highScore = 0;
                let score = null;
                // lay the card that will give you the most points right now
                for (let i = 0; i < this.playerHand2.length; i++) {
                    let value = (this.playerHand2[i].rank >= 10) ? 10 : this.playerHand2[i].rank;
                    if (value + this.pegNum <= 31) {
                        score = this.testPeggingCard(this.playerHand2[i]);
                        if (score > highScore) {
                            cardToLay = this.playerHand2[i];
                            highScore = score;
                            n = i;
                        }
                    }
                }
            }
            // if none of your cards will give you points, lay a random card
            if (this.pegCards.length === 0 || !cardToLay) {
                n = Math.floor(Math.random() * this.playerHand2.length);
                cardToLay = this.playerHand2[n];
            }
            this.playerHand2.splice(n, 1);
            this.pegPoints(cardToLay);
        }
    }

    // used to test how many points laying a given card will give in the current game state
    testPeggingCard(c) {
        let points = 0;
        let total = (c.rank >= 10) ? this.pegNum + 10 : this.pegNum + c.rank;
        // 15s / 31
        if (total === 15 || 31) {
            points += 2;
        }
        // pairs
        let pairs = 0;
        let noPair = false;
        let l = this.pegCards.length;
        for (let i = l - 1; i >= 0; i--) {
            if (this.pegCards[i].rank === c.rank) {
                pairs++;
            }
            else {
                noPair = true;
            }
            if (noPair) {
                break;
            }
        }
        points += pairs * (pairs + 1);
        // runs
        let runLength = 1;
        let bestRun = 2;
        let runs = [];
        let runFound = true;
        runs.push(c.rank, this.pegCards[l - 1].rank);
        for (let j = l - 2; j >= 0; j--) {
            runs.push(this.pegCards[j].rank);
            runs.sort((a, b) => { return a - b });
            runLength = 1;
            runFound = true;
            for (let i = 0; i < runs.length - 1; i++) {
                if (runs[i] + 1 === runs[i + 1]) {
                    runLength++;
                }
                else {
                    runFound = false;
                    break;
                }
            }
            if (runFound && runLength > bestRun) {
                bestRun = runLength;
            }
        }
        if (bestRun > 2) {
            points += bestRun;
        }
        return points;
    }

    // end the game when player against computer
    gameOver(winner) {
        if (!this.winnerDeclared) {
            this.winnerDeclared = true;
            let victor = (winner) ? true : false;
            let msg = (victor) ? "You have beat the computer!" : "The computer won the game!";
            chatText.innerHTML += msg;
            inLobby = true;
            inGame = false;
            socket.emit('inOutLobby', {
                p1: yourInfo,
                inLobby: true,
            });
            socket.emit('compGameOver', {
                win: victor,
                player: this.p1,
                bH: this.p1BestHand,
            });
            gameCanvas.style.display = 'none';
            lobbyCanvas.style.display = 'inline-block';
        }
    }

}