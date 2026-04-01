import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase 프로젝트 설정
const firebaseConfig = {
  apiKey: "AIzaSyBedFpyeMev1TQ9JRejop4OV3gA973xn-Q",
  authDomain: "tapnow-f07e4.firebaseapp.com",
  projectId: "tapnow-f07e4",
  storageBucket: "tapnow-f07e4.firebasestorage.app",
  messagingSenderId: "714648605866",
  appId: "1:714648605866:web:f8a9874d032c98a51f2cd3",
  measurementId: "G-6BVHMWEKLE"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
