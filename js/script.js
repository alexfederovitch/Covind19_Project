let map;

//Runs the getCountryData() function as the page loads
window.onload = () => {
    getCountryData();
    getHistoricalAll();
}

//Initializes the map
function initMap() {
  let myLatLng = {lat: 29.605254, lng: -95.524481};

  map = new google.maps.Map(document.getElementById("map"), {
    center: {
      lat: 29.605254,
      lng: -95.524481,
    },
    zoom: 3,
    styles: mapStyle,
  });

}

//Grabs the data from the API for each country
const getCountryData = () => {

    fetch("https://disease.sh/v3/covid-19/countries")
    .then((response)=>{
        return response.json();
    }).then((data)=> {
        console.log(data[205]);
        showData(data);
        showDataInTable(data);
    })

}

//Builds data for the historical data chart
const buildChartData = (data) => {
    let chartData = [];
    let chartRecovered = [];
    let chartDeaths = [];
    let defaultX;

    //Loop through the API object to pull the date and then use that to insert into chartData array.
    for (let date in data.cases) {
        let newDataPoint = {
            x: date,
            y: data.cases[date]
        }
        chartData.push(newDataPoint);
    }

    for (let date in data.recovered) {
        let newDataPoint2 = {
            x: date,
            y: data.recovered[date]
        }
        chartRecovered.push(newDataPoint2);
    }

    for (let date in data.deaths) {
        let newDataPoint3 = {
            x: date,
            y: data.deaths[date]
        }
        chartDeaths.push(newDataPoint3);
    }
    
    chartValues = [chartData, chartRecovered, chartDeaths]
    return chartValues;
}


//Builds the line chart from Chart.js for historical data
const buildLineChart = (chartValues) => {
    var timeFormat = 'MM/DD/YYYY';

    var ctx = document.getElementById('myChart').getContext('2d');
    var chart = new Chart(ctx, {
    // The type of chart we want to create
    type: 'line',

    // The data for our dataset
    data: {
        datasets: [{
            label: 'Total Cases',        
            borderColor: '#FF0000',
            data: chartValues[0],
            
        }, {
            label: 'Recovered',
            borderColor: '#008000',
            data: chartValues[1]
        }, {
            label: 'Deaths',
            borderColor: '#000000',
            data: chartValues[2]
        }]
    },

    // Configuration options go here
    options: {
        tooltips: {
            mode: 'index',
            intersect: false
        },
        //Pulled from StackOverflow Search: chart js with dates
        scales: {
            xAxes: [{
                type: "time",
                time: {
                    format: timeFormat,
                    tooltipFormat: 'll'
                }
            }],
            yAxes: [{
                ticks: {
                    
                    callback: function(value, index, values) {
                        return numeral(value).format('0,0');
                    }
                }
            }]
        }
    }
});

}

//Calls the API for historical data
const getHistoricalAll = () => {
    fetch("https://disease.sh/v3/covid-19/historical/all?lastdays=all")
    .then((response) => {
        return response.json();
    }).then((data) => {
        let chartData = buildChartData(data);
        buildLineChart(chartData);
    })
}

const showData = (data) => {

    //Loops through the data for the entire [data] object and displays the data
    data.map((country) => {

        //Defines the center for each country on the map
        let countryCenter = {
            lat: country.countryInfo.lat,
            lng: country.countryInfo.long
        }

        // Creates the circle for each country.  The size of each circle is determined by the number of cases each country has
        const countryCircle = new google.maps.Circle({
            strokeColor: "#FF0000",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#FF0000",
            fillOpacity: 0.35,
            map,
            center: countryCenter,
            radius: Math.sqrt(country.cases) * 400,

            
        });

        //Creates Div blocks to display the data for the InfoWindow popup
        let cases = numeral(country.cases).format('0,0');
        let recovered = numeral(country.recovered).format('0,0');
        let deaths = numeral(country.deaths).format('0,0');
        let html = `
        <div class="info-container">
            <div class="info-flag" style="background-image: url(${country.countryInfo.flag})">
            </div>
            <div class="info-name">
                ${country.country}
            </div>
            <div class="info-confirmed">
               Total Cases: ${cases}
            </div>
            <div class="info-recovered">
               Recovered: ${recovered}
            </div>
            <div class="info-deaths">
               Deaths: ${deaths}
            </div>
        </div>
        `

        //Creates the infoWindow object to display Total Cases, Recovered, and Death upon mouseover of the respective circle
        const infoWindow = new google.maps.InfoWindow({
            content: html, 
            position: countryCircle.center
        });

        google.maps.event.addListener(countryCircle, 'mouseover', function() {
            infoWindow.open(map);
        });

        google.maps.event.addListener(countryCircle, 'mouseout', function() {
            infoWindow.close();
        });

    });

    
}

//Function cycles through the data object to create a table displaying country
const showDataInTable = (data) => {

    let html = "";

    data.forEach((country) => {

        var tableCases = numeral(country.cases).format('0,0');
        var tableRecovered = numeral(country.recovered).format('0,0');
        var tableDeaths = numeral(country.deaths).format('0,0');

        //Creates a row for each country and appends each row to the html variable
        html += `
        <tr>
            <td>${country.country}</td>
            <td>${tableCases}</td>
            <td>${tableRecovered}</td>
            <td>${tableDeaths}</td>
        </tr>
      `
    })

    document.getElementById('table-data').innerHTML = html;
}

