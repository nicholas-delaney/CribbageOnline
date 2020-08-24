// optimize: get scores of all hands before hand for quick table look up 

class CribRL {
    constructor() {
        this.state = [];
        this.p = [];
        this.q = []; 
        this.env = new Environment();
        this.actions = this.env.getActions();
        this.deck = this.env.getDeck();
        this.init();
    }

    init() {
        const EPSILON = 0.1;
        const GAMMA = 0.5;
        const ALPHA = 0.6;

        // init p and q
        let aLength = this.actions.length;
        let initP = 1 / aLength;
        for (let c1 = 0; c1 < 52; c1++) {
            for (let c2 = c1+1; c2 < 51; c2++) {
                for (let c3 = c2+1; c3 < 50; c3++) {
                    for (let c4 = c3+1; c4 < 49; c4++) {
                        for (let c5 = c4 + 1; c5 < 48; c5++) {
                            for (let c6 = c5+1; c6 < 47; c6++) {
                                for (let a = 0; a < aLength; a++) {
                                    for (let d = 1; d < 2; d++) {
                                        this.q.push([c1, c2, c3, c4, c5, c6, a, d, 0]);
                                        this.p.push([c1, c2, c3, c4, c5, c6, a, d, initP]);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // get initial state 
        let hand = env.getPlayerHand();
    
    }

    iteration() {
        // action = select action from policy (state)
        // next state = get next state(state, action)
        // reward = env.getReward(nextState, action?)
        // update value(nextState, action, reward)
        // update policy();
        // state = newState
        // 
    }

    selectActionFromPolicy(state) {

    }

    getNextState(state, action) {

    }

    updateValue(nextState, action, reward) {

    }

    updatePolicty() {

    }

}