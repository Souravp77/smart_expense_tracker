from app import create_app
from config import Config


class TestConfig(Config):
    TESTING = True


def test_budgets_api_route_exists_and_is_protected():
    app = create_app(TestConfig)
    client = app.test_client()

    # Route exists and requires auth for POST.
    post_resp = client.post('/api/budgets', json={})
    assert post_resp.status_code in (302, 401), post_resp.get_data(as_text=True)

    # GET is not defined for this endpoint (method should be rejected, not 404).
    get_resp = client.get('/api/budgets')
    assert get_resp.status_code == 405, get_resp.get_data(as_text=True)
