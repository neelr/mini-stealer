// Crossword game logic
class CrosswordGame {
    constructor(crosswordData) {
        this.data = crosswordData;
        this.grid = [];
        this.userGrid = [];
        this.selectedCell = null;
        this.selectedDirection = 0; // 0 = across, 1 = down
        this.selectedWord = null;
        this.timerInterval = null;
        this.startTime = null;
        this.elapsedTime = 0;
        this.isComplete = false;

        this.init();
    }

    init() {
        this.setupGrid();
        this.renderGrid();
        this.renderClues();
        this.attachEventListeners();
    }

    setupGrid() {
        const [width, height] = this.data.size;

        // Initialize empty grids
        this.grid = Array(height).fill(null).map(() => Array(width).fill(null));
        this.userGrid = Array(height).fill(null).map(() => Array(width).fill(''));

        // Mark black squares
        this.data.black.forEach(([x, y]) => {
            this.grid[y][x] = '#';
        });

        // Fill in the solution grid and assign numbers
        this.data.words.forEach(word => {
            const [number, x, y, dir, answer, clue] = word;

            // Place the number at the start cell
            if (this.grid[y][x] !== '#') {
                if (!this.grid[y][x]) {
                    this.grid[y][x] = { number: number, letter: null };
                }
                this.grid[y][x].number = number;
            }

            // Fill in the answer letters
            for (let i = 0; i < answer.length; i++) {
                const cx = dir === 0 ? x + i : x;
                const cy = dir === 1 ? y + i : y;

                // Check bounds
                if (cx >= this.data.size[0] || cy >= this.data.size[1]) {
                    console.warn(`Word ${number} "${answer}" goes out of bounds at position (${cx}, ${cy})`);
                    continue;
                }

                if (!this.grid[cy][cx] || this.grid[cy][cx] === '#') {
                    this.grid[cy][cx] = { number: null, letter: answer[i] };
                } else {
                    this.grid[cy][cx].letter = answer[i];
                }
            }
        });
    }

    renderGrid() {
        const gridElement = document.getElementById('grid');
        const [width, height] = this.data.size;

        gridElement.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
        gridElement.innerHTML = '';

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;

                if (this.grid[y][x] === '#') {
                    cell.classList.add('black');
                } else {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.maxLength = 1;
                    input.value = this.userGrid[y][x];
                    input.dataset.x = x;
                    input.dataset.y = y;

                    cell.appendChild(input);

                    if (this.grid[y][x]?.number) {
                        const numberLabel = document.createElement('div');
                        numberLabel.className = 'cell-number';
                        numberLabel.textContent = this.grid[y][x].number;
                        cell.appendChild(numberLabel);
                    }
                }

                gridElement.appendChild(cell);
            }
        }
    }

    renderClues() {
        const acrossClues = document.getElementById('across-clues');
        const downClues = document.getElementById('down-clues');

        acrossClues.innerHTML = '';
        downClues.innerHTML = '';

        this.data.words.forEach(word => {
            const [number, x, y, dir, answer, clue] = word;
            const clueElement = document.createElement('div');
            clueElement.className = 'clue';
            clueElement.dataset.number = number;
            clueElement.dataset.direction = dir;
            clueElement.dataset.x = x;
            clueElement.dataset.y = y;

            clueElement.innerHTML = `<span class="clue-number">${number}</span> ${clue}`;

            if (dir === 0) {
                acrossClues.appendChild(clueElement);
            } else {
                downClues.appendChild(clueElement);
            }
        });
    }

    attachEventListeners() {
        // Grid cell clicks
        document.querySelectorAll('.cell input').forEach(input => {
            input.addEventListener('click', (e) => {
                this.selectCell(parseInt(e.target.dataset.x), parseInt(e.target.dataset.y));
            });

            input.addEventListener('dblclick', (e) => {
                this.toggleDirection();
            });

            input.addEventListener('input', (e) => {
                this.handleInput(e);
            });

            input.addEventListener('keydown', (e) => {
                this.handleKeydown(e);
            });

            // Select all text on focus so any new key replaces it
            input.addEventListener('focus', (e) => {
                e.target.select();
            });

            // Re-select text if user clicks in the input
            input.addEventListener('mouseup', (e) => {
                e.preventDefault();
                e.target.select();
            });
        });

        // Clue clicks
        document.querySelectorAll('.clue').forEach(clue => {
            clue.addEventListener('click', (e) => {
                const x = parseInt(clue.dataset.x);
                const y = parseInt(clue.dataset.y);
                const dir = parseInt(clue.dataset.direction);
                this.selectedDirection = dir;
                this.selectCell(x, y);
            });
        });

        // Control buttons
        document.getElementById('check-btn').addEventListener('click', () => this.checkAnswers());
        document.getElementById('reveal-btn').addEventListener('click', () => this.revealAnswers());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearGrid());
        document.getElementById('share-btn').addEventListener('click', () => this.share());
        document.getElementById('start-timer-btn').addEventListener('click', () => this.startGame());
    }

    selectCell(x, y) {
        if (this.grid[y][x] === '#') return;

        // Clear previous selection
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected', 'highlighted');
        });
        document.querySelectorAll('.clue').forEach(clue => {
            clue.classList.remove('selected');
        });

        this.selectedCell = { x, y };

        // Highlight selected cell
        const selectedCellElement = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (selectedCellElement) {
            selectedCellElement.classList.add('selected');
            const input = selectedCellElement.querySelector('input');
            if (input) input.focus();
        }

        // Find and highlight the current word
        this.highlightWord(x, y);
    }

    highlightWord(x, y) {
        const word = this.findWord(x, y, this.selectedDirection);
        if (!word) return;

        this.selectedWord = word;
        const [number, wx, wy, dir, answer] = word;

        // Highlight cells in the word
        for (let i = 0; i < answer.length; i++) {
            const cx = dir === 0 ? wx + i : wx;
            const cy = dir === 1 ? wy + i : wy;
            const cell = document.querySelector(`.cell[data-x="${cx}"][data-y="${cy}"]`);
            if (cell && !cell.classList.contains('selected')) {
                cell.classList.add('highlighted');
            }
        }

        // Highlight corresponding clue
        const clue = document.querySelector(`.clue[data-number="${number}"][data-direction="${dir}"]`);
        if (clue) clue.classList.add('selected');
    }

    findWord(x, y, preferredDir = null) {
        const words = this.data.words.filter(word => {
            const [, wx, wy, dir, answer] = word;
            if (preferredDir !== null && dir !== preferredDir) return false;

            if (dir === 0) { // Across
                return y === wy && x >= wx && x < wx + answer.length;
            } else { // Down
                return x === wx && y >= wy && y < wy + answer.length;
            }
        });

        if (words.length > 0) {
            return words[0];
        } else if (preferredDir !== null) {
            // Try the other direction if no word found in preferred direction
            return this.findWord(x, y, 1 - preferredDir);
        }
        return null;
    }

    handleInput(e) {
        const x = parseInt(e.target.dataset.x);
        const y = parseInt(e.target.dataset.y);
        const value = e.target.value.toUpperCase();

        this.userGrid[y][x] = value;
        e.target.value = value;

        // Auto-advance to next cell
        if (value && this.selectedWord) {
            this.advanceToNextCell();
        }

        // Check if puzzle is complete
        if (this.checkComplete()) {
            this.handleCompletion();
        }
    }

    handleKeydown(e) {
        const x = parseInt(e.target.dataset.x);
        const y = parseInt(e.target.dataset.y);

        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.moveSelection(x, y - 1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.moveSelection(x, y + 1);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.moveSelection(x - 1, y);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.moveSelection(x + 1, y);
                break;
            case 'Tab':
                e.preventDefault();
                this.toggleDirection();
                break;
            case 'Backspace':
                if (!e.target.value && this.selectedWord) {
                    e.preventDefault();
                    this.moveToPreviousCell();
                }
                break;
            case ' ':
                e.preventDefault();
                this.toggleDirection();
                break;
            case 'Enter':
                e.preventDefault();
                this.moveToNextRow(x, y);
                break;
        }
    }

    moveSelection(x, y) {
        const [width, height] = this.data.size;
        if (x >= 0 && x < width && y >= 0 && y < height && this.grid[y][x] !== '#') {
            this.selectCell(x, y);
        }
    }

    moveToNextRow(x, y) {
        const [width, height] = this.data.size;
        let nextY = y + 1;

        // Find the next row with a valid cell
        while (nextY < height) {
            // Try to find a cell in this row, starting from the leftmost position
            for (let nextX = 0; nextX < width; nextX++) {
                if (this.grid[nextY][nextX] !== '#' && this.grid[nextY][nextX] !== null) {
                    this.selectCell(nextX, nextY);
                    return;
                }
            }
            nextY++;
        }

        // If no next row found, wrap to the first row
        for (let wrapY = 0; wrapY <= y; wrapY++) {
            for (let wrapX = 0; wrapX < width; wrapX++) {
                if (this.grid[wrapY][wrapX] !== '#' && this.grid[wrapY][wrapX] !== null) {
                    this.selectCell(wrapX, wrapY);
                    return;
                }
            }
        }
    }

    advanceToNextCell() {
        if (!this.selectedWord || !this.selectedCell) return;

        const [, wx, wy, dir, answer] = this.selectedWord;
        const currentIndex = dir === 0
            ? this.selectedCell.x - wx
            : this.selectedCell.y - wy;

        if (currentIndex < answer.length - 1) {
            const nextX = dir === 0 ? this.selectedCell.x + 1 : this.selectedCell.x;
            const nextY = dir === 1 ? this.selectedCell.y + 1 : this.selectedCell.y;
            this.selectCell(nextX, nextY);
        }
    }

    moveToPreviousCell() {
        if (!this.selectedWord || !this.selectedCell) return;

        const [, wx, wy, dir] = this.selectedWord;
        const currentIndex = dir === 0
            ? this.selectedCell.x - wx
            : this.selectedCell.y - wy;

        if (currentIndex > 0) {
            const prevX = dir === 0 ? this.selectedCell.x - 1 : this.selectedCell.x;
            const prevY = dir === 1 ? this.selectedCell.y - 1 : this.selectedCell.y;
            this.selectCell(prevX, prevY);
        }
    }

    toggleDirection() {
        this.selectedDirection = 1 - this.selectedDirection;
        if (this.selectedCell) {
            this.selectCell(this.selectedCell.x, this.selectedCell.y);
        }
    }

    checkAnswers() {
        let hasErrors = false;
        const [width, height] = this.data.size;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (this.grid[y][x] !== '#' && this.grid[y][x]?.letter) {
                    const input = document.querySelector(`input[data-x="${x}"][data-y="${y}"]`);
                    if (!input) continue;
                    const cell = input.parentElement;

                    if (this.userGrid[y][x] === this.grid[y][x].letter) {
                        cell.classList.add('correct');
                        setTimeout(() => cell.classList.remove('correct'), 500);
                    } else if (this.userGrid[y][x]) {
                        cell.classList.add('incorrect');
                        setTimeout(() => cell.classList.remove('incorrect'), 300);
                        hasErrors = true;
                    }
                }
            }
        }
    }

    revealAnswers() {
        const [width, height] = this.data.size;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (this.grid[y][x] !== '#' && this.grid[y][x]?.letter) {
                    this.userGrid[y][x] = this.grid[y][x].letter;
                    const input = document.querySelector(`input[data-x="${x}"][data-y="${y}"]`);
                    if (input) input.value = this.grid[y][x].letter;
                }
            }
        }

        // Treat reveal as completion
        this.handleCompletion();
    }

    clearGrid() {
        const [width, height] = this.data.size;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (this.grid[y][x] !== '#') {
                    this.userGrid[y][x] = '';
                    const input = document.querySelector(`input[data-x="${x}"][data-y="${y}"]`);
                    if (input) input.value = '';
                }
            }
        }

        this.stopTimer();
        this.startTime = null;
        document.getElementById('timer').textContent = '0:00';
    }

    checkComplete() {
        const [width, height] = this.data.size;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (this.grid[y][x] !== '#' && this.grid[y][x]?.letter) {
                    if (this.userGrid[y][x] !== this.grid[y][x].letter) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    handleCompletion() {
        if (this.isComplete) return;
        this.isComplete = true;

        this.stopTimer();

        // Play completion sound
        const audio = new Audio('boop.mp3');
        audio.play().catch(e => console.log('Could not play sound:', e));

        const modal = document.getElementById('completion-modal');
        const finalTime = document.getElementById('final-time');
        const shareText = document.getElementById('share-text');

        const timeText = this.formatTime(this.elapsedTime);
        finalTime.textContent = timeText;

        // Generate share link
        const shareData = {
            puzzle: this.data,
            time: this.elapsedTime
        };
        const encoded = btoa(JSON.stringify(shareData));
        // Add dashes every 10 characters
        const encodedWithDashes = encoded.match(/.{1,10}/g).join('-');
        const url = `${window.location.origin}${window.location.pathname}?data=${encodedWithDashes}`;

        // Set the share text
        shareText.value = `I completed the mini (hacked) in ${timeText} :o\ndo it @ ${url}`;

        modal.classList.add('show');
    }

    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
            document.getElementById('timer').textContent = this.formatTime(this.elapsedTime);
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    share() {
        // Get the text from the textarea
        const shareText = document.getElementById('share-text').value;

        // Copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            // Change button text temporarily
            const shareBtn = document.getElementById('share-btn');
            const originalText = shareBtn.textContent;
            shareBtn.textContent = 'Copied!';
            setTimeout(() => {
                shareBtn.textContent = originalText;
            }, 2000);
        }).catch(() => {
            prompt('Copy this text to share:', shareText);
        });
    }

    startGame() {
        document.getElementById('start-modal').classList.remove('show');
        this.startTimer();
    }
}

// Initialize the game
let game;

// Check for shared puzzle in URL
const urlParams = new URLSearchParams(window.location.search);
const sharedData = urlParams.get('data');

if (sharedData) {
    try {
        // Remove all dashes first
        const withoutDashes = sharedData.replace(/-/g, '');
        // Decode URL encoding, then base64
        const urlDecoded = decodeURIComponent(withoutDashes);
        const decoded = JSON.parse(atob(urlDecoded));
        game = new CrosswordGame(decoded.puzzle);
        if (decoded.time) {
            // Show the time to beat
            console.log(`Time to beat: ${Math.floor(decoded.time / 60)}:${(decoded.time % 60).toString().padStart(2, '0')}`);
        }
    } catch (e) {
        console.error('Invalid share data:', e);
        game = new CrosswordGame(sampleCrossword);
    }
} else {
    game = new CrosswordGame(sampleCrossword);
}