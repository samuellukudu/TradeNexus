import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import { readFileSync } from 'fs';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';

const projectId = 'demo-tradenexus';
let testEnv: any;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: projectId,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('TradeNexus Firestore Rules - Sessions', () => {
  it('should deny unauthorized access', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const sessionDoc = doc(unauthedDb, 'users/user1/sessions/session1');
    await assertFails(getDoc(sessionDoc));
  });

  it('should allow user to create their own session', async () => {
    const authedDb = testEnv.authenticatedContext('user1').firestore();
    const sessionDoc = doc(authedDb, 'users/user1/sessions/session1');
    await assertSucceeds(setDoc(sessionDoc, {
      userId: 'user1',
      createdAt: 123456789,
      name: 'Test Session',
      config: {}
    }));
  });

  it('should deny creating session for another user', async () => {
    const authedDb = testEnv.authenticatedContext('user1').firestore();
    const sessionDoc = doc(authedDb, 'users/user2/sessions/session1');
    await assertFails(setDoc(sessionDoc, {
      userId: 'user2',
      createdAt: 123456789,
      name: 'Test Session',
      config: {}
    }));
  });

  it('should deny user spoofing in document', async () => {
    const authedDb = testEnv.authenticatedContext('user1').firestore();
    const sessionDoc = doc(authedDb, 'users/user1/sessions/session1');
    await assertFails(setDoc(sessionDoc, {
      userId: 'user2', // Spoofed
      createdAt: 123456789,
      name: 'Test Session',
      config: {}
    }));
  });

  it('should allow user to update their own session', async () => {
    const authedDb = testEnv.authenticatedContext('user1').firestore();
    const sessionDoc = doc(authedDb, 'users/user1/sessions/session1');
    await testEnv.withSecurityRulesDisabled(async (context: any) => {
        await setDoc(doc(context.firestore(), 'users/user1/sessions/session1'), {
          userId: 'user1',
          createdAt: 123456789,
          name: 'Test Session',
          config: {}
        });
    });

    await assertSucceeds(updateDoc(sessionDoc, {
      name: 'Updated Session'
    }));
  });

  it('should deny user updating immutable fields', async () => {
    const authedDb = testEnv.authenticatedContext('user1').firestore();
    const sessionDoc = doc(authedDb, 'users/user1/sessions/session1');
    await testEnv.withSecurityRulesDisabled(async (context: any) => {
        await setDoc(doc(context.firestore(), 'users/user1/sessions/session1'), {
          userId: 'user1',
          createdAt: 123456789,
          name: 'Test Session',
          config: {}
        });
    });

    await assertFails(updateDoc(sessionDoc, {
        userId: 'user2'
    }));
  });
});
