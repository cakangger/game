import { saveScore, getLeaderboard } from './firebase.js';

class GameApp {
    constructor() {
        this.currentGame = 0; // 1 or 2
        this.playerName = '';
        
        // Game state
        this.isPlaying = false;
        this.score = 0;
        this.startTime = 0;
        this.timerInterval = null;
        
        // Screens
        this.menuScreen = document.getElementById('menu-screen');
        this.nameScreen = document.getElementById('name-screen');
        this.game1Screen = document.getElementById('game1-screen');
        this.game2Screen = document.getElementById('game2-screen');
        this.leaderboardScreen = document.getElementById('leaderboard-screen');
        
        // Elements
        this.playerNameInput = document.getElementById('player-name');
        this.nameGameTitle = document.getElementById('name-game-title');
        
        // Game 1
        this.g1Timer = document.getElementById('game1-timer');
        this.g1Score = document.getElementById('game1-score');
        this.g1Btn = document.getElementById('game1-btn');
        
        // Game 2
        this.g2Timer = document.getElementById('game2-timer');
        this.g2Score = document.getElementById('game2-score');
        this.g2Btn = document.getElementById('game2-btn');
    }

    // Navigation
    showScreen(screenElement) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        screenElement.classList.add('active');
    }

    showMenu() {
        this.resetGameState();
        this.showScreen(this.menuScreen);
    }

    selectGame(gameId) {
        this.currentGame = gameId;
        this.nameGameTitle.innerText = gameId === 1 ? 'Game 1: 10 Second Challenge' : 'Game 2: Clicker 1-100';
        this.playerNameInput.value = '';
        this.showScreen(this.nameScreen);
    }

    startGame() {
        const name = this.playerNameInput.value.trim();
        if (!name) {
            alert('Please enter your name to play!');
            return;
        }
        this.playerName = name;
        
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
        clearInterval(this.timerInterval);
    }

    // GAME 1 LOGIC
    prepareGame1() {
        this.resetGameState();
        this.g1Timer.innerText = '10.000';
        this.g1Score.innerText = '0';
        this.g1Btn.innerText = 'CLICK TO START';
        this.g1Btn.disabled = false;
        this.showScreen(this.game1Screen);
    }

    startTimerGame1() {
        this.isPlaying = true;
        this.startTime = performance.now();
        this.g1Btn.innerText = 'CLICK!';
        
        const duration = 10000; // 10 seconds

        const updateTimer = () => {
            if (!this.isPlaying) return;
            const elapsed = performance.now() - this.startTime;
            const remaining = Math.max(0, duration - elapsed);
            
            this.g1Timer.innerText = (remaining / 1000).toFixed(3);

            if (remaining <= 0) {
                this.endGame1();
            } else {
                this.timerInterval = requestAnimationFrame(updateTimer);
            }
        };
        
        this.timerInterval = requestAnimationFrame(updateTimer);
    }

    clickGame1() {
        if (!this.isPlaying) {
            this.startTimerGame1();
        }
        this.score++;
        this.g1Score.innerText = this.score;
        
        // Add click animation
        this.g1Btn.style.transform = 'scale(0.9)';
        setTimeout(() => this.g1Btn.style.transform = 'scale(1)', 50);
    }

    async endGame1() {
        this.isPlaying = false;
        this.g1Timer.innerText = '0.000';
        this.g1Btn.disabled = true;
        
        await saveScore(1, this.playerName, this.score);
        this.showLeaderboard(1);
    }

    // GAME 2 LOGIC
    prepareGame2() {
        this.resetGameState();
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
    async showLeaderboard(gameId) {
        this.showScreen(this.leaderboardScreen);
        
        const title = document.getElementById('leaderboard-title');
        title.innerText = gameId === 1 ? 'Top Clicks (10s)' : 'Fastest Times (100 Clicks)';
        title.style.color = gameId === 1 ? 'var(--neon-red)' : 'var(--neon-fire)';
        title.style.textShadow = `0 0 10px ${gameId === 1 ? 'var(--neon-red-glow)' : 'var(--neon-fire-glow)'}`;
        
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
            
            const scoreText = gameId === 1 ? `${entry.score} clicks` : `${entry.score}s`;
            
            li.innerHTML = `
                <span class="rank">#${index + 1}</span>
                <span class="name">${entry.name}</span>
                <span class="score">${scoreText}</span>
            `;
            list.appendChild(li);
        });
    }
}

// Make app instance available globally
window.app = new GameApp();
