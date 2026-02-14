import Mustache from 'mustache';
import { gameState } from './state/gameState.js';
import { NarrativeGame } from './narrative/NarrativeGame.js';
import { ShadeGame } from './shade/ShadeGame.js';
// Import templates as raw strings
import titleTemplate from '../templates/title.mustache?raw';
import narrativeTemplate from '../templates/narrative.mustache?raw';
import shadeGameTemplate from '../templates/shade-game.mustache?raw';
import consequencesTemplate from '../templates/consequences.mustache?raw';
import { gameContent, getVariant, getConsequence } from './narrative/gameContent.js';

class GameOrchestrator {
    constructor() {
        this.app = document.getElementById('app');
        this.narrativeGame = null;
        this.shadeGame = null;
    }

    // Utility function to trigger fade-in animations for content elements
    triggerContentFadeIn(screenElement) {
        if (!screenElement) return;
        
        // Only animate elements that don't already have their own transition system
        const animatedElements = screenElement.querySelectorAll('.text-display, .consequence-text, .story-content, .game-header, .circle-container, .game-buttons-container, .continue-btn, .back-button, .next-button, .commit-button');
        
        // Exclude option buttons from global animation to prevent conflicts
        const allButtons = screenElement.querySelectorAll('.btn');
        const optionButtons = screenElement.querySelectorAll('.option-btn, .option');
        const nonOptionButtons = Array.from(allButtons).filter(btn => !btn.classList.contains('option-btn') && !btn.classList.contains('option'));
        
        // Remove any existing fade-in classes first
        animatedElements.forEach(element => {
            element.classList.remove('fade-in-content', 'fade-in-content-delay-1', 'fade-in-content-delay-2', 'fade-in-content-delay-3');
        });
        
        // Animate non-option buttons separately
        nonOptionButtons.forEach(element => {
            element.classList.remove('fade-in-content', 'fade-in-content-delay-1', 'fade-in-content-delay-2', 'fade-in-content-delay-3');
            // Remove animation classes
            element.style.animation = 'none';
            element.offsetHeight; // Trigger reflow
            // Re-add animation
            element.style.animation = '';
        });
        
        // Animate other elements
        animatedElements.forEach(element => {
            // Remove animation classes
            element.style.animation = 'none';
            element.offsetHeight; // Trigger reflow
            // Re-add animation
            element.style.animation = '';
        });
    }

    init() {
        gameState.reset();
        this.renderTitleScreen();
    }

    renderTitleScreen() {
        // Check for save data and prepare template data
        const hasSave = gameState.hasSaveData();
        let templateData = { title: gameContent.title };
        
        if (hasSave) {
            const timestamp = gameState.getSaveTimestamp();
            const saveDate = timestamp ? new Date(timestamp).toLocaleDateString() : 'Unknown';
            
            // Load save data temporarily to get round info
            const currentRound = gameState.currentRound;
            const currentMode = gameState.mode;
            
            // Create a temporary state to check save info
            const tempState = { ...gameState };
            if (gameState.loadGame()) {
                templateData.hasSave = true;
                templateData.saveRound = gameState.currentRound;
                templateData.saveDate = saveDate;
                
                // Restore current state if we were just checking
                if (currentMode === 'title') {
                    gameState.currentRound = currentRound;
                    gameState.mode = currentMode;
                }
            }
        }
        
        this.app.innerHTML = Mustache.render(titleTemplate, templateData);
        gameState.mode = 'title';

        const playButton = this.app.querySelector('#play-button');
        if (playButton) {
            playButton.addEventListener('click', () => this.startGame());
        }
        
        const continueButton = this.app.querySelector('#continue-button');
        if (continueButton) {
            continueButton.addEventListener('click', () => this.continueGame());
        }
    }

    startGame() {
        console.log('Starting new game...');
        gameState.reset();
        
        // Delete any existing save data when starting new game
        gameState.deleteSave();

 // DEBUG: confirm redemptionRate at game start
    gameState.logRedemption('After reset (startGame)');

        // Initialize used attempts
        gameState.usedAttempts = { A: 0, B: 0, C: 0 };

        // Render narrative template
        this.app.innerHTML = narrativeTemplate;

        // Initialize narrative game
        this.narrativeGame = new NarrativeGame(this.app);
        this.narrativeGame.setOrchestrator(this);
        this.narrativeGame.onNextRound = () => this.handleNarrativeNext();
        this.narrativeGame.init();

        gameState.mode = 'narrative';
        gameState.inNarrative = true;
        gameState.currentRound = 1;

        this.showNarrativeScreen();
        
        // Save game after starting
        gameState.saveGame();
    }

    continueGame() {
        console.log('Continuing saved game...');
        
        if (!gameState.loadGame()) {
            console.error('Failed to load saved game');
            return;
        }

        // Check if game was completed
        if (gameState.gameOver) {
            this.showGameOver();
            return;
        }

        // Restore the appropriate screen based on saved mode
        switch (gameState.mode) {
            case 'narrative':
                this.continueToNarrative();
                break;
            case 'shade':
                this.continueToShade();
                break;
            case 'consequences':
                this.continueToConsequences();
                break;
            default:
                // If mode is unclear, start a new game
                this.startGame();
                return;
        }
    }

    continueToNarrative() {
        console.log('Continuing to narrative screen...');
        
        // Render narrative template
        this.app.innerHTML = narrativeTemplate;

        // Initialize narrative game
        this.narrativeGame = new NarrativeGame(this.app);
        this.narrativeGame.setOrchestrator(this);
        this.narrativeGame.onNextRound = () => this.handleNarrativeNext();
        this.narrativeGame.init();

        this.showNarrativeScreen();
    }

    continueToShade() {
        console.log('Continuing to shade game...');
        
        if (!gameState.previousChoice) {
            console.error('No previous choice found for shade game');
            this.continueToNarrative();
            return;
        }

        // Hide all screens first
        this.hideAllScreens();

        // Insert shade game template if not already present
        if (!this.app.querySelector('#shade-game-screen')) {
            this.app.insertAdjacentHTML('beforeend', shadeGameTemplate);
        }

        // Initialize shade game
        if (!this.shadeGame) {
            this.shadeGame = new ShadeGame(this.app);
            this.shadeGame.onWin = () => this.handleShadeWin();
            this.shadeGame.onLose = () => this.handleShadeLose();
            this.shadeGame.onBack = () => this.returnToNarrative();
            this.shadeGame.init();
        }

        // Show the shade game screen
        const gameScreen = this.app.querySelector('#shade-game-screen');
        if (gameScreen) {
            gameScreen.classList.remove('hidden');
            // Start the shade battle with the saved option
            this.shadeGame.startBattle(gameState.previousChoice);
        }
    }

    continueToConsequences() {
        console.log('Continuing to consequences screen...');
        this.showConsequences();
    }

    showNarrativeScreen() {
        const narrativeScreen = this.app.querySelector('#narrative-screen');
        if (narrativeScreen) {
            // Hide the advance button when showing the narrative
            const advanceButton = this.app.querySelector('#advance-button');
            if (advanceButton) {
                advanceButton.classList.add('hidden');
            }
            
            narrativeScreen.classList.remove('hidden');
            this.narrativeGame.showNarrativeScreen(gameState.currentRound);
            
            // Trigger fade-in animations
            setTimeout(() => {
                this.triggerContentFadeIn(narrativeScreen);
            }, 50);
        }
    }

    handleNarrativeNext() {
        const currentOption = gameState.previousChoice;
        if (!currentOption) {
            console.error('No option selected for shade game transition');
            return;
        }

        // Directly transition to shade
        this.transitionToShade(currentOption);
    }

    transitionToShade(option) {
        console.log('Transitioning to shade game with option:', option);
        
        // Save game before transitioning to shade game
        gameState.saveGame();

        // Hide narrative screens
        this.hideAllScreens();

        // Insert shade game template if not already present
        if (!this.app.querySelector('#shade-game-screen')) {
            this.app.insertAdjacentHTML('beforeend', shadeGameTemplate);
        }

        // Initialize shade game
        if (!this.shadeGame) {
            this.shadeGame = new ShadeGame(this.app);
            this.shadeGame.onWin = () => this.handleShadeWin();
            this.shadeGame.onLose = () => this.handleShadeLose();
            this.shadeGame.onBack = () => this.returnToNarrative();
            this.shadeGame.init();
        }

        // Start the shade battle immediately
        const gameScreen = this.app.querySelector('#shade-game-screen');
        if (gameScreen) {
            gameScreen.classList.remove('hidden');
            this.shadeGame.startBattle(option);
            
            // Trigger fade-in animations
            setTimeout(() => {
                this.triggerContentFadeIn(gameScreen);
            }, 50);
        }

        // Update game state
        gameState.mode = 'shade';
        gameState.inNarrative = false;
    }

    handleShadeWin() {
        console.log('Shade game won');
        
        // Update redemption rate based on the selected option
        if (gameState.previousChoice) {
            const option = gameState.previousChoice;
            switch (option) {
                case 'A':
                    gameState.redemptionRate = Math.min(100, Math.round(gameState.redemptionRate * 1.15));
                    console.log('Redemption rate increased by 15%');
                    break;
                case 'B':
                    gameState.redemptionRate = Math.max(0, Math.round(gameState.redemptionRate * 0.95));
                    console.log('Redemption rate decreased by 5%');
                    break;
                case 'C':
                    gameState.redemptionRate = Math.max(0, Math.round(gameState.redemptionRate * 0.90));
                    console.log('Redemption rate decreased by 10%');
                    break;
            }
        }
        
        // Save game after winning shade game
        gameState.saveGame();
        
        // Show consequences screen
        this.showConsequences();
    }
    
    showConsequences() {
        console.log('Showing consequences screen');
        
        // Make sure we have a clean slate
        this.hideAllScreens();
        
        // Render the consequences template
        this.app.innerHTML = Mustache.render(consequencesTemplate, {
            redemptionRate: Math.round(gameState.redemptionRate)
        });
        
        // Show the consequences screen
        const consequencesScreen = this.app.querySelector('#consequences-screen');
        if (consequencesScreen) {
            consequencesScreen.classList.remove('hidden');
            
            // Trigger fade-in animations
            setTimeout(() => {
                this.triggerContentFadeIn(consequencesScreen);
            }, 50);
        }
        
        // Set up the continue button
        const continueButton = this.app.querySelector('#continue-button');
        if (continueButton) {
            continueButton.addEventListener('click', () => {
                // Reset options before moving to next round
                gameState.resetOptionsForNewRound();
                
                // Move to next round when continuing from consequences
                gameState.currentRound++;
                console.log('Moving to round:', gameState.currentRound);
                
                // Save game after advancing to next round
                gameState.saveGame();
                
                // Return to narrative with fresh options
                this.returnToNarrative();
            });
        }
        
        // Show the consequence text
        this.showConsequenceText();
        
        // Update game state
        gameState.mode = 'consequences';
    }
    
    showConsequenceText() {
        const consequenceEl = this.app.querySelector('#consequence-text');
        if (!consequenceEl) return;
        
        // Get the consequence text using the getConsequence function
        const consequenceText = getConsequence(
            gameState.currentRound,
            gameState.previousChoice,
            gameState.redemptionRate
        );
        
        // Display the consequence text
        consequenceEl.innerHTML = consequenceText || 'The consequences are unclear...';
    }

    handleShadeLose() {
        console.log('Shade game lost');
        this.returnToNarrative();
    }

    returnToNarrative() {
        console.log('=== Returning to narrative ===');
        console.log('Current round:', gameState.currentRound);
        console.log('Previous choice:', gameState.previousChoice);
        console.log('Current redemption rate:', gameState.redemptionRate);
        
        // Check if we've completed the final round (37)
        if (gameState.currentRound > 37) {
            console.log('Game completed!');
            this.showGameOver();
            return;
        }
        
        // Clean up shade game if it exists
        if (this.shadeGame) {
            console.log('Cleaning up shade game...');
            this.shadeGame.cleanupEventListeners();
        }
        
        // Reset current game state (but NOT attempts - those should persist)
        console.log('Resetting current game state...');
        gameState.currentAttempts = 0;
        gameState.currentOption = null;
        gameState.targetShade = null;
        
        // Update game state
        gameState.mode = 'narrative';
        gameState.inNarrative = true;
        
        // Show narrative screen
        this.hideAllScreens();
        
        // Only re-initialize if the narrative screen doesn't exist
        if (!this.app.querySelector('#narrative-screen')) {
            console.log('Initializing new narrative screen...');
            this.app.innerHTML = narrativeTemplate;
            
            this.narrativeGame = new NarrativeGame(this.app);
            this.narrativeGame.setOrchestrator(this);
            this.narrativeGame.onNextRound = () => this.handleNarrativeNext();
            this.narrativeGame.init();
        }
        
        // Show the narrative screen for the current round
        console.log('Showing narrative screen for round', gameState.currentRound);
        this.showNarrativeScreen();
        
        console.log('=== Return to narrative complete ===');
        console.log('Current state:', {
            mode: gameState.mode,
            inNarrative: gameState.inNarrative,
            currentRound: gameState.currentRound,
            previousChoice: gameState.previousChoice,
            usedAttempts: gameState.usedAttempts,
            exhaustedOptions: Array.from(gameState.exhaustedOptions || [])
        });
    }
    
    showGameOver() {
        this.hideAllScreens();
        
        // Create a simple game over screen
        this.app.innerHTML = `
            <div id="game-over-screen" class="screen">
                <div class="game-over-container">
                    <h1>Luminance</h1>
                    <p class="game-year">2026</p>
                    <p class="game-author">by Isa Webbe</p>
                    <p class="game-credits">with ENORMOUS thanks to Keith Perfetti</p>
                    <p class="final-stats">Final Redemption Rate: ${Math.round(gameState.redemptionRate)}%</p>
                    <button id="restart-button" class="btn">Again</button>
                </div>
            </div>
        `;
        
        // Show the game over screen
        const gameOverScreen = this.app.querySelector('#game-over-screen');
        if (gameOverScreen) {
            gameOverScreen.classList.remove('hidden');
        }
        
        // Set up restart button
        const restartButton = this.app.querySelector('#restart-button');
        if (restartButton) {
            restartButton.addEventListener('click', () => this.startGame());
        }
        
        // Update game state
        gameState.gameOver = true;
        
        // Delete save data when game is completed
        gameState.deleteSave();
    }

    hideAllScreens() {
        // Hide all screen elements
        const screens = this.app.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Explicitly hide the advance button
        const advanceButton = this.app.querySelector('#advance-button');
        if (advanceButton) {
            advanceButton.classList.add('hidden');
        }
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    const orchestrator = new GameOrchestrator();
    orchestrator.init();
    
    // DEBUG: Add keyboard shortcut to skip rounds
    // Press 'S' + 'Shift' to skip current round and bypass shade game
    document.addEventListener('keydown', (e) => {
        if (e.shiftKey && e.key === 'S') {
            console.log('🚀 DEBUG: Skipping round and bypassing shade game');
            
            // Check if we've reached the end before skipping
            if (gameState.currentRound >= 37) {
                console.log('🏁 DEBUG: Already at final round, showing game over');
                orchestrator.showGameOver();
                return;
            }
            
            // Skip to next round directly
            gameState.currentRound++;
            gameState.previousChoice = 'A'; // Auto-select option A for convenience
            gameState.usedAttempts = {}; // Reset attempts for next round
            
            // Check if we've completed the final round (37)
            if (gameState.currentRound > 37) {
                console.log('🏁 DEBUG: Game completed!');
                orchestrator.showGameOver();
                return;
            }
            
            // Go directly to next narrative round
            orchestrator.showNarrativeScreen();
        }
    });
});
