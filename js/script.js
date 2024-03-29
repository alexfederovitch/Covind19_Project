let map;
let globalCoronaData;
let mapCircles = [];
let vaccinations = 0;
let vaccinationsToday = 0;
let vaccinatedCard;
let radius;
const selectDefault = {
    name: "Worldwide",
    value: "",
    selected: true
}

//Runs the getCountryData() function as the page loads
window.onload = () => {
    getCountryData2();
    getHistVac();
    getStateData();
    getWorldCoronaData();
    getVaccinationTotals();
}

const setCountrySearch = (data) => {
    let countryList = [];
    countryList.push(selectDefault);
    data.forEach((data) => {
        countryList.push({
            name: data.country,
            value: data.countryInfo.iso3
        })
    })
    uiDropdown(countryList);
}

//Initializes dropdown for search menu.
const uiDropdown = (countryList) => {
    $('.ui.dropdown').dropdown({
        clearable: true,
        values: countryList,
        onChange: function(value, text) {
            if(value !== selectDefault.value) {
                getCountrySearch(value);
                vCountrySearch(value);
            } else {
                getWorldCoronaData();
                getVaccinationTotals();
            }
        }
    });
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
    streetViewControl: false,
  });
}

//Selecting caseID for 
const cardSelection = (caseID) => {
    clearMap();
    showData2(globalCoronaData, caseID);
}

const clearMap = () => {
    for(let circle of mapCircles) {
        circle.setMap(null);
    }
}


//API call for US State data
const getStateData = () => {

    fetch("https://disease.sh/v3/covid-19/states?yesterday=true&allowNull=true")
    .then((response)=>{
        return response.json();
    }).then((pieData)=> {
        // console.log(pieData);
    });

}

//Call of country API for search bar functionality for individual countries
const getCountrySearch = (countryIso) => {
    const url = "https://disease.sh/v3/covid-19/countries/" + countryIso;
    fetch(url)
    .then((response)=>{
        return response.json()
    }).then((data)=>{
        cardFill(data);
    })
}

//API call for the Vaccine statistics for individual countries
const vCountrySearch = (vCountryIso) => {
    const url = "https://disease.sh/v3/covid-19/vaccine/coverage/countries/" + vCountryIso + "?lastdays=30&fullData=false";
    fetch(url)
    .then((response)=>{
        return response.json()
    }).then((data)=>{
        vCardData(data);
        // console.log(data);
    })
}

//Use "http://localhost:3000/countries" to use custom API
//Remake of API  call for country data that includes vaccine data for every country
const getCountryData2 = () => {
        Promise.all([fetch("https://disease.sh/v3/covid-19/countries"), 
    fetch("https://disease.sh/v3/covid-19/vaccine/coverage/countries?lastdays=all")
    ]).then(function (responses) {
        return Promise.all(responses.map(function (response) {
        return response.json();
    }));
    }).then(function(data2) {
        //Adding data to globalCoronaData to use for case selector variable
        globalCoronaData = data2;
        console.log(globalCoronaData);
        showData2(data2);
        showDataInTable(data2[0]);
        setCountrySearch(data2[0]);
    });
}

//Builds data for the historical data chart
const buildChartData = (data) => {
    let chartData = [];
    let chartRecovered = [];
    let chartDeaths = [];
    let chartVaccine = [];

    //Loop through the API object to pull the date and then use that to insert into chartData array.
    for (let date in data[0].cases) {
        let newDataPoint = {
            x: date,
            y: data[0].cases[date]
        }
        chartData.push(newDataPoint);
    }

    for (let date in data[0].recovered) {
        let newDataPoint2 = {
            x: date,
            y: data[0].recovered[date]
        }
        chartRecovered.push(newDataPoint2);
    }

    for (let date in data[0].deaths) {
        let newDataPoint3 = {
            x: date,
            y: data[0].deaths[date]
        }
        chartDeaths.push(newDataPoint3);
    }

    for (let date in data[1]) {
        let newDataPoint4 = {
            x: date,
            y: data[1][date]
        }
        chartVaccine.push(newDataPoint4);
    }
    
    chartValues = [chartData, chartRecovered, chartDeaths, chartVaccine];
    return chartValues;
}

const buildPieChart = (pieData) => {

    var ctx = document.getElementById('myPieChart').getContext('2d');
    
    var myPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            datasets: [{
                data: [10, 20, 30]
            }],
        
            // These labels appear in the legend and in the tooltips when hovering different arcs
            labels: [
                'Red',
                'Yellow',
                'Blue'
            ]
        }
    }); 
}

//Builds the line chart from Chart.js for historical data
const buildLineChart = (chartValues) => {
    var timeFormat = 'MM/DD/YYYY';

    // console.log(chartValues[2]);
    // console.log(chartValues[3]);
    var ctx = document.getElementById('myChart').getContext('2d');
    var chart = new Chart(ctx, {
    // The type of chart we want to create
    type: 'line',
        
    // The data for our dataset
    data: {
        datasets: [{
            label: 'Vaccinations',        
            borderColor: '#0000FF',
            data: chartValues[3],
            
        }, {
            label: 'Recovered',
            borderColor: '#008000',
            data: chartValues[1]
        }, {
            label: 'Deaths',
            borderColor: '#000000',
            data: chartValues[2]
        }, {
            label: 'Total Cases',
            borderColor: '#FF0000',
            data: chartValues[0]
        }]
    },

    // Configuration options go here
    options: {
        responsive: true,
        maintainAspectRatio: false,
        tooltips: {
            mode: 'index',
            intersect: false
        },
        //Pulled from StackOverflow Search: chart js with dates
        scales: {
            xAxes: [{
                type: "time",
                gridLines: {
                    display:false
                },
                time: {
                    format: timeFormat,
                    tooltipFormat: 'll'
                }
            }],
            yAxes: [{
                ticks: {
                    
                    callback: function(value, index, values) {
                        return numeral(value).format('0.0a');
                    }
                }
            }]
        }
    }
});

}

//Combined API fetch for Vaccines and historical data
const getHistVac = () => {
    Promise.all([fetch("https://disease.sh/v3/covid-19/historical/all?lastdays=all"), 
                 fetch("https://disease.sh/v3/covid-19/vaccine/coverage?lastdays=all")
    ]).then(function (responses) {
        return Promise.all(responses.map(function (response) {
            return response.json();
        }));
    }).then(function(data) {
        // console.log(data[0]);
        // console.log(data[1]);
        let chartData = buildChartData(data);
        // console.log(chartData);
        buildLineChart(chartData);
    });
}

//API for world Coronavirus data for data cards
const getWorldCoronaData = () => {
    fetch("https://disease.sh/v2/all")
    .then((response)=>{
        return response.json()
    }).then((data)=>{
        cardFill(data);
    })
}

//API for world vaccination data for vaccination data card
const getVaccinationTotals = () => {
    fetch("https://disease.sh/v3/covid-19/vaccine/coverage?lastdays=30")
    .then((response)=>{
        return response.json()
    }).then((data)=>{
        vCardData(data);
        // console.log(data);
    })
}

//Information for the Vaccination card data
const vCardData = (data) => {
    const vaccineDates = [];
    // console.log(data)

    if(data.timeline === data.timeline) {
        for(let date in data.timeline) {
            vaccinatedCard = data.timeline[date];
            vaccineDates.push(vaccinatedCard);
            // console.log(vaccinatedCard)
        }
        vaccinationsToday = vaccineDates[28] - vaccineDates[27];

        vaccinatedCard = numeral(vaccinatedCard).format('0,0');
        // console.log(vaccinatedCard);
        vaccinationsToday = numeral(vaccinationsToday).format('+0,0');
        document.querySelector('.vaccinated-text').innerHTML = vaccinatedCard;
        document.querySelector('.vaccinated-today').innerHTML = vaccinationsToday;
    }

    for(let date in data) {
        vaccinatedCard = data[date];
        vaccineDates.push(vaccinatedCard);
    }

    vaccinatedCard = vaccineDates[29];
    vaccinationsToday = vaccineDates[28] - vaccineDates[27];

    // console.log(vaccineDates[29]);
    // console.log(vaccineDates[28]);
    // console.log(vaccineDates[27]);
    vaccinatedCard = numeral(vaccinatedCard).format('0,0');
    // console.log(vaccinatedCard);
    vaccinationsToday = numeral(vaccinationsToday).format('+0,0');
    document.querySelector('.vaccinated-text').innerHTML = vaccinatedCard;
    document.querySelector('.vaccinated-today').innerHTML = vaccinationsToday;
}

//Information for the data cards
const cardFill = (cardData) => {
    let totalCard = numeral(cardData.cases).format('0,0');
    let activeCard = numeral(cardData.active).format('0,0');
    let recoveredCard = numeral(cardData.recovered).format('0,0');
    let deathsCard = numeral(cardData.deaths).format('0,0');
    let perMillion = numeral(cardData.casesPerOneMillion).format('0,0');
    let casesToday = numeral(cardData.todayCases).format('+0,0');
    let recoveredToday = numeral(cardData.todayRecovered).format('+0,0');
    let deathsToday = numeral(cardData.todayDeaths).format('+0,0');
    document.querySelector('.cases-text').innerHTML = totalCard;
    document.querySelector('.active-text').innerHTML = activeCard;
    document.querySelector('.recovered-text').innerHTML = recoveredCard;
    document.querySelector('.deaths-text').innerHTML = deathsCard;
    document.querySelector('.per-million').innerHTML = `${perMillion} PMP`;
    document.querySelector('.cases-today').innerHTML = casesToday;
    document.querySelector('.recovered-today').innerHTML = recoveredToday;
    document.querySelector('.deaths-today').innerHTML = deathsToday;
}

//Shows data in the map area
const showData2 = (data2, caseID="cases") => {
    // console.log(data2[0]);
    // console.log(data2[1][0].timeline);

    //Loops through the data for the entire [data] object and displays the data
    data2[0].map((country) => {

        //Loops through the data for the vaccinations and compares the countries with reported vaccination number
        Object.entries(data2[1]).forEach((entry) => {
            const [key, vaccine] = entry;
            if (vaccine.country === country.country) {
                //Getting latest date from the API
                for (let date in entry[1].timeline) {
                    vaccinations = entry[1].timeline[date];
                }
                return vaccinations;
            }
        });

        //Defines the center for each country on the map
        let countryCenter = {
            lat: country.countryInfo.lat,
            lng: country.countryInfo.long
        }

        //Setting radius variable
        radius = Math.sqrt(country[caseID]) * 200;

        //Changing the radius variable for vaccinations
        if (caseID === 'vaccinated') {
            radius = Math.sqrt(vaccinations) * 100;
        }

        if (caseID === 'deaths') {
            radius = Math.sqrt(country['deaths']) * 1500;
        }

        //Object to change the colors of the map circles
        let caseIDColors = {
            cases: "#FF0000",
            active: "#008000",
            recovered: "#9d80fe",
            deaths: "#000000",
            vaccinated: "#0000FF"
        }


        // Creates the circle for each country.  The size of each circle is determined by the number of cases each country has
        let countryCircle = new google.maps.Circle({
            strokeColor: caseIDColors[caseID],
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: caseIDColors[caseID],
            fillOpacity: 0.35,
            map,
            center: countryCenter,
            radius: radius
        });

        //Pushes the map circles for circle recreation
        mapCircles.push(countryCircle);

        //Creates Div blocks to display the data for the InfoWindow popup
        let cases = numeral(country.cases).format('0,0');
        let recovered = numeral(country.recovered).format('0,0');
        let deaths = numeral(country.deaths).format('0,0');
        let vaccinated = numeral(vaccinations).format('0,0')
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
            <div class="info-vaccinated">
            Vaccinated: ${vaccinated}
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