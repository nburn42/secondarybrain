#!/usr/bin/env python3
"""
Test script to verify agent functionality
"""

import os
import requests
import json

def test_token_generation():
    """Test JWT token generation"""
    api_url = "http://localhost:5000"
    project_id = "5951c74e-d376-4e85-9432-fe14fa96a0af"  # Use your actual project ID
    
    print("Testing token generation...")
    
    try:
        # Generate token
        response = requests.post(
            f"{api_url}/api/projects/{project_id}/agent-token",
            json={"taskId": "test-task"}
        )
        
        if response.status_code == 200:
            token_data = response.json()
            print("✓ Token generated successfully")
            print(f"Token: {token_data['token'][:50]}...")
            return token_data['token']
        else:
            print(f"✗ Token generation failed: {response.status_code}")
            print(response.text)
            return None
            
    except Exception as e:
        print(f"✗ Error: {e}")
        return None

def test_agent_api(token):
    """Test agent API endpoints"""
    if not token:
        return
    
    api_url = "http://localhost:5000"
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\nTesting agent repositories endpoint...")
    
    try:
        response = requests.get(f"{api_url}/api/agent/repositories", headers=headers)
        
        if response.status_code == 200:
            repos = response.json()
            print(f"✓ Found {len(repos)} repositories")
            for repo in repos:
                print(f"  - {repo['name']}: {repo['url']}")
        else:
            print(f"✗ API call failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    print("Testing Secondary Brain Agent Integration")
    print("=" * 40)
    
    token = test_token_generation()
    test_agent_api(token)
    
    print("\nTest complete!")