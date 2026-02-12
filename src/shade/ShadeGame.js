import { gameState } from '../state/gameState.js';

const TOLERANCE = { A: 3, B: 10, C: 20 };

export class ShadeGame {
    constructor(container) {
        // Initialize properties
        this.container = container;
        this.currentShade = 128;
        this.targetShade = null;
        this.isMouseDown = false;
        this.isPreviewing = false;
        this.onWin = null;
        this.onLose = null;
        this.onComplete = null;
        this.onContinue = null;
        this.onBack = null;
        this.currentOption = null;
        this._spectrumHandlers = null;
        this.selectedShade = null;
        this.commitButton = null;
        
        // Bind methods
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleCommit = this.handleCommit.bind(this);
        this.handleBackToOptions = this.handleBackToOptions.bind(this);
    }
    
    cleanupEventListeners() {
        if (!this._spectrumHandlers) return;
            
        const spectrum = this.container.querySelector('#spectrum');
        if (spectrum && this._spectrumHandlers) {
            if (this._spectrumHandlers.mousedown) spectrum.removeEventListener('mousedown', this._spectrumHandlers.mousedown);
            if (this._spectrumHandlers.mousemove) spectrum.removeEventListener('mousemove', this._spectrumHandlers.mousemove);
            if (this._spectrumHandlers.touchstart) spectrum.removeEventListener('touchstart', this._spectrumHandlers.touchstart);
            if (this._spectrumHandlers.touchmove) spectrum.removeEventListener('touchmove', this._spectrumHandlers.touchmove);
        }
            
        if (this._spectrumHandlers) {
            if (this._spectrumHandlers.mouseup) document.removeEventListener('mouseup', this._spectrumHandlers.mouseup);
            if (this._spectrumHandlers.touchend) document.removeEventListener('touchend', this._spectrumHandlers.touchend);
            if (this._spectrumHandlers.keydown) document.removeEventListener('keydown', this._spectrumHandlers.keydown);
        }
            
        this._spectrumHandlers = null;
    }
    
    setupEventListeners() {
        const spectrum = this.container.querySelector('#spectrum');
        if (!spectrum) {
            console.error('Spectrum element not found!');
            return;
        }

        this._spectrumHandlers = {
            mousedown: (e) => {
                e.preventDefault();
                this.handleMouseDown(e);
            },
            mousemove: (e) => {
                e.preventDefault();
                this.handleMouseMove(e);
            },
            mouseup: (e) => {
                e.preventDefault();
                this.handleMouseUp(e);
            },
            touchstart: (e) => {
                e.preventDefault();
                this.handleMouseDown(e.touches[0]);
            },
            touchmove: (e) => {
                e.preventDefault();
                this.handleMouseMove(e.touches[0]);
            },
            touchend: (e) => {
                e.preventDefault();
                this.handleMouseUp(e);
            },
            keydown: (e) => this.handleKeyDown(e)
        };

        // Add event listeners
        spectrum.addEventListener('mousedown', this._spectrumHandlers.mousedown);
        document.addEventListener('mousemove', this._spectrumHandlers.mousemove);
        document.addEventListener('mouseup', this._spectrumHandlers.mouseup);
        spectrum.addEventListener('touchstart', this._spectrumHandlers.touchstart, { passive: false });
        spectrum.addEventListener('touchmove', this._spectrumHandlers.touchmove, { passive: false });
        document.addEventListener('touchend', this._spectrumHandlers.touchend);
        document.addEventListener('keydown', this._spectrumHandlers.keydown);
        
        // Set up back button
        const backButton = this.container.querySelector('#back-to-options');
        if (backButton) {
            backButton.onclick = this.handleBackToOptions.bind(this);
        }
    }

    init() {
        // Initialize game state
        gameState.currentOption = null;
        gameState.targetShade = null;
        this.targetShade = null;
        this.currentShade = 128;
        this.isMouseDown = false;
        this.selectedShade = null;
        
        // Clean up any existing listeners and set up new ones
        this.cleanupEventListeners();
        this.setupEventListeners();
    }

    showStory(round) {
        try {
            const storyText = this.container.querySelector('#story-text');
            if (storyText) {
                storyText.textContent = `Round ${round}: The light waits.`;
                setTimeout(() => {
                    if (this.onContinue) this.onContinue();
                }, 1500);
            }
        } catch (error) {
            console.error('Error in showStory:', error);
            if (this.onContinue) this.onContinue();
        }
    }

    mapChoiceToOption(choice) {
        const validChoices = ['A', 'B', 'C'];
        const trimmedChoice = String(choice).trim();
        
        if (!validChoices.includes(trimmedChoice)) {
            throw new Error(`Invalid choice: ${choice}. Must be one of: ${validChoices.join(', ')}`);
        }
        
        return trimmedChoice;
    }

    updateBackButton() {
        const backButton = this.container.querySelector('#back-to-options');
        if (!backButton) return;
        
        if (this.currentOption && !gameState.exhaustedOptions.has(this.currentOption)) {
            const attemptsUsed = gameState.usedAttempts[this.currentOption] || 0;
            const maxAttempts = gameState.maxAttempts[this.currentOption];
            const hasAttemptsLeft = attemptsUsed < maxAttempts;
            
            backButton.classList.toggle('hidden', !hasAttemptsLeft);
        } else {
            backButton.classList.add('hidden');
        }
    }

    startBattle(option) {
        console.log(`Starting battle with option: ${option}`);
        this.currentOption = option;

        // Ensure the option is uppercase for consistency
        const optionUpper = option.toUpperCase();
        
        // Initialize gameState structures if missing
        if (!gameState.usedAttempts) gameState.usedAttempts = { A: 0, B: 0, C: 0 };
        if (!gameState.exhaustedOptions) gameState.exhaustedOptions = new Set();
        if (!gameState.failedOptions) gameState.failedOptions = new Set();
        
        // Ensure attempts for this option exist
        if (gameState.usedAttempts[optionUpper] === undefined) {
            gameState.usedAttempts[optionUpper] = 0;
        }
        
        // Clean up any existing event listeners and reset the spectrum
        this.cleanupEventListeners();
        const spectrum = this.container.querySelector('#spectrum');
        if (spectrum) {
            spectrum.style.pointerEvents = 'auto';
            spectrum.style.opacity = '1';
        }

        console.log('Current gameState before battle:', {
            exhaustedOptions: Array.from(gameState.exhaustedOptions),
            failedOptions: Array.from(gameState.failedOptions),
            usedAttempts: gameState.usedAttempts,
            maxAttempts: gameState.maxAttempts
        });

        // Check if the option is exhausted or failed
        if (gameState.exhaustedOptions.has(optionUpper) || gameState.failedOptions.has(optionUpper)) {
            console.log(`Option ${optionUpper} is already exhausted or failed.`);
            if (this.onLose) this.onLose();
            return;
        }

        // Check if we've used all attempts
        const usedAttempts = gameState.usedAttempts[optionUpper] || 0;
        const maxAttempts = gameState.maxAttempts[optionUpper];
        
        if (usedAttempts >= maxAttempts) {
            console.log(`Option ${optionUpper} has no attempts left (used ${usedAttempts} of ${maxAttempts})`);
            gameState.failedOptions.add(optionUpper);
            if (this.onLose) this.onLose();
            return;
        }

        // Reset internal shade values
        this.currentShade = 128;
        gameState.currentOption = option;
        gameState.currentAttempts = 0;

        // Generate and store target shade
        const newTargetShade = this.generateShade(option);
        this.targetShade = newTargetShade;
        gameState.targetShade = newTargetShade;

        console.log(`Generated target shade for option ${option}: ${this.targetShade}`);

        // Initialize commit button
        this.commitButton = this.container.querySelector('#commit-button');
        if (this.commitButton) {
            this.commitButton.onclick = this.handleCommit.bind(this);
            this.commitButton.classList.add('hidden');
            this.commitButton.disabled = false;
            this.commitButton.style.opacity = '1';
            this.commitButton.style.border = 'none';
        }

        // Render circles
        this.render();

        // Set up event listeners
        this.cleanupEventListeners();
        this.setupEventListeners();

        // Update target circle
        const targetCircle = this.container.querySelector('#target-circle');
        if (targetCircle) {
            targetCircle.style.backgroundColor = `rgb(${this.targetShade}, ${this.targetShade}, ${this.targetShade})`;
            console.log('Target circle updated with color:', targetCircle.style.backgroundColor);
        } else {
            console.warn('Target circle element not found!');
        }

        // Show the shade game screen
        const gameScreen = this.container.querySelector('#shade-game-screen');
        if (gameScreen) gameScreen.classList.remove('hidden');
        
        // Show "match the shade" animation for round 1 only
        this.showMatchTheShadeAnimation();
        
        this.updateBackButton();
    }

    render() {
        this.paintCircles();
    }

    showMatchTheShadeAnimation() {
        // Only show animation for round 1
        if (gameState.currentRound !== 1) {
            return;
        }

        const animationElement = this.container.querySelector('#match-the-shade-animation');
        if (!animationElement) {
            console.warn('Match the shade animation element not found');
            return;
        }

        // Show the animation
        animationElement.classList.remove('hidden');
        
        // After 5 seconds, add fade-out class
        setTimeout(() => {
            animationElement.classList.add('fade-out');
            
            // Hide completely after fade-out animation (1 second)
            setTimeout(() => {
                animationElement.classList.add('hidden');
                animationElement.classList.remove('fade-out');
            }, 1000);
        }, 5000);
    }

    handleMouseDown(e) {
        this.isMouseDown = true;
        const shade = this.getShadeFromEvent(e);
        if (shade !== null) {
            this.currentShade = shade;
            this.paintCircles();
        }
    }

    handleMouseMove(e) {
        if (!this.isMouseDown) return;
        
        const shade = this.getShadeFromEvent(e);
        if (shade !== null) {
            this.currentShade = shade;
            this.paintCircles();
        }
    }

    handleMouseUp(e) {
        if (this.isMouseDown) {
            this.isMouseDown = false;
            if (this.targetShade === null || this.targetShade === undefined) {
                console.warn('handleMouseUp: targetShade is not set, ignoring click');
                return;
            }
            this.selectedShade = this.currentShade;
            console.log('Selected shade:', this.selectedShade, 'Target shade:', this.targetShade);
            this.showCommitButton();
        }
    }

    setupEventListeners() {
        const spectrum = this.container.querySelector('#spectrum');
        if (!spectrum) {
            console.error('Spectrum element not found!');
            return;
        }

        this._spectrumHandlers = {
            mousedown: (e) => {
                e.preventDefault();
                this.handleMouseDown(e);
            },
            mousemove: (e) => {
                e.preventDefault();
                this.handleMouseMove(e);
            },
            mouseup: (e) => {
                e.preventDefault();
                this.handleMouseUp(e);
            },
            touchstart: (e) => {
                e.preventDefault();
                this.handleMouseDown(e.touches[0]);
            },
            touchmove: (e) => {
                e.preventDefault();
                this.handleMouseMove(e.touches[0]);
            },
            touchend: (e) => {
                e.preventDefault();
                this.handleMouseUp(e);
            },
            keydown: (e) => this.handleKeyDown(e)
        };

        // Add event listeners
        spectrum.addEventListener('mousedown', this._spectrumHandlers.mousedown);
        document.addEventListener('mousemove', this._spectrumHandlers.mousemove);
        document.addEventListener('mouseup', this._spectrumHandlers.mouseup);
        spectrum.addEventListener('touchstart', this._spectrumHandlers.touchstart, { passive: false });
        spectrum.addEventListener('touchmove', this._spectrumHandlers.touchmove, { passive: false });
        document.addEventListener('touchend', this._spectrumHandlers.touchend);
        document.addEventListener('keydown', this._spectrumHandlers.keydown);
        
        // Set up back button
        const backButton = this.container.querySelector('#back-to-options');
        if (backButton) {
            backButton.onclick = this.handleBackToOptions.bind(this);
        }
    }

    showCommitButton() {
        if (!this.commitButton) {
            this.commitButton = this.container.querySelector('#commit-button');
            if (!this.commitButton) {
                console.error('Commit button not found in the DOM');
                return;
            }
            this.commitButton.onclick = this.handleCommit.bind(this);
        }
        
        this.commitButton.classList.remove('hidden');
        this.commitButton.disabled = false;
        this.commitButton.style.opacity = '1';
        this.commitButton.style.border = 'none';
        
        void this.commitButton.offsetHeight;
    }

    hideCommitButton() {
        if (this.commitButton) {
            this.commitButton.classList.add('hidden');
        }
    }

    handleCommit() {
        if (this.selectedShade === null || this.selectedShade === undefined) {
            console.warn('No shade selected to commit');
            return;
        }
        
        const currentShade = this.selectedShade;
        
        if (this.commitButton) {
            this.commitButton.disabled = true;
            this.commitButton.style.opacity = '0.7';
        }
        
        setTimeout(() => {
            this.checkMatch(currentShade);
            
            if (this.commitButton) {
                this.commitButton.disabled = false;
                this.commitButton.style.opacity = '1';
            }
        }, 300);
    }

    loseAttempt() {
        try {
            // Get current option and update attempt count
            const currentOption = gameState.currentOption;
            const currentAttempts = (gameState.usedAttempts[currentOption] || 0) + 1;
            
            // Calculate remaining attempts (max 3 for A/B, infinite for C)
            const maxAttempts = gameState.maxAttempts[currentOption];
            
            // Update the attempt count for this failed attempt
            gameState.usedAttempts[currentOption] = currentAttempts;
            
            const remainingAttempts = maxAttempts === Infinity ? Infinity : Math.max(0, maxAttempts - currentAttempts);
            
            console.log(`Attempt ${currentAttempts} for option ${currentOption}. Max: ${maxAttempts}, Remaining: ${remainingAttempts}`);

            const gameScreen = this.container.querySelector('#shade-game-screen');
            if (gameScreen) {
                gameScreen.classList.add('shake');
                
                const flash = document.createElement('div');
                flash.className = 'flash-overlay';
                gameScreen.appendChild(flash);
                
                setTimeout(() => {
                    gameScreen.classList.remove('shake');
                    if (flash.parentNode) {
                        flash.remove();
                    }

                    // Check if this was the last attempt
                    if (maxAttempts !== Infinity && currentAttempts >= maxAttempts) {
                        console.log(`All ${maxAttempts} attempts used for option ${currentOption}`);
                        gameState.exhaustedOptions.add(currentOption);
                        
                        // Small delay before triggering lose state
                        setTimeout(() => {
                            if (this.onLose) {
                                this.onLose();
                            }
                        }, 300);
                        return;
                    }
                    
                    // Reset for next attempt
                    this.selectedShade = null;
                    this.hideCommitButton();
                    
                    // Update UI to show remaining attempts
                    const gameText = this.container.querySelector('#game-text');
                    if (gameText) {
                        const attemptsLeft = maxAttempts - currentAttempts;
                        gameText.textContent = `Incorrect! ${attemptsLeft} attempt(s) remaining.`;
                    }
                }, 500);
            }
            
            this.updateBackButton();
        } catch (error) {
            console.error('Error in loseAttempt:', error);
            if (this.onLose) this.onLose();
        }
    }

    checkMatch(selectedShade) {
        if (this.targetShade === null || this.targetShade === undefined) {
            console.error('No target shade set in checkMatch!', {
                targetShade: this.targetShade,
                currentOption: this.currentOption,
                gameStateTargetShade: gameState.targetShade
            });
            return;
        }
        
        const difference = Math.abs(selectedShade - this.targetShade);
        const tolerance = TOLERANCE[this.currentOption] || 10;
        
        console.log(`Selected shade: ${selectedShade}, Target: ${this.targetShade}, Difference: ${difference}, Tolerance: ${tolerance}`);
        
        if (difference <= tolerance) {
            // Win condition - redemption rate will be updated by main.js
            console.log(`Shade game won for option ${this.currentOption}`);
            
            console.log('[REDEMPTION CALC]', {
                option: this.currentOption,
                round: gameState.currentRound,
                difference,
                tolerance
            });
            
            if (this.onWin) this.onWin();
        } else {
            console.log('No match');
            this.loseAttempt();
    }
}

setupEventListeners() {
    const spectrum = this.container.querySelector('#spectrum');
    if (!spectrum) {
        console.error('Spectrum element not found!');
        return;
    }

    this._spectrumHandlers = {
        mousedown: (e) => {
            e.preventDefault();
            this.handleMouseDown(e);
        },
        mousemove: (e) => {
            e.preventDefault();
            this.handleMouseMove(e);
        },
        mouseup: (e) => {
            e.preventDefault();
            this.handleMouseUp(e);
        },
        touchstart: (e) => {
            e.preventDefault();
            this.handleMouseDown(e.touches[0]);
        },
        touchmove: (e) => {
            e.preventDefault();
            this.handleMouseMove(e.touches[0]);
        },
        touchend: (e) => {
            e.preventDefault();
            this.handleMouseUp(e);
        },
        keydown: (e) => this.handleKeyDown(e)
    };

    // Add event listeners
    spectrum.addEventListener('mousedown', this._spectrumHandlers.mousedown);
    document.addEventListener('mousemove', this._spectrumHandlers.mousemove);
    document.addEventListener('mouseup', this._spectrumHandlers.mouseup);
    spectrum.addEventListener('touchstart', this._spectrumHandlers.touchstart, { passive: false });
    spectrum.addEventListener('touchmove', this._spectrumHandlers.touchmove, { passive: false });
    document.addEventListener('touchend', this._spectrumHandlers.touchend);
    document.addEventListener('keydown', this._spectrumHandlers.keydown);
        
    // Set up back button
    const backButton = this.container.querySelector('#back-to-options');
    if (backButton) {
        backButton.onclick = this.handleBackToOptions.bind(this);
    }
}

showCommitButton() {
    if (!this.commitButton) {
        this.commitButton = this.container.querySelector('#commit-button');
        if (!this.commitButton) {
            console.error('Commit button not found in the DOM');
            return;
        }
        this.commitButton.onclick = this.handleCommit.bind(this);
    }
        
    this.commitButton.classList.remove('hidden');
    this.commitButton.disabled = false;
    this.commitButton.style.opacity = '1';
    this.commitButton.style.border = 'none';
        
    void this.commitButton.offsetHeight;
}

hideCommitButton() {
    if (this.commitButton) {
        this.commitButton.classList.add('hidden');
    }
}

handleCommit() {
    if (this.selectedShade === null || this.selectedShade === undefined) {
        console.warn('No shade selected to commit');
        return;
    }
        
    const currentShade = this.selectedShade;
        
    if (this.commitButton) {
        this.commitButton.disabled = true;
        this.commitButton.style.opacity = '0.7';
    }
        
    setTimeout(() => {
        this.checkMatch(currentShade);
            
        if (this.commitButton) {
            this.commitButton.disabled = false;
            this.commitButton.style.opacity = '1';
        }
    }, 300);
}

checkMatch(selectedShade) {
    if (this.targetShade === null || this.targetShade === undefined) {
        console.error('No target shade set in checkMatch!', {
            targetShade: this.targetShade,
            currentOption: this.currentOption,
            gameStateTargetShade: gameState.targetShade
        });
        return;
    }
        
    const difference = Math.abs(selectedShade - this.targetShade);
        
if (this.commitButton) {
    this.commitButton.disabled = true;
    this.commitButton.style.opacity = '0.7';
}
        
setTimeout(() => {
    this.checkMatch(currentShade);
            
    if (this.commitButton) {
        this.commitButton.disabled = false;
        this.commitButton.style.opacity = '1';
    }
}, 300);
}

checkMatch(selectedShade) {
if (this.targetShade === null || this.targetShade === undefined) {
    console.error('No target shade set in checkMatch!', {
        targetShade: this.targetShade,
        currentOption: this.currentOption,
        gameStateTargetShade: gameState.targetShade
    });
    return;
}
        
const difference = Math.abs(selectedShade - this.targetShade);
const tolerance = TOLERANCE[this.currentOption] || 10;
        
console.log(`Selected shade: ${selectedShade}, Target: ${this.targetShade}, Difference: ${difference}, Tolerance: ${tolerance}`);
        
if (difference <= tolerance) {
    // Win condition - redemption rate will be updated by main.js
    console.log(`Shade game won for option ${this.currentOption}`);
    this.onWin();    
} else {
    console.log('No match');
    this.loseAttempt();
}
}

handleBackToOptions() {
    try {
        if (this.onBack) {
            this.onBack();
        } else {
            this.container.innerHTML = '<div class="screen"><p>Returning to previous screen...</p></div>';
        }
    } catch (error) {
        console.error('Error in handleBackToOptions:', error);
        this.container.innerHTML = '<div class="screen"><p>Error returning to previous screen.</p></div>';
    }
}

    setupNextButton() {
        const nextButton = this.container.querySelector('#next-button');
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                if (this.onComplete) this.onComplete();
            });
        }
    }

    paintCircles() {
        const target = this.container.querySelector('#target-circle');
        const player = this.container.querySelector('#player-circle');

        if (target && this.targetShade !== null) {
            target.style.backgroundColor = `rgb(${this.targetShade}, ${this.targetShade}, ${this.targetShade})`;
        }

        if (player) {
            player.style.backgroundColor = `rgb(${this.currentShade}, ${this.currentShade}, ${this.currentShade})`;
        }
    }

    generateShade(option) {
        try {
            const normalizedOption = String(option).trim();

            if (normalizedOption === 'A') {
                return Math.floor(108 + Math.random() * 40);
            }

            if (normalizedOption === 'B') {
                const useDark = Math.random() < 0.5;
                return useDark
                    ? 10 + Math.floor(Math.random() * 40)
                    : 205 + Math.floor(Math.random() * 40);
            }

            return Math.random() < 0.5 ? 0 : 255;
        } catch (error) {
            console.error('Error in generateShade:', error);
            return Math.floor(Math.random() * 256);
        }
    }

    getShadeFromEvent(e) {
        const spectrum = this.container.querySelector('#spectrum');
        if (!spectrum) {
            console.error('Spectrum element not found');
            return this.currentShade;
        }

        const rect = spectrum.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const percentage = x / rect.width;

        return Math.round(percentage * 255);
    }

    disableSpectrum() {
        const spectrum = this.container.querySelector('#spectrum');
        if (spectrum) {
            spectrum.style.pointerEvents = 'none';
        }
    }

    winBattle() {
        this.disableSpectrum();
        if (this.onWin) {
            this.onWin();
        }
    }

    loseBattle() {
        const option = gameState.currentOption;
        if (!option) return;
        
        // Ensure the option is uppercase for consistency
        const optionUpper = option.toUpperCase();
        
        // Initialize sets if they don't exist
        if (!gameState.exhaustedOptions) gameState.exhaustedOptions = new Set();
        if (!gameState.failedOptions) gameState.failedOptions = new Set();
        
        // Get the current number of attempts for this option
        const usedAttempts = gameState.usedAttempts?.[optionUpper] || 0;
        const maxAttempts = gameState.maxAttempts?.[optionUpper] || 0;
        
        console.log(`loseBattle for option ${optionUpper}: used ${usedAttempts} of ${maxAttempts} attempts`);
        
        // If we've used up all attempts, mark as failed
        if (usedAttempts >= maxAttempts && maxAttempts !== Infinity) {
            console.log(`Marking option ${optionUpper} as failed`);
            gameState.failedOptions.add(optionUpper);
        } 
        // Otherwise, mark as exhausted
        else if (usedAttempts > 0) {
            console.log(`Marking option ${optionUpper} as exhausted`);
            gameState.exhaustedOptions.add(optionUpper);
        }
        
        this.cleanupEventListeners();
    }

    handleKeyDown(e) {
        let newShade = this.currentShade;

        switch(e.key) {
            case 'ArrowLeft':
                newShade = Math.max(0, this.currentShade - 5);
                break;
            case 'ArrowRight':
                newShade = Math.min(255, this.currentShade + 5);
                break;
            case ' ':
            case 'Enter':
                e.preventDefault();
                this.checkMatch(this.currentShade);
                return;
            default:
                return;
        }

        if (newShade !== this.currentShade) {
            this.currentShade = newShade;
            this.paintCircles();
        }
    }
}
