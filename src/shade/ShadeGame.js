import { gameState } from '../state/gameState.js';

const TOLERANCE = { a: 10, b: 10, c: 20 };

export class ShadeGame {
    constructor(container) {
        this.container = container;
        this.currentShade = 128;
        this.isMouseDown = false;
        this.isPreviewing = false;
        this.onWin = null;
        this.onLose = null;
        this.onComplete = null;
    }

    init() {
        // Reset shade game state
        gameState.currentOption = null;
        gameState.targetShade = null;
        gameState.attempts = { a: 3, b: 3, c: Infinity };
        gameState.exhaustedOptions.clear();
    }

    showStory(round) {
        const storyText = this.container.querySelector('#story-text');
        if (storyText) {
            storyText.textContent = `Round ${round}: The light waits.`;
        }
    }

    showOptions() {
        const optionB = this.container.querySelector('.option-button[data-option="b"]');
        if (gameState.shadeRound === 0) {
            if (optionB) optionB.style.display = 'none';
        } else {
            if (optionB) optionB.style.display = 'flex';
        }

        // Update exhausted options
        gameState.exhaustedOptions.forEach(option => {
            const btn = this.container.querySelector(`.option-button[data-option="${option}"]`);
            if (btn) {
                btn.classList.add('exhausted');
                btn.disabled = true;
            }
        });
    }

    startBattle(option) {
        gameState.currentOption = option;
        gameState.targetShade = this.generateShade(option);
        this.paintCircles();
        this.enableSpectrum();
    }

    paintCircles() {
        const target = this.container.querySelector('#target-circle');
        const player = this.container.querySelector('#player-circle');

        if (target && gameState.targetShade !== null) {
            target.style.backgroundColor = `rgb(${gameState.targetShade}, ${gameState.targetShade}, ${gameState.targetShade})`;
        }

        if (player) {
            player.style.backgroundColor = `rgb(128, 128, 128)`;
        }
    }

    generateShade(option) {
        if (option === "a") {
            return 128 + Math.floor(Math.random() * 21) - 10; // MID GRAY
        }
        if (option === "b") {
            return Math.random() < 0.5
                ? Math.floor(Math.random() * 64)
                : 192 + Math.floor(Math.random() * 64);
        }
        return Math.random() < 0.5 ? 0 : 255;
    }

    checkGuess(playerShade) {
        if (!gameState.currentOption || gameState.targetShade === null) return;

        const diff = Math.abs(playerShade - gameState.targetShade);

        if (diff <= TOLERANCE[gameState.currentOption]) {
            this.winBattle();
        } else {
            this.loseAttempt();
        }
    }

    loseAttempt() {
        document.body.classList.add('flash-red');
        setTimeout(() => {
            document.body.classList.remove('flash-red');
        }, 500);

        if (gameState.attempts[gameState.currentOption] !== Infinity) {
            gameState.attempts[gameState.currentOption]--;
        }

        if (gameState.attempts[gameState.currentOption] <= 0 && gameState.currentOption !== "c") {
            this.loseBattle();
        }
    }

    winBattle() {
        this.disableSpectrum();
        if (this.onWin) {
            this.onWin();
        }
    }

    loseBattle() {
        gameState.exhaustedOptions.add(gameState.currentOption);
        this.disableSpectrum();
        if (this.onLose) {
            this.onLose();
        }
    }

    updatePlayerCircle(shade, isPreview = false) {
        const player = this.container.querySelector('#player-circle');
        if (player) {
            const clampedShade = Math.max(0, Math.min(255, Math.round(shade)));
            player.style.backgroundColor = `rgb(${clampedShade}, ${clampedShade}, ${clampedShade})`;
            player.dataset.preview = isPreview.toString();
            this.isPreviewing = isPreview;
        }
        return shade;
    }

    enableSpectrum() {
        const spectrum = this.container.querySelector('#spectrum');
        if (!spectrum) return;

        this.currentShade = 128;
        this.updatePlayerCircle(this.currentShade);

        const handleMouseDown = (e) => {
            this.isMouseDown = true;
            const rect = spectrum.getBoundingClientRect();
            let x = e.clientX - rect.left;
            x = Math.max(0, Math.min(x, rect.width - 1));
            const percentage = x / (rect.width - 1);
            this.currentShade = Math.round(percentage * 255);
            this.updatePlayerCircle(this.currentShade, false);
        };

        const handleMouseUp = () => {
            this.isMouseDown = false;
            this.updatePlayerCircle(this.currentShade, false);
        };

        const handleSpectrumMove = (e) => {
            const rect = spectrum.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const boundedX = Math.max(0, Math.min(x, rect.width - 1));
            const percentage = boundedX / (rect.width - 1);
            const previewShade = Math.round(percentage * 255);

            if (this.isMouseDown) {
                this.currentShade = previewShade;
                this.updatePlayerCircle(this.currentShade, false);
            } else {
                this.updatePlayerCircle(previewShade, true);
            }
        };

        const handleSpectrumClick = (e) => {
            const rect = spectrum.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const boundedX = Math.max(0, Math.min(x, rect.width - 1));
            const percentage = boundedX / (rect.width - 1);
            this.currentShade = Math.round(percentage * 255);
            this.updatePlayerCircle(this.currentShade, false);
            this.checkGuess(this.currentShade);
        };

        const handleSpectrumLeave = () => {
            if (!this.isMouseDown) {
                this.updatePlayerCircle(this.currentShade, false);
                this.isPreviewing = false;
            }
        };

        const handleKeyDown = (e) => {
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
                    this.checkGuess(this.currentShade);
                    return;
                default:
                    return;
            }

            if (newShade !== this.currentShade) {
                this.currentShade = newShade;
                this.updatePlayerCircle(this.currentShade);
            }
        };

        spectrum.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);
        spectrum.addEventListener('mousemove', handleSpectrumMove);
        spectrum.addEventListener('mouseleave', handleSpectrumLeave);
        spectrum.addEventListener('click', handleSpectrumClick);
        document.addEventListener('keydown', handleKeyDown);

        // Store handlers for cleanup
        this._spectrumHandlers = {
            mousedown: handleMouseDown,
            mouseup: handleMouseUp,
            mousemove: handleSpectrumMove,
            mouseleave: handleSpectrumLeave,
            click: handleSpectrumClick,
            keydown: handleKeyDown
        };
    }

    disableSpectrum() {
        const spectrum = this.container.querySelector('#spectrum');
        if (!spectrum || !this._spectrumHandlers) return;

        spectrum.removeEventListener('mousedown', this._spectrumHandlers.mousedown);
        document.removeEventListener('mouseup', this._spectrumHandlers.mouseup);
        spectrum.removeEventListener('mousemove', this._spectrumHandlers.mousemove);
        spectrum.removeEventListener('mouseleave', this._spectrumHandlers.mouseleave);
        spectrum.removeEventListener('click', this._spectrumHandlers.click);
        document.removeEventListener('keydown', this._spectrumHandlers.keydown);

        this._spectrumHandlers = null;
    }

    showInterlude(text) {
        const interludeText = this.container.querySelector('#interlude-text');
        if (interludeText) {
            interludeText.textContent = text;
        }
    }
}

