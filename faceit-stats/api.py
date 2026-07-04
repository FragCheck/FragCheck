import requests
import json

API_KEY = "ADDKEYHERE"
USERNAME = "My5ticTurk"

headers = {
    "Authorization" : f"Bearer {API_KEY}"
}

url = f"https://open.faceit.com/data/v4/players?nickname={USERNAME}"

response = requests.get(url, headers=headers)

#When main.py will call api.py the API data should be passed to main.py to be used in index.html

print("Status Code:", response.status_code)
print("JSON Reponse:")
print(json.dumps(response.json(), indent=4))