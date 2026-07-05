import requests
import json

API_KEY = "f945e411-9234-4eba-b93d-39d4de1656af"
USERNAME = "My5ticTurk"

headers = {
    "Authorization" : f"Bearer {API_KEY}"
}

def get_player(username):
    url = f"https://open.faceit.com/data/v4/players?nickname={USERNAME}"

    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    
    return {
        "error": "Player not found or API request failure",
        "status_code": response.status_code 
    }
