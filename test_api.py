import requests

# We need to simulate a logged in user.
# But just checking if the route exists should return 405 (Method Not Allowed) if we use GET,
# or 401/302 if we use POST without auth.
# If it returns 404, then the route is truly missing.

url = "http://localhost:5000/api/budgets"
try:
    # Try POST - should return 401 or redirect to login (302) if auth is required
    r = requests.post(url)
    print(f"POST {url} status: {r.status_code}")
    
    # Try GET - should return 405 or 404
    r = requests.get(url)
    print(f"GET {url} status: {r.status_code}")
except Exception as e:
    print(f"Error: {e}")
