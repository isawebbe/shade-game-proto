# Vite Integrated Game - Complete Guide

A beginner-friendly guide to understanding and extending your integrated narrative and shade-matching game.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Understanding the Project Structure](#understanding-the-project-structure)
3. [How the Game Works](#how-the-game-works)
4. [Extending Your Game](#extending-your-game)
5. [Common Tasks](#common-tasks)
6. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Installation

1. **Open your terminal** (Command Prompt on Windows, Terminal on Mac/Linux)

2. **Navigate to the project folder**:
   ```bash
   cd vite-integrated-game
   ```

3. **Install the required packages**:
   ```bash
   npm install
   ```
   This downloads all the code libraries your game needs (like Vite and Mustache).

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and go to `http://localhost:3000`

   You should see your game's title screen! The server will automatically reload when you make changes to your code.

### What is Vite?

Vite is a tool that:
- Runs your game in a web browser during development
- Automatically refreshes the page when you save changes
- Helps organize your code into modules
- Builds your game for production when you're ready to share it

You don't need to understand how Vite works to use it - just run `npm run dev` and it handles everything!

---

## Understanding the Project Structure

Here's what each file and folder does:

```
vite-integrated-game/
├── index.html              # The main webpage - this is what loads first
├── package.json            # Lists all the tools your game needs
├── vite.config.js          # Settings for Vite (you usually don't need to change this)
├── templates/              # HTML templates for different screens
│   ├── title.mustache      # The title/start screen
│   ├── narrative.mustache # The narrative game screen
│   ├── shade-game.mustache # The shade matching game screen
│   └── interlude.mustache  # Transition screens between games
└── src/                    # All your game code goes here
    ├── main.js             # The "conductor" - controls which screen shows when
    ├── state/
    │   └── gameState.js    # Remembers player progress, scores, etc.
    ├── narrative/
    │   ├── NarrativeGame.js    # Handles narrative game logic
    │   └── gameContent.js      # All your story text and choices
    ├── shade/
    │   └── ShadeGame.js     # Handles shade matching game logic
    └── styles/
        └── main.css         # All the visual styling (colors, fonts, layout)
```

### Key Files Explained

#### `index.html`
This is the entry point. It's a simple HTML file that loads your JavaScript code. You rarely need to edit this.

#### `src/main.js` - The Game Orchestrator
Think of this as the "conductor" of an orchestra. It:
- Decides which screen to show (title, narrative, shade game, etc.)
- Handles transitions between screens
- Connects the narrative game and shade game together

**Example**: When you click "Begin Your Journey", `main.js` tells the game to show the narrative screen.

#### `src/state/gameState.js` - The Memory
This file stores all the information about the current game:
- What round you're on
- Your redemption rate (score)
- Which game mode you're in (narrative or shade)
- Previous choices you made

**Think of it like**: A notebook that remembers everything about the player's progress.

#### `src/narrative/gameContent.js` - Your Story
This is where all your story text lives! Every narrative, every choice option, every consequence.

**This is the file you'll edit most** when adding new story content.

#### `src/narrative/NarrativeGame.js` - Narrative Logic
This handles:
- Displaying story text
- Showing choice buttons
- Processing player choices
- Updating the redemption rate

**You'll edit this** if you want to change how choices work or add new features to the narrative game.

#### `src/shade/ShadeGame.js` - Shade Matching Logic
This handles:
- The shade matching mini-game
- Checking if the player matched the shade correctly
- Managing attempts and failures

**You'll edit this** if you want to change difficulty, add new options, or modify the shade game mechanics.

#### `templates/*.mustache` - Screen Layouts
These files define what each screen looks like. They use Mustache syntax (like `{{title}}`) to insert dynamic content.

**You'll edit these** if you want to change the layout or add new elements to screens.

#### `src/styles/main.css` - Visual Styling
This controls how everything looks:
- Colors
- Fonts
- Sizes
- Spacing
- Animations

**You'll edit this** to change the game's appearance.

---

## How the Game Works

### The Game Flow

1. **Title Screen** → Player clicks "Begin Your Journey"
2. **Narrative Round 1** → Player reads story and makes a choice
3. **Shade Game** → Player matches a shade
4. **Narrative Round 2** → Player reads story and makes a choice
5. **Shade Game** → Player matches a shade
6. ...continues alternating...
7. **Final Rounds (37-38)** → Special ending content

### How Screens Transition

The `main.js` file uses a class called `GameOrchestrator` that manages everything:

```javascript
// When player clicks "Begin Your Journey"
startGame() {
    // 1. Load the narrative template
    this.app.innerHTML = narrativeTemplate;

    // 2. Create a new NarrativeGame instance
    this.narrativeGame = new NarrativeGame(this.app);

    // 3. Set up what happens when player makes choices
    this.narrativeGame.onNextRound = () => this.handleNarrativeNext();

    // 4. Show the first narrative screen
    this.showNarrativeScreen();
}
```

### How Choices Affect the Game

When a player makes a choice in the narrative game:

1. `NarrativeGame.js` receives the choice (A, B, or C)
2. It updates `gameState.redemptionRate` based on the choice:
   - Choice A: Increases redemption rate by 15%
   - Choice B: Decreases redemption rate by 5%
   - Choice C: Decreases redemption rate by 10%
3. The consequence text is shown
4. Player clicks "Continue"
5. The game moves to the next round

### How the Shade Game Works

1. Player sees story text
2. Player chooses an option (A, B, or C) - each has different difficulty
3. A target shade is generated based on the option
4. Player uses the spectrum to match the shade
5. If correct: Win! Move to interlude
6. If wrong: Lose an attempt, try again (or lose if out of attempts)

---

## Extending Your Game

### Adding New Narrative Content

#### Step 1: Open `src/narrative/gameContent.js`

Find the `narratives` object. It looks like this:

```javascript
narratives: {
    1: {
        default: "Your story text here...",
        options: {
            A: "Choice A text",
            C: "Choice C text"
        },
        consequences: {
            A: "What happens if player chooses A",
            C: "What happens if player chooses C"
        }
    },
    2: {
        X: {
            text: "Story text for variant X",
            options: { ... },
            consequences: { ... }
        },
        Y: {
            text: "Story text for variant Y",
            options: { ... },
            consequences: { ... }
        }
    }
}
```

#### Step 2: Add a New Round

Let's say you want to add Round 7. Find where round 6 ends and add:

```javascript
7: {
    X: {
        text: "You find yourself at a crossroads. Two paths stretch before you.",
        options: {
            A: "Take the left path",
            B: "Take the right path",
            C: "Stay where you are"
        },
        consequences: {
            A: "The left path leads to a beautiful garden. You feel a sense of peace.",
            B: "The right path is dark and foreboding. You hear strange sounds.",
            C: "You remain at the crossroads, uncertain of which way to go."
        }
    },
    Y: {
        text: "You find yourself at a crossroads. The paths seem to shift and change.",
        options: {
            A: "Take the left path",
            B: "Take the right path",
            C: "Stay where you are"
        },
        consequences: {
            A: "The path crumbles beneath your feet. You must find another way.",
            B: "The path leads deeper into darkness. You feel lost.",
            C: "The crossroads itself begins to fade. You must choose quickly."
        }
    }
}
```

**Understanding Variants (X, Y, W, Z):**
- **W**: Shown when redemption rate is 75-100% (high)
- **X**: Shown when redemption rate is 50-74% (medium-high)
- **Y**: Shown when redemption rate is 25-49% (medium-low)
- **Z**: Shown when redemption rate is 0-24% (low)

This lets you show different story content based on how the player has been playing!

#### Step 3: Save and Test

Save the file. If your dev server is running (`npm run dev`), the page will automatically reload. Test your new round!

### Adding More Rounds to the Shade Game

The shade game uses a simple system. Currently, it shows generic text like "Round 1: The light waits."

To customize shade game stories:

1. **Open `src/shade/ShadeGame.js`**

2. **Find the `showStory` method** (around line 30):

```javascript
showStory(round) {
    const storyText = this.container.querySelector('#story-text');
    if (storyText) {
        storyText.textContent = `Round ${round}: The light waits.`;
    }
}
```

3. **Create a stories object** at the top of the file:

```javascript
const SHADE_STORIES = {
    1: "The first shade appears before you. Can you match its subtle gray?",
    2: "A darker challenge awaits. The shadows grow deeper.",
    3: "Light and dark dance together. Find the balance.",
    // Add more as needed
};
```

4. **Update the `showStory` method**:

```javascript
showStory(round) {
    const storyText = this.container.querySelector('#story-text');
    if (storyText) {
        // Use custom story if available, otherwise use default
        const story = SHADE_STORIES[round] || `Round ${round}: The light waits.`;
        storyText.textContent = story;
    }
}
```

### Changing Choice Effects

Want to change how choices affect the redemption rate?

1. **Open `src/narrative/NarrativeGame.js`**

2. **Find the `selectOption` method** (around line 64):

```javascript
selectOption(option) {
    // ... existing code ...

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
    }
}
```

3. **Modify the numbers**:
   - `1.15` means "multiply by 1.15" (15% increase)
   - `0.95` means "multiply by 0.95" (5% decrease)
   - `Math.min(100, ...)` ensures it never goes above 100
   - `Math.max(0, ...)` ensures it never goes below 0

**Example**: To make choice A give a 25% increase:
```javascript
case 'A':
    gameState.redemptionRate = Math.min(100, Math.round(gameState.redemptionRate * 1.25));
    break;
```

### Changing Shade Game Difficulty

1. **Open `src/shade/ShadeGame.js`**

2. **Find the `TOLERANCE` constant** at the top:

```javascript
const TOLERANCE = { a: 10, b: 10, c: 20 };
```

This means:
- Option A: Player must be within 10 shades of the target
- Option B: Player must be within 10 shades of the target
- Option C: Player must be within 20 shades of the target (easier)

**To make it easier**: Increase the numbers (e.g., `{ a: 15, b: 15, c: 25 }`)
**To make it harder**: Decrease the numbers (e.g., `{ a: 5, b: 5, c: 10 }`)

3. **Find the `attempts` in `gameState.js`**:

```javascript
attempts: { a: 3, b: 3, c: Infinity }
```

This controls how many tries the player gets:
- Option A: 3 attempts
- Option B: 3 attempts
- Option C: Infinite attempts

**To change attempts**: Modify the numbers (e.g., `{ a: 5, b: 5, c: Infinity }`)

### Changing Visual Styling

#### Changing Colors

1. **Open `src/styles/main.css`**

2. **Find the `:root` section** at the top:

```css
:root {
    --primary-color: #333333;      /* Main text color */
    --secondary-color: #666666;    /* Button color */
    --accent-color: #999999;        /* Hover effects */
    --text-color: #333333;         /* Text color */
    --bg-color: #ffffff;           /* Background color */
}
```

3. **Change the color codes**:
   - `#333333` is dark gray
   - `#ffffff` is white
   - `#ff0000` is red
   - `#0000ff` is blue
   - Use a color picker tool online to find hex codes you like!

#### Changing Fonts

Find the `body` section:

```css
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    /* ... */
}
```

Change to any font you like:
- `'Times New Roman', serif` - Classic serif font
- `'Courier New', monospace` - Typewriter style
- `'Comic Sans MS', cursive` - Playful font
- Or use Google Fonts (see below)

#### Using Google Fonts

1. Go to [Google Fonts](https://fonts.google.com)
2. Pick a font you like
3. Copy the `<link>` tag they provide
4. Add it to `index.html` in the `<head>` section
5. Use the font name in your CSS

### Adding New Screens

Want to add a completely new screen type?

#### Step 1: Create a Template

Create a new file in `templates/`, e.g., `custom-screen.mustache`:

```html
<div id="custom-screen" class="screen hidden">
    <h2>{{title}}</h2>
    <p>{{message}}</p>
    <button id="custom-button" class="btn">Continue</button>
</div>
```

#### Step 2: Import and Use in `main.js`

1. **Add the import** at the top:
```javascript
import customScreenTemplate from '../templates/custom-screen.mustache?raw';
```

2. **Add a method to show it**:
```javascript
showCustomScreen(title, message) {
    const html = Mustache.render(customScreenTemplate, { title, message });
    this.app.innerHTML += html; // Append to existing content

    const button = this.app.querySelector('#custom-button');
    if (button) {
        button.onclick = () => {
            // Do something when button is clicked
            this.showNarrativeScreen();
        };
    }
}
```

3. **Call it from somewhere**:
```javascript
// In another method, when you want to show the custom screen:
this.showCustomScreen("Special Event", "Something important happened!");
```

---

## Common Tasks

### Task 1: Add a New Choice Option (D, E, etc.)

Currently, the game only uses A, B, and C. To add D:

1. **In `gameContent.js`**, add D to the options:
```javascript
options: {
    A: "Choice A",
    B: "Choice B",
    C: "Choice C",
    D: "New Choice D"  // Add this
}
```

2. **In `NarrativeGame.js`**, add handling for D in `selectOption`:
```javascript
case 'D':
    gameState.redemptionRate = Math.min(100, Math.round(gameState.redemptionRate * 1.10));
    break;
```

3. **In `gameContent.js`**, add a consequence for D:
```javascript
consequences: {
    A: "...",
    B: "...",
    C: "...",
    D: "You chose D. Here's what happens..."  // Add this
}
```

### Task 2: Change the Maximum Number of Rounds

1. **Open `src/state/gameState.js`**

2. **Find `maxRounds`**:
```javascript
maxRounds: 38,
```

3. **Change it to your desired number**:
```javascript
maxRounds: 50,  // Now the game has 50 rounds
```

4. **Update the score display** in `templates/narrative.mustache`:
```html
<div>Round: <span id="round-display">1</span>/50</div>
```

### Task 3: Add Sound Effects

1. **Add audio files** to a new `public/sounds/` folder

2. **In `NarrativeGame.js`**, add a method to play sounds:
```javascript
playSound(soundName) {
    const audio = new Audio(`/sounds/${soundName}.mp3`);
    audio.play().catch(err => console.log("Could not play sound:", err));
}
```

3. **Call it when needed**:
```javascript
selectOption(option) {
    this.playSound('choice-select');  // Play sound when choice is made
    // ... rest of the code
}
```

### Task 4: Add Save/Load Functionality

1. **Create a new file** `src/utils/saveGame.js`:
```javascript
export function saveGame() {
    const saveData = {
        currentRound: gameState.currentRound,
        redemptionRate: gameState.redemptionRate,
        previousChoice: gameState.previousChoice
    };
    localStorage.setItem('gameSave', JSON.stringify(saveData));
}

export function loadGame() {
    const saveData = localStorage.getItem('gameSave');
    if (saveData) {
        const data = JSON.parse(saveData);
        gameState.currentRound = data.currentRound;
        gameState.redemptionRate = data.redemptionRate;
        gameState.previousChoice = data.previousChoice;
        return true;
    }
    return false;
}
```

2. **Import and use in `main.js`**:
```javascript
import { saveGame, loadGame } from './utils/saveGame.js';

// Save when player makes a choice
// Load when game starts
```

---

## Troubleshooting

### Problem: "Cannot find module" error

**Solution**: Make sure you ran `npm install` in the project folder.

### Problem: Changes aren't showing up

**Solutions**:
1. Make sure the dev server is running (`npm run dev`)
2. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
3. Check the browser console for errors (F12)

### Problem: Game won't start

**Solutions**:
1. Check the browser console (F12) for error messages
2. Make sure all your JavaScript files have proper syntax (no missing brackets, quotes, etc.)
3. Verify that template files exist in the `templates/` folder

### Problem: Choices aren't working

**Check**:
1. Are the option IDs correct in `NarrativeGame.js`?
2. Are the option keys (A, B, C) matching in `gameContent.js`?
3. Check the browser console for JavaScript errors

### Problem: Styling looks broken

**Solutions**:
1. Make sure `main.css` is linked in `index.html`
2. Check that CSS syntax is correct (every `{` has a matching `}`)
3. Clear browser cache

### Getting Help

If you're stuck:
1. **Check the browser console** (Press F12, look at the Console tab)
2. **Read error messages carefully** - they usually tell you what's wrong
3. **Check your code syntax** - missing commas, brackets, or quotes are common issues
4. **Compare with working code** - look at existing rounds that work and copy their structure

---

## Next Steps

Now that you understand the basics:

1. **Experiment**: Try making small changes and see what happens
2. **Add content**: Write your own story rounds
3. **Customize**: Change colors, fonts, and styling to match your vision
4. **Extend**: Add new features like save/load, sound effects, or new game modes

Remember: The best way to learn is by doing! Start with small changes and work your way up to bigger modifications.

Good luck with your game! 🎮
