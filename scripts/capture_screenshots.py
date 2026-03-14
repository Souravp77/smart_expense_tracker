from playwright.sync_api import sync_playwright
import time
import os

def run():
    artifacts_dir = "c:\\Users\\soura\\.gemini\\antigravity\\brain\\6a6f8d40-ced6-4ff2-98ef-dabe3c7213fc\\"
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 800})
        
        print("Registering new user or navigating to login...")
        response = page.goto("http://127.0.0.1:5000/register")
        print(f"Status code: {response.status}")
        try:
            page.fill("input[name='username']", "Test User 2", timeout=5000)
            page.fill("input[name='email']", "test3@example.com")
            page.fill("input[name='password']", "password")
            page.click("button[type='submit']")
            time.sleep(1)
        except Exception as e:
            print("Already registered or error:", e)
        
        print("Logging in...")
        page.goto("http://127.0.0.1:5000/login")
        page.fill("input[name='email']", "test3@example.com")
        page.fill("input[name='password']", "password")
        page.click("button[type='submit']")
        
        print("Waiting for dashboard to load...")
        time.sleep(3)
        
        # 1. Dashboard Light Mode
        print("Capturing dashboard_light.png")
        page.screenshot(path=os.path.join(artifacts_dir, "dashboard_light.png"))
        
        try:
            # 2. Dashboard Dark Mode
            print("Switching to dark mode...")
            page.click("#themeIcon")
            time.sleep(1)
            print("Capturing dashboard_dark.png")
            page.screenshot(path=os.path.join(artifacts_dir, "dashboard_dark.png"))
        except Exception as e: print(e)
        
        try:
            # 3. Add Transaction Modal
            print("Opening add transaction modal...")
            page.click("button:has-text('Add Transaction')")
            time.sleep(1)
            print("Capturing add_transaction.png")
            page.screenshot(path=os.path.join(artifacts_dir, "add_transaction.png"))
            page.click("button:has-text('Cancel')")
            time.sleep(1)
        except Exception as e: print(e)
        
        try:
            # 4. Savings Goals
            print("Navigating to savings goals...")
            page.click("button#nav-savings")
            time.sleep(2)
            print("Capturing savings_goals.png")
            page.screenshot(path=os.path.join(artifacts_dir, "savings_goals.png"))
        except Exception as e: print(e)
        
        try:
            # 5. Goal Modal
            print("Opening goal modal...")
            page.click("button:has-text('Create Goal')")
            time.sleep(1)
            print("Capturing add_goal_modal.png")
            page.screenshot(path=os.path.join(artifacts_dir, "add_goal_modal.png"))
        except Exception as e: print(e)
        
        print("Done capturing screenshots.")
        browser.close()

if __name__ == "__main__":
    run()
