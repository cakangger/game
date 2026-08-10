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
        
        document.body.addEventListener('click', () => {
            const bgAudio = document.getElementById('bg-audio');
            if (bgAudio) {
                bgAudio.play().catch(e => console.log('Autoplay prevented until interaction.'));
            }
        }, { once: true });
        
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
    showScreen(screenElement) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        screenElement.classList.add('active');
        sessionStorage.setItem('currentScreen', screenElement.id);
    }

    showMenu() {
        this.resetGameState();
        this.showScreen(this.menuScreen);
        this.updateTicker();
    }

    selectGame(gameId) {
        this.currentGame = gameId;
        this.nameGameTitle.innerText = gameId === 1 ? 'Game 1: Exact 10 Seconds' : 'Game 2: Clicker 1-100';
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
            const scoreText = gameId === 1 ? `${entry.score.toFixed(3)}s off` : `${entry.score.toFixed(3)}s`;
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
            
            this.g1Timer.innerText = (elapsed / 1000).toFixed(3);
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
        const timeInSeconds = elapsed / 1000;
        this.g1Timer.innerText = timeInSeconds.toFixed(3);
        
        // Calculate absolute difference from 10.000 seconds
        const difference = Math.abs(10 - timeInSeconds);
        this.score = parseFloat(difference.toFixed(3));
        this.g1Score.innerText = this.score.toFixed(3);
        
        this.g1Btn.disabled = true;
        
        await saveScore(1, this.playerName, this.score);
        
        // Show leaderboard after 5 seconds
        setTimeout(() => {
            this.showLeaderboard(1);
        }, 5000);
    }

    // GAME 2 LOGIC
    prepareGame2() {
        this.resetGameState();
        this.g2PlayerName.innerText = 'PLAYER READY: ' + this.playerName;
        this.g2Timer.innerText = '0.000';
        this.g2Score.innerText = '0';
        this.g2Btn.innerText = 'CLICK TO START';
        this.g2Btn.disabled = false;
        this.showScreen(this.game2Screen);
    }

    startTimerGame2() {
        this.isPlaying = true;
        this.startTime = performance.now();
        this.g2Btn.innerText = 'CLICK!';

        const updateTimer = () => {
            if (!this.isPlaying) return;
            const elapsed = performance.now() - this.startTime;
            this.g2Timer.innerText = (elapsed / 1000).toFixed(3);
            this.timerInterval = requestAnimationFrame(updateTimer);
        };
        
        this.timerInterval = requestAnimationFrame(updateTimer);
    }

    clickGame2() {
        if (this.score >= 100) return; // Prevent extra clicks

        if (!this.isPlaying) {
            this.startTimerGame2();
        }
        
        this.score++;
        this.g2Score.innerText = this.score;

        // Add click animation
        this.g2Btn.style.transform = 'scale(0.9)';
        setTimeout(() => this.g2Btn.style.transform = 'scale(1)', 50);

        if (this.score >= 100) {
            this.endGame2();
        }
    }

    async endGame2() {
        this.isPlaying = false;
        const elapsed = performance.now() - this.startTime;
        const timeInSeconds = parseFloat((elapsed / 1000).toFixed(3));
        this.g2Timer.innerText = timeInSeconds.toFixed(3);
        this.g2Btn.disabled = true;

        await saveScore(2, this.playerName, timeInSeconds);
        this.showLeaderboard(2);
    }

    // LEADERBOARD LOGIC
    async showLeaderboard(gameId, fromMenu = false) {
        this.showScreen(this.leaderboardScreen);
        
        const title = document.getElementById('leaderboard-title');
        title.innerText = gameId === 1 ? 'Most Accurate (Difference from 10s)' : 'Fastest Times (100 Clicks)';
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
            
            if (entry.name === this.playerName && entry.score === this.score) {
                li.style.backgroundColor = 'rgba(255, 204, 0, 0.3)';
                li.style.border = '2px solid var(--neon-fire)';
                li.style.boxShadow = '0 0 10px var(--neon-fire-glow)';
            }
            
            const scoreText = gameId === 1 ? `${entry.score.toFixed(3)}s off` : `${entry.score.toFixed(3)}s`;
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
