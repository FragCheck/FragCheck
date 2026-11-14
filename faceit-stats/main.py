
from flask import Flask, jsonify, render_template, request

import api


app = Flask(__name__)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/search-player", methods=["POST"])
def search_player():
    # Validate the incoming JSON request.
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

    # Retrieve the player's FACEIT profile.
    player_data = api.get_player(username)

    if "error" in player_data:
        return jsonify(player_data), player_data.get("status_code", 502)

    player_id = player_data.get("player_id")

    if not player_id:
        return jsonify({
            "error": "The player profile could not be found."
        }), 404

    # Retrieve the player's CS2 statistics.
    player_stats = api.get_player_stats(player_id)

    if "error" in player_stats:
        return jsonify(player_stats), player_stats.get("status_code", 502)

    # Return both datasets to the frontend.
    player_info = {
        "profile": player_data,
        "stats": player_stats,
    }

    return jsonify(player_info)


if __name__ == "__main__":
    app.run(debug=True, port=5001)
