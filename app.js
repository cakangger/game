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
        
        // Screens
        this.menuScreen = document.getElementById('menu-screen');
        this.nameScreen = document.getElementById('name-screen');
        this.game1Screen = document.getElementById('game1-screen');
        this.game2Screen = document.getElementById('game2-screen');
        this.leaderboardScreen = document.getElementById('leaderboard-screen');
        
        // Elements
        this.playerNameInput = document.getElementById('player-name');
        this.nameGameTitle = document.getElementById('name-game-title');
        this.menuTicker = document.getElementById('menu-ticker');
        
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

    async updateTicker() {
        if (!this.menuTicker) return;
        
        try {
            const g1Scores = await window.getLeaderboard(1);
            const g2Scores = await window.getLeaderboard(2);
            
            let tickerHtml = '';
            
            if (g1Scores && g1Scores.length > 0) {
                tickerHtml += `<span class="ticker-text ticker-g1">🏆 GAME 1 TOP PLAYERS: `;
                const names = g1Scores.slice(0, 5).map((s, i) => `#${i+1} ${s.name} (${s.score.toFixed(3)}s off)`).join(' 🔹 ');
                tickerHtml += names + `</span><span class="ticker-sep">||</span>`;
            }
            
            if (g2Scores && g2Scores.length > 0) {
                tickerHtml += `<span class="ticker-text ticker-g2">🔥 GAME 2 TOP PLAYERS: `;
                const names = g2Scores.slice(0, 5).map((s, i) => `#${i+1} ${s.name} (${s.score.toFixed(3)}s)`).join(' 🔹 ');
                tickerHtml += names + `</span><span class="ticker-sep">||</span>`;
            }
            
            if (tickerHtml === '') {
                tickerHtml = '<span class="ticker-text">BE THE FIRST TO SET A RECORD IN THE FESTIVAL DATABASE!</span>';
            } else {
                // Duplicate it a few times so the scrolling is continuous
                tickerHtml = tickerHtml + tickerHtml + tickerHtml + tickerHtml;
            }
            
            this.menuTicker.innerHTML = tickerHtml;
        } catch (e) {
            console.error("Error updating ticker", e);
        }
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
        const elapsed = performance.now() - this.startTime;
        const timeInSeconds = elapsed / 1000;
        this.g1Timer.innerText = timeInSeconds.toFixed(3);
        
        // Calculate absolute difference from 10.000 seconds
        const difference = Math.abs(10 - timeInSeconds);
        this.score = parseFloat(difference.toFixed(3));
        this.g1Score.innerText = this.score.toFixed(3);
        
        this.g1Btn.disabled = true;
        
        await saveScore(1, this.playerName, this.score);
        this.showLeaderboard(1);
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
            
            const scoreText = gameId === 1 ? `${entry.score.toFixed(3)}s off` : `${entry.score.toFixed(3)}s`;
            
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
window.app.updateTicker(); // Load ticker on initial load
