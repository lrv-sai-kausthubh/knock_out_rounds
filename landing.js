// DOM Elements
const elements = {
    // Panels and containers
    setupPanel: document.getElementById('setup-panel'),
    tournamentView: document.getElementById('tournament-view'),
    matchPanel: document.getElementById('match-panel'),
    bracketContainer: document.getElementById('tournament-bracket'),
    playersList: document.getElementById('players'),
    
    // Inputs and counters
    tournamentNameInput: document.getElementById('tournament-name'),
    playerInput: document.getElementById('player-input'),
    playerCount: document.getElementById('player-count'),
    tournamentTitle: document.getElementById('tournament-title'),
    roundDisplay: document.getElementById('round-display'),
    
    // Buttons
    addPlayerBtn: document.getElementById('add-player'),
    startTournamentBtn: document.getElementById('start-tournament'),
    newTournamentBtn: document.getElementById('new-tournament'),
    saveTournamentBtn: document.getElementById('save-tournament'),
    prevRoundBtn: document.getElementById('prev-round'),
    nextRoundBtn: document.getElementById('next-round'),
    closeMatchBtn: document.getElementById('close-match-panel'),
    
    // Match display
    matchPlayer1: document.getElementById('match-player1'),
    matchPlayer2: document.getElementById('match-player2'),
    
    // Modal elements
    modal: document.getElementById('modal'),
    modalTitle: document.getElementById('modal-title'),
    modalBody: document.getElementById('modal-body'),
    modalConfirm: document.getElementById('modal-confirm'),
    modalCancel: document.getElementById('modal-cancel'),
    closeModal: document.querySelector('.close-modal'),

    // Add these new elements
    atcoderIdInput: document.getElementById('atcoder-id'),
    problemContainer: document.getElementById('problem-container'),
    problemLink: document.getElementById('problem-link'),

};

// Update the tournament object to include maxRounds and playerScores
const tournament = {
    name: '',
    players: [],
    rounds: [],
    currentRound: 0,
    winners: [],
    losers: [],
    activeMatch: null,
    maxRounds: 3, // Default to 3 rounds
    playerScores: {}, // Will track wins/losses for each player
    completed: false,
    allProblems: [],
};

// Event Listeners
function setupEventListeners() {
    // Setup panel listeners
    elements.addPlayerBtn.addEventListener('click', addPlayer);
    elements.playerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addPlayer();
    });
    elements.startTournamentBtn.addEventListener('click', startTournament);
    
    // Tournament controls
    elements.newTournamentBtn.addEventListener('click', confirmNewTournament);
    elements.saveTournamentBtn.addEventListener('click', saveTournament);
    elements.prevRoundBtn.addEventListener('click', showPreviousRound);
    elements.nextRoundBtn.addEventListener('click', showNextRound);

    // Add these elements to your elements object
    // Add this to the elements object near the top of the file
    elements.roundsInput = document.getElementById('rounds-input');
    elements.scoreboardPanel = document.getElementById('scoreboard-panel');
    elements.scoreboard = document.getElementById('scoreboard');
    elements.returnToTournamentBtn = document.getElementById('return-to-tournament');
    elements.newTournamentFromResultsBtn = document.getElementById('new-tournament-from-results');
    elements.returnToTournamentBtn.addEventListener('click', hideScoreboard);
    elements.newTournamentFromResultsBtn.addEventListener('click', confirmNewTournament);


    
    // Match panel
    elements.closeMatchBtn.addEventListener('click', closeMatchPanel);
    document.querySelectorAll('.win-btn').forEach(btn => {
        btn.addEventListener('click', markWinner);
    });
    
    // Modal
    elements.closeModal.addEventListener('click', () => hideModal());
    elements.modalCancel.addEventListener('click', () => hideModal());
    
    // Allow removing players
    elements.playersList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-player')) {
            const playerItem = e.target.closest('li');
            const playerIndex = Array.from(elements.playersList.children).indexOf(playerItem);
            removePlayer(playerIndex);
        }
    });
}

// Player Management Functions
// Update the addPlayer function to include AtCoder ID
function addPlayer() {
    const playerName = elements.playerInput.value.trim();
    const atcoderId = elements.atcoderIdInput.value.trim();
    
    if (playerName === '') {
        showMessage('Please enter a player name', 'warning');
        return;
    }
    
    if (atcoderId === '') {
        showMessage('Please enter an AtCoder ID', 'warning');
        return;
    }
    
    // Check if player name already exists
    if (tournament.players.some(p => p.name === playerName)) {
        showMessage('This player is already in the tournament', 'warning');
        return;
    }
    
    // Add player with AtCoder ID and empty unsolved problems array
    tournament.players.push({
        name: playerName,
        atcoderId: atcoderId,
        unsolvedProblems: []
    });
    
    updatePlayersList();
    elements.playerInput.value = '';
    elements.atcoderIdInput.value = '';
    elements.playerInput.focus();
}
// function addPlayer() {
//     const playerName = elements.playerInput.value.trim();
    
//     if (playerName === '') {
//         showMessage('Please enter a player name', 'warning');
//         return;
//     }
    
//     if (tournament.players.includes(playerName)) {
//         showMessage('This player is already in the tournament', 'warning');
//         return;
//     }
    
//     tournament.players.push(playerName);
//     updatePlayersList();
//     elements.playerInput.value = '';
//     elements.playerInput.focus();
// }

function removePlayer(index) {
    tournament.players.splice(index, 1);
    updatePlayersList();
}

function updatePlayersList() {
    elements.playersList.innerHTML = '';
    tournament.players.forEach(player => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <span>${player.name}</span>
                <small>(${player.atcoderId})</small>
            </div>
            <span class="remove-player"><i class="fas fa-times"></i></span>
        `;
        elements.playersList.appendChild(li);
    });
    
    elements.playerCount.textContent = `(${tournament.players.length})`;
    
    // Enable/disable start button based on player count
    if (tournament.players.length < 2) {
        elements.startTournamentBtn.disabled = true;
        elements.startTournamentBtn.classList.add('disabled');
    } else {
        elements.startTournamentBtn.disabled = false;
        elements.startTournamentBtn.classList.remove('disabled');
    }
}



// Add a function to fetch all problems
// Modified fetchAllProblems function to separate problems by difficulty
async function fetchAllProblems() {
    try {
        const response = await fetch('https://kenkoooo.com/atcoder/resources/merged-problems.json');
        if (!response.ok) {
            throw new Error('Failed to fetch problems from AtCoder API');
        }
        
        const allProblems = await response.json();
        
        // Categorize problems by difficulty
        const problemsByDifficulty = {
            a: [],
            b: []
        };
        
        allProblems.forEach(problem => {
            const id = problem.id.toLowerCase();
            if (id.startsWith('abc')) {
                if (id.endsWith('_a')) {
                    problemsByDifficulty.a.push(problem);
                } else if (id.endsWith('_b')) {
                    problemsByDifficulty.b.push(problem);
                }
            }
        });
        
        return problemsByDifficulty;
    } catch (error) {
        console.error('Error fetching problems:', error);
        showMessage('Failed to fetch problems. Please try again.', 'error');
        return { a: [], b: [] };
    }
}
// async function fetchAllProblems() {
//     try {
//         const response = await fetch('https://kenkoooo.com/atcoder/resources/merged-problems.json');
//         if (!response.ok) {
//             throw new Error('Failed to fetch problems from AtCoder API');
//         }
        
//         const allProblems = await response.json();
        
//         // Filter to only include ABC A and B problems
//         return allProblems.filter(problem => {
//             const id = problem.id.toLowerCase();
//             return id.startsWith('abc') && (id.endsWith('_a') || id.endsWith('_b'));
//         });
//     } catch (error) {
//         console.error('Error fetching problems:', error);
//         showMessage('Failed to fetch problems. Please try again.', 'error');
//         return [];
//     }
// }

// Add a function to fetch user's submissions
async function fetchUserSubmissions(userId) {
    try {
        const response = await fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${userId}&from_second=0`);
        if (!response.ok) {
            throw new Error(`Failed to fetch data for user: ${userId}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error fetching submissions for ${userId}:`, error);
        return [];
    }
}

// Add a function to get unsolved problems for a player
async function getUnsolvedProblems(player, allProblems) {
    // Fetch user submissions
    const submissions = await fetchUserSubmissions(player.atcoderId);
    
    // Get solved problems (unique problem IDs with AC status)
    const solvedProblems = new Set();
    submissions.forEach(sub => {
        if (sub.result === "AC") {
            solvedProblems.add(sub.problem_id);
        }
    });
    
    // Return unsolved problems (ABC A and B only)
    return allProblems.filter(problem => !solvedProblems.has(problem.id));
}


// function updatePlayersList() {
//     elements.playersList.innerHTML = '';
//     tournament.players.forEach(player => {
//         const li = document.createElement('li');
//         li.innerHTML = `
//             <span>${player}</span>
//             <span class="remove-player"><i class="fas fa-times"></i></span>
//         `;
//         elements.playersList.appendChild(li);
//     });
    
//     elements.playerCount.textContent = `(${tournament.players.length})`;
    
//     // Enable/disable start button based on player count
//     if (tournament.players.length < 2) {
//         elements.startTournamentBtn.disabled = true;
//         elements.startTournamentBtn.classList.add('disabled');
//     } else {
//         elements.startTournamentBtn.disabled = false;
//         elements.startTournamentBtn.classList.remove('disabled');
//     }
// }

// Tournament Management
async function startTournament() {
    const tournamentName = elements.tournamentNameInput.value.trim() || 'New Tournament';
    
    if (tournament.players.length < 2) {
        showMessage('You need at least 2 players to start a tournament', 'warning');
        return;
    }
    
    // Get the number of rounds
    const maxRounds = parseInt(elements.roundsInput.value);
    if (isNaN(maxRounds) || maxRounds < 1) {
        showMessage('Please enter a valid number of rounds', 'warning');
        return;
    }
    
    // Show loading message
    showMessage('Fetching problems from AtCoder...', 'info');
    elements.startTournamentBtn.disabled = true;
    elements.startTournamentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    
    try {
        // Fetch all ABC A and B problems, categorized by difficulty
        tournament.allProblems = await fetchAllProblems();
        
        if (tournament.allProblems.a.length === 0 || tournament.allProblems.b.length === 0) {
            throw new Error('Failed to fetch problems from AtCoder');
        }
        
        // Fetch unsolved problems for all players
        for (const player of tournament.players) {
            // Combine A and B problems for initial check
            const allProblemsArray = [...tournament.allProblems.a, ...tournament.allProblems.b];
            player.unsolvedProblems = await getUnsolvedProblems(player, allProblemsArray);
        }
        
        // Setup tournament
        tournament.name = tournamentName;
        tournament.maxRounds = maxRounds;
        tournament.completed = false;
        elements.tournamentTitle.textContent = tournament.name;
        
        // Initialize player scores
        tournament.playerScores = {};
        tournament.players.forEach(player => {
            tournament.playerScores[player.name] = {
                wins: 0,
                losses: 0,
                score: 0
            };
        });
        
        // Shuffle players for random matching
        shuffleArray(tournament.players);
        
        // Create first round
        await createFirstRound();
        
        // Show tournament view
        elements.setupPanel.classList.add('hidden');
        elements.tournamentView.classList.remove('hidden');
        elements.tournamentView.classList.add('fade-in');
        
        // Render the bracket
        renderBracket();
        
        hideModal();
        
    } catch (error) {
        console.error('Error starting tournament:', error);
        showMessage(`Error: ${error.message}`, 'error');
    } finally {
        // Reset button state
        elements.startTournamentBtn.disabled = false;
        elements.startTournamentBtn.innerHTML = '<i class="fas fa-play"></i> Start Tournament';
    }
}



// function startTournament() {
//     const tournamentName = elements.tournamentNameInput.value.trim() || 'New Tournament';
    
//     if (tournament.players.length < 2) {
//         showMessage('You need at least 2 players to start a tournament', 'warning');
//         return;
//     }
    
//     // Get the number of rounds
//     const maxRounds = parseInt(elements.roundsInput.value);
//     if (isNaN(maxRounds) || maxRounds < 1) {
//         showMessage('Please enter a valid number of rounds', 'warning');
//         return;
//     }
    
//     tournament.name = tournamentName;
//     tournament.maxRounds = maxRounds;
//     tournament.completed = false;
//     elements.tournamentTitle.textContent = tournament.name;
    
//     // Initialize player scores
//     tournament.playerScores = {};
//     tournament.players.forEach(player => {
//         tournament.playerScores[player] = {
//             wins: 0,
//             losses: 0,
//             score: 0 // Can be calculated as wins - losses
//         };
//     });
    
//     // Shuffle players for random matching
//     shuffleArray(tournament.players);
    
//     // Create first round
//     createFirstRound();
    
//     // Show tournament view
//     elements.setupPanel.classList.add('hidden');
//     elements.tournamentView.classList.remove('hidden');
//     elements.tournamentView.classList.add('fade-in');
    
//     // Render the tournament bracket
//     renderBracket();
// }


// Update createFirstRound function to assign problems to matches
async function createFirstRound() {
    // Reset tournament state
    tournament.rounds = [];
    tournament.currentRound = 0;
    tournament.winners = [];
    tournament.losers = [];
    
    // Get appropriate difficulty for the first round
    const difficulty = getProblemDifficultyForRound(0, tournament.maxRounds);
    
    // Create matches for the first round
    const firstRound = [];
    const players = [...tournament.players];
    
    // If odd number of players, one gets a bye
    if (players.length % 2 !== 0) {
        tournament.losers.push(null); // Add placeholder for tracking
        const byePlayer = players.pop();
        tournament.winners.push(byePlayer.name); // Last player gets a bye
    }
    
    // Create matches
    while (players.length > 0) {
        const player1 = players.pop();
        const player2 = players.pop();
        
        // Find common unsolved problems of the appropriate difficulty
        const commonUnsolved = findCommonUnsolvedProblems(player1, player2, difficulty);
        
        // Assign a random problem from common unsolved ones
        let assignedProblem = null;
        if (commonUnsolved.length > 0) {
            assignedProblem = commonUnsolved[Math.floor(Math.random() * commonUnsolved.length)];
        }
        
        firstRound.push({
            player1: player1.name,
            player2: player2.name,
            player1Id: player1.atcoderId,
            player2Id: player2.atcoderId,
            winner: null,
            loser: null,
            completed: false,
            problem: assignedProblem,
            difficulty: difficulty // Store the difficulty level
        });
    }
    
    tournament.rounds.push(firstRound);
    updateRoundDisplay();
}


// Function to find common unsolved problems between two players
// Updated findCommonUnsolvedProblems to filter by difficulty
function findCommonUnsolvedProblems(player1, player2, difficulty) {
    // Filter the unsolved problems by the specified difficulty
    const player1UnsolvedByDifficulty = player1.unsolvedProblems.filter(p => 
        p.id.toLowerCase().endsWith(`_${difficulty}`)
    );
    
    // Get problem IDs for easier comparison
    const player1UnsolvedIds = new Set(player1UnsolvedByDifficulty.map(p => p.id));
    
    // Find problems that player2 hasn't solved with the required difficulty
    return player2.unsolvedProblems.filter(p => 
        player1UnsolvedIds.has(p.id) && 
        p.id.toLowerCase().endsWith(`_${difficulty}`)
    );
}
// function findCommonUnsolvedProblems(player1, player2) {
//     // Get the problem IDs from player1's unsolved problems
//     const player1UnsolvedIds = new Set(player1.unsolvedProblems.map(p => p.id));
    
//     // Find the intersection with player2's unsolved problems
//     return player2.unsolvedProblems.filter(p => player1UnsolvedIds.has(p.id));
// }

// function createFirstRound() {
//     // Reset tournament state
//     tournament.rounds = [];
//     tournament.currentRound = 0;
//     tournament.winners = [];
//     tournament.losers = [];
    
//     // Create matches for the first round
//     const firstRound = [];
//     const players = [...tournament.players];
    
//     // If odd number of players, one gets a bye
//     if (players.length % 2 !== 0) {
//         tournament.losers.push(null); // Add placeholder for tracking
//         tournament.winners.push(players.pop()); // Last player gets a bye
//     }
    
//     // Create matches
//     while (players.length > 0) {
//         const player1 = players.pop();
//         const player2 = players.pop();
        
//         firstRound.push({
//             player1: player1,
//             player2: player2,
//             winner: null,
//             loser: null,
//             completed: false
//         });
//     }
    
//     tournament.rounds.push(firstRound);
//     updateRoundDisplay();
// }

// Update createNextRound function to assign problems to new matches
async function createNextRound() {
    const currentRound = tournament.rounds[tournament.currentRound];
    const completedMatches = currentRound.filter(match => match.completed);
    
    // Check if all matches are completed
    if (completedMatches.length !== currentRound.length) {
        showMessage('Complete all matches before advancing to the next round', 'warning');
        return false;
    }
    
    // Determine difficulty for the next round (current round + 1)
    const nextRoundIndex = tournament.currentRound + 1;
    const difficulty = getProblemDifficultyForRound(nextRoundIndex, tournament.maxRounds);
    
    // Create winner and loser brackets
    const winnersRound = [];
    const losersRound = [];
    
    // Handle winners bracket
    const winners = [...tournament.winners];
    
    // If odd number of winners, one gets a bye
    if (winners.length % 2 !== 0 && winners.length > 1) {
        // Move the last winner to the next round directly
        const byePlayer = winners.pop();
        tournament.winners = [byePlayer];
    } else {
        tournament.winners = [];
    }
    
    // Create winner matches
    while (winners.length > 1) {
        const player1Name = winners.pop();
        const player2Name = winners.pop();
        
        // Find player objects
        const player1 = tournament.players.find(p => p.name === player1Name);
        const player2 = tournament.players.find(p => p.name === player2Name);
        
        // Find common unsolved problems with appropriate difficulty
        const commonUnsolved = findCommonUnsolvedProblems(player1, player2, difficulty);
        
        // Assign a random problem from common unsolved ones
        let assignedProblem = null;
        if (commonUnsolved.length > 0) {
            assignedProblem = commonUnsolved[Math.floor(Math.random() * commonUnsolved.length)];
        }
        
        winnersRound.push({
            player1: player1Name,
            player2: player2Name,
            player1Id: player1.atcoderId,
            player2Id: player2.atcoderId,
            winner: null,
            loser: null,
            completed: false,
            bracket: 'winners',
            problem: assignedProblem,
            difficulty: difficulty // Store the difficulty level
        });
    }
    
    // Handle losers bracket - same logic as above but for losers
    const losers = [...tournament.losers].filter(player => player !== null);
    
    if (losers.length % 2 !== 0 && losers.length > 1) {
        const byePlayer = losers.pop();
        tournament.losers = [byePlayer];
    } else {
        tournament.losers = [];
    }
    
    while (losers.length > 1) {
        const player1Name = losers.pop();
        const player2Name = losers.pop();
        
        const player1 = tournament.players.find(p => p.name === player1Name);
        const player2 = tournament.players.find(p => p.name === player2Name);
        
        const commonUnsolved = findCommonUnsolvedProblems(player1, player2, difficulty);
        
        let assignedProblem = null;
        if (commonUnsolved.length > 0) {
            assignedProblem = commonUnsolved[Math.floor(Math.random() * commonUnsolved.length)];
        }
        
        losersRound.push({
            player1: player1Name,
            player2: player2Name,
            player1Id: player1.atcoderId,
            player2Id: player2.atcoderId,
            winner: null,
            loser: null,
            completed: false,
            bracket: 'losers',
            problem: assignedProblem,
            difficulty: difficulty
        });
    }
    
    // Add new rounds to tournament
    tournament.rounds.push([...winnersRound, ...losersRound]);
    tournament.currentRound++;
    updateRoundDisplay();
    
    return true;
}

// function createNextRound() {
//     const currentRound = tournament.rounds[tournament.currentRound];
//     const completedMatches = currentRound.filter(match => match.completed);
    
//     // Check if all matches are completed
//     if (completedMatches.length !== currentRound.length) {
//         showMessage('Complete all matches before advancing to the next round', 'warning');
//         return false;
//     }
    
//     // Create winner and loser brackets
//     const winnersRound = [];
//     const losersRound = [];
    
//     // Handle winners bracket
//     const winners = [...tournament.winners];
    
//     // If odd number of winners, one gets a bye
//     if (winners.length % 2 !== 0 && winners.length > 1) {
//         // Move the last winner to the next round directly
//         const byePlayer = winners.pop();
//         tournament.winners = [byePlayer];
//     } else {
//         tournament.winners = [];
//     }
    
//     // Create winner matches
//     while (winners.length > 1) {
//         const player1 = winners.pop();
//         const player2 = winners.pop();
        
//         winnersRound.push({
//             player1: player1,
//             player2: player2,
//             winner: null,
//             loser: null,
//             completed: false,
//             bracket: 'winners'
//         });
//     }
    
//     // Handle losers bracket
//     const losers = [...tournament.losers].filter(player => player !== null);
    
//     // If odd number of losers, one gets a bye
//     if (losers.length % 2 !== 0 && losers.length > 1) {
//         // Move the last loser to the next round directly
//         const byePlayer = losers.pop();
//         tournament.losers = [byePlayer];
//     } else {
//         tournament.losers = [];
//     }
    
//     // Create loser matches
//     while (losers.length > 1) {
//         const player1 = losers.pop();
//         const player2 = losers.pop();
        
//         losersRound.push({
//             player1: player1,
//             player2: player2,
//             winner: null,
//             loser: null,
//             completed: false,
//             bracket: 'losers'
//         });
//     }
    
//     // Add new rounds to tournament
//     tournament.rounds.push([...winnersRound, ...losersRound]);
//     tournament.currentRound++;
//     updateRoundDisplay();
    
//     return true;
// }

function showPreviousRound() {
    if (tournament.currentRound > 0) {
        tournament.currentRound--;
        updateRoundDisplay();
        renderBracket();
    }
}

function showNextRound() {
    // If looking at the last round and we haven't reached the max rounds
    if (tournament.currentRound === tournament.rounds.length - 1 && 
        tournament.currentRound < tournament.maxRounds - 1) {
        if (createNextRound()) {
            renderBracket();
        }
    } else if (tournament.currentRound < tournament.rounds.length - 1) {
        // Otherwise just navigate to the next existing round
        tournament.currentRound++;
        updateRoundDisplay();
        renderBracket();
    }
}



function updateRoundDisplay() {
    elements.roundDisplay.textContent = `Round ${tournament.currentRound + 1} of ${tournament.maxRounds}`;
    
    // Update navigation buttons
    elements.prevRoundBtn.disabled = tournament.currentRound === 0;
    
    if (tournament.currentRound === tournament.rounds.length - 1) {
        // If we've reached max rounds or all final matches are completed
        const finalRound = tournament.rounds[tournament.currentRound];
        const completedFinals = finalRound.filter(match => match.completed);
        
        if (tournament.currentRound >= tournament.maxRounds - 1 || 
            (finalRound.length === 1 && completedFinals.length === 1)) {
            elements.nextRoundBtn.disabled = true;
        } else {
            elements.nextRoundBtn.disabled = false;
        }
    } else {
        elements.nextRoundBtn.disabled = false;
    }
}



// Bracket Rendering
function renderBracket() {
    elements.bracketContainer.innerHTML = '';
    
    const currentRoundMatches = tournament.rounds[tournament.currentRound];
    const roundsContainer = document.createElement('div');
    roundsContainer.className = 'rounds-container';
    
    // Determine if we have separate brackets
    const winnerMatches = currentRoundMatches.filter(match => match.bracket !== 'losers');
    const loserMatches = currentRoundMatches.filter(match => match.bracket === 'losers');
    
    // Render winner bracket if exists
    if (winnerMatches.length > 0) {
        const winnerRound = createRoundElement('Winners Bracket', winnerMatches);
        roundsContainer.appendChild(winnerRound);
    }

    // Check if we've completed the final round of the tournament
    if (tournament.completed && !elements.scoreboardPanel.classList.contains('fade-in')) {
        showScoreboard();
    }
    
    // Render loser bracket if exists
    if (loserMatches.length > 0) {
        const loserRound = createRoundElement('Losers Bracket', loserMatches);
        roundsContainer.appendChild(loserRound);
    }
    
    // If no separate brackets, render all matches
    if (winnerMatches.length === 0 && loserMatches.length === 0) {
        const round = createRoundElement(`Round ${tournament.currentRound + 1}`, currentRoundMatches);
        roundsContainer.appendChild(round);
    }
    
    elements.bracketContainer.appendChild(roundsContainer);
    
    // Check if we have a winner
    if (tournament.currentRound === tournament.rounds.length - 1) {
        const finalRound = tournament.rounds[tournament.currentRound];
        
        if (finalRound.length === 1 && finalRound[0].completed) {
            const winner = finalRound[0].winner;
            const message = document.createElement('div');
            message.className = 'winner-announcement';
            message.innerHTML = `
                <h2>Tournament Champion!</h2>
                <div class="winner-name">${winner}</div>
                <p>Congratulations to our tournament winner!</p>
            `;
            elements.bracketContainer.appendChild(message);
        }
    }
}

function createRoundElement(title, matches) {
    const round = document.createElement('div');
    round.className = 'round';
    
    const header = document.createElement('div');
    header.className = 'round-header';
    header.textContent = title;
    round.appendChild(header);
    
    matches.forEach(match => {
        const matchElement = createMatchElement(match);
        round.appendChild(matchElement);
    });
    
    return round;
}

// Update createMatchElement function to show problem info in the bracket
function createMatchElement(match) {
    const matchElement = document.createElement('div');
    matchElement.className = 'match';
    
    if (!match.player1 || !match.player2) {
        matchElement.classList.add('match-pending');
    }
    
    // Player 1
    const player1Element = document.createElement('div');
    player1Element.className = 'match-player';
    
    if (match.winner === match.player1) {
        player1Element.classList.add('winner');
    } else if (match.completed) {
        player1Element.classList.add('loser');
    }
    
    player1Element.innerHTML = `
        <span class="player-name">${match.player1 || 'TBD'}</span>
    `;
    
    // Player 2
    const player2Element = document.createElement('div');
    player2Element.className = 'match-player';
    
    if (match.winner === match.player2) {
        player2Element.classList.add('winner');
    } else if (match.completed) {
        player2Element.classList.add('loser');
    }
    
    player2Element.innerHTML = `
        <span class="player-name">${match.player2 || 'TBD'}</span>
    `;
    
    // Add problem indicator if one exists
    if (match.problem) {
        const problemIndicator = document.createElement('div');
        problemIndicator.className = 'problem-indicator';
        const difficulty = match.problem.id.split('_').pop().toUpperCase();
        problemIndicator.innerHTML = `
            <small>Problem: ${match.problem.title} (Difficulty: ${difficulty})</small>
        `;
        
        matchElement.appendChild(player1Element);
        matchElement.appendChild(player2Element);
        matchElement.appendChild(problemIndicator);
    } else {
        matchElement.appendChild(player1Element);
        matchElement.appendChild(player2Element);
    }
    
    // Add click event to edit match
    if (!match.completed && match.player1 && match.player2) {
        matchElement.addEventListener('click', () => openMatchPanel(match));
    }
    
    return matchElement;
}


// function createMatchElement(match) {
//     const matchElement = document.createElement('div');
//     matchElement.className = 'match';
    
//     if (!match.player1 || !match.player2) {
//         matchElement.classList.add('match-pending');
//     }
    
//     // Player 1
//     const player1Element = document.createElement('div');
//     player1Element.className = 'match-player';
    
//     if (match.winner === match.player1) {
//         player1Element.classList.add('winner');
//     } else if (match.completed) {
//         player1Element.classList.add('loser');
//     }
    
//     player1Element.innerHTML = `
//         <span class="player-name">${match.player1 || 'TBD'}</span>
//     `;
    
//     // Player 2
//     const player2Element = document.createElement('div');
//     player2Element.className = 'match-player';
    
//     if (match.winner === match.player2) {
//         player2Element.classList.add('winner');
//     } else if (match.completed) {
//         player2Element.classList.add('loser');
//     }
    
//     player2Element.innerHTML = `
//         <span class="player-name">${match.player2 || 'TBD'}</span>
//     `;
    
//     matchElement.appendChild(player1Element);
//     matchElement.appendChild(player2Element);
    
//     // Add click event to edit match
//     if (!match.completed && match.player1 && match.player2) {
//         matchElement.addEventListener('click', () => openMatchPanel(match));
//     }
    
//     return matchElement;
// }



// Helper function to determine problem difficulty based on tournament progress
function getProblemDifficultyForRound(currentRound, maxRounds) {
    // For 3-round tournament: rounds 1-2 use difficulty A, round 3 uses difficulty B
    // For 4+ round tournament: rounds 1-2 use difficulty A, rounds 3+ use difficulty B
    
    // If tournament is 3 rounds, only the final round uses difficulty B
    if (maxRounds === 3) {
        return currentRound < 2 ? 'a' : 'b';
    } 
    // If tournament is 4+ rounds, first half uses A, second half uses B
    else {
        return currentRound < 2 ? 'a' : 'b';
    }
}





// Match Management
// Update openMatchPanel function to show the assigned problem
function openMatchPanel(match) {
    tournament.activeMatch = match;
    
    elements.matchPlayer1.querySelector('h3').textContent = match.player1;
    elements.matchPlayer2.querySelector('h3').textContent = match.player2;
    
    // Display problem information
    if (match.problem) {
        const difficulty = match.problem.id.split('_').pop().toUpperCase();
        elements.problemContainer.innerHTML = `
            <div class="problem-title">${match.problem.title}</div>
            <div class="problem-contest">Contest: ${match.problem.contest_id.toUpperCase()}</div>
            <div>Difficulty: ${difficulty}</div>
        `;
        
        // Set problem link
        elements.problemLink.href = `https://atcoder.jp/contests/${match.problem.contest_id}/tasks/${match.problem.id}`;
        elements.problemLink.style.display = 'inline-block';
    } else {
        elements.problemContainer.innerHTML = `
            <div class="error-message">
                No common unsolved problems found for these players.
                Please manually assign a problem.
            </div>
        `;
        elements.problemLink.style.display = 'none';
    }
    
    elements.matchPanel.classList.remove('hidden');
    elements.matchPanel.classList.add('fade-in');
}




// function openMatchPanel(match) {
//     tournament.activeMatch = match;
    
//     elements.matchPlayer1.querySelector('h3').textContent = match.player1;
//     elements.matchPlayer2.querySelector('h3').textContent = match.player2;
    
//     elements.matchPanel.classList.remove('hidden');
//     elements.matchPanel.classList.add('fade-in');
// }

function closeMatchPanel() {
    elements.matchPanel.classList.add('hidden');
    tournament.activeMatch = null;
}



// function markWinner(e) {
//     const winnerNum = e.target.getAttribute('data-player');
//     const match = tournament.activeMatch;
    
//     if (!match) return;
    
//     const winner = winnerNum === '1' ? match.player1 : match.player2;
//     const loser = winnerNum === '1' ? match.player2 : match.player1;
    
//     match.winner = winner;
//     match.loser = loser;
//     match.completed = true;
    
//     // Update player scores
//     if (tournament.playerScores[winner]) {
//         tournament.playerScores[winner].wins += 1;
//         tournament.playerScores[winner].score += 1; // Add 1 point for a win
//     }
    
//     if (tournament.playerScores[loser]) {
//         tournament.playerScores[loser].losses += 1;
//         tournament.playerScores[loser].score -= 0; // No point deduction for a loss
//     }
    
//     // Add to winners and losers for next round
//     tournament.winners.push(winner);
//     tournament.losers.push(loser);
    
//     closeMatchPanel();
//     renderBracket();
    
//     // Check if this was the last match of the max round
//     checkTournamentCompletion();
// }


// Update markWinner to check if the match actually has both players
function markWinner(e) {
    const winnerNum = e.target.getAttribute('data-player');
    const match = tournament.activeMatch;
    
    if (!match) return;
    
    const winner = winnerNum === '1' ? match.player1 : match.player2;
    const loser = winnerNum === '1' ? match.player2 : match.player1;
    
    match.winner = winner;
    match.loser = loser;
    match.completed = true;
    
    // Update player scores
    if (tournament.playerScores[winner]) {
        tournament.playerScores[winner].wins += 1;
        tournament.playerScores[winner].score += 1;
    }
    
    if (tournament.playerScores[loser]) {
        tournament.playerScores[loser].losses += 1;
    }
    
    // Add to winners and losers for next round
    tournament.winners.push(winner);
    tournament.losers.push(loser);
    
    closeMatchPanel();
    renderBracket();
    
    // Check if this was the last match of the max round
    checkTournamentCompletion();
}





// Add a function to check if the tournament is complete
function checkTournamentCompletion() {
    // If we've completed the max number of rounds
    if (tournament.currentRound >= tournament.maxRounds - 1) {
        const currentRound = tournament.rounds[tournament.currentRound];
        const allCompleted = currentRound.every(match => match.completed);
        
        if (allCompleted) {
            tournament.completed = true;
            setTimeout(() => {
                showScoreboard();
            }, 500); // Small delay for better UX
        }
    }
}

// Add function to show the scoreboard
function showScoreboard() {
    // Generate the scoreboard HTML
    const scoreboardHTML = generateScoreboardHTML();
    elements.scoreboard.innerHTML = scoreboardHTML;
    
    // Hide tournament view and show scoreboard
    elements.tournamentView.classList.add('hidden');
    elements.scoreboardPanel.classList.remove('hidden');
    elements.scoreboardPanel.classList.add('fade-in');
}

function hideScoreboard() {
    elements.scoreboardPanel.classList.add('hidden');
    elements.tournamentView.classList.remove('hidden');
}

// Generate the HTML for the scoreboard
function generateScoreboardHTML() {
    // Convert player scores to an array for sorting
    const playerScores = Object.entries(tournament.playerScores).map(([name, stats]) => ({
        name,
        ...stats
    }));
    
    // Sort by score (descending)
    playerScores.sort((a, b) => b.score - a.score);
    
    // Create the table HTML
    let html = `
        <table class="scoreboard-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Wins</th>
                    <th>Losses</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Add each player row
    playerScores.forEach((player, index) => {
        const rankClass = index < 3 ? ` class="player-rank-${index + 1}"` : '';
        
        html += `
            <tr${rankClass}>
                <td>${index + 1}</td>
                <td>${player.name}</td>
                <td class="score-win">${player.wins}</td>
                <td class="score-loss">${player.losses}</td>
                <td>${player.score}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    return html;
}



// Helper Functions
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function showMessage(message, type = 'info') {
    elements.modalTitle.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    elements.modalBody.textContent = message;
    
    // Hide cancel button for info/warning messages
    if (type === 'info' || type === 'warning') {
        elements.modalCancel.classList.add('hidden');
    } else {
        elements.modalCancel.classList.remove('hidden');
    }
    
    elements.modal.classList.remove('hidden');
}

function hideModal() {
    elements.modal.classList.add('hidden');
}

function confirmNewTournament() {
    showMessage('Start a new tournament? All current progress will be lost.', 'confirm');
    
    elements.modalConfirm.addEventListener('click', function newTournamentHandler() {
        resetTournament();
        hideModal();
        elements.modalConfirm.removeEventListener('click', newTournamentHandler);
    }, { once: true });
}

// Update resetTournament to also reset the new properties
// Update resetTournament function to reset player data structure
function resetTournament() {
    // Reset tournament state
    tournament.name = '';
    tournament.players = [];
    tournament.rounds = [];
    tournament.currentRound = 0;
    tournament.winners = [];
    tournament.losers = [];
    tournament.activeMatch = null;
    tournament.maxRounds = 3;
    tournament.playerScores = {};
    tournament.completed = false;
    tournament.allProblems = [];
    
    // Reset UI
    elements.tournamentView.classList.add('hidden');
    elements.matchPanel.classList.add('hidden');
    elements.scoreboardPanel.classList.add('hidden');
    elements.setupPanel.classList.remove('hidden');
    elements.tournamentNameInput.value = '';
    elements.playerInput.value = '';
    elements.atcoderIdInput.value = '';
    elements.roundsInput.value = '3';
    updatePlayersList();
}

// function resetTournament() {
//     // Reset tournament state
//     tournament.name = '';
//     tournament.players = [];
//     tournament.rounds = [];
//     tournament.currentRound = 0;
//     tournament.winners = [];
//     tournament.losers = [];
//     tournament.activeMatch = null;
//     tournament.maxRounds = 3; // Reset to default
//     tournament.playerScores = {};
//     tournament.completed = false;
    
//     // Reset UI
//     elements.tournamentView.classList.add('hidden');
//     elements.matchPanel.classList.add('hidden');
//     elements.scoreboardPanel.classList.add('hidden');
//     elements.setupPanel.classList.remove('hidden');
//     elements.tournamentNameInput.value = '';
//     elements.playerInput.value = '';
//     elements.roundsInput.value = '3'; // Reset to default
//     updatePlayersList();
// }

function saveTournament() {
    const tournamentData = JSON.stringify(tournament);
    
    try {
        localStorage.setItem('knockout-tournament', tournamentData);
        showMessage('Tournament saved successfully!', 'info');
    } catch (e) {
        showMessage('Failed to save tournament', 'warning');
        console.error('Save error:', e);
    }
}

function loadSavedTournament() {
    try {
        const savedData = localStorage.getItem('knockout-tournament');
        
        if (savedData) {
            const savedTournament = JSON.parse(savedData);
            
            // Confirm before loading
            showMessage('Load saved tournament?', 'confirm');
            
            elements.modalConfirm.addEventListener('click', function loadHandler() {
                // Copy saved data to tournament state
                Object.assign(tournament, savedTournament);
                
                // Update UI
                elements.tournamentNameInput.value = tournament.name;
                elements.tournamentTitle.textContent = tournament.name;
                updatePlayersList();
                updateRoundDisplay();
                
                // Show tournament view if rounds exist
                if (tournament.rounds.length > 0) {
                    elements.setupPanel.classList.add('hidden');
                    elements.tournamentView.classList.remove('hidden');
                    renderBracket();
                }
                
                hideModal();
                elements.modalConfirm.removeEventListener('click', loadHandler);
            }, { once: true });
        }
    } catch (e) {
        console.error('Load error:', e);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updatePlayersList();
    
    // Check for saved tournament
    if (localStorage.getItem('knockout-tournament')) {
        loadSavedTournament();
    }
});