import re
import os
import time
import urllib3
import requests
from flask import Flask, make_response
from bs4 import BeautifulSoup

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


live_link_file = 'last_live_link.txt'
last_live_link_updated = 0
last_live_link = None

if os.path.isfile(live_link_file):
    with open(live_link_file) as f:
        data = f.read()
        last_live_link = data


app = Flask(__name__)

# Set the user-agent to the latest Chrome version
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.5615.137 Safari/537.36'
}

@app.route('/')
def hello():
    return 'Hello, World! This is Flask running on port 5000.'

@app.route('/get_current_match_id', methods=['GET'])
def get_current_url():

    global last_live_link_updated, last_live_link
    url = 'http://www.cricbuzz.com/'
    response = requests.get(url, headers=headers,verify=False)
    live_link = last_live_link

    if response.status_code == 200:
        # Parse the HTML content with BeautifulSoup
        soup = BeautifulSoup(response.text, 'html.parser')
        links = soup.find_all('a', href=True)
        for link in links:
            href = link['href']
            if '/live-cricket-scores/' in href:
                code = re.findall('live-cricket-scores/(\\d+)/', href)
                if code:
                    live_link = code[0]
                    if time.time() - last_live_link_updated > 900:
                        last_live_link = code[0]
                        last_live_link_updated = time.time()

                        with open(live_link_file, 'w') as f:
                            f.write(code[0])
                    break

        if live_link:
            response = make_response({'link': live_link}, 200)
        else:
            response = make_response({'error':'Not found'}, 400)
    else:
        response = make_response({'error':'Not found'}, 400)
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, use_reloader=True, debug=True)
