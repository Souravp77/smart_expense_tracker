import requests
import re
import json

def test_settings():
    base_url = "http://127.0.0.1:5000"
    session = requests.Session()
    
    # 1. Get CSRF token from login page
    print("Fetching login page...")
    login_page = session.get(f"{base_url}/login")
    csrf_token = re.search(r'name="_csrf_token" value="([^"]+)"', login_page.text)
    token = csrf_token.group(1) if csrf_token else None
    print(f"Token: {token}")

    # 2. Login
    print("Logging in...")
    login_data = {
        'email': 'verify@test.com', 
        'password': 'password123',
        '_csrf_token': token
    }
    login_resp = session.post(f"{base_url}/login", data=login_data)
    if login_resp.url.endswith('/login') and "Invalid" in login_resp.text:
        print("Login failed!")
        return

    # 3. Update Settings
    print("Updating settings...")
    headers = {'X-CSRF-Token': token}
    settings_data = {
        'currency': 'USD',
        'notify_budget_alerts': False,
        'notify_goal_milestones': False
    }
    resp = session.post(f"{base_url}/api/settings", json=settings_data, headers=headers)
    print(f"Update Status: {resp.status_code}")
    try:
        print(f"Update Response: {resp.json()}")
    except:
        print(f"Update Response (text): {resp.text[:200]}")
    
    # 4. Fetch Dashboard (to check returned user data)
    print("Fetching dashboard...")
    resp = session.get(f"{base_url}/api/dashboard")
    try:
        data = resp.json()
        user = data.get('user', {})
        print(f"Returned Currency: {user.get('currency')}")
        print(f"Returned Budget Alerts: {user.get('notify_budget_alerts')}")
        print(f"Returned Goal Milestones: {user.get('notify_goal_milestones')}")
        
        if user.get('currency') == 'USD' and user.get('notify_budget_alerts') is False:
            print("SUCCESS: Settings persisted!")
        else:
            print("FAILURE: Settings did not persist correctly.")
    except Exception as e:
        print(f"Error parsing dashboard JSON: {e}")
        print(f"Response (text): {resp.text[:500]}")

if __name__ == "__main__":
    test_settings()
