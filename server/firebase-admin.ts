import admin from 'firebase-admin';

// Initialize Firebase Admin
// In production, this will use Application Default Credentials from GKE
// For local development, you'll need to set GOOGLE_APPLICATION_CREDENTIALS
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'neuronotify',
  });
}

export const adminAuth = admin.auth();
export const adminApp = admin.app();