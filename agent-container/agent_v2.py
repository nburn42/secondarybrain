#!/usr/bin/env python3
"""
Secondary Brain Agent - Task Execution Container with Planner Loop
"""

import os
import time
import json
import jwt
import requests
import subprocess
from typing import Dict, Any, Optional, List

# Configuration
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:5000')
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key')
PROJECT_ID = os.getenv('PROJECT_ID')
CONTAINER_ID = os.getenv('CONTAINER_ID')
WORKSPACE_DIR = '/workspace'

class SecondaryBrainAgent:
    def __init__(self):
        self.jwt_token = self.get_jwt_token()
        self.headers = {
            'Authorization': f'Bearer {self.jwt_token}',
            'Content-Type': 'application/json'
        }
        self.current_task = None
        
    def get_jwt_token(self) -> str:
        """Generate JWT token for authentication"""
        payload = {
            'projectId': PROJECT_ID,
            'iat': int(time.time()),
            'exp': int(time.time()) + 3600  # 1 hour expiration
        }
        return jwt.encode(payload, JWT_SECRET, algorithm='HS256')
    
    def make_api_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict[Any, Any]:
        """Make authenticated API request to backend"""
        url = f"{BACKEND_URL}{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=self.headers)
            elif method.upper() == 'POST':
                response = requests.post(url, headers=self.headers, json=data)
            elif method.upper() == 'PUT':
                response = requests.put(url, headers=self.headers, json=data)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API request failed: {e}")
            return {}
    
    def claim_task(self) -> Optional[Dict]:
        """Claim an available task by setting container ID"""
        print("Looking for available tasks...")
        
        # Get pending tasks for this project
        tasks = self.make_api_request('GET', f'/api/projects/{PROJECT_ID}/tasks')
        
        if not tasks:
            return None
        
        # Find a pending task without a container
        for task in tasks:
            if task.get('status') == 'pending' and not task.get('containerId'):
                task_id = task['id']
                
                # Try to claim the task by setting our container ID
                update_data = {
                    'containerId': CONTAINER_ID,
                    'status': 'running'
                }
                
                result = self.make_api_request('PUT', f'/api/tasks/{task_id}', update_data)
                
                if result:
                    print(f"Successfully claimed task: {task['title']} (ID: {task_id})")
                    return result
                else:
                    print(f"Failed to claim task: {task_id}")
        
        return None
    
    def get_task_items(self, task_id: str) -> List[Dict]:
        """Get all task items for a task to build chat history"""
        return self.make_api_request('GET', f'/api/tasks/{task_id}/items') or []
    
    def create_task_item(self, task_id: str, item_data: Dict) -> Optional[Dict]:
        """Create a new task item"""
        return self.make_api_request('POST', f'/api/tasks/{task_id}/items', item_data)
    
    def build_chat_history(self, task_items: List[Dict]) -> List[Dict]:
        """Build chat history from task items"""
        chat_history = []
        
        # Sort task items by creation time
        sorted_items = sorted(task_items, key=lambda x: x.get('createdAt', ''))
        
        for item in sorted_items:
            item_type = item.get('type')
            content = item.get('content', '')
            chat_response = item.get('chatResponse', '')
            
            if item_type == 'planning' and content:
                chat_history.append({
                    'role': 'user',
                    'content': content
                })
            
            if chat_response:
                chat_history.append({
                    'role': 'assistant', 
                    'content': chat_response
                })
            
            # Add tool calls to history
            if item.get('toolName'):
                tool_call = {
                    'role': 'assistant',
                    'content': f"I'll use the {item['toolName']} tool.",
                    'tool_calls': [{
                        'name': item['toolName'],
                        'parameters': item.get('toolParameters', {}),
                        'response': item.get('toolResponse', {})
                    }]
                }
                chat_history.append(tool_call)
        
        return chat_history
    
    def execute_planner_loop(self, task: Dict):
        """Execute the main planner loop for a task"""
        task_id = task['id']
        task_title = task['title']
        task_description = task.get('description', '')
        
        print(f"Starting planner execution for task: {task_title}")
        
        # Get existing task items to build chat history
        task_items = self.get_task_items(task_id)
        chat_history = self.build_chat_history(task_items)
        
        print(f"Found {len(task_items)} existing task items")
        print(f"Built chat history with {len(chat_history)} messages")
        
        # If no existing items, create initial planning item
        if not task_items:
            initial_content = f"Task: {task_title}\nDescription: {task_description}\n\nPlease analyze this task and create a plan for execution."
            
            planning_item = {
                'type': 'planning',
                'title': 'Initial Task Analysis',
                'content': initial_content
            }
            
            created_item = self.create_task_item(task_id, planning_item)
            if created_item:
                print("Created initial planning task item")
                chat_history.append({
                    'role': 'user',
                    'content': initial_content
                })
        
        # Simulate planner response (in real implementation, this would call an LLM)
        if chat_history:
            planner_response = self.generate_planner_response(chat_history, task)
            
            # Create response task item
            response_item = {
                'type': 'planning',
                'title': 'Planner Response',
                'content': 'Agent analysis and planning',
                'chatResponse': planner_response
            }
            
            created_response = self.create_task_item(task_id, response_item)
            if created_response:
                print("Created planner response task item")
        
        # Mark task as completed for now (in real implementation, this would be more complex)
        completion_data = {
            'status': 'completed',
            'completedAt': time.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
        }
        
        self.make_api_request('PUT', f'/api/tasks/{task_id}', completion_data)
        print(f"Task {task_title} marked as completed")
    
    def generate_planner_response(self, chat_history: List[Dict], task: Dict) -> str:
        """Generate planner response (placeholder for LLM integration)"""
        task_title = task['title']
        task_description = task.get('description', '')
        
        # This is a placeholder - in real implementation, this would:
        # 1. Send chat_history to an LLM (OpenAI, Anthropic, etc.)
        # 2. Get the response and parse it
        # 3. Execute any tool calls mentioned in the response
        
        return f"""I've analyzed the task "{task_title}".

Description: {task_description}

Based on the chat history ({len(chat_history)} messages), I'll create a plan to execute this task.

This is a placeholder response. In the full implementation, this would:
1. Analyze the task requirements
2. Create a step-by-step execution plan  
3. Execute Python code and file operations as needed
4. Report progress and results

The task has been processed and is ready for more sophisticated planning integration."""
    
    def clone_repositories(self):
        """Clone project repositories into workspace"""
        print("Fetching project repositories...")
        
        repos = self.make_api_request('GET', f'/api/projects/{PROJECT_ID}/repositories')
        
        if not repos:
            print("No repositories found for this project")
            return
        
        os.makedirs(WORKSPACE_DIR, exist_ok=True)
        
        for repo in repos:
            repo_name = repo.get('name', 'unknown')
            repo_url = repo.get('url', '')
            github_token = repo.get('githubToken')
            is_private = repo.get('isPrivate', False)
            
            if not repo_url:
                print(f"Skipping repository {repo_name}: No URL provided")
                continue
            
            print(f"Cloning repository: {repo_name}")
            
            # Prepare clone URL with authentication for private repos
            clone_url = repo_url
            if is_private and github_token:
                # Insert token into GitHub URL
                if 'github.com' in repo_url:
                    clone_url = repo_url.replace('https://github.com/', f'https://{github_token}@github.com/')
            
            repo_path = os.path.join(WORKSPACE_DIR, repo_name)
            
            try:
                if os.path.exists(repo_path):
                    print(f"Repository {repo_name} already exists, pulling latest changes...")
                    subprocess.run(['git', 'pull'], cwd=repo_path, check=True)
                else:
                    subprocess.run(['git', 'clone', clone_url, repo_path], check=True)
                    print(f"Successfully cloned {repo_name}")
            except subprocess.CalledProcessError as e:
                print(f"Failed to clone {repo_name}: {e}")
    
    def run(self):
        """Main agent execution loop"""
        print(f"Neural Notify Agent starting for project {PROJECT_ID}")
        print(f"Container ID: {CONTAINER_ID}")
        
        # Clone repositories first
        self.clone_repositories()
        
        print("Starting task execution loop...")
        
        # Main task execution loop
        while True:
            try:
                # Try to claim a task
                task = self.claim_task()
                
                if task:
                    self.current_task = task
                    self.execute_planner_loop(task)
                    self.current_task = None
                else:
                    print("No available tasks, waiting...")
                    time.sleep(30)  # Wait 30 seconds before checking again
                    
            except Exception as e:
                print(f"Error in task execution loop: {e}")
                if self.current_task:
                    # Mark current task as failed
                    self.make_api_request('PUT', f'/api/tasks/{self.current_task["id"]}', {
                        'status': 'failed'
                    })
                    self.current_task = None
                
                time.sleep(60)  # Wait before retrying

if __name__ == "__main__":
    agent = SecondaryBrainAgent()
    agent.run()