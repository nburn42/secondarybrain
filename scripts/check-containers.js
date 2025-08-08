#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { config } from './config.js';

// Initialize Firebase with type-safe config
const app = initializeApp(config.firebase);
const auth = getAuth(app);

async function checkContainers() {
  try {
    // Sign in as test user
    console.log('Signing in...');
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      config.auth.testEmail, 
      config.auth.testPassword
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
    
    // Sort by creation time descending (newest first)
    containers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    containers.slice(0, 10).forEach(container => {
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