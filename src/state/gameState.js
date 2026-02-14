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
    },

    // Save game state to localStorage
    saveGame() {
        try {
            const saveData = {
                currentRound: this.currentRound,
                redemptionRate: this.redemptionRate,
                inNarrative: this.inNarrative,
                gameOver: this.gameOver,
                previousChoice: this.previousChoice,
                currentConsequence: this.currentConsequence,
                showConsequence: this.showConsequence,
                shadeRound: this.shadeRound,
                currentOption: this.currentOption,
                targetShade: this.targetShade,
                usedAttempts: this.usedAttempts,
                exhaustedOptions: Array.from(this.exhaustedOptions),
                failedOptions: Array.from(this.failedOptions),
                currentAttempts: this.currentAttempts,
                mode: this.mode,
                timestamp: Date.now()
            };
            localStorage.setItem('luminance_save', JSON.stringify(saveData));
            console.log('Game saved successfully');
        } catch (error) {
            console.error('Failed to save game:', error);
        }
    },

    // Load game state from localStorage
    loadGame() {
        try {
            const saveData = localStorage.getItem('luminance_save');
            if (!saveData) {
                console.log('No save data found');
                return false;
            }

            const parsed = JSON.parse(saveData);
            
            // Restore all game state properties
            this.currentRound = parsed.currentRound || 1;
            this.redemptionRate = parsed.redemptionRate || 50;
            this.inNarrative = parsed.inNarrative !== undefined ? parsed.inNarrative : true;
            this.gameOver = parsed.gameOver || false;
            this.previousChoice = parsed.previousChoice || null;
            this.currentConsequence = parsed.currentConsequence || '';
            this.showConsequence = parsed.showConsequence || false;
            this.shadeRound = parsed.shadeRound || 0;
            this.currentOption = parsed.currentOption || null;
            this.targetShade = parsed.targetShade || null;
            this.usedAttempts = parsed.usedAttempts || { A: 0, B: 0, C: 0 };
            this.exhaustedOptions = new Set(parsed.exhaustedOptions || []);
            this.failedOptions = new Set(parsed.failedOptions || []);
            this.currentAttempts = parsed.currentAttempts || 0;
            this.mode = parsed.mode || 'title';

            console.log('Game loaded successfully');
            console.log('Loaded state:', {
                round: this.currentRound,
                redemptionRate: this.redemptionRate,
                mode: this.mode,
                previousChoice: this.previousChoice
            });
            
            return true;
        } catch (error) {
            console.error('Failed to load game:', error);
            return false;
        }
    },

    // Check if a save exists
    hasSaveData() {
        try {
            const saveData = localStorage.getItem('luminance_save');
            return saveData !== null;
        } catch (error) {
            console.error('Failed to check save data:', error);
            return false;
        }
    },

    // Delete save data
    deleteSave() {
        try {
            localStorage.removeItem('luminance_save');
            console.log('Save data deleted');
        } catch (error) {
            console.error('Failed to delete save data:', error);
        }
    },

    // Get save timestamp for display
    getSaveTimestamp() {
        try {
            const saveData = localStorage.getItem('luminance_save');
            if (!saveData) return null;
            
            const parsed = JSON.parse(saveData);
            return parsed.timestamp || null;
        } catch (error) {
            console.error('Failed to get save timestamp:', error);
            return null;
        }
    }
};

