
from unittest.mock import patch

import pytest

from main import app


@pytest.fixture
def client():
    app.config["TESTING"] = True

    with app.test_client() as test_client:
        yield test_client


def test_home_page(client):
    response = client.get("/")

    assert response.status_code == 200


def test_missing_json(client):
    response = client.post("/search-player")

    assert response.status_code == 400
    assert "error" in response.get_json()


def test_empty_username(client):
    response = client.post(
        "/search-player",
        json={"username": ""},
    )

    assert response.status_code == 400
    assert "error" in response.get_json()


def test_valid_player_search(client):
    mock_profile = {"player_id": "123", "nickname": "TestPlayer"}
    mock_stats = {"lifetime": {"Matches": "100"}}

    with (
        patch("main.api.get_player", return_value=mock_profile),
        patch("main.api.get_player_stats", return_value=mock_stats),
    ):
        response = client.post(
            "/search-player",
            json={"username": "TestPlayer"},
        )

    assert response.status_code == 200
    assert response.get_json() == {
        "profile": mock_profile,
        "stats": mock_stats,
    }


def test_player_not_found(client):
    with patch(
        "main.api.get_player",
        return_value={
            "error": "Player not found.",
            "status_code": 404,
        },
    ):
        response = client.post(
            "/search-player",
            json={"username": "UnknownPlayer"},
        )

    assert response.status_code == 404
    assert "error" in response.get_json()


def test_unexpected_server_error(client):
    with patch(
        "main.api.get_player",
        side_effect=RuntimeError("Unexpected failure"),
    ):
        response = client.post(
            "/search-player",
            json={"username": "TestPlayer"},
        )

    assert response.status_code == 500
    assert "error" in response.get_json()
