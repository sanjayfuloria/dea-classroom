/**
 * api.js — Zero-cost edition.
 *
 * All DEA computation now runs in the browser (solver.js + interpreter.js).
 * This file handles only Firestore persistence (auth already managed by Firebase).
 *
 * No backend server. No Cloud Run. No bills.
 */
import { db, auth } from './firebase'
import {
  collection, doc, addDoc, getDoc, getDocs, setDoc,
  query, where, orderBy, limit, serverTimestamp,
} from 'firebase/firestore'

// ── Sessions ──────────────────────────────────────────────────────────────────
export async function saveSession(data) {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')
  const ref = await addDoc(collection(db, 'sessions'), {
    ...data, userId: uid, createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function getSession(sessionId) {
  const snap = await getDoc(doc(db, 'sessions', sessionId))
  if (!snap.exists()) throw new Error('Session not found')
  return { id: snap.id, ...snap.data() }
}

export async function getMySessions() {
  const uid = auth.currentUser?.uid
  if (!uid) return []
  const q = query(
    collection(db, 'sessions'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(30),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── Faculty: all sessions ─────────────────────────────────────────────────────
export async function getAllSessions() {
  const q = query(collection(db, 'sessions'), orderBy('createdAt', 'desc'), limit(100))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── Uploaded datasets ─────────────────────────────────────────────────────────
export async function saveUploadedDataset(data) {
  const uid = auth.currentUser?.uid
  const ref = await addDoc(collection(db, 'datasets'), {
    ...data, ownerId: uid, createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function getUploadedDatasets() {
  const uid = auth.currentUser?.uid
  if (!uid) return []
  const q = query(collection(db, 'datasets'), where('ownerId', '==', uid))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── Courses ───────────────────────────────────────────────────────────────────
export async function getCourses(facultyId) {
  const q = query(collection(db, 'courses'), where('facultyId', '==', facultyId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function createCourse(title, description, facultyId) {
  const ref = await addDoc(collection(db, 'courses'), {
    title, description: description || '', facultyId,
    enrolledStudents: [], createdAt: serverTimestamp(),
  })
  return { id: ref.id, title }
}

// ── Python execution history ──────────────────────────────────────────────────
export async function savePythonRun(sessionId, code, output, error) {
  const uid = auth.currentUser?.uid
  await addDoc(collection(db, 'python_runs'), {
    sessionId, code, output, error: error || null,
    userId: uid, timestamp: serverTimestamp(),
  })
}
