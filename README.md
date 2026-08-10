# Great Festival Clicker Games

Welcome to the **Great Festival Clicker Games**, a high-intensity neon arcade experience right in your browser!

## The Games

### Game 1: 10 Second Challenge (Red Neon)
Test your ultimate clicking speed. You have exactly 10 seconds to click the massive glowing button as many times as possible. Every millisecond counts!

### Game 2: Clicker 1-100 (Fire Neon)
A race against the clock! How fast can you reach exactly 100 clicks? The timer starts as soon as you click the button for the first time. The lower the time, the better your rank.

## How to Play Locally

Since this game is built with pure HTML, CSS, and JavaScript, you don't need any complex build tools to run it.

1. Open the project folder (`D:\SRIN Project\Game`).
2. Double-click on `index.html` to open it in your default web browser.
3. Choose a game, enter your name, and start clicking!

*Note: For the best experience and to avoid CORS issues with ES Modules, we recommend opening the folder in VS Code and using the **Live Server** extension.*

## Firebase Setup

This game is designed to store player records on a Firebase Cloud Firestore database.

To enable the database:
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Enable **Firestore Database** in your project (Start in Test Mode or configure proper security rules).
3. Register a web app in your Firebase project settings to get your configuration object.
4. Open `firebase.js` in this project.
5. Replace the placeholder `firebaseConfig` object with your actual config.

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

Once updated, the game will automatically connect and save scores to the `leaderboard_game1` and `leaderboard_game2` collections!

## Deployment

You can host this game entirely for free on **GitHub Pages**, **Firebase Hosting**, or **Vercel** because it's a static web app. Just push the code to your repository and enable Pages!
