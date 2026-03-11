const tempSelect = document.getElementById("tempUnit");
const savedUnit = localStorage.getItem("tempUnit");
if (savedUnit) {
    tempSelect.value = savedUnit;
}

tempSelect.addEventListener("change", () => {
    localStorage.setItem("tempUnit", tempSelect.value);
    fetchWeather(); 
});

const notesArea = document.getElementById("tripNotes");

const savedNotes = sessionStorage.getItem("tripNotes");
if (savedNotes) {
    notesArea.value = savedNotes;
}

let m = notesArea;
let n = 'notesArea';

Object.defineProperty(m, n,{
    get: function() {
        return this.getAttribute('data-value') || '';
    },
    set: function(val) {
        this.setAttribute('data-value', val);
    }
});

function saveNotes() {
    m.value = notesArea.value;
    console.log("Notes saved:", m.value);
    sa
}

notesArea.addEventListener("input", () => {
    sessionStorage.setItem("tripNotes", notesArea.value);
});

const weatherPara = document.getElementById("weather");
async function fetchWeather() {
    try {
        const response = await fetch(
            "https://api.open-meteo.com/v1/forecast?latitude=22.6939&longitude=72.8616&daily=sunrise,sunset&hourly=temperature_2m,wind_speed_10m&current=temperature_2m,wind_speed_10m&timezone=auto&forecast_days=1"
        );
        const data = await response.json();

        let tempC = data.current.temperature_2m;
        const windSpeed = data.current.wind_speed_10m;
        const sunrise = data.daily.sunrise[0].split("T")[1];
        const sunset = data.daily.sunset[0].split("T")[1];

        let displayTemp = tempC;
        let unitSymbol = "°C";
        if (tempSelect.value === "fahrenheit") {
            displayTemp = (tempC * 9 / 5 + 32).toFixed(2);
            unitSymbol = "°F";
        }

        weatherPara.textContent =
            `Current Weather in Nadiad: ${displayTemp}${unitSymbol} with wind speeds of ${windSpeed} km/h
            (Sunrise: ${sunrise}, Sunset: ${sunset})`;
    } catch (error) {
        weatherPara.textContent = "Unable to load weather data.";
        console.error(error);
    }
}
fetchWeather();
