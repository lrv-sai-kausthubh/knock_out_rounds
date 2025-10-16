// Global variables
let players = [];
let matches = [];
let currentRound = 1;
let totalRounds = 0;
let refreshIntervalId = null;
const REFRESH_INTERVAL = 30000; // 30 seconds
const RATING_INCREMENT = 100;
const ADMIN_PASSWORD = "knockout2025";
let assignedProblems = new Set();

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners
    document.getElementById('generate-fields').addEventListener('click', generatePlayerFields);
    document.getElementById('start-tournament').addEventListener('click', startTournament);
    document.getElementById('next-round').addEventListener('click', startNextRound);
    document.getElementById('toggle-leaderboard').addEventListener('click', toggleLeaderboard);
    document.getElementById('show-tournament').addEventListener('click', showTournament);
});

// Generate player input fields based on the number specified
function generatePlayerFields() {
    const numPlayers = parseInt(document.getElementById('num-players').value);
    
    if (!numPlayers || numPlayers < 2 || numPlayers % 2 !== 0) {
        alert('Please enter an even number of players (minimum 2)');
        return;
    }
    
    const playerFieldsContainer = document.getElementById('player-fields');
    playerFieldsContainer.innerHTML = '';
    
    for (let i = 1; i <= numPlayers; i++) {
        const playerRow = document.createElement('div');
        playerRow.className = 'player-row';
        
        const playerNumber = document.createElement('div');
        playerNumber.className = 'player-number';
        playerNumber.textContent = `Player ${i}:`;
        
        const playerName = document.createElement('div');
        playerName.className = 'player-name';
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.id = `player-name-${i}`;
        nameInput.placeholder = 'Enter Player Name';
        playerName.appendChild(nameInput);
        
        const playerIdContainer = document.createElement('div');
        playerIdContainer.className = 'player-id';
        const idInput = document.createElement('input');
        idInput.type = 'text';
        idInput.id = `player-id-${i}`;
        idInput.placeholder = 'Enter AtCoder ID';
        
        const verifyButton = document.createElement('button');
        verifyButton.className = 'verify-btn';
        verifyButton.textContent = 'Verify';
        verifyButton.setAttribute('data-player', i);
        verifyButton.addEventListener('click', verifyAtCoderid);
        
        const verifyStatus = document.createElement('span');
        verifyStatus.className = 'verify-status';
        verifyStatus.id = `verify-status-${i}`;
        
        playerIdContainer.appendChild(idInput);
        playerIdContainer.appendChild(verifyButton);
        playerIdContainer.appendChild(verifyStatus);
        
        playerRow.appendChild(playerNumber);
        playerRow.appendChild(playerName);
        playerRow.appendChild(playerIdContainer);
        
        playerFieldsContainer.appendChild(playerRow);
    }
    
    document.getElementById('start-tournament').disabled = false;
}

// Verify if an AtCoder ID exists
async function verifyAtCoderid(e) {
    const playerNum = e.target.getAttribute('data-player');
    const atcoderId = document.getElementById(`player-id-${playerNum}`).value.trim();
    const statusElement = document.getElementById(`verify-status-${playerNum}`);
    
    if (!atcoderId) {
        statusElement.textContent = 'Please enter an AtCoder ID';
        statusElement.className = 'verify-status error';
        return;
    }
    
    // Show verification in progress
    e.target.disabled = true;
    statusElement.textContent = 'Verifying...';
    statusElement.className = 'verify-status pending';
    
    try {
        // Use the same API endpoint as in timepass.html
        const response = await fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${atcoderId}&from_second=0`);
        
        if (!response.ok) {
            throw new Error('Failed to verify user');
        }
        
        const submissions = await response.json();
        
        if (submissions.length === 0) {
            statusElement.textContent = 'No submissions found';
            statusElement.className = 'verify-status error';
        } else {
            statusElement.textContent = '✓ Valid';
            statusElement.className = 'verify-status success';
        }
    } catch (error) {
        statusElement.textContent = 'Invalid ID';
        statusElement.className = 'verify-status error';
    } finally {
        e.target.disabled = false;
    }
}

// Start the tournament with entered players
async function startTournament() {
    const numPlayers = parseInt(document.getElementById('num-players').value);
    const numRounds = parseInt(document.getElementById('num-rounds').value);
    players = [];
    
    // Reset assigned problems when starting a new tournament
    assignedProblems = new Set();
    
    // Store tournament start time for accurate timing
    window.tournamentStartTime = Math.floor(Date.now() / 1000);
    
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
    
    // Use the specified number of rounds instead of calculating it
    totalRounds = numRounds;
    
    document.getElementById('setup-section').classList.remove('active');
    document.getElementById('setup-section').classList.add('hidden');
    document.getElementById('tournament-section').classList.remove('hidden');
    document.getElementById('tournament-section').classList.add('active');
    document.getElementById('current-round').textContent = currentRound;
    
    // Display loading message while setting up the tournament
    const matchesContainer = document.getElementById('matches-container');
    matchesContainer.innerHTML = '<div class="loading-message">Setting up matches...</div>';
    
    try {
        await createMatches();
        displayMatches();
        startAutoRefresh();
    } catch (error) {
        console.error('Error starting tournament:', error);
        matchesContainer.innerHTML = '<div class="error-message">Failed to set up matches. Please try again.</div>';
    }
}
// async function startTournament() {
//     const numPlayers = parseInt(document.getElementById('num-players').value);
//     players = [];
    
//     // Store tournament start time for accurate timing
//     window.tournamentStartTime = Math.floor(Date.now() / 1000);
    
//     for (let i = 1; i <= numPlayers; i++) {
//         const nameInput = document.getElementById(`player-name-${i}`);
//         const idInput = document.getElementById(`player-id-${i}`);
        
//         if (!nameInput.value || !idInput.value) {
//             alert('Please fill in all player information');
//             return;
//         }
        
//         players.push({
//             id: i,
//             name: nameInput.value,
//             atcoderId: idInput.value,
//             rating: 0,
//             wins: 0,
//             matches: 0
//         });
//     }
    
//     totalRounds = Math.ceil(Math.log2(players.length));
    
//     document.getElementById('setup-section').classList.remove('active');
//     document.getElementById('setup-section').classList.add('hidden');
//     document.getElementById('tournament-section').classList.remove('hidden');
//     document.getElementById('tournament-section').classList.add('active');
//     document.getElementById('current-round').textContent = currentRound;
    
//     // Display loading message while setting up the tournament
//     const matchesContainer = document.getElementById('matches-container');
//     matchesContainer.innerHTML = '<div class="loading-message">Setting up matches...</div>';
    
//     try {
//         await createMatches();
//         displayMatches();
//         startAutoRefresh();
//     } catch (error) {
//         console.error('Error starting tournament:', error);
//         matchesContainer.innerHTML = '<div class="error-message">Failed to set up matches. Please try again.</div>';
//     }
// }


// New function to get a problem that both users haven't solved yet
// Then update the getUnsolvedProblem function to check this set
async function getUnsolvedProblem(player1Id, player2Id, round, totalRounds) {
    try {
        // Fetch submissions for both players (keep existing code)
        const player1Response = await fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${player1Id}&from_second=0`);
        const player2Response = await fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${player2Id}&from_second=0`);
        
        if (!player1Response.ok || !player2Response.ok) {
            throw new Error('Failed to fetch submissions');
        }
        
        const player1Submissions = await player1Response.json();
        const player2Submissions = await player2Response.json();
        
        // Get sets of solved problem IDs for both players
        const player1Solved = new Set();
        const player2Solved = new Set();
        
        player1Submissions.forEach(sub => {
            if (sub.result === 'AC') {
                player1Solved.add(sub.problem_id);
            }
        });
        
        player2Submissions.forEach(sub => {
            if (sub.result === 'AC') {
                player2Solved.add(sub.problem_id);
            }
        });
        
        // List of beginner contests (ABC series)
        const beginnerContests = [];
        // Generate contest IDs from abc001 to abc300 (covers most beginner contests)
        for (let i = 1; i <= 300; i++) {
            beginnerContests.push(`abc${i.toString().padStart(3, '0')}`);
        }
        
        // Determine if we should use type A or B based on the round number
        // Use A problems for the first half of the rounds (rounded up), and B problems for the rest
        const useTypeA = round <= Math.ceil(totalRounds / 2);
        
        if (useTypeA) {
            // Try category A problems
            for (const contestId of beginnerContests) {
                const problemId = `${contestId}_a`;
                
                // Check if problem is already assigned OR solved by either player
                if (!assignedProblems.has(problemId) && 
                    !player1Solved.has(problemId) && 
                    !player2Solved.has(problemId)) {
                    
                    // Mark as assigned
                    assignedProblems.add(problemId);
                    
                    return {
                        id: problemId,
                        url: `https://atcoder.jp/contests/${contestId}/tasks/${contestId}_1`,
                        name: `${contestId.toUpperCase()} Problem A`
                    };
                }
            }
        } else {
            // Try category B problems
            for (const contestId of beginnerContests) {
                const problemId = `${contestId}_b`;
                
                // Check if problem is already assigned OR solved by either player
                if (!assignedProblems.has(problemId) && 
                    !player1Solved.has(problemId) && 
                    !player2Solved.has(problemId)) {
                    
                    // Mark as assigned
                    assignedProblems.add(problemId);
                    
                    return {
                        id: problemId,
                        url: `https://atcoder.jp/contests/${contestId}/tasks/${contestId}_2`,
                        name: `${contestId.toUpperCase()} Problem B`
                    };
                }
            }
        }
        
        // If we get here, we've exhausted the preferred type, try the other type
        const problemType = useTypeA ? '_b' : '_a';
        const urlSuffix = useTypeA ? '_2' : '_1';
        const problemLabel = useTypeA ? 'B' : 'A';
        
        for (const contestId of beginnerContests) {
            const problemId = `${contestId}${problemType}`;
            
            if (!assignedProblems.has(problemId) && 
                !player1Solved.has(problemId) && 
                !player2Solved.has(problemId)) {
                
                // Mark as assigned
                assignedProblems.add(problemId);
                
                return {
                    id: problemId,
                    url: `https://atcoder.jp/contests/${contestId}/tasks/${contestId}${urlSuffix}`,
                    name: `${contestId.toUpperCase()} Problem ${problemLabel}`
                };
            }
        }
        
        // Extreme fallback - find any unused problem
        for (const contestId of beginnerContests) {
            for (const type of ['a', 'b']) {
                const problemId = `${contestId}_${type}`;
                const urlSuffix = type === 'a' ? '1' : '2';
                const problemLabel = type === 'a' ? 'A' : 'B';
                
                if (!assignedProblems.has(problemId)) {
                    assignedProblems.add(problemId);
                    
                    return {
                        id: problemId,
                        url: `https://atcoder.jp/contests/${contestId}/tasks/${contestId}_${urlSuffix}`,
                        name: `${contestId.toUpperCase()} Problem ${problemLabel} (Fallback)`
                    };
                }
            }
        }
        
        // Ultimate fallback
        return {
            id: 'abc042_a',
            url: 'https://atcoder.jp/contests/abc042/tasks/abc042_1',
            name: 'ABC042 Problem A (Ultimate Fallback)'
        };
        
    } catch (error) {
        console.error('Error getting unsolved problem:', error);
        return {
            id: 'abc042_a',
            url: 'https://atcoder.jp/contests/abc042/tasks/abc042_1',
            name: 'ABC042 Problem A (Error Fallback)'
        };
    }
}

// async function getUnsolvedProblem(player1Id, player2Id) {
//     try {
//         // Fetch submissions for both players
//         const player1Response = await fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${player1Id}&from_second=0`);
//         const player2Response = await fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${player2Id}&from_second=0`);
        
//         if (!player1Response.ok || !player2Response.ok) {
//             throw new Error('Failed to fetch submissions');
//         }
        
//         const player1Submissions = await player1Response.json();
//         const player2Submissions = await player2Response.json();
        
//         // Get sets of solved problem IDs for both players
//         const player1Solved = new Set();
//         const player2Solved = new Set();
        
//         player1Submissions.forEach(sub => {
//             if (sub.result === 'AC') {
//                 player1Solved.add(sub.problem_id);
//             }
//         });
        
//         player2Submissions.forEach(sub => {
//             if (sub.result === 'AC') {
//                 player2Solved.add(sub.problem_id);
//             }
//         });
        
//         // List of beginner contests (ABC series)
//         const beginnerContests = [];
//         // Generate contest IDs from abc001 to abc300 (covers most beginner contests)
//         for (let i = 1; i <= 300; i++) {
//             beginnerContests.push(`abc${i.toString().padStart(3, '0')}`);
//         }
        
//         // First try category A problems (which are _1 in URLs but _a in problem IDs)
//         for (const contestId of beginnerContests) {
//             const problemId = `${contestId}_a`;  // Keep this as _a for API matching
            
//             // If neither player has solved this problem, use it
//             if (!player1Solved.has(problemId) && !player2Solved.has(problemId)) {
//                 return {
//                     id: problemId,  // Keep as _a for API comparison
//                     url: `https://atcoder.jp/contests/${contestId}/tasks/${contestId}_1`,  // Use _1 in URL
//                     name: `${contestId.toUpperCase()} Problem A`
//                 };
//             }
//         }
        
//         // If no common unsolved A problems, try category B problems
//         for (const contestId of beginnerContests) {
//             const problemId = `${contestId}_b`;  // Keep this as _b for API matching
            
//             // If neither player has solved this problem, use it
//             if (!player1Solved.has(problemId) && !player2Solved.has(problemId)) {
//                 return {
//                     id: problemId,  // Keep as _b for API comparison
//                     url: `https://atcoder.jp/contests/${contestId}/tasks/${contestId}_2`,  // Use _2 in URL
//                     name: `${contestId.toUpperCase()} Problem B`
//                 };
//             }
//         }
        
//         // Fallback to a random beginner A problem if no common unsolved problems found
//         const randomContestId = beginnerContests[Math.floor(Math.random() * beginnerContests.length)];
//         return {
//             id: `${randomContestId}_a`,  // Keep as _a for API comparison
//             url: `https://atcoder.jp/contests/${randomContestId}/tasks/${randomContestId}_1`,  // Use _1 in URL
//             name: `${randomContestId.toUpperCase()} Problem A (Fallback)`
//         };
        
//     } catch (error) {
//         console.error('Error getting unsolved problem:', error);
//         // Fallback to a simple problem if there's an error
//         return {
//             id: 'abc042_a',  // Keep as _a for API comparison
//             url: 'https://atcoder.jp/contests/abc042/tasks/abc042_1',  // Use _1 in URL
//             name: 'ABC042 Problem A (Error Fallback)'
//         };
//     }
// }



// Create matches for the current round
async function createMatches() {
    matches = [];
    
    // If this is the first round, randomly pair players
    if (currentRound === 1) {
        // Shuffle players for random pairing
        const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
        
        // Create pairs and assign problems
        for (let i = 0; i < shuffledPlayers.length; i += 2) {
            if (i + 1 < shuffledPlayers.length) {
                const loadingMatch = {
                    id: matches.length + 1,
                    player1: shuffledPlayers[i],
                    player2: shuffledPlayers[i + 1],
                    problem: { id: 'loading', name: 'Loading problem...', url: '#' },
                    status: 'loading',
                    winner: null,
                    player1Solved: false,
                    player2Solved: false,
                    player1Time: null,
                    player2Time: null
                };
                
                matches.push(loadingMatch);
            }
        }
        
        displayMatches();
        
        // Now replace each loading match with actual problem
        for (const match of matches) {
            try {
                // Pass current round and total rounds to the function
                const problem = await getUnsolvedProblem(
                    match.player1.atcoderId, 
                    match.player2.atcoderId,
                    currentRound,
                    totalRounds
                );
                
                match.problem = problem;
                match.status = 'in_progress';
                displayMatches();
            } catch (error) {
                console.error('Error assigning problem to match:', error);
            }
        }
        
    } else {
        // Later rounds logic (similar update)
        const roundWinners = players.filter(p => p.wins === currentRound - 1);
        roundWinners.sort((a, b) => a.rating - b.rating);
        
        for (let i = 0; i < roundWinners.length; i += 2) {
            if (i + 1 < roundWinners.length) {
                const loadingMatch = {
                    id: matches.length + 1,
                    player1: roundWinners[i],
                    player2: roundWinners[i + 1],
                    problem: { id: 'loading', name: 'Loading problem...', url: '#' },
                    status: 'loading',
                    winner: null,
                    player1Solved: false,
                    player2Solved: false,
                    player1Time: null,
                    player2Time: null
                };
                
                matches.push(loadingMatch);
            }
        }
        
        displayMatches();
        
        for (const match of matches) {
            try {
                // Pass current round and total rounds to the function
                const problem = await getUnsolvedProblem(
                    match.player1.atcoderId, 
                    match.player2.atcoderId,
                    currentRound,
                    totalRounds
                );
                
                match.problem = problem;
                match.status = 'in_progress';
                displayMatches();
            } catch (error) {
                console.error('Error assigning problem to match:', error);
            }
        }
    }
}
// async function createMatches() {
//     matches = [];
    
//     // If this is the first round, randomly pair players
//     if (currentRound === 1) {
//         // Shuffle players for random pairing
//         const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
        
//         // Create pairs and assign problems (now async)
//         for (let i = 0; i < shuffledPlayers.length; i += 2) {
//             if (i + 1 < shuffledPlayers.length) {
//                 // Show loading message while fetching problems
//                 const loadingMatch = {
//                     id: matches.length + 1,
//                     player1: shuffledPlayers[i],
//                     player2: shuffledPlayers[i + 1],
//                     problem: { id: 'loading', name: 'Loading problem...', url: '#' },
//                     status: 'loading',
//                     winner: null,
//                     player1Solved: false,
//                     player2Solved: false,
//                     player1Time: null,
//                     player2Time: null
//                 };
                
//                 matches.push(loadingMatch);
//             }
//         }
        
//         // Display initial matches with loading indicators
//         displayMatches();
        
//         // Now replace each loading match with actual problem
//         for (const match of matches) {
//             try {
//                 const problem = await getUnsolvedProblem(match.player1.atcoderId, match.player2.atcoderId);
//                 match.problem = problem;
//                 match.status = 'in_progress';
//                 displayMatches(); // Update the display after each problem is fetched
//             } catch (error) {
//                 console.error('Error assigning problem to match:', error);
//             }
//         }
        
//     } else {
//         // Later rounds logic (similar update)
//         const roundWinners = players.filter(p => p.wins === currentRound - 1);
//         roundWinners.sort((a, b) => a.rating - b.rating);
        
//         // Create pairs based on rating and assign problems (now async)
//         for (let i = 0; i < roundWinners.length; i += 2) {
//             if (i + 1 < roundWinners.length) {
//                 // Show loading message while fetching problems
//                 const loadingMatch = {
//                     id: matches.length + 1,
//                     player1: roundWinners[i],
//                     player2: roundWinners[i + 1],
//                     problem: { id: 'loading', name: 'Loading problem...', url: '#' },
//                     status: 'loading',
//                     winner: null,
//                     player1Solved: false,
//                     player2Solved: false,
//                     player1Time: null,
//                     player2Time: null
//                 };
                
//                 matches.push(loadingMatch);
//             }
//         }
        
//         // Display initial matches with loading indicators
//         displayMatches();
        
//         // Now replace each loading match with actual problem
//         for (const match of matches) {
//             try {
//                 const problem = await getUnsolvedProblem(match.player1.atcoderId, match.player2.atcoderId);
//                 match.problem = problem;
//                 match.status = 'in_progress';
//                 displayMatches(); // Update the display after each problem is fetched
//             } catch (error) {
//                 console.error('Error assigning problem to match:', error);
//             }
//         }
//     }
// }






// Display matches in the UI
function displayMatches() {
    const matchesContainer = document.getElementById('matches-container');
    matchesContainer.innerHTML = '';
    
    matches.forEach(match => {
        const matchCard = document.createElement('div');
        matchCard.className = 'match-card';
        matchCard.id = `match-${match.id}`;
        
        if (match.status === 'completed') {
            if (match.winner === match.player1.id) {
                matchCard.classList.add('player1-won');
            } else {
                matchCard.classList.add('player2-won');
            }
        }
        
        // Match header
        const matchHeader = document.createElement('div');
        matchHeader.className = 'match-header';
        matchHeader.textContent = `Match ${match.id}`;
        
        // Problem info
        const problemInfo = document.createElement('div');
        problemInfo.className = 'problem-info';
        problemInfo.textContent = match.problem.name;
        
        // Player 1
        const player1 = document.createElement('div');
        player1.className = 'player';
        player1.id = `player1-${match.id}`;
        if (match.player1Solved) {
            player1.classList.add('solved');
            if (match.winner === match.player1.id) {
                player1.classList.add('winner');
            }
        }
        
        const player1Info = document.createElement('div');
        player1Info.className = 'player-info';
        
        const player1Name = document.createElement('span');
        player1Name.className = 'player-name-display';
        player1Name.textContent = match.player1.name;
        
        const player1Rating = document.createElement('span');
        player1Rating.className = 'player-rating';
        player1Rating.textContent = match.player1.rating;
        
        // Manual winner button for player 1
        const manualWin1Button = document.createElement('button');
        manualWin1Button.className = 'manual-win-btn';
        manualWin1Button.textContent = '+';
        manualWin1Button.title = 'Mark as winner (admin)';
        manualWin1Button.onclick = () => promptManualWinner(match, match.player1);
        
        player1Info.appendChild(player1Name);
        player1Info.appendChild(player1Rating);
        player1Info.appendChild(manualWin1Button);
        
        const player1Status = document.createElement('div');
        player1Status.className = 'submission-status';
        player1Status.id = `player1-status-${match.id}`;
        player1Status.textContent = match.player1Solved ? 
            `Solved in ${formatTime(match.player1Time)}` : 'Not solved yet';
        
        player1.appendChild(player1Info);
        player1.appendChild(player1Status);
        
        // Versus
        const versus = document.createElement('div');
        versus.className = 'versus';
        versus.textContent = 'VS';
        
        // Player 2
        const player2 = document.createElement('div');
        player2.className = 'player';
        player2.id = `player2-${match.id}`;
        if (match.player2Solved) {
            player2.classList.add('solved');
            if (match.winner === match.player2.id) {
                player2.classList.add('winner');
            }
        }
        
        const player2Info = document.createElement('div');
        player2Info.className = 'player-info';
        
        const player2Name = document.createElement('span');
        player2Name.className = 'player-name-display';
        player2Name.textContent = match.player2.name;
        
        const player2Rating = document.createElement('span');
        player2Rating.className = 'player-rating';
        player2Rating.textContent = match.player2.rating;
        
        // Manual winner button for player 2
        const manualWin2Button = document.createElement('button');
        manualWin2Button.className = 'manual-win-btn';
        manualWin2Button.textContent = '+';
        manualWin2Button.title = 'Mark as winner (admin)';
        manualWin2Button.onclick = () => promptManualWinner(match, match.player2);
        
        player2Info.appendChild(player2Name);
        player2Info.appendChild(player2Rating);
        player2Info.appendChild(manualWin2Button);
        
        const player2Status = document.createElement('div');
        player2Status.className = 'submission-status';
        player2Status.id = `player2-status-${match.id}`;
        player2Status.textContent = match.player2Solved ? 
            `Solved in ${formatTime(match.player2Time)}` : 'Not solved yet';
        
        player2.appendChild(player2Info);
        player2.appendChild(player2Status);
        
        // Problem link
        const problemLink = document.createElement('a');
        problemLink.href = match.problem.url;
        problemLink.className = 'problem-link';
        problemLink.textContent = 'View Problem';
        problemLink.target = '_blank';
        
        // Assemble match card
        matchCard.appendChild(matchHeader);
        matchCard.appendChild(problemInfo);
        matchCard.appendChild(player1);
        matchCard.appendChild(versus);
        matchCard.appendChild(player2);
        matchCard.appendChild(problemLink);
        
        matchesContainer.appendChild(matchCard);
    });
}

// Add this new function to handle manual winner declaration
function promptManualWinner(match, player) {
    // Don't allow manual winner for completed matches
    if (match.status === 'completed') {
        alert('This match is already completed.');
        return;
    }
    
    // Prompt for password
    const passwordInput = prompt('Enter admin password to mark winner:');
    
    if (passwordInput === ADMIN_PASSWORD) {
        // Set player as solved with current time
        if (player.id === match.player1.id) {
            match.player1Solved = true;
            match.player1Time = Math.floor(Date.now() / 1000) - window.tournamentStartTime;
        } else {
            match.player2Solved = true;
            match.player2Time = Math.floor(Date.now() / 1000) - window.tournamentStartTime;
        }
        
        // Declare as winner
        declareWinner(match, player);
        displayMatches();
        checkRoundComplete();
        
        alert(`${player.name} has been manually declared the winner.`);
    } else {
        alert('Invalid password. Action canceled.');
    }
}


// function displayMatches() {
//     const matchesContainer = document.getElementById('matches-container');
//     matchesContainer.innerHTML = '';
    
//     matches.forEach(match => {
//         const matchCard = document.createElement('div');
//         matchCard.className = 'match-card';
//         matchCard.id = `match-${match.id}`;
        
//         if (match.status === 'completed') {
//             if (match.winner === match.player1.id) {
//                 matchCard.classList.add('player1-won');
//             } else {
//                 matchCard.classList.add('player2-won');
//             }
//         }
        
//         // Match header
//         const matchHeader = document.createElement('div');
//         matchHeader.className = 'match-header';
//         matchHeader.textContent = `Match ${match.id}`;
        
//         // Problem info
//         const problemInfo = document.createElement('div');
//         problemInfo.className = 'problem-info';
//         problemInfo.textContent = match.problem.name;
        
//         // Player 1
//         const player1 = document.createElement('div');
//         player1.className = 'player';
//         player1.id = `player1-${match.id}`;
//         if (match.player1Solved) {
//             player1.classList.add('solved');
//             if (match.winner === match.player1.id) {
//                 player1.classList.add('winner');
//             }
//         }
        
//         const player1Info = document.createElement('div');
//         player1Info.className = 'player-info';
        
//         const player1Name = document.createElement('span');
//         player1Name.className = 'player-name-display';
//         player1Name.textContent = match.player1.name;
        
//         const player1Rating = document.createElement('span');
//         player1Rating.className = 'player-rating';
//         player1Rating.textContent = match.player1.rating;
        
//         player1Info.appendChild(player1Name);
//         player1Info.appendChild(player1Rating);
        
//         const player1Status = document.createElement('div');
//         player1Status.className = 'submission-status';
//         player1Status.id = `player1-status-${match.id}`;
//         player1Status.textContent = match.player1Solved ? 
//             `Solved in ${formatTime(match.player1Time)}` : 'Not solved yet';
        
//         player1.appendChild(player1Info);
//         player1.appendChild(player1Status);
        
//         // Versus
//         const versus = document.createElement('div');
//         versus.className = 'versus';
//         versus.textContent = 'VS';
        
//         // Player 2
//         const player2 = document.createElement('div');
//         player2.className = 'player';
//         player2.id = `player2-${match.id}`;
//         if (match.player2Solved) {
//             player2.classList.add('solved');
//             if (match.winner === match.player2.id) {
//                 player2.classList.add('winner');
//             }
//         }
        
//         const player2Info = document.createElement('div');
//         player2Info.className = 'player-info';
        
//         const player2Name = document.createElement('span');
//         player2Name.className = 'player-name-display';
//         player2Name.textContent = match.player2.name;
        
//         const player2Rating = document.createElement('span');
//         player2Rating.className = 'player-rating';
//         player2Rating.textContent = match.player2.rating;
        
//         player2Info.appendChild(player2Name);
//         player2Info.appendChild(player2Rating);
        
//         const player2Status = document.createElement('div');
//         player2Status.className = 'submission-status';
//         player2Status.id = `player2-status-${match.id}`;
//         player2Status.textContent = match.player2Solved ? 
//             `Solved in ${formatTime(match.player2Time)}` : 'Not solved yet';
        
//         player2.appendChild(player2Info);
//         player2.appendChild(player2Status);
        
//         // Problem link
//         const problemLink = document.createElement('a');
//         problemLink.href = match.problem.url;
//         problemLink.className = 'problem-link';
//         problemLink.textContent = 'View Problem';
//         problemLink.target = '_blank';
        
//         // Assemble match card
//         matchCard.appendChild(matchHeader);
//         matchCard.appendChild(problemInfo);
//         matchCard.appendChild(player1);
//         matchCard.appendChild(versus);
//         matchCard.appendChild(player2);
//         matchCard.appendChild(problemLink);
        
//         matchesContainer.appendChild(matchCard);
//     });
// }





// Format time in MM:SS
function formatTime(seconds) {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Start automatically refreshing match status
function startAutoRefresh() {
    // Immediately check once
    checkSubmissions();
    
    // Then set up interval
    if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
    }
    
    refreshIntervalId = setInterval(checkSubmissions, REFRESH_INTERVAL);
    
    // Add a refresh button to the tournament header
    const roundInfo = document.querySelector('.round-info');
    
    // Only add if it doesn't exist yet
    if (!document.getElementById('refresh-button')) {
        const refreshButton = document.createElement('button');
        refreshButton.id = 'refresh-button';
        refreshButton.textContent = 'Refresh Now';
        refreshButton.addEventListener('click', checkSubmissions);
        roundInfo.appendChild(refreshButton);
    }
}

// Stop the auto-refresh
function stopAutoRefresh() {
    if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
        refreshIntervalId = null;
    }
}

// Check for submissions from all players
async function checkSubmissions() {
    // Only check ongoing matches
    const ongoingMatches = matches.filter(match => match.status === 'in_progress');
    
    if (ongoingMatches.length === 0) {
        return;
    }
    
    // Get all player IDs from ongoing matches
    const playerIds = new Set();
    ongoingMatches.forEach(match => {
        playerIds.add(match.player1.atcoderId);
        playerIds.add(match.player2.atcoderId);
    });
    
    // Fetch submissions for all players
    const submissionsPromises = Array.from(playerIds).map(async playerId => {
        try {
            const response = await fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${playerId}&from_second=0`);
            
            if (!response.ok) {
                console.error(`Failed to fetch submissions for ${playerId}`);
                return { playerId, submissions: [] };
            }
            
            const submissions = await response.json();
            return { playerId, submissions };
        } catch (error) {
            console.error(`Error fetching submissions for ${playerId}:`, error);
            return { playerId, submissions: [] };
        }
    });
    
    const submissionsResults = await Promise.all(submissionsPromises);
    
    // Create a map of player ID -> submissions
    const submissionsMap = {};
    submissionsResults.forEach(result => {
        submissionsMap[result.playerId] = result.submissions;
    });
    
    // Store the tournament start time (use actual start time or mock it)
    const tournamentStartTime = window.tournamentStartTime || 
        (Math.floor(Date.now() / 1000) - 3600); // Fallback to 1 hour ago
    
    // Check each match
    let matchesUpdated = false;
    
    ongoingMatches.forEach(match => {
        const player1Submissions = submissionsMap[match.player1.atcoderId] || [];
        const player2Submissions = submissionsMap[match.player2.atcoderId] || [];
        
        // Check if player 1 solved the problem
        const player1AcceptedSubmission = player1Submissions.find(sub => 
            sub.problem_id === match.problem.id && 
            sub.result === 'AC' &&
            sub.epoch_second >= tournamentStartTime
        );
        
        // Check if player 2 solved the problem
        const player2AcceptedSubmission = player2Submissions.find(sub => 
            sub.problem_id === match.problem.id && 
            sub.result === 'AC' &&
            sub.epoch_second >= tournamentStartTime
        );
        
        // Update match status based on submissions
        if (player1AcceptedSubmission && !match.player1Solved) {
            match.player1Solved = true;
            match.player1Time = player1AcceptedSubmission.epoch_second - tournamentStartTime;
            matchesUpdated = true;
        }
        
        if (player2AcceptedSubmission && !match.player2Solved) {
            match.player2Solved = true;
            match.player2Time = player2AcceptedSubmission.epoch_second - tournamentStartTime;
            matchesUpdated = true;
        }
        
        // Determine winner if both solved or one solved
        if ((match.player1Solved || match.player2Solved) && match.status === 'in_progress') {
            // If both solved, the fastest wins
            if (match.player1Solved && match.player2Solved) {
                if (match.player1Time < match.player2Time) {
                    declareWinner(match, match.player1);
                } else {
                    declareWinner(match, match.player2);
                }
                matchesUpdated = true;
            }
            // If only one solved and it's been a while, they win automatically
            // (optional: add time threshold for auto-win)
        }
    });
    
    // Update UI if matches were updated
    if (matchesUpdated) {
        displayMatches();
        checkRoundComplete();
    }
}

// Declare a winner for a match
function declareWinner(match, winner) {
    match.status = 'completed';
    match.winner = winner.id;
    
    // Update player stats
    const winnerPlayer = players.find(p => p.id === winner.id);
    if (winnerPlayer) {
        winnerPlayer.wins++;
        winnerPlayer.rating += RATING_INCREMENT;
    }
    
    // Update matches played for both players
    const player1 = players.find(p => p.id === match.player1.id);
    const player2 = players.find(p => p.id === match.player2.id);
    
    if (player1) player1.matches++;
    if (player2) player2.matches++;
    
    // Update the match object with the latest player data
    match.player1 = player1;
    match.player2 = player2;
}

// Check if the current round is complete
function checkRoundComplete() {
    const allMatchesComplete = matches.every(match => match.status === 'completed');
    
    if (allMatchesComplete) {
        document.getElementById('next-round').disabled = false;
        
        // If it's the final round, we have a tournament winner
        if (currentRound === totalRounds) {
            const winners = players.filter(p => p.wins === currentRound);
            let winnerMessage = 'Tournament complete! ';
            
            if (winners.length === 1) {
                winnerMessage += `The winner is ${winners[0].name}!`;
            } else {
                winnerMessage += `The winners are: ${winners.map(w => w.name).join(', ')}`;
            }
            
            alert(winnerMessage);
        }
    }
}
// function checkRoundComplete() {
//     const allMatchesComplete = matches.every(match => match.status === 'completed');
    
//     if (allMatchesComplete) {
//         document.getElementById('next-round').disabled = false;
        
//         // If it's the final round, we have a tournament winner
//         if (currentRound === totalRounds) {
//             const finalMatch = matches[0];
//             const winnerId = finalMatch.winner;
//             const winner = players.find(p => p.id === winnerId);
            
//             alert(`Tournament complete! The winner is ${winner.name}!`);
//         }
//     }
// }

// Update startNextRound for async operation
async function startNextRound() {
    currentRound++;
    document.getElementById('current-round').textContent = currentRound;
    document.getElementById('next-round').disabled = true;
    
    // Display loading message
    const matchesContainer = document.getElementById('matches-container');
    matchesContainer.innerHTML = '<div class="loading-message">Setting up next round...</div>';
    
    try {
        await createMatches();
        displayMatches();
        
        // If no matches were created (odd number of winners), the tournament is over
        if (matches.length === 0) {
            alert('Tournament complete!');
            showLeaderboard();
        }
    } catch (error) {
        console.error('Error starting next round:', error);
        matchesContainer.innerHTML = '<div class="error-message">Failed to set up next round. Please try again.</div>';
    }
}


// Toggle between tournament and leaderboard views
function toggleLeaderboard() {
    const tournamentSection = document.getElementById('tournament-section');
    const leaderboardSection = document.getElementById('leaderboard-section');
    const toggleButton = document.getElementById('toggle-leaderboard');
    
    if (leaderboardSection.classList.contains('hidden')) {
        // Show leaderboard
        tournamentSection.classList.add('hidden');
        tournamentSection.classList.remove('active');
        leaderboardSection.classList.add('active');
        leaderboardSection.classList.remove('hidden');
        toggleButton.textContent = 'Show Tournament';
        updateLeaderboard();
    } else {
        showTournament();
    }
}

// Show the tournament view
function showTournament() {
    const tournamentSection = document.getElementById('tournament-section');
    const leaderboardSection = document.getElementById('leaderboard-section');
    const toggleButton = document.getElementById('toggle-leaderboard');
    
    tournamentSection.classList.add('active');
    tournamentSection.classList.remove('hidden');
    leaderboardSection.classList.add('hidden');
    leaderboardSection.classList.remove('active');
    toggleButton.textContent = 'Show Leaderboard';
}

// Update the leaderboard with current player stats
function updateLeaderboard() {
    const leaderboardBody = document.getElementById('leaderboard-body');
    leaderboardBody.innerHTML = '';
    
    // Sort players by rating (descending)
    const sortedPlayers = [...players].sort((a, b) => b.rating - a.rating);
    
    sortedPlayers.forEach((player, index) => {
        const row = document.createElement('tr');
        
        const rankCell = document.createElement('td');
        rankCell.textContent = index + 1;
        
        const nameCell = document.createElement('td');
        nameCell.textContent = player.name;
        
        const idCell = document.createElement('td');
        idCell.textContent = player.atcoderId;
        
        const ratingCell = document.createElement('td');
        ratingCell.textContent = player.rating;
        
        const winsCell = document.createElement('td');
        winsCell.textContent = player.wins;
        
        const matchesCell = document.createElement('td');
        matchesCell.textContent = player.matches;
        
        row.appendChild(rankCell);
        row.appendChild(nameCell);
        row.appendChild(idCell);
        row.appendChild(ratingCell);
        row.appendChild(winsCell);
        row.appendChild(matchesCell);
        
        leaderboardBody.appendChild(row);
    });
}

// Show leaderboard directly
function showLeaderboard() {
    const tournamentSection = document.getElementById('tournament-section');
    const leaderboardSection = document.getElementById('leaderboard-section');
    const toggleButton = document.getElementById('toggle-leaderboard');
    
    tournamentSection.classList.add('hidden');
    tournamentSection.classList.remove('active');
    leaderboardSection.classList.add('active');
    leaderboardSection.classList.remove('hidden');
    toggleButton.textContent = 'Show Tournament';
    
    updateLeaderboard();
}
