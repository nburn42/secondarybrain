#!/usr/bin/env python3

import os
import sys
import jwt
import requests
import git
from pathlib import Path
from typing import List, Dict, Optional
import json
from datetime import datetime

class TaskAgent:
    def __init__(self):
        self.jwt_token = os.getenv('JWT_TOKEN')
        self.api_base_url = os.getenv('API_BASE_URL', 'http://host.docker.internal:5000')
        self.workspace_dir = Path(os.getenv('WORKSPACE_DIR', '/workspace'))
        self.container_id = os.getenv('CONTAINER_ID')
        self.project_id = None
        
        if not self.jwt_token:
            raise ValueError("JWT_TOKEN environment variable is required")
        
        if not self.container_id:
            raise ValueError("CONTAINER_ID environment variable is required")
        
        # Decode JWT to get project ID
        try:
            payload = jwt.decode(self.jwt_token, options={"verify_signature": False})
            self.project_id = payload.get('project_id')
            if not self.project_id:
                raise ValueError("JWT token must contain project_id")
        except Exception as e:
            raise ValueError(f"Invalid JWT token: {e}")
        
        print(f"Agent initialized for project: {self.project_id}")
        print(f"Container ID: {self.container_id}")
        print(f"Workspace directory: {self.workspace_dir}")
        print(f"API base URL: {self.api_base_url}")

    def make_api_request(self, endpoint: str, method: str = 'GET', data: Optional[Dict] = None) -> Optional[Dict]:
        """Make authenticated API request"""
        headers = {
            'Authorization': f'Bearer {self.jwt_token}',
            'Content-Type': 'application/json'
        }
        
        url = f"{self.api_base_url}{endpoint}"
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'PATCH':
                response = requests.patch(url, headers=headers, json=data)
            else:
                response = requests.request(method, url, headers=headers, json=data)
            
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"API request failed: {e}")
            return None
    
    def update_container_status(self, status: str, exit_code: Optional[int] = None):
        """Update the container status"""
        update_data = {
            'status': status
        }
        
        if status == 'completed' or status == 'failed':
            update_data['completedAt'] = datetime.now().isoformat()
            
        if exit_code is not None:
            update_data['exitCode'] = exit_code
            
        endpoint = f"/api/containers/{self.container_id}"
        result = self.make_api_request(endpoint, method='PATCH', data=update_data)
        
        if result:
            print(f"Container status updated to: {status}")
        else:
            print(f"Failed to update container status to: {status}")

    def get_project_repositories(self) -> List[Dict]:
        """Fetch repositories for the current project"""
        print(f"Fetching repositories for project {self.project_id}...")
        
        repos = self.make_api_request(f'/api/projects/{self.project_id}/repositories')
        if repos is None:
            print("Failed to fetch repositories")
            return []
        
        print(f"Found {len(repos)} repositories")
        return repos

    def clone_repository(self, repo: Dict) -> bool:
        """Clone a single repository into workspace"""
        repo_name = repo['name']
        repo_url = repo['url']
        clone_path = self.workspace_dir / repo_name
        github_token = repo.get('githubToken')
        is_private = repo.get('isPrivate', False)
        
        print(f"Cloning repository: {repo_name}")
        print(f"URL: {repo_url}")
        print(f"Target path: {clone_path}")
        print(f"Private repo: {is_private}")
        
        try:
            # Remove existing directory if it exists
            if clone_path.exists():
                print(f"Directory {clone_path} already exists, removing...")
                import shutil
                shutil.rmtree(clone_path)
            
            # Prepare clone URL with authentication if available
            clone_url = repo_url
            if github_token and is_private:
                # Decrypt the token (assuming we add decryption capability)
                decrypted_token = self._decrypt_github_token(github_token)
                if decrypted_token:
                    # Format: https://token@github.com/owner/repo.git
                    if repo_url.startswith('https://github.com/'):
                        clone_url = repo_url.replace('https://github.com/', f'https://{decrypted_token}@github.com/')
                    print(f"Using authenticated clone URL")
                else:
                    print("Warning: Failed to decrypt GitHub token, using public clone")
            
            # Clone the repository
            git.Repo.clone_from(clone_url, clone_path)
            print(f"Successfully cloned {repo_name}")
            return True
            
        except Exception as e:
            print(f"Failed to clone {repo_name}: {e}")
            if is_private and not github_token:
                print("Note: This appears to be a private repository. Authentication may be required.")
            return False

    def _decrypt_github_token(self, encrypted_token: str) -> str:
        """Decrypt GitHub token - placeholder for decryption logic"""
        # In a real implementation, this would decrypt the token
        # For now, we'll assume the token is passed through decrypted via API
        # This method would use the same decryption as the server
        try:
            # TODO: Implement proper decryption matching server/crypto.ts
            # For now, return the token as-is (this would be insecure in production)
            return encrypted_token
        except Exception as e:
            print(f"Failed to decrypt token: {e}")
            return ""

    def setup_workspace(self):
        """Set up the workspace by cloning all project repositories"""
        print("Setting up workspace...")
        
        # Ensure workspace directory exists
        self.workspace_dir.mkdir(parents=True, exist_ok=True)
        
        # Get project repositories
        repositories = self.get_project_repositories()
        
        if not repositories:
            print("No repositories found for this project")
            return
        
        # Clone each repository
        success_count = 0
        for repo in repositories:
            if self.clone_repository(repo):
                success_count += 1
        
        print(f"Workspace setup complete: {success_count}/{len(repositories)} repositories cloned successfully")
        
        # List workspace contents
        print("\nWorkspace contents:")
        for item in self.workspace_dir.iterdir():
            if item.is_dir():
                print(f"  📁 {item.name}/")
            else:
                print(f"  📄 {item.name}")

    def get_project_tasks(self) -> List[Dict]:
        """Fetch pending tasks for the current project"""
        print(f"Fetching tasks for project {self.project_id}...")
        
        endpoint = f"/api/projects/{self.project_id}/tasks"
        tasks = self.make_api_request(endpoint)
        
        if tasks is None:
            print("Failed to fetch tasks")
            return []
        
        # Filter for pending tasks
        pending_tasks = [task for task in tasks if task.get('status') == 'pending']
        print(f"Found {len(pending_tasks)} pending tasks")
        
        return pending_tasks
    
    def get_task_items(self, task_id: str) -> List[Dict]:
        """Fetch task items for a given task"""
        endpoint = f"/api/tasks/{task_id}/items"
        items = self.make_api_request(endpoint)
        
        if items is None:
            print(f"Failed to fetch task items for task {task_id}")
            return []
        
        return items
    
    def execute_task(self, task: Dict) -> bool:
        """Execute a single task"""
        task_id = task['id']
        task_title = task['title']
        
        print(f"\n🚀 Executing task: {task_title}")
        print(f"Task ID: {task_id}")
        
        try:
            # Update task status to running
            self.update_task_status(task_id, 'running')
            
            # Get task items
            task_items = self.get_task_items(task_id)
            
            if not task_items:
                print("No task items found for this task")
                self.update_task_status(task_id, 'completed')
                return True
            
            # Process each task item
            for item in task_items:
                print(f"\nProcessing item: {item['title']}")
                print(f"Item type: {item['type']}")
                
                if item['type'] == 'file_creation':
                    self.execute_file_creation(item)
                elif item['type'] == 'planning':
                    print(f"Planning: {item['content']}")
                elif item['type'] == 'completion':
                    print(f"Completion: {item['content']}")
                else:
                    print(f"Unsupported item type: {item['type']}")
            
            # Mark task as completed
            self.update_task_status(task_id, 'completed')
            print(f"✅ Task completed: {task_title}")
            return True
            
        except Exception as e:
            print(f"❌ Task execution failed: {e}")
            self.update_task_status(task_id, 'failed')
            return False
    
    def execute_file_creation(self, item: Dict):
        """Execute a file creation task item"""
        file_path = item.get('filePath')
        file_content = item.get('fileContent', '')
        
        if not file_path:
            print("No file path specified for file creation")
            return
        
        # Create the file in the workspace
        full_path = self.workspace_dir / file_path
        
        # Create parent directories if needed
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write the file
        with open(full_path, 'w') as f:
            # Unescape newlines in file content
            content = file_content.replace('\\n', '\n')
            f.write(content)
        
        print(f"📄 Created file: {full_path}")
        
        # If it's a Python file, try to run it
        if file_path.endswith('.py'):
            try:
                print(f"🐍 Running Python file: {file_path}")
                result = os.system(f"cd {self.workspace_dir} && python3 {file_path}")
                if result == 0:
                    print("✅ Python script executed successfully")
                else:
                    print(f"❌ Python script failed with exit code: {result}")
            except Exception as e:
                print(f"❌ Failed to run Python script: {e}")
    
    def update_task_status(self, task_id: str, status: str):
        """Update the status of a task"""
        update_data = {'status': status}
        
        if status == 'completed':
            update_data['completedAt'] = datetime.now().isoformat()
        
        endpoint = f"/api/tasks/{task_id}"
        result = self.make_api_request(endpoint, method='PATCH', data=update_data)
        
        if result:
            print(f"Task status updated to: {status}")
        else:
            print(f"Failed to update task status to: {status}")

    def run(self):
        """Main agent execution loop"""
        print("Starting Task Agent...")
        
        try:
            # Set up workspace first
            self.setup_workspace()
            
            # Fetch and execute tasks
            print("\n🔍 Looking for tasks to execute...")
            tasks = self.get_project_tasks()
            
            if not tasks:
                print("No pending tasks found")
            else:
                print(f"Found {len(tasks)} pending tasks to execute")
                
                # Execute each task
                executed_count = 0
                for task in tasks:
                    if self.execute_task(task):
                        executed_count += 1
                
                print(f"\n📊 Execution summary: {executed_count}/{len(tasks)} tasks completed successfully")
            
            # Mark container as completed successfully
            self.update_container_status('completed', exit_code=0)
            
        except Exception as e:
            print(f"Agent execution failed: {e}")
            # Mark container as failed
            self.update_container_status('failed', exit_code=1)
            sys.exit(1)

if __name__ == "__main__":
    agent = TaskAgent()
    agent.run()