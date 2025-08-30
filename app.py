from flask import Flask, request, jsonify, render_template
import requests

app = Flask(__name__)

# Define the NHTSA API endpoints
DECODE_API_URL = "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/"
RECALL_API_URL = "https://api.nhtsa.gov/recalls/v2/by-vin/"

@app.route('/')
def index():
    """Serves the main HTML page."""
    return render_template('index.html')

@app.route('/decode_vin', methods=['POST'])
def decode_vin():
    """Handles the initial VIN decoding."""
    vin = request.json.get('vin')
    if not vin:
        return jsonify({"error": "VIN is required"}), 400

    api_url = f"{DECODE_API_URL}{vin}?format=json"
    try:
        response = requests.get(api_url)
        response.raise_for_status()
        data = response.json()
        vehicle_info = data['Results'][0]
        return jsonify(vehicle_info)
    except requests.exceptions.RequestException as e:
        print(f"API request failed: {e}")
        return jsonify({"error": "Failed to fetch data from NHTSA API"}), 500

# *** NEW SECTION FOR RECALLS ***
@app.route('/get_recalls', methods=['POST'])
def get_recalls():
    """Handles the safety recall lookup."""
    vin = request.json.get('vin')
    if not vin:
        return jsonify({"error": "VIN is required"}), 400
        
    api_url = f"{RECALL_API_URL}{vin}?format=json"
    try:
        response = requests.get(api_url)
        response.raise_for_status()
        data = response.json()
        # The recall API has a different structure, so we return the whole thing
        return jsonify(data)
    except requests.exceptions.RequestException as e:
        print(f"Recall API request failed: {e}")
        return jsonify({"error": "Failed to fetch recall data from NHTSA API"}), 500

if __name__ == '__main__':
    app.run(debug=True)