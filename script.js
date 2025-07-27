document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const gameModeSelection = document.getElementById('game-mode-selection');
    const pvpButton = document.getElementById('pvp-button');
    const pvaButton = document.getElementById('pva-button');
    const gameArea = document.getElementById('game-area');
    const gameBoard = document.getElementById('game-board');
    const statusDisplay = document.getElementById('status-display');
    const restartButton = document.getElementById('restart-button');

    // --- Game State Variables ---
    let gameMode = ''; // 'pvp' or 'pva'
    let gameActive = false;
    let currentPlayer = 'X';
    let gameState = ["", "", "", "", "", "", "", "", ""];
    const humanPlayer = 'X';
    const aiPlayer = 'O';

    // --- Constants ---
    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    // Messages updated to fit the cosmic theme
    const winningMessage = () => gameMode === 'pva' && currentPlayer === aiPlayer ? `AI Dominates!` : `Player ${currentPlayer} Victorious!`;
    const drawMessage = `Cosmic Stalemate!`;
    const currentPlayerTurn = () => gameMode === 'pva' && currentPlayer === humanPlayer ? "Your Turn, Commander!" : `Player ${currentPlayer}'s Turn`;

    // --- Event Listeners ---
    pvpButton.addEventListener('click', () => startGame('pvp'));
    pvaButton.addEventListener('click', () => startGame('pva'));
    restartButton.addEventListener('click', handleRestartGame);

    /**
     * Starts the game in the selected mode.
     * @param {string} mode - The selected game mode ('pvp' or 'pva').
     */
    function startGame(mode) {
        gameMode = mode;
        gameActive = true;
        gameModeSelection.classList.add('hidden');
        gameArea.classList.remove('hidden');
        statusDisplay.textContent = currentPlayerTurn();
        initializeBoard();
    }

    /**
     * Initializes or resets the game board by creating the cells.
     */
    function initializeBoard() {
        gameBoard.innerHTML = ''; // Clear previous board
        gameState = ["", "", "", "", "", "", "", "", ""];
        currentPlayer = 'X';
        gameActive = true;
        statusDisplay.textContent = currentPlayerTurn();

        gameState.forEach((_, index) => {
            const cell = document.createElement('div');
            cell.classList.add('cell'); // Add base cell class
            cell.dataset.cellIndex = index;
            gameBoard.appendChild(cell);
        });
        addCellListeners();
    }

    /**
     * Handles a click on any of the game cells.
     * @param {MouseEvent} clickedCellEvent - The click event from the cell.
     */
    function handleCellClick(clickedCellEvent) {
        const clickedCell = clickedCellEvent.target;
        const clickedCellIndex = parseInt(clickedCell.dataset.cellIndex);

        if (gameState[clickedCellIndex] !== "" || !gameActive || (gameMode === 'pva' && currentPlayer === aiPlayer)) {
            return;
        }

        handleCellPlayed(clickedCell, clickedCellIndex);
        if (handleResultValidation()) return;

        if (gameMode === 'pva') {
            handlePlayerChange(); // Switch to AI's turn
            // Add a slight delay for AI move to make it feel more natural
            setTimeout(handleAiMove, 700); 
        } else {
            handlePlayerChange();
        }
    }

    /**
     * Updates the game state and UI for a played cell.
     * @param {HTMLElement} clickedCell - The cell element that was clicked.
     * @param {number} clickedCellIndex - The index of the clicked cell.
     */
    function handleCellPlayed(clickedCell, clickedCellIndex) {
        gameState[clickedCellIndex] = currentPlayer;
        clickedCell.textContent = currentPlayer;
        clickedCell.classList.add(currentPlayer.toLowerCase()); // 'x' or 'o' class for styling
    }

    /**
     * Checks for a win or a draw after each move.
     * @returns {boolean} - True if the game has ended, false otherwise.
     */
    function handleResultValidation() {
        let roundWon = false;
        let winningCombo = [];

        for (let i = 0; i < winningConditions.length; i++) {
            const winCondition = winningConditions[i];
            const a = gameState[winCondition[0]];
            const b = gameState[winCondition[1]];
            const c = gameState[winCondition[2]];
            if (a === '' || b === '' || c === '') continue;
            if (a === b && b === c) {
                roundWon = true;
                winningCombo = winCondition;
                break;
            }
        }

        if (roundWon) {
            statusDisplay.textContent = winningMessage();
            gameActive = false;
            highlightWinningCells(winningCombo);
            return true;
        }

        const roundDraw = !gameState.includes("");
        if (roundDraw) {
            statusDisplay.textContent = drawMessage;
            gameActive = false;
            return true;
        }
        return false;
    }
    
    /**
     * Adds a 'win' class to the winning cells for animation.
     * @param {number[]} winningCombo - An array of indices of the winning cells.
     */
    function highlightWinningCells(winningCombo) {
        winningCombo.forEach(index => {
            gameBoard.children[index].classList.add('win');
        });
    }

    /**
     * Switches the current player.
     */
    function handlePlayerChange() {
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        statusDisplay.textContent = currentPlayerTurn();
    }

    /**
     * Restarts the game.
     */
    function handleRestartGame() {
        // Hide game area and show mode selection
        gameArea.classList.add('hidden');
        gameModeSelection.classList.remove('hidden');
        // Reset game state for a fresh start
        gameActive = false;
        gameMode = '';
        gameState = ["", "", "", "", "", "", "", "", ""];
        currentPlayer = 'X';
        statusDisplay.textContent = ''; // Clear status
        gameBoard.innerHTML = ''; // Clear cells
    }
    
    /**
     * Attaches click listeners to all game cells.
     */
    function addCellListeners() {
         document.querySelectorAll('.cell').forEach(cell => {
            cell.addEventListener('click', handleCellClick);
        });
    }

    // --- AI Logic (Minimax Algorithm) ---

    /**
     * Handles the AI's turn to make a move.
     */
    function handleAiMove() {
        if (!gameActive) return;
        const bestMove = findBestMove(gameState);
        if (bestMove.index !== -1) { // Ensure a valid move was found
            const cell = gameBoard.children[bestMove.index];
            handleCellPlayed(cell, bestMove.index);
            if (handleResultValidation()) return;
            handlePlayerChange(); // Switch back to human's turn
        }
    }

    /**
     * Finds the best move for the AI using the minimax algorithm.
     * @param {string[]} board - The current game state.
     * @returns {object} - An object containing the index of the best move.
     */
    function findBestMove(board) {
        let bestVal = -Infinity;
        let bestMove = { index: -1 };

        for (let i = 0; i < board.length; i++) {
            // Check if cell is empty
            if (board[i] === "") {
                board[i] = aiPlayer; // Make the move
                let moveVal = minimax(board, 0, false); // Evaluate this move
                board[i] = ""; // Undo the move

                // If the current move is better than the best value found so far, update
                if (moveVal > bestVal) {
                    bestMove.index = i;
                    bestVal = moveVal;
                }
            }
        }
        return bestMove;
    }

    /**
     * The minimax algorithm to determine the optimal move.
     * @param {string[]} board - The current game state.
     * @param {number} depth - The current depth of the recursion.
     * @param {boolean} isMax - True if maximizing player (AI), false if minimizing (Human).
     * @returns {number} - The score of the board state.
     */
    function minimax(board, depth, isMax) {
        const score = evaluateBoard(board);

        // Base cases: If maximizer or minimizer has won, return their score
        if (score === 10) return score - depth; // AI wins, prefer shallower wins
        if (score === -10) return score + depth; // Human wins, prefer shallower losses

        // If no moves left and no winner, it's a draw
        if (!board.includes("")) return 0;

        if (isMax) { // AI's turn (Maximizer)
            let best = -Infinity;
            for (let i = 0; i < board.length; i++) {
                if (board[i] === "") {
                    board[i] = aiPlayer;
                    best = Math.max(best, minimax(board, depth + 1, !isMax));
                    board[i] = ""; // Undo the move
                }
            }
            return best;
        } else { // Human's turn (Minimizer)
            let best = Infinity;
            for (let i = 0; i < board.length; i++) {
                if (board[i] === "") {
                    board[i] = humanPlayer;
                    best = Math.min(best, minimax(board, depth + 1, !isMax));
                    board[i] = ""; // Undo the move
                }
            }
            return best;
        }
    }

    /**
     * Evaluates the board and returns a score.
     * +10 for AI win, -10 for Human win, 0 for no winner yet.
     * @param {string[]} b - The current game state.
     * @returns {number} - The score.
     */
    function evaluateBoard(b) {
        for (let i = 0; i < winningConditions.length; i++) {
            const [x, y, z] = winningConditions[i];
            if (b[x] && b[x] === b[y] && b[y] === b[z]) {
                if (b[x] === aiPlayer) return 10;
                if (b[x] === humanPlayer) return -10;
            }
        }
        return 0; // No winner
    }
});
