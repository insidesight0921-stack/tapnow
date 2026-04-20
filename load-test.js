import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';
import dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loadTest = async () => {
  const email = 'loadtest90@tapnow.com';
  const password = 'password123';
  
  let user;
  try {
    user = (await signInWithEmailAndPassword(auth, email, password)).user;
    console.log('Logged into existing test account');
  } catch (e) {
    user = (await createUserWithEmailAndPassword(auth, email, password)).user;
    console.log('Created new test account');
    await setDoc(doc(db, 'gyms', user.uid), {
      gymName: 'Load Test Gym',
      ownerEmail: email,
      registeredAt: new Date().toISOString().split('T')[0],
      memberCount: 0,
      plan: 'free',
      planExpireDate: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0],
      status: 'active'
    });
  }

  const membersRef = collection(db, 'gyms', user.uid, 'members');
  console.log('Adding 90 members...');

  const promises = [];
  for (let i = 1; i <= 90; i++) {
    promises.push(
      addDoc(membersRef, {
        name: `LoadTest Member ${i}`,
        phone: `010-0000-${i.toString().padStart(4, '0')}`,
        belt: '화이트',
        gral: 0,
        registerDate: new Date().toISOString().split('T')[0],
        startDate: new Date().toISOString().split('T')[0],
        plans: [],
        paymentMethod: '카드',
        paymentAmount: 0,
        memo: 'Load Test'
      })
    );
  }

  await Promise.all(promises);
  console.log('Added 90 members successfully.');
  process.exit(0);
};

loadTest();
