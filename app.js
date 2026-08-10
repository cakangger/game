// Firebase functions (saveScore, getLeaderboard) are now available on the global window object.

class GameApp {
    constructor() {
        this.currentGame = 0; // 1 or 2
        this.playerName = '';
        
        // Game state
        this.isPlaying = false;
        this.score = 0;
        this.startTime = 0;
        this.timerInterval = null;
        
        // Audio
        this.tickAudio = new Audio('./tick.ogg');
        this.tickAudio.loop = true;
        
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            this.audioCtx = new AudioContext();
        }
        
        document.body.addEventListener('click', (e) => {
            const bgAudio = document.getElementById('bg-audio');
            if (bgAudio) {
                bgAudio.play().catch(err => console.log('Autoplay prevented until interaction.'));
            }
            if (e.target.closest('.btn') || e.target.closest('.card') || e.target.closest('.btn-massive') || e.target.closest('.audio-btn')) {
                this.playClickSound();
            }
        });
        
        document.querySelectorAll('.card, .btn, .btn-massive, .audio-btn').forEach(el => {
            el.addEventListener('mouseenter', () => this.playHoverSound());
        });
        
        // Audio UI setup
        this.setupAudioControls();
        
        // Screens
        this.menuScreen = document.getElementById('menu-screen');
        this.nameScreen = document.getElementById('name-screen');
        this.game1Screen = document.getElementById('game1-screen');
        this.game2Screen = document.getElementById('game2-screen');
        this.leaderboardScreen = document.getElementById('leaderboard-screen');
        
        // Elements
        this.playerNameInput = document.getElementById('player-name');
        this.nameGameTitle = document.getElementById('name-game-title');
        this.liveListG1 = document.getElementById('live-list-g1');
        this.liveListG2 = document.getElementById('live-list-g2');
        
        // Game 1
        this.g1Timer = document.getElementById('game1-timer');
        this.g1Score = document.getElementById('game1-score');
        this.g1Btn = document.getElementById('game1-btn');
        this.g1PlayerName = document.getElementById('game1-player-name');
        
        // Game 2
        this.g2Timer = document.getElementById('game2-timer');
        this.g2Score = document.getElementById('game2-score');
        this.g2Btn = document.getElementById('game2-btn');
        this.g2PlayerName = document.getElementById('game2-player-name');
    }

    // Navigation
    showScreen(screenElement, pushHistory = true) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        screenElement.classList.add('active');
        sessionStorage.setItem('currentScreen', screenElement.id);
        
        if (pushHistory) {
            history.pushState({ screen: screenElement.id }, '');
        }
    }

    showMenu(pushHistory = true) {
        this.resetGameState();
        this.showScreen(this.menuScreen, pushHistory);
        this.updateTicker();
    }

    selectGame(gameId) {
        this.currentGame = gameId;
        this.nameGameTitle.innerText = gameId === 1 ? 'Game 1: Exact 10 Seconds' : 'Game 2: STRIKE 100';
        this.playerNameInput.value = '';
        this.showScreen(this.nameScreen);
    }

    setupAudioControls() {
        const bgAudio = document.getElementById('bg-audio');
        const audioToggle = document.getElementById('audio-toggle');
        const volumeSlider = document.getElementById('volume-slider');
        
        if (!bgAudio || !audioToggle || !volumeSlider) return;
        
        audioToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent document body click
            if (bgAudio.paused) {
                bgAudio.play();
                audioToggle.innerText = '🔊';
            } else {
                bgAudio.pause();
                audioToggle.innerText = '🔇';
            }
        });
        
        volumeSlider.addEventListener('input', (e) => {
            bgAudio.volume = e.target.value;
        });
    }

    playHoverSound() {
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.audioCtx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
        
        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.1);
    }

    playClickSound() {
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.6, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
        
        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.1);
    }

    startGame() {
        const name = this.playerNameInput.value.trim();
        if (!name) {
            alert('Please enter your name to play!');
            return;
        }
        this.playerName = name;
        sessionStorage.setItem('playerName', this.playerName);
        sessionStorage.setItem('currentGame', this.currentGame);
        
        if (this.currentGame === 1) {
            this.prepareGame1();
        } else if (this.currentGame === 2) {
            this.prepareGame2();
        }
    }

    restartGame() {
        if (this.currentGame === 1) this.prepareGame1();
        if (this.currentGame === 2) this.prepareGame2();
    }

    resetGameState() {
        this.isPlaying = false;
        this.score = 0;
        if (this.timerInterval) cancelAnimationFrame(this.timerInterval);
        if (this.tickAudio) this.tickAudio.pause();
    }

    initializeLiveLeaderboards() {
        if (!this.liveListG1 || !this.liveListG2) return;

        if (typeof window.subscribeLeaderboard !== 'function') {
            console.error("subscribeLeaderboard not found in firebase.js");
            return;
        }

        // Subscribe to Game 1
        window.subscribeLeaderboard(1, (scores) => {
            this.renderLiveList(this.liveListG1, scores, 1);
        });

        // Subscribe to Game 2
        window.subscribeLeaderboard(2, (scores) => {
            this.renderLiveList(this.liveListG2, scores, 2);
        });
    }

    renderLiveList(listElement, scores, gameId) {
        listElement.innerHTML = ''; // Clear current list

        if (scores.length === 0) {
            listElement.innerHTML = '<li class="live-placeholder">Waiting for players to submit scores...</li>';
            return;
        }

        scores.forEach((entry, index) => {
            const li = document.createElement('li');
            
            // Top player styling
            if (index === 0) {
                li.style.border = '2px solid #ffcc00';
                li.style.boxShadow = '0 0 10px #ffcc00';
                li.style.backgroundColor = 'rgba(255, 204, 0, 0.2)';
            }
            
            const scoreText = gameId === 1 ? `${(entry.rawTime !== undefined ? entry.rawTime : entry.score).toFixed(3)}s` : `${entry.score.toFixed(2)} PWR`;
            const crown = index === 0 ? '👑 ' : '';
            
            li.innerHTML = `
                <span class="name">#${index + 1} ${crown}${entry.name}</span>
                <span class="score">${scoreText}</span>
            `;
            listElement.appendChild(li);
        });
    }

    // GAME 1 LOGIC
    prepareGame1() {
        this.resetGameState();
        this.g1PlayerName.innerText = 'PLAYER READY: ' + this.playerName;
        this.g1Timer.innerText = '0.000';
        this.g1Score.innerText = '0.000';
        this.g1Btn.innerText = 'CLICK TO START';
        this.g1Btn.disabled = false;
        this.showScreen(this.game1Screen);
    }

    startTimerGame1() {
        this.isPlaying = true;
        this.startTime = performance.now();
        this.g1Btn.innerText = 'STOP!';
        
        this.tickAudio.currentTime = 0;
        this.tickAudio.play().catch(e => console.log('Audio play failed', e));
        
        const updateTimer = () => {
            if (!this.isPlaying) return;
            const elapsed = performance.now() - this.startTime;
            const loopedElapsed = elapsed % 10000;
            
            this.g1Timer.innerText = (loopedElapsed / 1000).toFixed(3);
            this.timerInterval = requestAnimationFrame(updateTimer);
        };
        
        this.timerInterval = requestAnimationFrame(updateTimer);
    }

    clickGame1() {
        // Add physical click animation
        this.g1Btn.classList.add('active-press');
        setTimeout(() => this.g1Btn.classList.remove('active-press'), 100);

        if (!this.isPlaying) {
            this.startTimerGame1();
        } else {
            this.endGame1();
        }
    }

    async endGame1() {
        this.isPlaying = false;
        this.tickAudio.pause();
        const elapsed = performance.now() - this.startTime;
        const loopedElapsed = elapsed % 10000;
        const timeInSeconds = loopedElapsed / 1000;
        
        this.g1Timer.innerText = timeInSeconds.toFixed(3);
        
        // Difference from the closest 10-second mark (0 or 10)
        const difference = Math.min(timeInSeconds, 10 - timeInSeconds);
        this.score = parseFloat(difference.toFixed(3));
        const rawTime = parseFloat(timeInSeconds.toFixed(3));
        
        this.g1Score.innerText = rawTime.toFixed(3);
        
        this.g1Btn.disabled = true;
        
        await saveScore(1, this.playerName, this.score, rawTime);
        
        // Show leaderboard after 5 seconds
        setTimeout(() => {
            this.showLeaderboard(1);
        }, 5000);
    }

    // GAME 2 LOGIC (High Striker)
    prepareGame2() {
        this.resetGameState();
        this.g2PlayerName = document.getElementById('game2-player-name');
        this.g2PlayerName.innerText = 'PLAYER READY: ' + this.playerName;
        
        this.strikerScoreVal = document.getElementById('game2-score-val');
        this.strikerScoreVal.innerText = '0.00';
        
        this.strikerPuck = document.getElementById('striker-puck');
        this.strikerPuck.style.bottom = '0%';
        
        this.strikerBell = document.getElementById('striker-bell');
        this.strikerBell.classList.remove('ring');
        
        this.g2Btn = document.getElementById('game2-btn');
        this.g2Btn.innerText = 'START!';
        this.g2Btn.disabled = false;
        
        this.showScreen(this.game2Screen);
    }

    startTimerGame2() {
        this.isPlaying = true;
        this.startTime = performance.now();
        this.g2Btn.innerText = 'STRIKE!';

        const updateStriker = () => {
            if (!this.isPlaying) return;
            const elapsed = performance.now() - this.startTime;
            
            // Triangle wave logic (0 to 100 to 0) over 1200ms
            const period = 1200; 
            // Sine wave for smoother acceleration/deceleration
            const power = (Math.sin((elapsed / period) * Math.PI * 2 - (Math.PI / 2)) + 1) / 2 * 100;

            this.score = power;
            this.strikerScoreVal.innerText = power.toFixed(2);
            this.strikerPuck.style.bottom = `${power}%`;

            if (power > 99.0) {
                this.strikerBell.classList.add('ring');
            } else {
                this.strikerBell.classList.remove('ring');
            }

            this.timerInterval = requestAnimationFrame(updateStriker);
        };
        
        this.timerInterval = requestAnimationFrame(updateStriker);
    }

    strikeGame2() {
        if (!this.isPlaying) {
            this.startTimerGame2();
            return;
        }
        
        // Add click animation to button
        this.g2Btn.style.transform = 'scale(0.9)';
        setTimeout(() => this.g2Btn.style.transform = 'scale(1)', 50);
        
        this.endGame2();
    }

    async endGame2() {
        this.isPlaying = false;
        cancelAnimationFrame(this.timerInterval);
        this.g2Btn.disabled = true;
        
        const finalScore = parseFloat(this.score.toFixed(2));
        this.strikerScoreVal.innerText = finalScore.toFixed(2);
        
        if (finalScore >= 98.0) {
            this.strikerBell.classList.add('ring');
        }

        await saveScore(2, this.playerName, finalScore);
        
        setTimeout(() => {
            this.showLeaderboard(2);
        }, 3000); // 3 second delay to see score
    }

    // LEADERBOARD LOGIC
    async showLeaderboard(gameId, fromMenu = false) {
        this.showScreen(this.leaderboardScreen);
        
        const title = document.getElementById('leaderboard-title');
        title.innerText = gameId === 1 ? 'Closest to 10 Seconds' : 'Highest Power (Max 100)';
        title.style.color = gameId === 1 ? 'var(--neon-red)' : 'var(--neon-fire)';
        title.style.textShadow = `0 0 10px ${gameId === 1 ? 'var(--neon-red-glow)' : 'var(--neon-fire-glow)'}`;
        
        // Hide "Play Again" if opened directly from menu
        const playAgainBtn = this.leaderboardScreen.querySelector('.btn-primary');
        if (fromMenu) {
            playAgainBtn.style.display = 'none';
        } else {
            playAgainBtn.style.display = 'block';
        }

        
        const list = document.getElementById('leaderboard-list');
        const loading = document.getElementById('loading-leaderboard');
        
        list.innerHTML = '';
        loading.style.display = 'block';

        const scores = await getLeaderboard(gameId);
        
        loading.style.display = 'none';
        
        if (scores.length === 0) {
            list.innerHTML = '<li><span class="name">No scores yet! (Or database not connected)</span></li>';
            return;
        }

        scores.forEach((entry, index) => {
            const li = document.createElement('li');
            li.className = `rank-${index + 1}`;
            
            if (index === 0) {
                li.style.border = '2px solid #ffcc00';
                li.style.boxShadow = '0 0 15px #ffcc00';
                li.style.backgroundColor = 'rgba(255, 204, 0, 0.3)';
            } else if (entry.name === this.playerName && entry.score === this.score) {
                li.style.backgroundColor = 'rgba(255, 204, 0, 0.3)';
                li.style.border = '2px solid var(--neon-fire)';
                li.style.boxShadow = '0 0 10px var(--neon-fire-glow)';
            }
            
            const scoreText = gameId === 1 ? `${(entry.rawTime !== undefined ? entry.rawTime : entry.score).toFixed(3)}s` : `${entry.score.toFixed(2)} PWR`;
            const crown = index === 0 ? '👑 ' : '';
            
            li.innerHTML = `
                <span class="rank">#${index + 1}</span>
                <span class="name">${crown}${entry.name}</span>
                <span class="score">${scoreText}</span>
            `;
            list.appendChild(li);
        });
    }
}

// Make app instance available globally
window.app = new GameApp();

// Restore session state on refresh
const savedScreen = sessionStorage.getItem('currentScreen');
const savedPlayer = sessionStorage.getItem('playerName');
const savedGame = sessionStorage.getItem('currentGame');

if (savedPlayer) window.app.playerName = savedPlayer;
if (savedGame) window.app.currentGame = parseInt(savedGame);

if (savedScreen === 'game1-screen' && savedPlayer) {
    window.app.prepareGame1();
} else if (savedScreen === 'game2-screen' && savedPlayer) {
    window.app.prepareGame2();
} else if (savedScreen === 'name-screen') {
    window.app.playerNameInput.value = savedPlayer || '';
    window.app.showScreen(window.app.nameScreen);
} else if (savedScreen === 'leaderboard-screen') {
    if (savedGame) {
        window.app.showLeaderboard(window.app.currentGame, true);
    } else {
        window.app.showMenu();
    }
} else {
    window.app.initializeLiveLeaderboards(); // Load live split leaderboards on initial load
}

// Handle Browser Back Button Navigation
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.screen) {
        const screen = document.getElementById(event.state.screen);
        if (screen) {
            window.app.showScreen(screen, false);
            return;
        }
    }
    // Fallback to menu if no state
    window.app.showMenu(false);
});
