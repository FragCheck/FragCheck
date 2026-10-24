import requests
import json
from urllib.parse import quote

API_KEY = "REMOVED_SECRET"

headers = {
    "Authorization" : f"Bearer {API_KEY}"
}

def get_player(username):
    url = f"https://open.faceit.com/data/v4/players?nickname={quote(username, safe="")}"#Encodes username to make it URL safe.

    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        thisresponse = response.json()
        return thisresponse
    
    return {
        "error": "Player not found or API request failure",
        "status_code": response.status_code 
    }

def get_player_stats(player_id):
    url = f"https://open.faceit.com/data/v4/players/{player_id}/stats/cs2"

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
      return response
    
    return {
        "error": "Stats not found or API request failure",
        "status_code": response.status_code 
    }