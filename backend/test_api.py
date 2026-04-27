import requests
import os

url = 'http://localhost:5000/api/upload'
file_path = r'C:\Users\Hp\.gemini\antigravity\brain\1882b188-47e2-4d08-a639-0dcc4740f7dd\sample_receipt_1777256162483.png'

if not os.path.exists(file_path):
    print(f"File not found: {file_path}")
    exit(1)

with open(file_path, 'rb') as f:
    files = {'file': f}
    print(f"Uploading {file_path} to {url}...")
    try:
        response = requests.post(url, files=files)
        print(f"Status Code: {response.status_code}")
        print("Response Body:")
        print(response.json())
    except Exception as e:
        print(f"Error: {e}")
