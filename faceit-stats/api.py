
import os
from urllib.parse import quote

import requests
from dotenv import load_dotenv


load_dotenv()

API_KEY = os.getenv("FACEIT_API_KEY")
BASE_URL = "https://open.faceit.com/data/v4"
REQUEST_TIMEOUT = 10


def _request_faceit(endpoint, *, not_found_message, params=None):
    """Send a request to FACEIT and return data or a structured error."""

    if not API_KEY:
        return {
            "error": "The FACEIT API service is not configured.",
            "status_code": 503,
        }

    url = f"{BASE_URL}/{endpoint}"
    headers = {"Authorization": f"Bearer {API_KEY}"}

    try:
        response = requests.get(
            url,
            headers=headers,
            params=params,
            timeout=REQUEST_TIMEOUT,
        )

    except requests.exceptions.Timeout:
        return {
            "error": "FACEIT took too long to respond. Please try again.",
            "status_code": 504,
        }

    except requests.exceptions.RequestException:
        return {
            "error": "Unable to connect to FACEIT. Please try again later.",
            "status_code": 502,
        }

    if response.status_code == 404:
        return {
            "error": not_found_message,
            "status_code": 404,
        }

    if response.status_code == 429:
        return {
            "error": "FACEIT is receiving too many requests. Please try again shortly.",
            "status_code": 503,
        }

    if response.status_code != 200:
        return {
            "error": "FACEIT could not process the request. Please try again later.",
            "status_code": 502,
        }

    try:
        data = response.json()

    except requests.exceptions.JSONDecodeError:
        return {
            "error": "FACEIT returned an invalid response.",
            "status_code": 502,
        }

    if not isinstance(data, dict):
        return {
            "error": "FACEIT returned an unexpected response format.",
            "status_code": 502,
        }

    return data


def get_player(username):
    """Retrieve a FACEIT player profile using their username."""

    return _request_faceit(
        "players",
        params={"nickname": username},
        not_found_message="No FACEIT player was found with that username.",
    )


def get_player_stats(player_id):
    """Retrieve CS2 statistics for a FACEIT player."""

    encoded_player_id = quote(str(player_id), safe="")
    endpoint = f"players/{encoded_player_id}/stats/cs2"

    return _request_faceit(
        endpoint,
        not_found_message="No CS2 statistics were found for this player.",
    )
