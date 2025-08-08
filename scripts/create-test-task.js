#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { config } from './config.js';

// Initialize Firebase with type-safe config
const app = initializeApp(config.firebase);
const auth = getAuth(app);

async function createTestTask() {
  try {
    // Sign in as test user
    console.log('Signing in as test user...');
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      config.auth.testEmail, 
      config.auth.testPassword
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
    
    // Create a test task
    console.log('\nCreating test task...');
    const taskData = {
      title: "Test Task - Hello World",
      description: "A simple test task that prints hello world and creates a file",
      status: "pending",
      priority: 1.0,
      authorName: "Test User"
    };
    
    const taskResponse = await fetch(`https://tandembrain.com/api/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(taskData)
    });
    
    if (!taskResponse.ok) {
      throw new Error(`Failed to create task: ${taskResponse.status} ${await taskResponse.text()}`);
    }
    
    const task = await taskResponse.json();
    console.log('Created task:', task.id);
    console.log('Task title:', task.title);
    console.log('Task status:', task.status);
    
    // Create task items for this task
    const taskItems = [
      {
        taskId: task.id,
        type: "planning",
        title: "Plan the hello world implementation",
        content: "This task will create a simple hello world script"
      },
      {
        taskId: task.id,
        type: "file_creation",
        title: "Create hello.py file",
        content: "Create a Python script that prints 'Hello World from Tandembrain!'",
        filePath: "hello.py",
        fileContent: "#!/usr/bin/env python3\\nprint('Hello World from Tandembrain!')"
      },
      {
        taskId: task.id,
        type: "completion",
        title: "Task completed",
        content: "Hello world task has been completed successfully"
      }
    ];
    
    console.log('\nCreating task items...');
    for (const item of taskItems) {
      const itemResponse = await fetch('https://tandembrain.com/api/task-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(item)
      });
      
      if (!itemResponse.ok) {
        console.error(`Failed to create task item: ${itemResponse.status}`);
        continue;
      }
      
      const taskItem = await itemResponse.json();
      console.log(`Created task item: ${taskItem.title}`);
    }
    
    console.log('\n✅ Test task created successfully!');
    console.log(`Task ID: ${task.id}`);
    console.log('Ready for container execution');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

createTestTask();