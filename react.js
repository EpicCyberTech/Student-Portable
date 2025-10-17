import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';

// --- Firebase Config (Integrated) ---
const firebaseConfig = {
  apiKey: "AIzaSyDFD0ilbHx70I-1Z1vtMVmnx6mLt30Pf44",
  authDomain: "student-portal-6c104.firebaseapp.com",
  projectId: "student-portal-6c104",
  storageBucket: "student-portal-6c104.firebasestorage.app",
  messagingSenderId: "386568197727",
  appId: "1:386568197727:web:4007afb1df2df05ce52dea",
  measurementId: "G-VR4YZLTG72"
};

// --- Firebase Initialization ---
let firebaseApp, db, auth;
try {
  firebaseApp = initializeApp(firebaseConfig);
  db = getFirestore(firebaseApp);
  auth = getAuth(firebaseApp);
} catch (e) {
  console.error("Firebase initialization failed:", e);
  db = null;
  auth = null;
}

// --- Constants ---
const STANDARD_SUBJECT_MODEL = () => ({
  assignments: Array(10).fill(0),
  quizzes: Array(5).fill(0),
  vivas: Array(3).fill(0),
  midSem: 0,
  finalSem: 0,
});

const SEMESTER_1_SUBJECTS = {
  'Applied Physics Theory': STANDARD_SUBJECT_MODEL(),
  'Applied Physics Lab': STANDARD_SUBJECT_MODEL(),
  'Programming Fundamental Theory': {
    ...STANDARD_SUBJECT_MODEL(),
    pbls: Array(3).fill(0),
  },
  'Programming Fundamental Lab': STANDARD_SUBJECT_MODEL(),
  'Islamic Studies': STANDARD_SUBJECT_MODEL(),
  'Ideology of Pakistan': STANDARD_SUBJECT_MODEL(),
  'English': STANDARD_SUBJECT_MODEL(),
  'AICT': STANDARD_SUBJECT_MODEL(),
};

const SEMESTER_MAP = {
  1: 'Fall 2024 (Current)',
  2: 'Spring 2025',
  3: 'Fall 2025',
  4: 'Spring 2026',
  5: 'Fall 2026',
  6: 'Spring 2027',
  7: 'Fall 2027',
  8: 'Spring 2028',
};

// --- Firestore Helpers ---
const getUserProfileDocRef = (userId) => doc(db, 'artifacts', 'student-portal', 'users', userId, 'profile', 'data');
const getMarksheetDocRef = (userId, semester) => doc(db, 'artifacts', 'student-portal', 'users', userId, 'marks', `semester_${semester}`);

// --- UI Components ---
const MarkInput = ({ value, onChange }) => (
  <input
    type="number"
    min="0"
    max="100"
    value={value === 0 ? '' : value}
    onChange={(e) => {
      const val = parseInt(e.target.value, 10);
      onChange(isNaN(val) ? 0 : Math.min(100, Math.max(0, val)));
    }}
    className="w-12 h-8 text-sm text-center border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
  />
);

const MarksCategory = ({ title, marks, onUpdate }) => (
  <div>
    <h4 className="text-md font-semibold text-gray-700 mb-2">{title}</h4>
    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border">
      {marks.map((mark, index) => (
        <div key={index} className="flex flex-col items-center">
          <span className="text-xs text-gray-500 mb-1">#{index + 1}</span>
          <MarkInput value={mark} onChange={(value) => onUpdate(index, value)} />
        </div>
      ))}
    </div>
  </div>
);

const SingleMark = ({ title, value, onUpdate }) => (
  <div className="flex flex-col items-start">
    <h4 className="text-md font-semibold text-gray-700 mb-2">{title}</h4>
    <MarkInput value={value} onChange={onUpdate} />
  </div>
);

const MarksheetComponent = ({ userId, currentSemester, marksData, setMarksData }) => {
  const subjects = marksData ? Object.keys(marksData) : Object.keys(SEMESTER_1_SUBJECTS);
  const semName = SEMESTER_MAP[currentSemester] || `Semester ${currentSemester}`;

  const updateMark = useCallback((subject, category, index, newValue) => {
    const updatedMarks = { ...marksData };
    if (index !== null) updatedMarks[subject][category][index] = newValue;
    else updatedMarks[subject][category] = newValue;
    setMarksData(updatedMarks);

    if (db) {
      const docRef = getMarksheetDocRef(userId, currentSemester);
      setDoc(docRef, updatedMarks, { merge: true }).catch(console.error);
    }
  }, [userId, currentSemester, marksData, setMarksData]);

  const calculateTotal = (subjectData) => {
    if (!subjectData) return 0;
    let total = 0;
    ['assignments', 'quizzes', 'vivas', 'pbls'].forEach(cat => {
      if (Array.isArray(subjectData[cat])) total += subjectData[cat].reduce((a, b) => a + b, 0);
    });
    total += (subjectData.midSem || 0) + (subjectData.finalSem || 0);
    return total;
  };

  return (
    <div className="p-4 md:p-8 w-full">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-6 border-b pb-2">{semName} Mark Sheet</h1>
      <div className="space-y-10">
        {subjects.map(subject => {
          const data = marksData[subject];
          const totalMarks = calculateTotal(data);
          return (
            <div key={subject} className="bg-white p-6 rounded-xl shadow-xl border-t-4 border-blue-500">
              <h2 className="text-xl font-bold text-blue-700 mb-4 flex justify-between items-center">
                {subject}
                <span className="text-sm bg-blue-100 px-3 py-1 rounded-full">Total: {totalMarks}</span>
              </h2>
              <div className="space-y-4">
                {data.assignments && <MarksCategory title="Assignments (10)" marks={data.assignments} onUpdate={(i, v) => updateMark(subject, 'assignments', i, v)} />}
                {data.quizzes && <MarksCategory title="Quizzes (5)" marks={data.quizzes} onUpdate={(i, v) => updateMark(subject, 'quizzes', i, v)} />}
                {data.vivas && <MarksCategory title="Vivas (3)" marks={data.vivas} onUpdate={(i, v) => updateMark(subject, 'vivas', i, v)} />}
                {data.pbls && <MarksCategory title="PBLs (3)" marks={data.pbls} onUpdate={(i, v) => updateMark(subject, 'pbls', i, v)} />}
                <div className="flex gap-6 border-t pt-4 mt-4">
                  <SingleMark title="Mid-Semester" value={data.midSem} onUpdate={(v) => updateMark(subject, 'midSem', null, v)} />
                  <SingleMark title="Final-Semester" value={data.finalSem} onUpdate={(v) => updateMark(subject, 'finalSem', null, v)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Main App ---
const App = () => {
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [view, setView] = useState('loading');
  const [currentSemester, setCurrentSemester] = useState(1);
  const [marksData, setMarksData] = useState(null);

  useEffect(() => {
    if (!auth || !db) {
      setView('error');
      return;
    }

    const signInUser = async () => {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.error("Auth sign-in failed:", e);
      }
    };
    signInUser();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const docRef = getUserProfileDocRef(user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
          setCurrentSemester(docSnap.data().startSemester || 1);
          setView('portal');
        } else {
          await setDoc(docRef, { startSemester: 1 });
          setUserProfile({ startSemester: 1 });
          setView('portal');
        }
      } else setView('auth');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db || !userId || !userProfile || !currentSemester) return;
    const docRef = getMarksheetDocRef(userId, currentSemester);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) setMarksData(snap.data());
      else {
        setDoc(docRef, SEMESTER_1_SUBJECTS);
        setMarksData(SEMESTER_1_SUBJECTS);
      }
    });
    return () => unsubscribe();
  }, [userId, userProfile, currentSemester]);

  if (view === 'error') return <div>Error initializing Firebase.</div>;
  if (view === 'loading') return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {marksData && (
        <MarksheetComponent
          userId={userId}
          currentSemester={currentSemester}
          marksData={marksData}
          setMarksData={setMarksData}
        />
      )}
    </div>
  );
};

export default App;