// Get references to all the HTML elements we'll need
const vinForm = document.getElementById('vin-form');
const vinInput = document.getElementById('vin-input');
const resultsContainer = document.getElementById('results-container');
const vehicleDetails = document.getElementById('vehicle-details');
const recallDetails = document.getElementById('recall-details');
const errorContainer = document.getElementById('error-container');
const errorMessage = document.getElementById('error-message');
const loadingSpinner = document.getElementById('loading-spinner');

vinForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const vin = vinInput.value.trim().toUpperCase();

    if (vin.length !== 17) {
        showError("Please enter a valid 17-digit VIN.");
        return;
    }

    resultsContainer.classList.add('hidden');
    errorContainer.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');

    // First, decode the VIN to get vehicle info
    fetch('/decode_vin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin: vin }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.ErrorCode && data.ErrorCode !== "0") {
            loadingSpinner.classList.add('hidden');
            showError(data.Message || "Could not decode VIN.");
        } else {
            displayResults(data);
            // *** NEW: If the first call is successful, fetch the recalls ***
            fetchRecalls(vin); 
        }
    })
    .catch(error => {
        loadingSpinner.classList.add('hidden');
        showError('An error occurred. Please try again later.');
        console.error('Error:', error);
    });
});

function fetchRecalls(vin) {
    fetch('http://127.0.0.1:5000/get_recalls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin: vin }),
    })
    .then(response => response.json())
    .then(data => {
        loadingSpinner.classList.add('hidden'); // Hide spinner after the second call completes
        displayRecalls(data.Results);
    })
    .catch(error => {
        loadingSpinner.classList.add('hidden');
        // Show an error in the recall section but don't hide vehicle info
        recallDetails.innerHTML = '<p>Could not load recall information.</p>';
        console.error('Recall fetch error:', error);
    });
}

function displayResults(data) {
    vehicleDetails.innerHTML = '';
    const detailsToShow = {
        "Make": data.Make, "Model": data.Model, "Model Year": data.ModelYear,
        "Body Class": data.BodyClass, "Vehicle Type": data.VehicleType,
        "Engine Cylinders": data.EngineCylinders, "Engine Displacement (L)": data.DisplacementL,
        "Fuel Type": data.FuelTypePrimary, "Drivetrain": data.DriveType,
        "Transmission Style": data.TransmissionStyle,
        "Manufactured In": `${data.PlantCity}, ${data.PlantState}, ${data.PlantCountry}`
    };

    for (const key in detailsToShow) {
        const value = detailsToShow[key] || 'N/A';
        const p = document.createElement('p');
        p.innerHTML = `<strong>${key}:</strong> ${value}`;
        vehicleDetails.appendChild(p);
    }
    resultsContainer.classList.remove('hidden');
}

// *** NEW FUNCTION TO DISPLAY RECALLS ***
function displayRecalls(recalls) {
    recallDetails.innerHTML = ''; // Clear previous recall info
    if (recalls.length === 0) {
        recallDetails.innerHTML = '<p>No open recalls found for this vehicle.</p>';
        return;
    }

    recalls.forEach(recall => {
        const recallDiv = document.createElement('div');
        recallDiv.className = 'recall-item';
        recallDiv.innerHTML = `
            <h4>${recall.Component}</h4>
            <p><strong>NHTSA Campaign Number:</strong> ${recall.NHTSACampaignNumber}</p>
            <p><strong>Report Received Date:</strong> ${recall.ReportReceivedDate}</p>
            <p><strong>Summary:</strong> ${recall.Summary}</p>
        `;
        recallDetails.appendChild(recallDiv);
    });
}

function showError(message) {
    errorMessage.textContent = message;
    errorContainer.classList.remove('hidden');
    resultsContainer.classList.add('hidden');
}
