
from unittest.mock import Mock, patch

import pytest
import requests

import api


@pytest.fixture(autouse=True)
def mock_api_key(monkeypatch):
    monkeypatch.setattr(api, "API_KEY", "test-api-key")


def test_get_player_success():
    response = Mock(status_code=200)
    response.json.return_value = {
        "player_id": "123",
        "nickname": "TestPlayer",
    }

    with patch("api.requests.get", return_value=response) as mock_get:
        result = api.get_player("TestPlayer")

    assert result["nickname"] == "TestPlayer"
    assert mock_get.call_args.kwargs["params"] == {
        "nickname": "TestPlayer"
    }


def test_get_player_not_found():
    response = Mock(status_code=404)

    with patch("api.requests.get", return_value=response):
        result = api.get_player("UnknownPlayer")

    assert result["status_code"] == 404
    assert "error" in result


def test_get_player_timeout():
    with patch(
        "api.requests.get",
        side_effect=requests.exceptions.Timeout,
    ):
        result = api.get_player("TestPlayer")

    assert result["status_code"] == 504
    assert "error" in result


def test_get_player_connection_failure():
    with patch(
        "api.requests.get",
        side_effect=requests.exceptions.ConnectionError,
    ):
        result = api.get_player("TestPlayer")

    assert result["status_code"] == 502
    assert "error" in result


def test_get_player_invalid_json():
    response = Mock(status_code=200)
    response.json.side_effect = requests.exceptions.JSONDecodeError(
        "Invalid JSON", "", 0
    )

    with patch("api.requests.get", return_value=response):
        result = api.get_player("TestPlayer")

    assert result["status_code"] == 502
    assert "error" in result


def test_get_player_rate_limited():
    response = Mock(status_code=429)

    with patch("api.requests.get", return_value=response):
        result = api.get_player("TestPlayer")

    assert result["status_code"] == 503
    assert "error" in result


def test_get_player_missing_api_key(monkeypatch):
    monkeypatch.setattr(api, "API_KEY", None)

    result = api.get_player("TestPlayer")

    assert result["status_code"] == 503
    assert "error" in result


def test_get_player_stats_success():
    response = Mock(status_code=200)
    response.json.return_value = {
        "lifetime": {"Matches": "100"}
    }

    with patch("api.requests.get", return_value=response) as mock_get:
        result = api.get_player_stats("123")

    assert result["lifetime"]["Matches"] == "100"
    assert "/players/123/stats/cs2" in mock_get.call_args.args[0]
