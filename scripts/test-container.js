#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "neuronotify.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "neuronotify",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "neuronotify.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testContainer() {
  try {
    // Sign in as test user
    console.log('Signing in as test user...');
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      'test@neuralviolin.com', 
      'TestUser123!'
    );
    
    const idToken = await userCredential.user.getIdToken();
    console.log('Successfully authenticated');
    
    // Get the first project
    const projectsResponse = await fetch('https://tandembrain.com/api/projects', {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    const projects = await projectsResponse.json();
    if (!projects || projects.length === 0) {
      console.error('No projects found');
      return;
    }
    
    const projectId = projects[0].id;
    console.log('Using project:', projectId);
    
    // Create a container
    console.log('\nCreating container...');
    const containerResponse = await fetch(`https://tandembrain.com/api/projects/${projectId}/containers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        status: 'pending'
      })
    });
    
    if (!containerResponse.ok) {
      throw new Error(`Failed to create container: ${containerResponse.status} ${await containerResponse.text()}`);
    }
    
    const container = await containerResponse.json();
    console.log('Created container:', container.id);
    console.log('Container status:', container.status);
    
    // Check Kubernetes job
    console.log('\n✅ Container created successfully!');
    console.log('Check the job with: kubectl get jobs -n tandembrain');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

testContainer();