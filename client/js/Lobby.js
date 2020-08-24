class Lobby {
    constructor() {
        this.ctx = null;
        this.players = [];
        this.challengers = [];
        this.challenge = {};
        this.viewYourProfile = {};
        this.viewTheirProfile = {};
        this.title = "";
        this.heading = "";
        this.selectedPlayer = null;
        this.hoveredUI = null;
        this.hoveredPlayer = null;
        this.pSize = {};
        this.pPos = {};
        this.UIs = [];
        this.viewProfile = false;
        this.profile = null;
        this.click = {};
        this.init();
    }
    init() {
        this.ctx = lobbyCanvas.getContext("2d");
        this.title = "CRIBBAGE";
        this.heading = "Players Online: ";
        this.click = {
            clicking: false,
            start: 0,
            time: 200
        }
        this.vsComp = {
            id: 0,
            name: "Play VS Computer",
            pos: { x: 50, y: 305 },
            size: { x: 150, y: 25 },
        }
        this.challenge = {
            id: 3,
            name: "Challenge",
            pos: { x: 300, y: 100 },
            size: { x: 150, y: 25 },
        }
        this.viewYourProfile = {
            id: 1,
            name: "View Your Profile",
            pos: { x: 250, y: 305 },
            size: { x: 150, y: 25 },
        }
        this.viewTheirProfile = {
            id: 2,
            name: "View Their Profile",
            pos: { x: 300, y: 135 },
            size: { x: 150, y: 25 },
        }
        this.UIs = [this.vsComp, this.challenge, this.viewTheirProfile, this.viewYourProfile];
        this.pPos = { x: 50, y: 100 };
        this.pSize = { x: 100, y: 20 };
        this.cPos = { x: 170, y: 100 };
    }

    // update challenger list to display challenger
    displayChallenge(challenger) {
        this.challengers.push(challenger);
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

    // main lobby loop
    update() {
        if (!this.viewProfile) {
            this.userInput();
            this.clickTime();
            this.render();
        }
        else {
            this.profile.update();
        }
    }

    userInput() {
        lobbyCanvas.addEventListener('mousemove', (e) => {
            // get x/y mouse coords 
            let rect = lobbyCanvas.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;
            // check if mouse hoving over UI button 
            let hovered = false;
            let length = this.UIs.length;
            for (let i = 0; i < length; i++) {
                let s = this.UIs[i].size;
                let p = this.UIs[i].pos;
                if (x >= p.x && x <= p.x + s.x && y >= p.y && y <= p.y + s.y) {
                    this.hoveredUI = this.UIs[i];
                    hovered = true;
                }
            }
            if (!hovered) {
                this.hoveredUI = null;
            }
            // check if mouse hovering over player 
            if (!hovered) {
                length = lobbyList.length;
                for (let i = 0; i < length; i++) {
                    if (x >= this.pPos.x && x <= this.pPos.x + this.pSize.x && y >= this.pPos.y + i * 25 && y <= this.pPos.y + i * 25 + this.pSize.y) {
                        this.hoveredPlayer = lobbyList[i];
                        this.hoveredPlayer.i = i;
                        hovered = true;
                    }
                }
                if (!hovered) {
                    this.hoveredPlayer = null;
                }
            }
            // check if mouse hovering over challenge
            if (!hovered && this.challengers.length > 0) {
                length = this.challengers.length;
                for (let i = 0; i < length; i++) {
                    if (x >= this.cPos.x && x <= this.cPos.x + this.pSize.x && y >= this.cPos.y + i * 25 && y <= this.cPos.y + i * 25 + this.pSize.y) {
                        this.hoveredChallenger = this.challengers[i];
                        this.hoveredChallenger.i = i;
                        hovered = true;
                    }
                }
                if (!hovered) {
                    this.hoveredChallenger = null;
                }
            }
        });
        lobbyCanvas.addEventListener('mouseup', (e) => {
            // check if clicking something important (something is being hovered over during click)
            if (!this.click.clicking) {
                this.click.clicking = true;
                this.click.start = new Date().getTime();
                if (this.hoveredPlayer) {
                    this.selectedPlayer = this.hoveredPlayer;
                }
                else if (this.hoveredUI) {
                    // play vs computer
                    if (this.hoveredUI.id === 0) {
                        this.challengers = [];
                        this.selectedPlayer = null;
                        this.hoveredPlayer = null;
                        inLobby = false;
                        inGame = true;
                        game = new Gamestate(yourInfo, null);
                        gameCanvas.style.display = 'inline-block';
                        lobbyCanvas.style.display = 'none';
                        socket.emit('inOutLobby', {
                            p1: yourInfo,
                            inLobby: false
                        });
                    }
                    // view your profile
                    else if (this.hoveredUI.id === 1) {
                        this.profile = new Profile(yourInfo);
                        this.viewProfile = true;
                    }
                    // view their profile
                    if (this.hoveredUI.id === 2) {
                        if (this.selectedPlayer) {
                            this.profile = new Profile(this.selectedPlayer);
                            this.viewProfile = true;
                        }
                        else {
                            alert("You must select a player from the lobby first!");
                        }

                    }
                    // challenge
                    else if (this.hoveredUI.id === 3) {
                        if (this.selectedPlayer) {
                            socket.emit('challengeRequest', {
                                sender: yourInfo,
                                receiver: this.selectedPlayer,
                            });
                        }
                        else {
                            alert("You must select a player from the lobby first!");
                        }
                    }
                }
                else if (this.hoveredChallenger) {
                    let answer = confirm("Accept " + this.hoveredChallenger.username + "'s challenge?");
                    if (answer) {
                        socket.emit('challengeResponse', {
                            sender: yourInfo,
                            receiver: this.hoveredChallenger,
                            response: true,
                        });
                    }
                    else {
                        socket.emit('challengeResponse', {
                            sender: yourInfo,
                            receiver: this.hoveredChallenger,
                            response: false,
                        });
                    }
                }
                else {
                    this.selectedPlayer = null;
                }
            }
        });
    }
    render() {
        // start new frame / draw background
        this.ctx.clearRect(0, 0, lobbyCanvas.width, lobbyCanvas.height);
        this.ctx.drawImage(assets.getBackground(2), 0, 0, lobbyCanvas.width, lobbyCanvas.height);
        // Draw tile / headings
        this.ctx.font = "30px Bangers";
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "center";
        this.ctx.fillText(this.title, lobbyCanvas.width / 2, lobbyCanvas.height / 10);
        this.ctx.font = "20px Bangers";
        this.ctx.fillText(this.heading + " " + playerList.length, lobbyCanvas.width / 2, lobbyCanvas.height / 7);
        this.ctx.fillText("Lobby", 100, 85);
        this.ctx.fillText("Challenges", 220, 85);
        // draw players online
        this.ctx.font = "15px Epilogue"
        let length = lobbyList.length;
        for (let i = 0; i < length; i++) {
            this.ctx.fillStyle = "green";
            this.ctx.fillRect(this.pPos.x, this.pPos.y + i * 25, this.pSize.x, this.pSize.y);
            this.ctx.fillStyle = "black";
            this.ctx.fillText(lobbyList[i].username, this.pPos.x + 50, this.pPos.y + i * 25 + 15);
        }
        // draw any active challenges
        if (this.challengers.length > 0) {
            length = this.challengers.length;
            for (let i = 0; i < length; i++) {
                this.ctx.fillStyle = "red";
                this.ctx.fillRect(this.cPos.x, this.cPos.y + i * 25, this.pSize.x, this.pSize.y);
                this.ctx.fillStyle = "black";
                this.ctx.fillText(this.challengers[i].username, this.cPos.x + 50, this.cPos.y + i * 25 + 15);
            }
        }
        // draw UIs
        length = this.UIs.length;
        for (let i = 0; i < length; i++) {
            this.ctx.fillStyle = "#FFAA00";
            this.ctx.fillRect(this.UIs[i].pos.x, this.UIs[i].pos.y, this.UIs[i].size.x, this.UIs[i].size.y);
            this.ctx.fillStyle = "black";
            this.ctx.fillText(this.UIs[i].name, this.UIs[i].pos.x + 75, this.UIs[i].pos.y + 18);
        }
        // highlight selected player if it exists
        if (this.selectedPlayer) {
            this.ctx.fillStyle = "blue";
            this.ctx.fillRect(50, 100 + this.selectedPlayer.i * 25, 100, 20);
            this.ctx.fillStyle = "white";
            this.ctx.fillText(this.selectedPlayer.username, 50 + 50, 100 + this.selectedPlayer.i * 25 + 15);
        }
        // highlight UI/player/challenger if the cursor hovers over either
        if (this.hoveredUI) {
            this.ctx.fillStyle = "black"
            this.ctx.fillRect(this.hoveredUI.pos.x, this.hoveredUI.pos.y, this.hoveredUI.size.x, this.hoveredUI.size.y);
            this.ctx.fillStyle = "#FFAA00";
            this.ctx.fillText(this.hoveredUI.name, this.hoveredUI.pos.x + 75, this.hoveredUI.pos.y + 18);
        }
        else if (this.hoveredPlayer) {
            this.ctx.fillStyle = "black";
            this.ctx.fillRect(this.pPos.x, this.pPos.y + this.hoveredPlayer.i * 25, this.pSize.x, this.pSize.y);
            this.ctx.fillStyle = "green";
            this.ctx.fillText(this.hoveredPlayer.username, this.pPos.x + 50, this.pPos.y + this.hoveredPlayer.i * 25 + 15);
        }
        else if (this.hoveredChallenger) {
            this.ctx.fillStyle = "black";
            this.ctx.fillRect(this.cPos.x, this.cPos.y + this.hoveredChallenger.i * 25, this.pSize.x, this.pSize.y);
            this.ctx.fillStyle = "red";
            this.ctx.fillText(this.hoveredChallenger.username, this.cPos.x + 50, this.cPos.y + this.hoveredChallenger.i * 25 + 15);
        }
    }
}