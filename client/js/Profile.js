class Profile {
    constructor(user) {
        this.user = user;
        this.title = this.user.username + "'s Stats!";
        this.ctx = lobbyCanvas.getContext("2d");
        this.click = {
            clicking: false,
            start: 0,
            time: 200
        }
        this.returnButton = {
            pos: { x: 400, y: 300 },
            size: { x: 200, y: 50 },
            text: "Return To Lobby",
        };
        this.mPos = { x: 190, y: 100 };
        this.cPos = { x: 500, y: 100 };
        this.mHead = "Versus other players";
        this.cHead = "Versus computer";
        this.gamesPlayed = "Games Played: " + (this.user.wins + this.user.losses);
        this.wins = "Won: " + this.user.wins;
        this.losses = "Lost: " + this.user.losses;
        this.bestScore = "Best Hand Score: " + this.user.bestHand.score
        this.cGamesPlayed = "Games Played: " + (this.user.vsComp.wins + this.user.vsComp.losses);
        this.cWins = "Won: " + this.user.vsComp.wins;
        this.cLosses = "Lost: " + this.user.vsComp.losses;
        this.bestHand = { pos: { x: 650, y: 150 } };
        this.UIs = [this.mHead, this.gamesPlayed, this.wins, this.losses, this.bestScore];
        this.cUIs = [this.cHead, this.cGamesPlayed, this.cWins, this.cLosses];
    }

    // main profile loop
    update() {
        this.userInput();
        this.clickTime();
        this.render();
    }

    userInput() {
        // check if mouse hovering over return button
        lobbyCanvas.addEventListener('mousemove', (e) => {
            // get x/y mouse coords 
            let rect = lobbyCanvas.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;

            let s = this.returnButton.size;
            let p = this.returnButton.pos;
            if (x >= p.x && x <= p.x + s.x && y >= p.y && y <= p.y + s.y) {
                this.rBHovered = true;
            }
            else {
                this.rBHovered = false;
            }
        });
        lobbyCanvas.addEventListener('mouseup', (e) => {
            // check if clicking return button
            if (!this.click.clicking && this.rBHovered) {
                this.click.clicking = true;
                this.click.start = new Date().getTime();
                lobby.viewProfile = false;
                lobby.profile = null;
            }
        });
    }

    // minimum time allowed between clicks
    clickTime() {
        if (this.click.clicking) {
            let t = new Date().getTime();
            let elapsed = t - this.click.start;
            if (elapsed >= this.click.time) {
                this.click.clicking = false;
            }
        }
    }

    // draw a new frame
    render() {
        // start new frame / draw background
        this.ctx.clearRect(0, 0, lobbyCanvas.width, lobbyCanvas.height);
        this.ctx.drawImage(assets.getBackground(2), 0, 0, lobbyCanvas.width, lobbyCanvas.height);
        // Draw tile / headings
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(370, 0, 630 - 370, 53);
        this.ctx.font = "50px Bangers";
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "center";
        this.ctx.fillText(this.title, lobbyCanvas.width / 2, lobbyCanvas.height / 10);
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(73, 76, 314 - 76, 250 - 56);
        this.ctx.fillRect(408, 76, 600 - 408, 220 - 56);
        // draw headings
        this.ctx.font = "30px Bangers";
        this.ctx.fillStyle = "white";
        this.ctx.fillText(this.mHead, this.mPos.x, this.mPos.y);
        this.ctx.fillText(this.cHead, this.cPos.x, this.cPos.y);
        this.ctx.font = "21px Epilogue";
        this.ctx.fillStyle = "orangered";
        // draw UIs (games played, wins, losses, best score)
        for (let i = 1; i < this.UIs.length; i++) {
            this.ctx.fillText(this.UIs[i], this.mPos.x, this.mPos.y + i * 40);
        }
        // draw vs computer UIs (games played, wins, losses)
        for (let i = 1; i < this.cUIs.length; i++) {
            this.ctx.fillText(this.cUIs[i], this.cPos.x, this.cPos.y + i * 40);
        }
        // draw best hand
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(635, 110, 993 - 635, 260 - 110);
        this.ctx.fillStyle = "orangered";
        this.ctx.fillText("Best Hand Score: " + this.user.bestHand.score, 800, 138);
        if (this.user.bestHand.score > 0) {
            let bHand = this.user.bestHand.hand;
            let cInfo = null;
            for (let i = 0; i < bHand.length; i++) {
                cInfo = assets.getCard(bHand[i].rank, bHand[i].suit);
                this.ctx.drawImage(cInfo.img, cInfo.sx, cInfo.sy, cInfo.sW, cInfo.sH, this.bestHand.pos.x + i * 67, this.bestHand.pos.y, 66, 100);
            }
        }
        // draw return to lobby button
        this.ctx.fillStyle = (this.rBHovered) ? "black" : "#FFAA00";
        this.ctx.fillRect(this.returnButton.pos.x, this.returnButton.pos.y, this.returnButton.size.x, this.returnButton.size.y);
        this.ctx.fillStyle = (this.rBHovered) ? "#FFAA00" : "black";
        this.ctx.fillText(this.returnButton.text, this.returnButton.pos.x + 100, this.returnButton.pos.y + 30);
    }
}