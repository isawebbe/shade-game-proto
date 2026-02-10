import { getNarrative, getOptions, getConsequence, gameContent, getVariant } from './gameContent.js';
import { gameState } from '../state/gameState.js';

export class NarrativeGame {
    constructor(container) {
        this.container = container;
        this.onNextRound = null;
        this.onTransitionToShade = null;
        this.gameOrchestrator = null; // Will be set by the orchestrator
        this.autoProgressTimer = null; // Timer for auto-progression from round 33
    }

    init() {
        this.updateScoreDisplay();
    }

    showConsequences() {
        console.log('=== showConsequences called ===');
        
        // Make sure the container is visible
        this.container.classList.remove('hidden');
        
        const narrativeEl = this.container.querySelector('#narrative-text');
        const optionsContainer = this.container.querySelector('#options-container');
        const advanceButton = this.container.querySelector('#advance-button');
        
        if (!narrativeEl) {
            console.error('Narrative element not found in the container');
            return;
        }
        
        // Hide options and show only the narrative with advance button
        if (optionsContainer) optionsContainer.classList.add('hidden');
        
        // Get the consequence text using the getConsequence function
        let consequenceText = getConsequence(
            gameState.currentRound, 
            gameState.previousChoice, 
            gameState.redemptionRate, 
            gameState.previousChoice
        );
        
        console.log('Showing consequences for round:', gameState.currentRound, 
                   'choice:', gameState.previousChoice);
        
        // Update the UI with the consequence text
        narrativeEl.innerHTML = consequenceText;
        narrativeEl.classList.remove('hidden');
        
        // Show the advance button to continue to next round, or restart if final round
        if (advanceButton) {
            advanceButton.classList.remove('hidden');
            
            // Check if this is the final round (37)
            const currentRoundData = gameContent.narratives[gameState.currentRound];
            const isFinalRound = currentRoundData?.isFinalRound || gameState.currentRound === 37;
            
            if (isFinalRound) {
                advanceButton.textContent = 'Start New Journey';
                advanceButton.onclick = () => {
                    // Reset the entire game
                    gameState.reset();
                    if (this.onNextRound) {
                        this.onNextRound();
                    }
                };
            } else {
                advanceButton.textContent = 'Continue';
                advanceButton.onclick = () => {
                    if (this.onNextRound) {
                        this.onNextRound();
                    }
                };
            }
        }
        
        // Show the narrative screen
        this.container.classList.remove('hidden');
    }
    
    showNarrativeScreen(round) {
        const narrative = getNarrative(round, gameState.redemptionRate, gameState.previousChoice);
        const narrativeEl = this.container.querySelector('#narrative-text');
        const optionsContainer = this.container.querySelector('#options-container');
        const advanceButton = this.container.querySelector('#advance-button');
        const showOptionsBtn = this.container.querySelector('#show-options-btn');
        
        if (narrativeEl) {
            narrativeEl.innerHTML = narrative;
        }
        
        // Initially hide options container and show show-options button
        if (optionsContainer) {
            optionsContainer.innerHTML = '';
            optionsContainer.classList.add('hidden');
        }
        
        // Set up show options button
        if (showOptionsBtn) {
            showOptionsBtn.classList.remove('hidden');
            showOptionsBtn.onclick = () => this.showOptions(round);
        }
        
        // Make sure advance button is hidden and reset when showing narrative
        if (advanceButton) {
            advanceButton.classList.add('hidden');
            advanceButton.textContent = 'Advance';
            advanceButton.onclick = () => this.handleAdvance();
        }
        
        // Auto-progress from round 33 to 34 after 12 seconds
        if (round === 33) {
            this.startAutoProgressTimer();
        } else {
            this.clearAutoProgressTimer();
        }
    }
    
    isOptionExhausted(optionKey) {
        if (!gameState.exhaustedOptions) {
            console.log(`[isOptionExhausted] No exhaustedOptions set, initializing new Set`);
            gameState.exhaustedOptions = new Set();
            return false;
        }
        
        // Check if the option is in the exhaustedOptions set
        const isInExhaustedSet = gameState.exhaustedOptions.has(optionKey);
        
        // Check if the option has used up all its attempts for the current round
        const maxAttempts = gameState.maxAttempts[optionKey] || 0;
        const usedAttempts = gameState.usedAttempts[optionKey] || 0;
        const hasNoAttemptsLeft = maxAttempts > 0 && usedAttempts >= maxAttempts;
        
        const isExhausted = isInExhaustedSet || hasNoAttemptsLeft;
        
        console.log(`[isOptionExhausted] Option ${optionKey} is ${isExhausted ? 'exhausted' : 'available'}`);
        console.log(`[isOptionExhausted] exhaustedOptions:`, Array.from(gameState.exhaustedOptions));
        console.log(`[isOptionExhausted] usedAttempts[${optionKey}]: ${usedAttempts}/${maxAttempts}`);
        
        return isExhausted;
    }
    
    showOptions(round) {
        if (!this.container) {
            console.error('Container not found');
            return;
        }
        
        console.log('showOptions called with round:', round);
        const optionsContainer = this.container.querySelector('#options-container');
        const showOptionsBtn = this.container.querySelector('#show-options-btn');
        const advanceButton = this.container.querySelector('#advance-button');
        
        console.log('Elements found:', { 
            optionsContainer: !!optionsContainer, 
            showOptionsBtn: !!showOptionsBtn, 
            advanceButton: !!advanceButton 
        });
        
        if (showOptionsBtn) {
            console.log('Hiding show options button');
            showOptionsBtn.classList.add('hidden');
        }
        
        if (!optionsContainer) {
            console.error('Options container not found');
            return;
        }
        
        console.log('Clearing and showing options container');
        optionsContainer.innerHTML = '';
        optionsContainer.classList.remove('hidden');
        
        const options = getOptions(gameState.currentRound, gameState.redemptionRate, gameState.previousChoice);
        console.log('Retrieved options:', options);
        
        if (!options || Object.keys(options).length === 0) {
            console.log('No options available');
            return;
        }
        
        console.log('Processing options...');
        let hasValidOptions = false;
        const optionElements = [];
        
        // Create all option elements first
        Object.entries(options).forEach(([key, text], index) => {
            // Skip options that have been failed or exhausted
            if (!gameState.failedOptions.has(key) && !this.isOptionExhausted(key)) {
                console.log(`Adding option ${key} to the UI`);
                hasValidOptions = true;
                const optionElement = this.addOption(key, text, optionsContainer);
                optionElements.push(optionElement);
            } else if (this.isOptionExhausted(key)) {
                console.log(`Option ${key} is exhausted, showing as disabled`);
                // Add disabled option
                const optionDiv = document.createElement('div');
                optionDiv.className = 'option disabled';
                optionDiv.id = `option-${key}`;
                optionDiv.textContent = text;
                optionDiv.title = 'This option is temporarily unavailable';
                optionsContainer.appendChild(optionDiv);
                optionElements.push(optionDiv);
            }
        });
        
        // Animate all options with Web Animations API
        optionElements.forEach((element, index) => {
            // Cancel any existing animations
            if (element.optionAnimation) {
                element.optionAnimation.cancel();
            }
            
            // Create smooth animation with Web Animations API
            const animation = element.animate([
                { 
                    opacity: 0, 
                    transform: 'translateY(20px) scale(0.95)',
                    filter: 'blur(1px)'
                },
                { 
                    opacity: 1, 
                    transform: 'translateY(0) scale(1)',
                    filter: 'blur(0px)'
                }
            ], {
                duration: 700,
                delay: index * 120,
                easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
                fill: 'forwards'
            });
            
            // Keep animation reference to prevent garbage collection
            element.optionAnimation = animation;
            
            // Clean up after animation completes
            animation.onfinish = () => {
                element.optionAnimation = null;
            };
        });
        
        console.log('Finished processing options. hasValidOptions:', hasValidOptions);
        // If all options are exhausted or failed, show advance button
        if (!hasValidOptions && advanceButton) {
            advanceButton.classList.remove('hidden');
            advanceButton.textContent = 'Continue';
        }
    }

    showGameScreen() {
        this.updateScoreDisplay();

        const optionsContainer = this.container.querySelector('#options-container');
        if (optionsContainer) {
            optionsContainer.innerHTML = '';
            optionsContainer.classList.remove('visible');

            const options = getOptions(gameState.currentRound, gameState.redemptionRate, gameState.previousChoice);

            Object.entries(options).forEach(([key, text], index) => {
                // Skip options that have been failed
                if (!gameState.failedOptions.has(key)) {
                    this.addOption(key, text, optionsContainer);
                    setTimeout(() => {
                        const option = this.container.querySelector(`#option-${key}`);
                        if (option) {
                            option.classList.add('visible');
                        }
                    }, 100 * (index + 1));
                }
            });

            const gameText = this.container.querySelector('#game-text');
            if (gameText) {
                // If we have a previous choice, show the consequence
                if (gameState.previousChoice && gameState.currentRound > 1) {
                    const consequenceRound = gameState.currentRound - 1;
                    const consequence = getConsequence(
                        consequenceRound,
                        gameState.previousChoice,
                        gameState.redemptionRate,
                        gameState.previousRoundChoice
                    );
                    gameText.innerHTML = consequence || getNarrative(gameState.currentRound, gameState.redemptionRate, gameState.previousChoice);
                } 
                // Otherwise show the narrative text
                else {
                    const narrative = getNarrative(gameState.currentRound, gameState.redemptionRate, gameState.previousChoice);
                    gameText.innerHTML = narrative;
                }
            }

            // If all options are exhausted, show continue button
            if (Object.keys(options).every(key => gameState.failedOptions.has(key))) {
                const continueBtn = document.createElement('button');
                continueBtn.className = 'btn continue-btn';
                continueBtn.textContent = 'Continue';
                continueBtn.addEventListener('click', () => {
                    if (this.onNextRound) {
                        this.onNextRound();
                    }
                });
                optionsContainer.appendChild(continueBtn);
            }

            setTimeout(() => {
                optionsContainer.classList.add('visible');
            }, 300);
        }
    }

    addOption(value, text, container) {
        if (!container) {
            console.error('Container is required for addOption');
            return;
        }
        
        console.log(`Adding option ${value} to container:`, container);
        const button = document.createElement('button');
        button.id = `option-${value}`;
        button.className = 'btn option-btn option';
        button.textContent = text;
        
        // Check if option is exhausted or failed
        const isExhausted = this.isOptionExhausted(value);
        const isFailed = gameState.failedOptions?.has(value) || false;
        
        if (isExhausted || isFailed) {
            button.disabled = true;
            button.classList.add('exhausted');
            console.log(`Option ${value} is ${isFailed ? 'failed' : 'exhausted'}`);
        } else {
            // Only add click handler if not exhausted/failed
            button.addEventListener('click', () => this.selectOption(value));
        }
        
        container.appendChild(button);
        console.log(`Option ${value} added to container`);
        return button; // Return the created element
    }

    // Method to be called by the orchestrator to set itself
    setOrchestrator(orchestrator) {
        this.gameOrchestrator = orchestrator;
        console.log('NarrativeGame: Orchestrator set', { hasTransitionMethod: !!orchestrator?.transitionToShade });
    }

    // Direct transition method that can be called as a fallback
    directTransitionToShade(option) {
        console.log('=== DIRECT TRANSITION TO SHADE ===');
        console.log('Using direct method call instead of event bus');
        
        if (this.gameOrchestrator && typeof this.gameOrchestrator.transitionToShade === 'function') {
            console.log('Calling orchestrator.transitionToShade directly');
            gameState.inNarrative = false;
            gameState.mode = 'shade';
            this.gameOrchestrator.transitionToShade(option);
            return true;
        }
        
        console.warn('Direct transition failed - no valid orchestrator method');
        return false;
    }

    selectOption(option) {
        console.log('=== selectOption called ===');
        console.log('Option selected:', option);
        
        // Block if option is invalid
        if (gameState.failedOptions?.has(option) || this.isOptionExhausted(option)) {
            console.warn('Option blocked - failed or exhausted');
            return;
        }
        
        // Ensure the option is uppercase for consistency
        const optionUpper = option.toUpperCase();
        
        // Initialize attempts tracking if needed
        if (!gameState.usedAttempts) {
            gameState.usedAttempts = { A: 0, B: 0, C: 0 };
        }
        
        // Don't increment attempts here - they're incremented in the shade game when attempts fail
        console.log(`Starting shade game for option ${optionUpper}: ${gameState.usedAttempts[optionUpper]}/${gameState.maxAttempts[optionUpper]} attempts used`);
        
        // Set the selected option
        gameState.previousChoice = optionUpper;
        console.log('Set previousChoice to:', optionUpper);
        
        // Update game state
        gameState.currentOption = optionUpper;
        gameState.currentAttempts = 0;
        gameState.inNarrative = false;
        
        // Check if we've used up all attempts for this option
        const maxAttempts = gameState.maxAttempts[optionUpper] || 0;
        const usedAttempts = gameState.usedAttempts[optionUpper] || 0;
        
        if (maxAttempts > 0 && usedAttempts >= maxAttempts) {
            console.log(`All ${maxAttempts} attempts used for option ${optionUpper}`);
            gameState.exhaustedOptions.add(optionUpper);
        }
        
        // Transition to shade game
        if (this.gameOrchestrator?.transitionToShade) {
            console.log('Transitioning to shade game');
            this.gameOrchestrator.transitionToShade(optionUpper);
        } else {
            console.warn('No transitionToShade method available on orchestrator');
        }
    }
    
    handleAdvance() {
        if (this.onNextRound) {
            this.onNextRound();
        }
    }

    clearExhaustedOptions() {
        if (!gameState.exhaustedOptions) {
            gameState.exhaustedOptions = new Set();
        } else {
            gameState.exhaustedOptions.clear();
        }
    }

    nextRound() {
        console.log('=== nextRound called ===');
        console.log('Current round before increment:', gameState.currentRound);
        
        // Clear any auto-progress timer
        this.clearAutoProgressTimer();
        
        // Log the current state before reset
        console.log('Before reset - Exhausted options:', Array.from(gameState.exhaustedOptions || []));
        console.log('Before reset - Used attempts:', gameState.usedAttempts);

        if (gameState.gameOver) {
            gameState.reset();
            this.onNextRound?.();
            return;
        }

        // Reset all options before incrementing the round
        // This ensures the new round starts with fresh options
        gameState.resetOptionsForNewRound();
        
        // Increment the round number
        gameState.currentRound++;
        
        // Clear the previous choice for the new round
        gameState.previousChoice = null;
        
        console.log('=== After reset ===');
        console.log('New round:', gameState.currentRound);
        console.log('All options have been reset for the new round');
        console.log('Exhausted options after reset:', Array.from(gameState.exhaustedOptions || []));
        console.log('Used attempts after reset:', gameState.usedAttempts);
        
        // Clear any existing UI state
        const optionsContainer = this.container.querySelector('#options-container');
        if (optionsContainer) {
            optionsContainer.innerHTML = '';
        }
        
        // Show the narrative screen for the new round
        this.showNarrativeScreen(gameState.currentRound);
    }

    updateScoreDisplay() {
        const redemptionRateDisplay = this.container.querySelector('#redemption-rate');
        const roundDisplay = this.container.querySelector('#round-display');

        if (redemptionRateDisplay) {
            redemptionRateDisplay.textContent = Math.round(gameState.redemptionRate);
            redemptionRateDisplay.style.color = '#555555';
        }

        if (roundDisplay) {
            roundDisplay.textContent = gameState.currentRound;
        }
    }

    startAutoProgressTimer() {
        // Clear any existing timer
        this.clearAutoProgressTimer();
        
        console.log('Starting 7-second auto-progress timer for round 33');
        
        // Start timer to auto-progress to round 34 after 7 seconds
        this.autoProgressTimer = setTimeout(() => {
            console.log('Auto-progressing from round 33 to round 34');
            
            // Force progression regardless of current state
            this.forceAutoProgressToRound34();
        }, 7000); // 7 seconds
    }

    clearAutoProgressTimer() {
        if (this.autoProgressTimer) {
            console.log('Clearing auto-progress timer');
            clearTimeout(this.autoProgressTimer);
            this.autoProgressTimer = null;
        }
    }

    forceAutoProgressToRound34() {
        console.log('=== FORCE AUTO-PROGRESS TO ROUND 34 ===');
        console.log('Current state before force:', {
            currentRound: gameState.currentRound,
            mode: gameState.mode,
            inNarrative: gameState.inNarrative,
            previousChoice: gameState.previousChoice
        });

        // Apply red flash and shake effects to whatever screen is currently visible
        this.applyAutoProgressEffectsToCurrentScreen();
        
        // Force progression after effects
        setTimeout(() => {
            // Set round to 34 regardless of current state
            gameState.currentRound = 34;
            gameState.previousChoice = null;
            gameState.mode = 'narrative';
            gameState.inNarrative = true;
            
            // Reset options for the new round
            gameState.resetOptionsForNewRound();
            
            // Force return to narrative screen for round 34
            if (this.gameOrchestrator) {
                // Use the orchestrator to force return to narrative
                this.gameOrchestrator.returnToNarrative();
            } else {
                // Fallback: show narrative screen directly
                this.showNarrativeScreen(34);
            }
            
            console.log('Force progression complete. Now in round 34');
        }, 500); // Wait for effects to complete
        
        // Clear the timer
        this.autoProgressTimer = null;
    }

    applyAutoProgressEffectsToCurrentScreen() {
        // Try to find the current visible screen
        let currentScreen = null;
        
        // Check for narrative screen
        currentScreen = this.container.querySelector('#narrative-screen');
        
        // If not found, check for shade game screen
        if (!currentScreen) {
            currentScreen = this.container.querySelector('#shade-game-screen');
        }
        
        // If still not found, check for consequences screen
        if (!currentScreen) {
            currentScreen = this.container.querySelector('#consequences-screen');
        }
        
        // If still not found, use the app container as fallback
        if (!currentScreen) {
            currentScreen = this.container;
        }

        if (currentScreen) {
            // Add shake effect
            currentScreen.classList.add('shake');
            
            // Create red flash overlay
            const flash = document.createElement('div');
            flash.className = 'flash-overlay';
            currentScreen.appendChild(flash);
            
            // Remove effects after animation completes
            setTimeout(() => {
                currentScreen.classList.remove('shake');
                if (flash.parentNode) {
                    flash.remove();
                }
            }, 500);
            
            console.log('Applied effects to screen:', currentScreen.id || 'container');
        } else {
            console.warn('No screen found for effects');
        }
    }

    applyAutoProgressEffects() {
        const narrativeScreen = this.container.querySelector('#narrative-screen');
        if (!narrativeScreen) {
            console.warn('Narrative screen not found for effects');
            return;
        }

        // Add shake effect
        narrativeScreen.classList.add('shake');
        
        // Create red flash overlay
        const flash = document.createElement('div');
        flash.className = 'flash-overlay';
        narrativeScreen.appendChild(flash);
        
        // Remove effects after animation completes
        setTimeout(() => {
            narrativeScreen.classList.remove('shake');
            if (flash.parentNode) {
                flash.remove();
            }
        }, 500);
    }
}

