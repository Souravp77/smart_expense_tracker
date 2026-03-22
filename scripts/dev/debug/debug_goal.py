import requests
import re

def test_add_goal():
    base_url = "http://127.0.0.1:5000"
    session = requests.Session()
    
    # 1. Get CSRF token from login page
    login_page = session.get(f"{base_url}/login")
    csrf_token = re.search(r'name="_csrf_token" value="([^"]+)"', login_page.text)
    if not csrf_token:
        # Try finding it in meta tag
        csrf_token = re.search(r'meta name="csrf-token" content="([^"]+)"', login_page.text)
        
    token = csrf_token.group(1) if csrf_token else None
    print(f"Token found: {token}")

    # 2. Login
    login_data = {
        'email': 'verify@test.com', 
        'password': 'password123',
        '_csrf_token': token
    }
    session.post(f"{base_url}/login", data=login_data)
    
    # 3. Add Goal
    # API usually expects CSRF token in header X-CSRF-Token or in JSON
    headers = {'X-CSRF-Token': token}
    goal_data = {
        'name': 'Test Goal',
        'target': '1000',
        'current': '0',
        'color': 'bg-blue-500',
        'icon': 'fa-bullseye',
        'priority': 'medium'
    }
    resp = session.post(f"{base_url}/api/goals", json=goal_data, headers=headers)
    print(f"Status Code: {resp.status_code}")
    print(f"Response: {resp.text}")

if __name__ == "__main__":
    test_add_goal()
