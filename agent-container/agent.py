#!/usr/bin/env python3

import os
import sys
import jwt
import requests
import git
from pathlib import Path
from typing import List, Dict, Optional
import json

class TaskAgent:
    def __init__(self):
        self.jwt_token = os.getenv('JWT_TOKEN')
        self.api_base_url = os.getenv('API_BASE_URL', 'http://host.docker.internal:5000')
        self.workspace_dir = Path(os.getenv('WORKSPACE_DIR', '/workspace'))
        self.project_id = None
        
        if not self.jwt_token:
            raise ValueError("JWT_TOKEN environment variable is required")
        
        # Decode JWT to get project ID
        try:
            payload = jwt.decode(self.jwt_token, options={"verify_signature": False})
            self.project_id = payload.get('project_id')
            if not self.project_id:
                raise ValueError("JWT token must contain project_id")
        except Exception as e:
            raise ValueError(f"Invalid JWT token: {e}")
        
        print(f"Agent initialized for project: {self.project_id}")
        print(f"Workspace directory: {self.workspace_dir}")
        print(f"API base URL: {self.api_base_url}")

    def make_api_request(self, endpoint: str, method: str = 'GET') -> Optional[Dict]:
        """Make authenticated API request"""
        headers = {
            'Authorization': f'Bearer {self.jwt_token}',
            'Content-Type': 'application/json'
        }
        
        url = f"{self.api_base_url}{endpoint}"
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            else:
                response = requests.request(method, url, headers=headers)
            
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"API request failed: {e}")
            return None

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
        
        print(f"Cloning repository: {repo_name}")
        print(f"URL: {repo_url}")
        print(f"Target path: {clone_path}")
        
        try:
            # Remove existing directory if it exists
            if clone_path.exists():
                print(f"Directory {clone_path} already exists, removing...")
                import shutil
                shutil.rmtree(clone_path)
            
            # Clone the repository
            git.Repo.clone_from(repo_url, clone_path)
            print(f"Successfully cloned {repo_name}")
            return True
            
        except Exception as e:
            print(f"Failed to clone {repo_name}: {e}")
            return False

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

    def run(self):
        """Main agent execution loop"""
        print("Starting Task Agent...")
        
        try:
            # Set up workspace first
            self.setup_workspace()
            
            # TODO: Add agent execution logic here
            print("\nAgent setup complete. Ready for task execution.")
            print("(Task execution logic will be implemented in next iteration)")
            
        except Exception as e:
            print(f"Agent execution failed: {e}")
            sys.exit(1)

if __name__ == "__main__":
    agent = TaskAgent()
    agent.run()