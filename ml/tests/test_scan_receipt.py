import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

RESPONSE_KEYS = {
    "model_version", "merchant", "items", "subtotal", "tax",
    "service_charge", "discount", "total", "needs_review",
}
ITEM_KEYS = {"name", "qty", "unit_price", "total_price", "category", "confidence"}
PNG = ("struk.png", b"\x89PNG\r\n\x1a\n" + b"0" * 32, "image/png")


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_success_matches_contract():
    r = client.post("/scan-receipt?mock=success")
    assert r.status_code == 200
    body = r.json()
    assert set(body) == RESPONSE_KEYS
    assert all(set(item) == ITEM_KEYS for item in body["items"])
    assert body["subtotal"] + body["tax"] + body["service_charge"] - body["discount"] == body["total"]
    assert body["needs_review"] is False


@pytest.mark.parametrize("mock", ["needs_review", "handwritten"])
def test_review_scenarios_flag_needs_review(mock):
    body = client.post(f"/scan-receipt?mock={mock}").json()
    assert set(body) == RESPONSE_KEYS
    assert body["needs_review"] is True


@pytest.mark.parametrize(
    "mock,status",
    [("invalid_file", 400), ("too_large", 413), ("unreadable", 422), ("server_error", 500)],
)
def test_error_scenarios(mock, status):
    r = client.post(f"/scan-receipt?mock={mock}")
    assert r.status_code == status
    assert set(r.json()["error"]) == {"code", "message"}


def test_unknown_mock():
    assert client.post("/scan-receipt?mock=nope").status_code == 400


def test_image_required_without_mock():
    assert client.post("/scan-receipt").status_code == 400


def test_rejects_non_image():
    r = client.post("/scan-receipt", files={"image": ("a.txt", b"hi", "text/plain")})
    assert r.status_code == 400


def test_accepts_png():
    r = client.post("/scan-receipt", files={"image": PNG})
    assert r.status_code == 200
    assert set(r.json()) == RESPONSE_KEYS


def test_rejects_file_over_5mb():
    big = ("big.png", b"0" * (5 * 1024 * 1024 + 1), "image/png")
    assert client.post("/scan-receipt", files={"image": big}).status_code == 413


def test_api_key_enforced(monkeypatch):
    monkeypatch.setattr("app.routes.receipt.API_KEY", "secret")
    assert client.post("/scan-receipt?mock=success").status_code == 401
    ok = client.post("/scan-receipt?mock=success", headers={"X-API-Key": "secret"})
    assert ok.status_code == 200
