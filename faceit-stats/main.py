import logging
import os

from flask import Flask, jsonify, render_template, request

import api


app = Flask(__name__)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/search-player", methods=["POST"])
def search_player():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "Please provide a valid JSON request."
        }), 400

    username = data.get("username")

    if not isinstance(username, str) or not username.strip():
        return jsonify({
            "error": "Please enter a valid FACEIT username."
        }), 400

    username = username.strip()

    try:
        player_data = api.get_player(username)

        if "error" in player_data:
            return jsonify(player_data), player_data.get("status_code", 502)

        player_id = player_data.get("player_id")

        if not player_id:
            return jsonify({
                "error": "The player profile could not be found."
            }), 404

        player_stats = api.get_player_stats(player_id)

        if "error" in player_stats:
            return jsonify(player_stats), player_stats.get("status_code", 502)

    except Exception:
        logger.exception("Unexpected error during FACEIT player search")

        return jsonify({
            "error": "An unexpected server error occurred. Please try again later."
        }), 500

    return jsonify({
        "profile": player_data,
        "stats": player_stats,
    })


if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG") == "1"
    app.run(debug=debug_mode, port=5001)
