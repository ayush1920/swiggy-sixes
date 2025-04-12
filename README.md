# 🏏 Swiggy Sixes - Live Cricket Score Tracker

A real-time cricket score tracker that monitors live matches and notifies users when Swiggy's 66% discount is available (typically after a six is hit).

## 📋 Features

- Live cricket score updates every 15 seconds
- Real-time ball-by-ball commentary
- Audio notifications for sixes
- Detailed match information including:
  - Current score and run rates
  - Last six and four timestamps
  - Over-by-over summaries
  - Batsmen and bowler stats

## 🛠️ Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Python (Flask)
- APIs: Cricbuzz API for match data

## 🚀 Setup and Installation

1. Clone the repository
2. Install Python dependencies:
```bash
pip install flask beautifulsoup4 requests urllib3
```
3. Start the Flask server:
```bash
python simply-ai_server.py
```
4. Serve the static files using any web server
5. Open `index.html` in your browser

## 📂 Project Structure

- `index.html` - Main webpage
- `styles.css` - Styling and animations
- `script.js` - Frontend logic and API handling
- `simply-ai_server.py` - Backend server for match ID retrieval
- `swiggy_six.mp3` - Audio notification file (not included)

## ⚙️ Configuration

The server runs on `localhost:5000` by default. The frontend makes API calls to:
- `https://simply-ai.online/get_current_match_id` for match ID
- Cricbuzz API for live match data

## 🌟 Features in Detail

1. **Auto-refresh**: Commentary updates every 15 seconds
2. **Sound Effects**: Plays audio when a six is hit (requires user interaction)
3. **Visual Alerts**: Animated banner shows when Swiggy promo is active
4. **Responsive Design**: Works on both desktop and mobile devices
5. **Historical Data**: Load previous overs with "Load More" button

## 📝 Note

This project relies on Cricbuzz's API and may need updates if their API structure changes. The Swiggy promotion is time-sensitive and may not always be available.

## 📜 License

This project is intended for educational purposes only. Please ensure you have the right to use any APIs before deploying.