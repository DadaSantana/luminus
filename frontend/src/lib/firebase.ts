import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAsfA0WskfAlUG63PaNgEIOGopMZj2DskA",
  authDomain: "luminus-aca84.firebaseapp.com",
  projectId: "luminus-aca84",
  storageBucket: "luminus-aca84.firebasestorage.app",
  messagingSenderId: "158050675590",
  appId: "1:158050675590:web:3c536b895e986443e79a07",
  measurementId: "G-0C1R934R9C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;