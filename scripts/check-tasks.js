#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { config } from './config.js';

// Initialize Firebase with type-safe config
const app = initializeApp(config.firebase);
const auth = getAuth(app);

async function checkTasks() {
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
    
    // Get tasks
    console.log('\nFetching tasks...');
    const tasksResponse = await fetch(`https://tandembrain.com/api/projects/${projectId}/tasks`, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    const tasks = await tasksResponse.json();
    console.log(`\nFound ${tasks.length} tasks:`);
    
    // Sort by creation time descending (newest first)
    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    tasks.slice(0, 5).forEach(task => {
      console.log(`\nTask ID: ${task.id}`);
      console.log(`Title: ${task.title}`);
      console.log(`Status: ${task.status}`);
      console.log(`Priority: ${task.priority}`);
      console.log(`Created: ${new Date(task.createdAt).toLocaleString()}`);
      if (task.completedAt) {
        console.log(`Completed: ${new Date(task.completedAt).toLocaleString()}`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

checkTasks();