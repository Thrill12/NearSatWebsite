import { getLatLngObj } from "tle.js";
import { getVisibleSatellites } from "tle.js";
import { getSatelliteName } from "tle.js";
import { getSatelliteInfo } from "tle.js";

let tleText = "";

const url = "https://celestrak.org/NORAD/elements/gp.php?GROUP=geo&FORMAT=tle"
let searchButton;
let latInput;
let longInput;
let latLong;
let allVisible = 0;
let closestDistanceSatellite = 0;
let obsLat = 34.439283990227125;
let obsLong = -117.47561122364522;

window.onload = loadButtons;

function loadButtons(){
    searchButton = document.getElementById("searchButton");
    latInput = document.getElementById("latInput");
    longInput = document.getElementById("longInput");

    updateTLEDataTimeBased();
    receiveObserverCoordinates();
    console.log(tleText);
    setInterval(function(){
        console.log("Now updating TLE Data");
        updateTLEData();
        console.log("Updated TLE data. Now taking coordinates");
        receiveObserverCoordinates();
        console.log("Finished taking coordinates. Now calculating visible satellites");
        getAllTLEsVisible();
        console.log("Finshed taking visible satellites. Now calculating closest one");
        let closest = findClosestSatellite();
        console.log("Finished closest one: " + closest);
        let title = getSatelliteTitle(closest);
        console.log("Finished title: " + title);

        let satelliteInfo = getSatelliteInfo(closest, Date.now(), obsLat, obsLong, 0);
        document.getElementById("satelliteName").innerHTML = title;
        document.getElementById("satelliteDistance").innerHTML = "(" + Math.round(satelliteInfo.range) + " km)";
        document.getElementById("satelliteLocation").innerHTML = "Height: " + Math.round(satelliteInfo.height) + " km, Velocity: " + Math.round(satelliteInfo.azimuth) + " km/s, Elevation: " + Math.round(satelliteInfo.elevation) + "°";
    }, 5000); 
}

// website updates TLE data on load
// user inputs coordinates
// user presses search button
// website gets visible satellites from observer coordinates
// website finds the closest to the observer
// website displays the satellite name and distance from observer

function findClosestSatellite(){
    let closest = allVisible[0];
    let closestDistance = 9999999; 
    for(let i = 0; i < allVisible.length; i++){
        try {
            latLong = getLatLngObj(allVisible[i]);
            let satInfo = getSatelliteInfo(allVisible[i], Date.now(), obsLat, obsLong, 0);
            let distance = satInfo.range;
            if(distance < closestDistance){
                closest = allVisible[i];
                closestDistance = distance;
            }    
        } catch (error) {
            console.log("Couldn't parse TLE for object");
        }
    }
    
    closestDistanceSatellite = closestDistance;
    return closest;
}

function receiveObserverCoordinates(){
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            obsLat = position.coords.latitude;
            obsLong = position.coords.longitude;
            console.log("Latitude: " + obsLat + " Longitude: " + obsLong);
        });
    } else {
    console.log("Geolocation is not supported by this browser.");
    }
}

function getAllTLEsVisible(){
    let tles = splitStringIntoThreeLines(tleText);
    allVisible = tles;
}

function getSatelliteTitle(tle){ 
    return getSatelliteName(tle);
}

function updateTLEData(){
    //fetch(url)
    //.then( r => r.text() )
    //.then( t => tleText = t );
    fetch("https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle")
    .then((res) => res.text())
    .then((text) => {
        tleText = text;
    })
}

function updateTLEDataTimeBased() {
    const now = new Date();

    const lastRun = localStorage.getItem('lastRun');
    if (lastRun && now - new Date(lastRun) < 24 * 60 * 60 * 1000) {
        console.log("Less than 24 hours since last run. Skipping update.");
        fetch("src/tle.txt")
        .then((data)=>data.text)
        .then((response)=>tleText = response);

        tleText = localStorage.getItem("tle");
        return;
    }

    // Update TLE data from celestrak here...
    updateTLEData();

    localStorage.setItem("tle", tleText);
    localStorage.setItem('lastRun', now.toString()); // Update the last run time
}

function splitStringIntoThreeLines(str) {
    let lines = str.split('\n');
    let result = [];

    for(let i = 0; i < lines.length; i += 3) {
        result.push(lines.slice(i, i + 3).join('\n'));
    }

    return result;
}