class Assets {

    constructor() {
        this.cardMap = {};
        this.backgrounds = {};
        this.cHeight = null;
        this.cWidth = null;
        this.init();
    }

    init() {
        this.cardMap = new Image();
        this.cardMap.src = 'client/assets/fulldeck.png';
        this.backgrounds.wood = new Image();
        this.backgrounds.wood.src = 'client/assets/background1.jpg';
        this.backgrounds.cribBoard = new Image();
        this.backgrounds.cribBoard.src = 'client/assets/cribBoardBg.jpg';
        this.backOfCard = new Image();
        this.backOfCard.src = 'client/assets/backofCard.jpg';
        this.cHeight = 153;
        this.cWidth = 98.5;
    }

    getCard(rank, suit) {
        let cardInfo = {
            img: this.cardMap,
            sW: this.cWidth,
            sH: this.cHeight,
            sx: (rank - 1) * this.cWidth,
            sy: (suit - 1) * this.cHeight,
        };
        return cardInfo;
    }

    getHiddenCard() {
        let cardInfo = {
            img: this.cardMap,
            sW: this.cWidth,
            sH: this.cHeight,
            sx: 197,
            sy: 612,
        };
        return cardInfo;
    }

    getBackground(n) {
        switch (n) {
            case 1:
                return this.backgrounds.wood;
            case 2:
                return this.backgrounds.cribBoard;
            default:
                return null;
        }
    }

    getBackofCard() {
        return this.backOfCard;
    }

}