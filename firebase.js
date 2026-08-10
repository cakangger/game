// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDzbfZFbZfiA0I5T-z6TEZKFjm9PP8NZB8",
  authDomain: "game-a43da.firebaseapp.com",
  projectId: "game-a43da",
  storageBucket: "game-a43da.firebasestorage.app",
  messagingSenderId: "461437277122",
  appId: "1:461437277122:web:d36665f318d4037d7afc5b",
  measurementId: "G-3RTB0EN9YW"
};

let db = null;

// Initialize Firebase only if the user has replaced the config
try {
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log("Firebase initialized successfully.");
    } else {
        console.warn("Firebase config is missing. Please update firebase.js with your project credentials.");
    }
} catch (error) {
    console.error("Error initializing Firebase:", error);
}

/**
 * Save a player's score to Firestore
 */
window.saveScore = async function(gameId, playerName, score) {
    if (!db) {
        console.warn("Database not initialized. Score not saved.");
        return false;
    }
    
    try {
        const collectionName = gameId === 1 ? 'leaderboard_game1' : 'leaderboard_game2';
        await db.collection(collectionName).add({
            name: playerName,
            score: score,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error adding document: ", error);
        return false;
    }
};

/**
 * Get the top 10 scores for a game
 */
window.getLeaderboard = async function(gameId) {
    if (!db) {
        console.warn("Database not initialized. Returning empty leaderboard.");
        return [];
    }

    try {
        const collectionName = gameId === 1 ? 'leaderboard_game1' : 'leaderboard_game2';
        const sortDirection = 'asc'; // Both games want the lowest score now (closest to 10s, or lowest time)
        
        const querySnapshot = await db.collection(collectionName)
            .orderBy('score', sortDirection)
            .limit(10)
            .get();
            
        const scores = [];
        querySnapshot.forEach((doc) => {
            scores.push(doc.data());
        });
        
        return scores;
    } catch (error) {
        console.error("Error getting leaderboard: ", error);
        return [];
    }
};
