from flask import Flask, render_template, request, jsonify
from api import get_player

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")
  #Data from API method should be used with render_template to populate placeholders in index.html

@app.route("/search-player", methods=["POST"])
def search_player():
  data = request.get_json()
  username = data.get("username")
  player_data = get_player(username)
  return jsonify(player_data)

if __name__ == "__main__":
    app.run(debug=True)