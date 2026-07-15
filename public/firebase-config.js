import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// The user's provided Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD0ZoxjJ72zIsqivr2wn1_H7M76loAq8kI",
  authDomain: "studio-1560217422-e282c.firebaseapp.com",
  projectId: "studio-1560217422-e282c",
  storageBucket: "studio-1560217422-e282c.firebasestorage.app",
  messagingSenderId: "871363060347",
  appId: "1:871363060347:web:08ffcd201ce147060c38de"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
