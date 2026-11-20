import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  increment, 
  getDocs, 
  query 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBgl35MhXrJnmbHez8SAt11tG7cDQ_IGiY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "loy-krathong-festival-e043f.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "loy-krathong-festival-e043f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "loy-krathong-festival-e043f.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1083101375704",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1083101375704:web:60766170a08e3d0c54bbad"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const COLLECTION_NAME = 'krathongs';

/**
 * Real-time listener for all genuine user Krathongs
 */
export function subscribeToKrathongs(onUpdate, onError) {
  const krathongCol = collection(db, COLLECTION_NAME);
  return onSnapshot(
    krathongCol,
    (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const id = docSnap.id;
        // Exclude mock seed krathongs (k-1 to k-20)
        if (!/^k-\d+$/.test(id)) {
          items.push({ id, ...data });
        }
      });
      // Sort by newest first
      items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      onUpdate(items);
    },
    (err) => {
      console.warn('Firestore subscription error (will fallback to local):', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Add a new genuine user Krathong to Firestore
 */
export async function addKrathongToFirestore(krathongData) {
  const docRef = doc(db, COLLECTION_NAME, krathongData.id);
  await setDoc(docRef, {
    ...krathongData,
    createdAt: Date.now()
  });
  return krathongData;
}

/**
 * Vote for a Krathong (atomically increments vote count)
 */
export async function voteKrathongInFirestore(krathongId) {
  const docRef = doc(db, COLLECTION_NAME, krathongId);
  await updateDoc(docRef, {
    votes: increment(1)
  });
}

/**
 * Delete a Krathong from Firestore
 */
export async function deleteKrathongFromFirestore(krathongId) {
  const docRef = doc(db, COLLECTION_NAME, krathongId);
  await deleteDoc(docRef);
}

/**
 * Clean up all mock starter krathongs (k-1 to k-20) from Firestore
 */
export async function purgeMockKrathongsFromFirestore() {
  try {
    const mockIds = Array.from({ length: 20 }, (_, i) => `k-${i + 1}`);
    const deletePromises = mockIds.map((id) => deleteDoc(doc(db, COLLECTION_NAME, id)));
    await Promise.all(deletePromises);
    console.log('Successfully purged all mock krathongs (k-1 to k-20) from Firestore');
  } catch (err) {
    console.warn('Failed to purge mock krathongs:', err);
  }
}
