
import { SearchSession } from '../types';
import { db } from './firebase';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: undefined, // Add auth checking here if needed, or omit for now
      },
      operationType,
      path
    }
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
}

export const getSessions = async (userId: string): Promise<SearchSession[]> => {
  if (!userId) return [];
  const pathForGetDocs = `users/${userId}/sessions`;
  try {
    const querySnapshot = await getDocs(collection(db, pathForGetDocs));
    const sessions: SearchSession[] = [];
    querySnapshot.forEach((doc) => {
      sessions.push(doc.data() as SearchSession);
    });
    // Sort so newest is first
    return sessions.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Failed to load sessions from storage", error);
    handleFirestoreError(error, OperationType.GET, pathForGetDocs);
    return [];
  }
};

export const saveSession = async (userId: string, session: SearchSession) => {
  if (!userId) return;
  const pathForWrite = `users/${userId}/sessions`;
  try {
      const sessionData = JSON.parse(JSON.stringify({
          ...session,
          userId // Ensure userId is attached for rules validation
      }));
      await setDoc(doc(db, pathForWrite, session.id), sessionData);
  } catch (error) {
      console.error("Failed to save session", error);
      handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
};

export const deleteSession = async (userId: string, sessionId: string) => {
  if (!userId || !sessionId) return;
  const pathForWrite = `users/${userId}/sessions`;
  try {
      await deleteDoc(doc(db, pathForWrite, sessionId));
  } catch (error) {
      console.error("Failed to delete session", error);
      handleFirestoreError(error, OperationType.DELETE, pathForWrite);
  }
};
