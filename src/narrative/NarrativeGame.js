import { getNarrative, getOptions, getConsequence } from './gameContent.js';
import { gameState } from '../state/gameState.js';

export class NarrativeGame {
    constructor(container) {
        this.container = container;
        this.onNextRound = null;
        this.onTransitionToShade = null;
    }

    init() {
        this.updateScoreDisplay();
    }

    showNarrativeScreen(round) {
        const narrative = getNarrative(round, gameState.redemptionRate, gameState.previousChoice);
        const narrativeEl = this.container.querySelector('#narrative-text');
        if (narrativeEl) {
            narrativeEl.innerHTML = narrative;
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
                this.addOption(key, text, optionsContainer);
                setTimeout(() => {
                    const option = this.container.querySelector(`#option-${key}`);
                    if (option) {
                        option.classList.add('visible');
                    }
                }, 100 * (index + 1));
            });

            const gameText = this.container.querySelector('#game-text');
            if (gameText) {
                const narrative = getNarrative(gameState.currentRound, gameState.redemptionRate, gameState.previousChoice);
                gameText.innerHTML = narrative;
            }

            setTimeout(() => {
                optionsContainer.classList.add('visible');
            }, 300);
        }
    }

    addOption(value, text, container) {
        const button = document.createElement('button');
        button.id = `option-${value}`;
        button.className = 'option-btn option';
        button.textContent = text;
        button.addEventListener('click', () => this.selectOption(value));
        container.appendChild(button);
    }

    selectOption(option) {
        const previousChoice = gameState.previousChoice;
        gameState.previousChoice = option;

        switch(option) {
            case 'A':
                gameState.redemptionRate = Math.min(100, Math.round(gameState.redemptionRate * 1.15));
                break;
            case 'B':
                gameState.redemptionRate = Math.max(0, Math.round(gameState.redemptionRate * 0.95));
                break;
            case 'C':
                gameState.redemptionRate = Math.max(0, Math.round(gameState.redemptionRate * 0.90));
                break;
            case 'M':
            case 'N':
                break;
        }

        const optionsContainer = this.container.querySelector('#options-container');
        const gameText = this.container.querySelector('#game-text');

        if (gameText) {
            const consequence = getConsequence(gameState.currentRound, option, gameState.redemptionRate, previousChoice);
            gameText.innerHTML = consequence;
        }

        if (optionsContainer) {
            optionsContainer.innerHTML = '';
            const continueBtn = document.createElement('button');
            continueBtn.className = 'btn continue-btn';
            continueBtn.textContent = 'Continue';
            continueBtn.addEventListener('click', () => {
                if (this.onNextRound) {
                    this.onNextRound();
                }
            });
            optionsContainer.appendChild(continueBtn);
            optionsContainer.classList.add('visible');
        }
    }

    nextRound() {
        if (gameState.gameOver) {
            gameState.reset();
            if (this.onNextRound) {
                this.onNextRound();
            }
            return;
        }

        gameState.currentRound++;

        if (gameState.currentRound >= 37) {
            this.showNarrativeScreen(gameState.currentRound);
            return;
        }

        gameState.inNarrative = !gameState.inNarrative;

        if (gameState.inNarrative) {
            this.showNarrativeScreen(gameState.currentRound);
        } else {
            if (this.onTransitionToShade) {
                this.onTransitionToShade();
            }
        }
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
}

