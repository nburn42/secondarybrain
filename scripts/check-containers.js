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

async function checkContainers() {
  try {
    // Sign in as test user
    console.log('Signing in...');
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      'test@neuralviolin.com', 
      'TestUser123!'
    );
    
    const idToken = await userCredential.user.getIdToken();
    
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
    
    // Get containers
    console.log('\nFetching containers...');
    const containersResponse = await fetch(`https://tandembrain.com/api/projects/${projectId}/containers`, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    const containers = await containersResponse.json();
    console.log(`\nFound ${containers.length} containers:`);
    
    containers.slice(0, 5).forEach(container => {
      console.log(`\nContainer ID: ${container.id}`);
      console.log(`Status: ${container.status}`);
      console.log(`Created: ${new Date(container.createdAt).toLocaleString()}`);
      if (container.startedAt) {
        console.log(`Started: ${new Date(container.startedAt).toLocaleString()}`);
      }
      if (container.completedAt) {
        console.log(`Completed: ${new Date(container.completedAt).toLocaleString()}`);
      }
      if (container.exitCode !== null) {
        console.log(`Exit Code: ${container.exitCode}`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

checkContainers();