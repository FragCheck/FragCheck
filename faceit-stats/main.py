from flask import Flask, jsonify
import API

app = Flask(__name__)

@app.route("/")
def home():
    return jsonify({"message": "Flask app is running"})

if __name__ == "__main__":
    app.run(debug=True)