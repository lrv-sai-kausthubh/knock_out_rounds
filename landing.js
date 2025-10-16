// Global variables
let players = [];
let matches = [];
let currentRound = 1;
let totalRounds = 0;
let refreshIntervalId = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
    // Set up event listeners
    document.getElementById('generate-fields').addEventListener('click', generatePlayerFields);
    document.getElementById('start-tournament').addEventListener('click', startTournament);
    document.getElementById('next-round').addEventListener('click', startNextRound);
    document.getElementById('toggle-leaderboard').addEventListener('click', toggleLeaderboard);
    document.getElementById('show-tournament').addEventListener('click', showTournament);
    
    // Add refresh button to tournament header
    const refreshButton = document.createElement('button');
    refreshButton.id = 'refresh-status';
    refreshButton.textContent = 'Refresh Status';
    refreshButton.addEventListener('click', refreshMatchStatus);
    document.querySelector('.round-info').appendChild(refreshButton);
}

function generatePlayerFields() {
    const numPlayers = parseInt(document.getElementById('num-players').value);
    
    // Validate number of players
    if (isNaN(numPlayers) || numPlayers < 2 || numPlayers % 2 !== 0) {
        alert('Please enter a valid even number of players (minimum 2)');
        return;
    }
    
    const playerFieldsContainer = document.getElementById('player-fields');
    playerFieldsContainer.innerHTML = '';
    
    // Generate input fields for each player
    for (let i = 1; i <= numPlayers; i++) {
        const playerRow = document.createElement('div');
        playerRow.className = 'player-row';
        
        playerRow.innerHTML = `
            <div class="player-number">Player ${i}</div>
            <div class="player-name">
                <label for="player-name-${i}">Name:</label>
                <input type="text" id="player-name-${i}" placeholder="Player ${i} Name" required>
            </div>
            <div class="player-id">
                <label for="player-id-${i}">AtCoder ID:</label>
                <div style="display: flex; align-items: center;">
                    <input type="text" id="player-id-${i}" placeholder="AtCoder ID" required>
                    <button class="verify-btn" data-player="${i}">Verify</button>
                    <span class="verify-status" id="verify-status-${i}"></span>
                </div>
            </div>
        `;
        
        playerFieldsContainer.appendChild(playerRow);
    }
    
    // Add event listeners to verify buttons
    document.querySelectorAll('.verify-btn').forEach(button => {
        button.addEventListener('click', verifyAtCoderId);
    });
    
    // Enable start tournament button
    document.getElementById('start-tournament').disabled = false;
}

async function verifyAtCoderId(event) {
    const playerNum = event.target.dataset.player;
    const idInput = document.getElementById(`player-id-${playerNum}`);
    const statusElement = document.getElementById(`verify-status-${playerNum}`);
    
    const atcoderId = idInput.value.trim();
    if (!atcoderId) {
        statusElement.textContent = 'Please enter an ID';
        statusElement.className = 'verify-status error';
        return;
    }
    
    statusElement.textContent = 'Verifying...';
    statusElement.className = 'verify-status pending';
    
    try {
        // Fetch user data from AtCoder API (using proxy if needed)
        const response = await fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/detail?user=${atcoderId}`);
        
        if (response.ok) {
            const userData = await response.json();
            if (userData) {
                statusElement.textContent = 'Valid ID';
                statusElement.className = 'verify-status success';
            } else {
                statusElement.textContent = 'Invalid ID';
                statusElement.className = 'verify-status error';
            }
        } else {
            statusElement.textContent = 'Invalid ID';
            statusElement.className = 'verify-status error';
        }
    } catch (error) {
        console.error('Error verifying AtCoder ID:', error);
        statusElement.textContent = 'Error verifying';
        statusElement.className = 'verify-status error';
    }
}

function startTournament() {
    const numPlayers = parseInt(document.getElementById('num-players').value);
    players = [];
    
    // Gather player information
    for (let i = 1; i <= numPlayers; i++) {
        const nameInput = document.getElementById(`player-name-${i}`);
        const idInput = document.getElementById(`player-id-${i}`);
        
        if (!nameInput.value || !idInput.value) {
            alert('Please fill in all player information');
            return;
        }
        
        players.push({
            id: i,
            name: nameInput.value,
            atcoderId: idInput.value,
            rating: 0,
            wins: 0,
            matches: 0
        });
    }
    
    // Calculate total rounds needed
    totalRounds = Math.log2(players.length);
    
    // Show tournament section
    document.getElementById('setup-section').classList.remove('active');
    document.getElementById('setup-section').classList.add('hidden');
    document.getElementById('tournament-section').classList.remove('hidden');
    document.getElementById('tournament-section').classList.add('active');
    
    // Start first round
    createMatches();
    displayMatches();
    
    // Start auto-refresh
    startAutoRefresh();
}

function createMatches() {
    matches = [];
    
    // If this is the first round, randomly pair players
    if (currentRound === 1) {
        // Shuffle players
        const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
        
        // Create matches
        for (let i = 0; i < shuffledPlayers.length; i += 2) {
            matches.push({
                id: matches.length + 1,
                player1: shuffledPlayers[i],
                player2: shuffledPlayers[i + 1],
                problemId: getRandomProblem(),
                winner: null,
                player1Solved: false,
                player2Solved: false,
                player1Time: null,
                player2Time: null
            });
        }
    } else {
        // Sort players by rating for subsequent rounds
        const activePlayers = players.filter(p => p.active !== false).sort((a, b) => b.rating - a.rating);
        
        // Create matches based on rating
        for (let i = 0; i < activePlayers.length; i += 2) {
            matches.push({
                id: matches.length + 1,
                player1: activePlayers[i],
                player2: activePlayers[i + 1],
                problemId: getRandomProblem(),
                winner: null,
                player1Solved: false,
                player2Solved: false,
                player1Time: null,
                player2Time: null
            });
        }
    }
}

function getRandomProblem() {
    // Sample AtCoder problems
    const contestIds = ['abc150', 'abc151', 'abc152', 'abc153', 'abc154', 'abc155'];
    const taskIds = ['a', 'b', 'c', 'd'];
    
    const contestId = contestIds[Math.floor(Math.random() * contestIds.length)];
    const taskId = taskIds[Math.floor(Math.random() * taskIds.length)];
    const problemId = `${contestId}_${taskId}`;
    
    return {
        id: problemId,
        url: `https://atcoder.jp/contests/${contestId}/tasks/${contestId}_${taskId}`,
        name: `${contestId.toUpperCase()} - Problem ${taskId.toUpperCase()}`
    };
}

function displayMatches() {
    const matchesContainer = document.getElementById('matches-container');
    matchesContainer.innerHTML = '';
    
    matches.forEach(match => {
        const matchCard = document.createElement('div');
        matchCard.className = 'match-card';
        matchCard.id = `match-${match.id}`;
        
        matchCard.innerHTML = `
            <div class="match-header">Match ${match.id}</div>
            <div class="problem-info">${match.problemId.name}</div>
            <a href="${match.problemId.url}" class="problem-link" target="_blank">View Problem</a>
            
            <div class="player ${match.player1Solved ? 'solved' : ''}" id="player1-match-${match.id}">
                <div class="player-info">
                    <span class="player-name-display">${match.player1.name}</span>
                    <span class="player-rating">Rating: ${match.player1.rating}</span>
                </div>
                <div>AtCoder ID: ${match.player1.atcoderId}</div>
                <div class="submission-status" id="status1-match-${match.id}">
                    ${match.player1Solved ? `Solved in ${formatTime(match.player1Time)}` : 'Not solved yet'}
                </div>
            </div>
            
            <div class="versus">VS</div>
            
            <div class="player ${match.player2Solved ? 'solved' : ''}" id="player2-match-${match.id}">
                <div class="player-info">
                    <span class="player-name-display">${match.player2.name}</span>
                    <span class="player-rating">Rating: ${match.player2.rating}</span>
                </div>
                <div>AtCoder ID: ${match.player2.atcoderId}</div>
                <div class="submission-status" id="status2-match-${match.id}">
                    ${match.player2Solved ? `Solved in ${formatTime(match.player2Time)}` : 'Not solved yet'}
                </div>
            </div>
        `;
        
        matchesContainer.appendChild(matchCard);
    });
    
    // Update the current round display
    document.getElementById('current-round').textContent = currentRound;
}

function formatTime(seconds) {
    if (seconds === null) return '';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
}

function startAutoRefresh() {
    // Clear any existing interval
    if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
    }
    
    // Set up auto-refresh every 30 seconds
    refreshIntervalId = setInterval(refreshMatchStatus, 30000);
    
    // Do an initial refresh
    refreshMatchStatus();
}

async function refreshMatchStatus() {
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'loading-message';
    loadingMessage.textContent = 'Refreshing match status...';
    document.getElementById('matches-container').prepend(loadingMessage);
    
    try {
        let allMatchesResolved = true;
        
        for (const match of matches) {
            if (match.winner) continue; // Skip matches that already have a winner
            
            // Check submissions for both players
            const [player1Status, player2Status] = await Promise.all([
                checkSubmissionStatus(match.player1.atcoderId, match.problemId.id),
                checkSubmissionStatus(match.player2.atcoderId, match.problemId.id)
            ]);
            
            // Update match data
            if (player1Status.solved && !match.player1Solved) {
                match.player1Solved = true;
                match.player1Time = player1Status.timeTaken;
                updateMatchDisplay(match);
            }
            
            if (player2Status.solved && !match.player2Solved) {
                match.player2Solved = true;
                match.player2Time = player2Status.timeTaken;
                updateMatchDisplay(match);
            }
            
            // Determine winner
            if (match.player1Solved && !match.player2Solved) {
                declareWinner(match, match.player1, match.player2);
            } else if (match.player2Solved && !match.player1Solved) {
                declareWinner(match, match.player2, match.player1);
            } else if (match.player1Solved && match.player2Solved) {
                if (match.player1Time < match.player2Time) {
                    declareWinner(match, match.player1, match.player2);
                } else {
                    declareWinner(match, match.player2, match.player1);
                }
            } else {
                allMatchesResolved = false;
            }
        }
        
        // If all matches are resolved, enable next round button
        if (allMatchesResolved && matches.length > 0) {
            document.getElementById('next-round').disabled = false;
        }
    } catch (error) {
        console.error('Error refreshing match status:', error);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'Error refreshing match status. Please try again.';
        document.getElementById('matches-container').prepend(errorMessage);
        
        setTimeout(() => errorMessage.remove(), 5000);
    } finally {
        loadingMessage.remove();
    }
}

async function checkSubmissionStatus(atcoderId, problemId) {
    try {
        // Using the unofficial AtCoder API
        // Format: https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=USERNAME&from_second=0
        const response = await fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${atcoderId}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch submission data');
        }
        
        const submissions = await response.json();
        
        // Find submissions for the specific problem
        const problemSubmissions = submissions.filter(sub => 
            sub.problem_id === problemId && sub.result === 'AC'
        );
        
        if (problemSubmissions.length > 0) {
            // Sort by timestamp to get the earliest accepted solution
            problemSubmissions.sort((a, b) => a.epoch_second - b.epoch_second);
            
            // Calculate time taken (from the start of the tournament)
            // In a real implementation, you would track the exact start time
            const timeTaken = calculateTimeTaken(problemSubmissions[0].epoch_second);
            
            return {
                solved: true,
                timeTaken: timeTaken
            };
        } else {
            return {
                solved: false,
                timeTaken: null
            };
        }
    } catch (error) {
        console.error(`Error checking submission for ${atcoderId}:`, error);
        return {
            solved: false,
            timeTaken: null
        };
    }
}

function calculateTimeTaken(submissionTimestamp) {
    // This function should calculate time from tournament start
    // For demo purposes, we'll use a mock time
    const mockStartTime = Math.floor(Date.now() / 1000) - 3600; // Assume started 1 hour ago
    return submissionTimestamp - mockStartTime;
}

function declareWinner(match, winner, loser) {
    match.winner = winner.id;
    
    // Update player stats
    winner.wins++;
    winner.rating += 100;
    winner.matches++;
    loser.matches++;
    
    // Mark loser as inactive for future rounds
    loser.active = false;
    
    // Update UI
    updateMatchDisplay(match);
    
    // Check if all matches have winners
    const allMatchesComplete = matches.every(m => m.winner !== null);
    if (allMatchesComplete) {
        document.getElementById('next-round').disabled = false;
    }
}

function updateMatchDisplay(match) {
    // Update player 1 display
    const player1Element = document.getElementById(`player1-match-${match.id}`);
    const status1Element = document.getElementById(`status1-match-${match.id}`);
    
    if (match.player1Solved) {
        player1Element.classList.add('solved');
        status1Element.textContent = `Solved in ${formatTime(match.player1Time)}`;
        
        if (!player1Element.querySelector('.time-taken')) {
            const timeElement = document.createElement('div');
            timeElement.className = 'time-taken';
            timeElement.textContent = formatTime(match.player1Time);
            player1Element.appendChild(timeElement);
        }
    }
    
    // Update player 2 display
    const player2Element = document.getElementById(`player2-match-${match.id}`);
    const status2Element = document.getElementById(`status2-match-${match.id}`);
    
    if (match.player2Solved) {
        player2Element.classList.add('solved');
        status2Element.textContent = `Solved in ${formatTime(match.player2Time)}`;
        
        if (!player2Element.querySelector('.time-taken')) {
            const timeElement = document.createElement('div');
            timeElement.className = 'time-taken';
            timeElement.textContent = formatTime(match.player2Time);
            player2Element.appendChild(timeElement);
        }
    }
    
    // Highlight winner
    const matchElement = document.getElementById(`match-${match.id}`);
    
    if (match.winner === match.player1.id) {
        player1Element.classList.add('winner');
        matchElement.classList.add('player1-won');
    } else if (match.winner === match.player2.id) {
        player2Element.classList.add('winner');
        matchElement.classList.add('player2-won');
    }
}

function startNextRound() {
    // Filter out players who lost
    players = players.filter(player => player.active !== false);
    
    // Check if tournament is complete
    if (players.length === 1) {
        alert(`Tournament complete! Champion: ${players[0].name}`);
        showLeaderboard();
        return;
    }
    
    // Start next round
    currentRound++;
    document.getElementById('next-round').disabled = true;
    
    // Create new matches and display them
    createMatches();
    displayMatches();
    
    // Refresh match status
    refreshMatchStatus();
}

function toggleLeaderboard() {
    const leaderboardSection = document.getElementById('leaderboard-section');
    
    if (leaderboardSection.classList.contains('hidden')) {
        showLeaderboard();
    } else {
        showTournament();
    }
}

function showLeaderboard() {
    document.getElementById('tournament-section').classList.add('hidden');
    document.getElementById('tournament-section').classList.remove('active');
    document.getElementById('leaderboard-section').classList.remove('hidden');
    document.getElementById('leaderboard-section').classList.add('active');
    
    updateLeaderboard();
}

function showTournament() {
    document.getElementById('leaderboard-section').classList.add('hidden');
    document.getElementById('leaderboard-section').classList.remove('active');
    document.getElementById('tournament-section').classList.remove('hidden');
    document.getElementById('tournament-section').classList.add('active');
}

function updateLeaderboard() {
    const leaderboardBody = document.getElementById('leaderboard-body');
    leaderboardBody.innerHTML = '';
    
    // Get all players, including eliminated ones
    const allPlayers = [...players];
    
    // Sort by rating
    allPlayers.sort((a, b) => b.rating - a.rating);
    
    // Create leaderboard rows
    allPlayers.forEach((player, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${player.name}</td>
            <td>${player.atcoderId}</td>
            <td>${player.rating}</td>
            <td>${player.wins}</td>
            <td>${player.matches}</td>
        `;
        leaderboardBody.appendChild(row);
    });
}