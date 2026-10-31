from flask import Flask, render_template, request, jsonify
import api
print("FRAGCHECK MAIN.PY LOADED", flush=True)

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")
  #Data from API method should be used with render_template to populate placeholders in index.html

@app.route("/search-player", methods=["POST"])
def search_player():
  print("SEARCH REQUEST RECEIVED", flush=True)
  data = request.get_json()
  username = data.get("username")
  
  playerdata = api.get_player(username)
  if "error" in playerdata:
    return jsonify(playerdata), playerdata.get("status_code", 502)

  playerid = playerdata.get("player_id")
  if not playerid:
    return jsonify({"error": "Player not found or FACEIT API request failed"}), 404

  playerstats = api.get_player_stats(playerid)

  playerinfo = {"profile": playerdata , "stats": playerstats}


  return jsonify(playerinfo)

if __name__ == "__main__":
    app.run(debug=True, port=5001)