import requests
import json
import math
import warnings
from urllib3.exceptions import InsecureRequestWarning

warnings.simplefilter('ignore', InsecureRequestWarning)

BASE_URL = "http://127.0.0.1:5000"
SESSION = requests.Session()

def login():
    res = SESSION.post(f"{BASE_URL}/login", data={
        "email": "test@example.com",
        "password": "password123"
    }, verify=False)
    if "Login Unsuccessful" in res.text or getattr(res, 'url', '').endswith('/login'):
        # Register if not exists
        SESSION.post(f"{BASE_URL}/register", data={
            "username": "tester",
            "email": "test@example.com",
            "password": "password123",
            "currency": "USD"
        }, verify=False)
        SESSION.post(f"{BASE_URL}/login", data={
            "email": "test@example.com",
            "password": "password123"
        }, verify=False)
        
    # Get CSRF
    dash = SESSION.get(f"{BASE_URL}/")
    csrf_token = ""
    if 'name="csrf-token"' in dash.text:
         csrf_token = dash.text.split('name="csrf-token" content="')[1].split('"')[0]
    elif 'name="_csrf_token"' in dash.text:
         csrf_token = dash.text.split('name="_csrf_token" value="')[1].split('"')[0]
         
    print(f"Login sequence finished. CSRF Token: {csrf_token}")
    return csrf_token

def run_tests():
    csrf = login()
    headers = {"X-CSRF-Token": csrf, "Content-Type": "application/json"}
    
    # Test 1: NaN amount
    print("\n--- Test 1: NaN amount for transaction ---")
    custom_json_nan = '{"type": "income", "amount": NaN, "category": "Salary", "date": "2026-03-04"}'
    res = SESSION.post(f"{BASE_URL}/api/transactions", data=custom_json_nan, headers=headers)
    print("Status:", res.status_code, "Response:", res.text)
    
    # Test 2: Infinity amount
    print("\n--- Test 2: Infinity amount for transaction ---")
    custom_json_inf = '{"type": "income", "amount": Infinity, "category": "Salary", "date": "2026-03-04"}'
    res = SESSION.post(f"{BASE_URL}/api/transactions", data=custom_json_inf, headers=headers)
    print("Status:", res.status_code, "Response:", res.text)
    
    # Test 3: Very long category name
    print("\n--- Test 3: Very long category name ---")
    res2 = SESSION.post(f"{BASE_URL}/api/transactions", json={
        "type": "expense",
        "amount": 100,
        "category": "A" * 300,
        "date": "2026-03-04"
    }, headers={"X-CSRF-Token": csrf})
    print("Status:", res2.status_code, "Response:", res2.text)

    # Test 4: Delete income after creating savings goal
    print("\n--- Test 4: Delete income after creating savings goal ---")
    income_res = SESSION.post(f"{BASE_URL}/api/transactions", json={
        "type": "income",
        "amount": 1000,
        "category": "Salary",
        "date": "2026-03-04"
    }, headers={"X-CSRF-Token": csrf})
    print("Income created:", income_res.json())
    inc_id = income_res.json().get('id')
    
    goal_res = SESSION.post(f"{BASE_URL}/api/goals", json={
        "name": "Test Hole",
        "target": 1000,
        "current": 1000
    }, headers={"X-CSRF-Token": csrf})
    print("Goal created:", goal_res.status_code, goal_res.text)
    
    # Now try to delete income
    del_res = SESSION.delete(f"{BASE_URL}/api/transactions/{inc_id}", headers={"X-CSRF-Token": csrf})
    print("Delete income response:", del_res.status_code, del_res.text)

    # Now total income is 0, but allocated savings is 1000!
    summary_res = SESSION.get(f"{BASE_URL}/api/data")
    if summary_res.status_code == 200:
        summ = summary_res.json().get('financeSummary')
        print("Finance Summary post-deletion:", summ)
    
if __name__ == "__main__":
    run_tests()
