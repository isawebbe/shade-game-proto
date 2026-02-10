// Shared game state management
export const gameState = {
    // Current game mode
    mode: 'title', // 'title' | 'narrative' | 'shade' | 'interlude'

    // Narrative game state
    currentRound: 1,
    redemptionRate: 50,
    inNarrative: true,
    maxRounds: 37,
    gameOver: false,
    previousChoice: null,
    currentConsequence: '',
    showConsequence: false,

    // Shade game state
    shadeRound: 0,
    currentOption: null,
    targetShade: null,
    maxAttempts: { A: 3, B: 3, C: Infinity }, // Maximum allowed attempts per option
    usedAttempts: { A: 0, B: 0, C: 0 }, // Track used attempts per option
    exhaustedOptions: new Set(), // Track which options are exhausted
    failedOptions: new Set(), // Track which options have failed all attempts
    currentAttempts: 0, // Track current number of attempts in current session

    // Check if an option can be used and update attempt count
    canUseOption(option) {
        option = String(option).trim();

        if (this.usedAttempts[option] >= this.maxAttempts[option]) {
            this.exhaustedOptions.add(option);
            return false;
        }

        this.usedAttempts[option]++;
        return true;
    },

    
    // Reset an option's attempt count
    resetOptionAttempts(option) {
        this.usedAttempts[option] = 0;
        this.exhaustedOptions.delete(option);
    },
    
    // Get remaining attempts for an option
    getRemainingAttempts(option) {
        return Math.max(0, this.maxAttempts[option] - this.usedAttempts[option]);
    },

    // Reset options for a new round
    resetOptionsForNewRound() {
        console.log('=== Resetting options for new round ===');
        console.log('Before reset - usedAttempts:', this.usedAttempts);
        console.log('Before reset - exhaustedOptions:', Array.from(this.exhaustedOptions || []));
        console.log('Before reset - failedOptions:', Array.from(this.failedOptions || []));
        
        // Create new objects to ensure reactivity in frameworks
        this.usedAttempts = { A: 0, B: 0, C: 0 };
        
        // Clear and recreate the Sets to ensure reactivity
        this.exhaustedOptions = new Set();
        this.failedOptions = new Set();
        
        // Reset current attempts and option state
        this.currentAttempts = 0;
        this.currentOption = null;
        this.targetShade = null;
        
        // Force update any reactive dependencies
        if (this._onStateChange) {
            this._onStateChange();
        }
        
        console.log('After reset - usedAttempts:', this.usedAttempts);
        console.log('After reset - exhaustedOptions:', Array.from(this.exhaustedOptions));
        console.log('After reset - failedOptions:', Array.from(this.failedOptions));
        console.log('Reset complete - all options should be available now');
    },

    logRedemption(label) {
        console.log(`[%cREDEMPTION%c] ${label}`, 
            'color: purple; font-weight: bold;',
            'color: inherit;',
            {
                value: this.redemptionRate,
                round: this.currentRound,
                mode: this.mode
            }
        );
    },

    reset() {
        this.currentRound = 1;
        this.redemptionRate = 50;
        this.inNarrative = true;
        this.gameOver = false;
        this.usedAttempts = { A: 0, B: 0, C: 0 }; // Reset used attempts
        this.maxAttempts = { A: 3, B: 3, C: Infinity }; // Reset max attempts
        this.exhaustedOptions = new Set();
        this.failedOptions = new Set();
        this.previousChoice = null;
        this.currentConsequence = '';
        this.showConsequence = false;
        this.shadeRound = 0;
        this.currentOption = null;
        this.targetShade = null;
        this.currentAttempts = 0;
        this.shouldTransitionToShade = false;
        this.mode = 'title';
    },

    // Helper to determine if we should show shade game
    shouldShowShadeGame() {
        // Show shade game every other round after round 1
        return !this.inNarrative && this.currentRound > 1;
    }
};

