// Shared game state management
export const gameState = {
    // Current game mode
    mode: 'title', // 'title' | 'narrative' | 'shade' | 'interlude'

    // Narrative game state
    currentRound: 1,
    redemptionRate: 50,
    inNarrative: true,
    maxRounds: 38,
    gameOver: false,
    previousChoice: null,

    // Shade game state
    shadeRound: 0,
    currentOption: null,
    targetShade: null,
    attempts: { a: 3, b: 3, c: Infinity },
    exhaustedOptions: new Set(),

    // Game flow control
    shouldTransitionToShade: false,

    reset() {
        this.currentRound = 1;
        this.redemptionRate = 50;
        this.inNarrative = true;
        this.gameOver = false;
        this.previousChoice = null;
        this.shadeRound = 0;
        this.currentOption = null;
        this.targetShade = null;
        this.attempts = { a: 3, b: 3, c: Infinity };
        this.exhaustedOptions.clear();
        this.shouldTransitionToShade = false;
        this.mode = 'title';
    },

    // Helper to determine if we should show shade game
    shouldShowShadeGame() {
        // Show shade game every other round after round 1
        return !this.inNarrative && this.currentRound > 1;
    }
};

