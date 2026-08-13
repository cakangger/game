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
window.saveScore = async function(gameId, playerName, score, rawTime = null) {
    if (!db) {
        console.warn("Database not initialized. Score not saved.");
        return false;
    }
    
    try {
        const collectionName = gameId === 1 ? 'leaderboard_game1' : 'leaderboard_game2';
        const data = {
            name: playerName,
            score: score,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (rawTime !== null) {
            data.rawTime = rawTime;
        }
        await db.collection(collectionName).add(data);
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
        const sortDirection = gameId === 1 ? 'asc' : 'desc';
        
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

/**
 * Subscribe to real-time leaderboard updates
 */
window.subscribeLeaderboard = function(gameId, callback) {
    if (!db) {
        console.warn("Database not initialized. Cannot subscribe.");
        return () => {}; // return empty unsubscribe function
    }

    const collectionName = gameId === 1 ? 'leaderboard_game1' : 'leaderboard_game2';
    const sortDirection = gameId === 1 ? 'asc' : 'desc';
    
    return db.collection(collectionName)
        .orderBy('score', sortDirection)
        .limit(10)
        .onSnapshot((querySnapshot) => {
            const scores = [];
            querySnapshot.forEach((doc) => {
                scores.push(doc.data());
            });
            callback(scores);
        }, (error) => {
            console.error("Error listening to leaderboard: ", error);
        });
};

/**
 * Reset all scores for a game (Batch deletion)
 */
window.resetLeaderboard = async function(gameId) {
    if (!db) {
        console.warn("Database not initialized. Cannot reset.");
        return false;
    }

    try {
        const collectionName = gameId === 1 ? 'leaderboard_game1' : 'leaderboard_game2';
        const querySnapshot = await db.collection(collectionName).get();
        
        // Firestore batch has a limit of 500 writes, but for 5-10 records it's perfectly fine
        const batch = db.batch();
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        return true;
    } catch (error) {
        console.error("Error resetting leaderboard: ", error);
        return false;
    }
};

/**
 * Verify Admin Credentials
 */
window.verifyAdmin = async function(username, password) {
    if (!db) {
        console.warn("Database not initialized. Cannot verify admin.");
        return false;
    }

    try {
        const docRef = db.collection('admins').doc(username);
        const docSnap = await docRef.get();
        
        if (docSnap.exists) {
            const data = docSnap.data();
            if (data.password === password) {
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error("Error verifying admin: ", error);
        return false; // Typically fails due to 403 Forbidden if rules are strict
    }
};
