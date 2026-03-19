const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const clearBtn = document.getElementById('clear-btn');
const resultsContainer = document.getElementById('results');
const searchIcon = document.querySelector('.search-container i'); // icône de recherche

let travelData = null;

const timeZoneMap = {
    // Country
    "Australia": "Australia/Sydney",
    "Japan": "Asia/Tokyo",
    "Brazil": "America/Sao_Paulo",
    // Specific cities (if needed)
    "Sydney, Australia": "Australia/Sydney",
    "Melbourne, Australia": "Australia/Melbourne",
    "Tokyo, Japan": "Asia/Tokyo",
    "Kyoto, Japan": "Asia/Tokyo",
    "Rio de Janeiro, Brazil": "America/Sao_Paulo",
    "São Paulo, Brazil": "America/Sao_Paulo",
    // Temples
    "Angkor Wat, Cambodia": "Asia/Phnom_Penh",
    "Taj Mahal, India": "Asia/Kolkata",
    // Beaches
    "Bora Bora, French Polynesia": "Pacific/Tahiti",
    "Copacabana Beach, Brazil": "America/Sao_Paulo"
};

// Function to get the time zone from the name of the place
function getTimeZoneForItem(locationName) {
    // Direct search in the map
    if (timeZoneMap[locationName]) {
        return timeZoneMap[locationName];
    }
    // Otherwise, try to extract the country (after the comma)
    const parts = locationName.split(',');
    if (parts.length > 1) {
        const country = parts[1].trim();
        if (timeZoneMap[country]) {
            return timeZoneMap[country];
        }
    }
    // Last resort: search in the keys that contain the name
    for (let key in timeZoneMap) {
        if (locationName.includes(key) || key.includes(locationName)) {
            return timeZoneMap[key];
        }
    }
    return null; // spindle not found
}

// Loading JSON
fetch('travel_recommendation.json')
    .then(response => {
        if (!response.ok) throw new Error('Erreur de chargement');
        return response.json();
    })
    .then(data => {
        travelData = data;
        console.log('Données chargées :', travelData);
    })
    .catch(error => {
        console.error('Erreur fetch :', error);
        resultsContainer.innerHTML = '<p class="no-results">Impossible de charger les recommandations.</p>';
    });

// Normalization of the keyword
function normalizeKeyword(keyword) {
    return keyword.trim().toLowerCase();
}

// Main search
function performSearch() {
    if (!travelData) {
        resultsContainer.innerHTML = '<p class="no-results">Données non chargées.</p>';
        return;
    }

    const keyword = normalizeKeyword(searchInput.value);
    if (keyword === '') {
        resultsContainer.innerHTML = '<p class="no-results">Veuillez entrer un mot-clé.</p>';
        return;
    }

    let results = [];

    // 1. Search by country name
    const matchedCountry = travelData.countries.find(country => 
        country.name.toLowerCase().includes(keyword)
    );
    if (matchedCountry) {
        results = matchedCountry.cities.map(city => ({
            name: city.name,
            imageUrl: city.imageUrl,
            description: city.description
        }));
    }
    // 2. Beach category
    else if (keyword.includes('beach') || keyword.includes('plage') || keyword.includes('plages')) {
        results = travelData.beaches.map(beach => ({
            name: beach.name,
            imageUrl: beach.imageUrl,
            description: beach.description
        }));
    }
    // 3. Temple category
    else if (keyword.includes('temple') || keyword.includes('temples')) {
        results = travelData.temples.map(temple => ({
            name: temple.name,
            imageUrl: temple.imageUrl,
            description: temple.description
        }));
    }
    // 4. Country category (all countries)
    else if (keyword.includes('country') || keyword.includes('countries') || keyword.includes('pays')) {
        travelData.countries.forEach(country => {
            country.cities.forEach(city => {
                results.push({
                    name: city.name,
                    imageUrl: city.imageUrl,
                    description: city.description
                });
            });
        });
    }
    else {
        resultsContainer.innerHTML = '<p class="no-results">Aucune recommandation trouvée. Essayez "plage", "temple", "pays" ou un nom de pays.</p>';
        return;
    }

    displayResults(results);
}

// Displaying results with local time
function displayResults(items) {
    if (!items || items.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">Aucune recommandation disponible.</p>';
        return;
    }

    let html = '';
    items.forEach(item => {
        // Default image management
        let imageUrl = item.imageUrl;
        if (imageUrl.includes('enter_your_image')) {
            imageUrl = 'https://i.pinimg.com/originals/2c/2b/0c/2c2b0c8fa02be5e186ef81d3b6c8c4d0.jpg';
        }

        // Local time calculation
        const timeZone = getTimeZoneForItem(item.name);
        let localTime = 'Non disponible';
        if (timeZone) {
            const options = { 
                timeZone: timeZone, 
                hour12: true, 
                hour: 'numeric', 
                minute: 'numeric', 
                second: 'numeric' 
            };
            localTime = new Date().toLocaleTimeString('en-US', options);
        }

        html += `
            <div class="result-card">
                <img src="${imageUrl}" alt="${item.name}" loading="lazy">
                <div class="card-content">
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                    <p><strong>Heure locale :</strong> ${localTime}</p>
                </div>
            </div>
        `;
    });
    resultsContainer.innerHTML = html;
}

// Reset
function clearSearch() {
    searchInput.value = '';
    resultsContainer.innerHTML = '';
}

// Events
searchBtn.addEventListener('click', performSearch);
clearBtn.addEventListener('click', clearSearch);
searchIcon.addEventListener('click', performSearch); // click on the search icon
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

// Adaptation of the existing showSection function to hide results outside the home
const originalShowSection = window.showSection; // if showSection is already defined
window.showSection = function(sectionId) {
    if (originalShowSection) originalShowSection(sectionId);
    // If we are not on home, we clear the results
    if (sectionId !== 'home') {
        resultsContainer.innerHTML = '';
    }
};