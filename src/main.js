import Mustache from 'mustache';
import { gameState } from './state/gameState.js';
import { NarrativeGame } from './narrative/NarrativeGame.js';
import { ShadeGame } from './shade/ShadeGame.js';
import { gameContent } from './narrative/gameContent.js';

// Import templates as raw strings
import titleTemplate from '../templates/title.mustache?raw';
import narrativeTemplate from '../templates/narrative.mustache?raw';
import shadeGameTemplate from '../templates/shade-game.mustache?raw';

class GameOrchestrator {
    constructor() {
        this.app = document.getElementById('app');
        this.narrativeGame = null;
        this.shadeGame = null;
        this.currentScreen = null;
    }

    init() {
        gameState.reset();
        this.renderTitleScreen();
        this.setupEventListeners();
    }

    renderTitleScreen() {
        const html = Mustache.render(titleTemplate, { title: gameContent.title });
        this.app.innerHTML = html;
        gameState.mode = 'title';

        const playButton = this.app.querySelector('#play-button');
        if (playButton) {
            playButton.addEventListener('click', () => this.startGame());
        }
    }

    startGame() {
        // Render narrative template
        this.app.innerHTML = narrativeTemplate;

        // Initialize narrative game
        this.narrativeGame = new NarrativeGame(this.app);
        this.narrativeGame.onNextRound = () => this.handleNarrativeNext();
        this.narrativeGame.onTransitionToShade = () => this.transitionToShade();
        this.narrativeGame.init();

        // Show first narrative screen
        gameState.mode = 'narrative';
        gameState.currentRound = 1;
        this.showNarrativeScreen();
    }

    showNarrativeScreen() {
        const narrativeScreen = this.app.querySelector('#narrative-screen');
        const gameScreen = this.app.querySelector('#game-screen');

        if (narrativeScreen) narrativeScreen.classList.remove('hidden');
        if (gameScreen) gameScreen.classList.add('hidden');

        this.narrativeGame.showNarrativeScreen(gameState.currentRound);

        const nextBtn = this.app.querySelector('#next-narrative');
        if (nextBtn) {
            nextBtn.onclick = () => {
                this.showGameScreen();
            };
        }
    }

    showGameScreen() {
        const narrativeScreen = this.app.querySelector('#narrative-screen');
        const gameScreen = this.app.querySelector('#game-screen');

        if (narrativeScreen) narrativeScreen.classList.add('hidden');
        if (gameScreen) gameScreen.classList.remove('hidden');

        this.narrativeGame.showGameScreen();
    }

    handleNarrativeNext() {
        this.narrativeGame.nextRound();

        if (gameState.inNarrative) {
            this.showNarrativeScreen();
        }
        // If not in narrative, transitionToShade will be called
    }

    transitionToShade() {
        // Append shade game template
        const shadeHtml = shadeGameTemplate;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = shadeHtml;

        // Append shade game screens to app
        while (tempDiv.firstChild) {
            this.app.appendChild(tempDiv.firstChild);
        }

        // Initialize shade game
        this.shadeGame = new ShadeGame(this.app);
        this.shadeGame.onWin = () => this.handleShadeWin();
        this.shadeGame.onLose = () => this.handleShadeLose();
        this.shadeGame.init();

        gameState.mode = 'shade';
        gameState.shadeRound++;
        this.showShadeStory();
    }

    showShadeStory() {
        this.hideAllScreens();
        const storyScreen = this.app.querySelector('#story-screen');
        if (storyScreen) {
            storyScreen.classList.remove('hidden');
            this.shadeGame.showStory(gameState.shadeRound);

            const continueBtn = this.app.querySelector('#story-continue-button');
            if (continueBtn) {
                continueBtn.onclick = () => this.showShadeOptions();
            }
        }
    }

    showShadeOptions() {
        this.hideAllScreens();
        const optionsScreen = this.app.querySelector('#options-screen');
        if (optionsScreen) {
            optionsScreen.classList.remove('hidden');
            this.shadeGame.showOptions();

            // Setup option button handlers
            const optionButtons = this.app.querySelectorAll('.option-button');
            optionButtons.forEach(btn => {
                btn.onclick = () => {
                    if (!btn.disabled && !btn.classList.contains('exhausted')) {
                        this.startShadeBattle(btn.dataset.option);
                    }
                };
            });
        }
    }

    startShadeBattle(option) {
        this.hideAllScreens();
        const gameScreen = this.app.querySelector('#shade-game-screen');
        if (gameScreen) {
            gameScreen.classList.remove('hidden');
            this.shadeGame.startBattle(option);
        }
    }

    handleShadeWin() {
        this.shadeGame.showInterlude('You matched the shade.');
        this.hideAllScreens();
        const interludeScreen = this.app.querySelector('#interlude-screen');
        if (interludeScreen) {
            interludeScreen.classList.remove('hidden');

            const continueBtn = this.app.querySelector('#continue-button');
            if (continueBtn) {
                continueBtn.onclick = () => this.completeShadeRound();
            }
        }
    }

    handleShadeLose() {
        // Return to options screen
        this.showShadeOptions();
    }

    completeShadeRound() {
        // Transition back to narrative
        gameState.inNarrative = true;
        gameState.currentRound++;

        // Clean up shade game screens
        const shadeScreens = ['story-screen', 'options-screen', 'shade-game-screen', 'interlude-screen'];
        shadeScreens.forEach(id => {
            const screen = this.app.querySelector(`#${id}`);
            if (screen) screen.remove();
        });

        // Show narrative screen
        this.showNarrativeScreen();
    }

    hideAllScreens() {
        const screens = this.app.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.add('hidden'));
    }

    setupEventListeners() {
        // Global event listeners if needed
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const orchestrator = new GameOrchestrator();
    orchestrator.init();
});

