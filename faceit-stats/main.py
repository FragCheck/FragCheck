from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")
  #Data from API method should be used with render_template to populate placeholders in index.html


if __name__ == "__main__":
    app.run(debug=True)