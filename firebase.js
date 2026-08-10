import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    limit,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase only if the user has replaced the config
let app, db;
try {
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log("Firebase initialized successfully.");
    } else {
        console.warn("Firebase config is missing. Please update firebase.js with your project credentials.");
    }
} catch (error) {
    console.error("Error initializing Firebase:", error);
}

/**
 * Save a player's score to Firestore
 * @param {number} gameId - 1 for Game 1, 2 for Game 2
 * @param {string} playerName - The name of the player
 * @param {number} score - Clicks (Game 1) or Time in seconds (Game 2)
 */
export async function saveScore(gameId, playerName, score) {
    if (!db) {
        console.warn("Database not initialized. Score not saved.");
        return false;
    }
    
    try {
        const collectionName = gameId === 1 ? 'leaderboard_game1' : 'leaderboard_game2';
        await addDoc(collection(db, collectionName), {
            name: playerName,
            score: score,
            timestamp: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error adding document: ", error);
        return false;
    }
}

/**
 * Get the top 10 scores for a game
 * @param {number} gameId - 1 for Game 1, 2 for Game 2
 * @returns {Promise<Array>} Array of score objects
 */
export async function getLeaderboard(gameId) {
    if (!db) {
        console.warn("Database not initialized. Returning empty leaderboard.");
        return [];
    }

    try {
        const collectionName = gameId === 1 ? 'leaderboard_game1' : 'leaderboard_game2';
        
        // Game 1: higher clicks is better (descending)
        // Game 2: lower time is better (ascending)
        const sortDirection = gameId === 1 ? 'desc' : 'asc';
        
        const q = query(
            collection(db, collectionName), 
            orderBy('score', sortDirection), 
            limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        const scores = [];
        querySnapshot.forEach((doc) => {
            scores.push(doc.data());
        });
        
        return scores;
    } catch (error) {
        console.error("Error getting leaderboard: ", error);
        return [];
    }
}
