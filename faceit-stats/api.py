import requests
import json
from urllib.parse import quote

API_KEY = "f945e411-9234-4eba-b93d-39d4de1656af"

headers = {
    "Authorization" : f"Bearer {API_KEY}"
}

def get_player(username):
    url = f"https://open.faceit.com/data/v4/players?nickname={quote(username, safe="")}"#Encodes username to make it URL safe.
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    
    return {
        "error": "Player not found or API request failure",
        "status_code": response.status_code 
    }
