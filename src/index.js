//TASK: get current date and time, apply this to the today_api_url

let date = new Date().toJSON();
let currentDate = date.slice(0, 10);
let currentTime = `${date.slice(10, 16)}Z`;
let currentHour = date.slice(11, 13);
let currentMinute = date.slice(14, 16);
console.log(`date is ${currentDate}`);
console.log(`time is ${currentTime}`);
const today_api_url = `https://api.carbonintensity.org.uk/intensity/date/${currentDate}`

//Get index of latest data
let timeIndex;
async function getTimeIndex() {
  const response = await fetch(today_api_url);
  const dataArray = await response.json();
  const { data } = dataArray;
  //Get possible array indices by hour
  let timeIndexArray = [];
  for (let i = 0; i < data.length; i++) {
    let objectHour = data[i]['from'].slice(11, 13);
    if (currentHour === objectHour) {
      timeIndexArray.push(i);
    }
  }
  //Get data from the current half hour
  for (let i = 0; i < timeIndexArray.length; i++) {
    if (currentMinute <= 30) {
      timeIndex = timeIndexArray.shift();
    } else {
      timeIndex = timeIndexArray.pop();
    }
  }
  getData(dataArray, timeIndex);
  return timeIndex;
}
setInterval(getTimeIndex(), 60000); 

//Get api data for current time
let previousDataObject;
let latestDataObject;

function getData(dataArray, timeIndex) {
  const xlabels = [];
  const intensityLabels = [];
  const forecastLabels = [];
  const { data } = dataArray;

  //Get time period of latest complete data set
  if (timeIndex >= 2) {
    const { from, to, intensity } = data[timeIndex - 2];
    generateSummary(from, to, intensity, timeIndex);
  } else {
    const { from, to, intensity } = data[timeIndex];
    generateSummary(from, to, intensity, timeIndex);
  }

function generateSummary(from, to, intensity, timeIndex) {
  let timeFrom = from.slice(11, 16);
  let timeTo = to.slice(11, 16);

  for (let i = 0; i < data.length; i++) {
    let timeLabel = data[i]['from'].slice(11, 16);
    let intensity = data[i]['intensity']['actual'];
    let forecast = data[i]['intensity']['forecast'];
    xlabels.push(timeLabel);
    if (intensity !== null) {
      intensityLabels.push(intensity);
    }
    if (forecast !== null) {
      forecastLabels.push(forecast);
    }
  }

  //Get daily maximum and minimum forecast carbon intensity 
  let dailyForecastArray = [];
  for (let i = 0; i < data.length; i++) {
    dailyForecastArray.push(data[i]['intensity']['forecast']);
  }
  //'...' is 'spread syntax'
  let dailyMaxForecast = Math.max(...dailyForecastArray);
  let dailyMinForecast = Math.min(...dailyForecastArray);

  document.getElementById('forecastTime').innerHTML = `
    <div id="timePeriodCaption">Latest data available 
       ${timeIndex >= 2 ? 'for ' : 'in'}
    </div>
    <div id="timePeriod" class="chartSummaryStats">
      ${timeIndex >= 2 ? `${timeFrom} - ${timeTo}` : `${60 - currentMinute} minutes`}
    </div>
  `;
  document.getElementById('latestIntensity').innerHTML = `
    <div id="timePeriodCaption" class="flex">
      ${timeIndex >= 2 ? `${intensity['index']}` : ''}
    </div>
    <div id="intensityContainer" class="flex">
      <div>
        <img id="intensityGauge" src="./images/intensity_indicator.svg" alt="intensity gauge icon" width="20" height="20">
      </div>
      <div class="chartSummaryStats">
        ${timeIndex >= 2 ? `${intensity['actual']}` : `pending`}
      </div>
    </div>
  `;
  document.getElementById('latestIntensity').style.color = 'var(--electric-blue-color)';
  console.log(document.getElementById('intensityGauge').getElementsByTagName('img'));
  document.getElementById('forecastMax').innerHTML = `
    <div id="maxCaption" class="flex">Max: </div>
    <div id="dailyMaxIntensity" class="chartSummaryStats">${dailyMaxForecast}</div>
  `;
  document.getElementById('forecastMin').innerHTML = `
    <div id="minCaption" class="flex">Min: </div>
    <div id="dailyMinIntensity" class="chartSummaryStats">${dailyMinForecast}</div>
  `;
  
  previousDataObject = data[timeIndex - 1]
  latestDataObject = data[timeIndex];
  initialiseChart(xlabels, intensityLabels, forecastLabels, dailyMaxForecast);
  return previousDataObject, latestDataObject;
  }
}

//Initialise chart.js
function initialiseChart(xlabels, intensityLabels, forecastLabels, dailyMaxForecast) {
  const style = getComputedStyle(document.body);
  const ctx = document.getElementById('chart');
  //Set the y-axis maximum to the maximum daily forecasted carbon intensity added to 200, rounded up to the nearest hundred
  let chartMax = Math.ceil(((dailyMaxForecast + 200)) / 100) * 100;
  const mixedChart = new Chart(ctx, {
    data: {
      labels: xlabels,
      datasets: [{
        type: 'line',
        label: 'Daily National Carbon Intensity',
        data: intensityLabels,
        backgroundColor: `${style.getPropertyValue('--opaque-electric-blue-color').trim()}`,
        borderColor: `${style.getPropertyValue('--electric-blue-color').trim()}`,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 0,
        //point styles
        pointHitRadius: 10,
        pointBorderColor: `${style.getPropertyValue('--electric-blue-color').trim()}`, 
        pointBorderWidth: 2,
        pointHoverBackgroundColor: `${style.getPropertyValue('--main-grey-color').trim()}`,
        fill: {
          target: 'origin',
          below: `${style.getPropertyValue('--main-grey-color').trim()}`
        },
        order: 1
      },  
      {
        type: 'bar',
        label: 'Forecast',
        data: forecastLabels,
        backgroundColor: `${style.getPropertyValue('--yellow-color').trim()}`,
        borderColor: `${style.getPropertyValue('--dark-yellow-color').trim()}`,
        tension: 0.2,
        borderWidth: 2,
        pointRadius: 0,
        //point styles
        pointHitRadius: 10,
        pointBorderColor: `${style.getPropertyValue('--dark-yellow-color').trim()}`, 
        pointBorderWidth: 2,
        pointHoverBackgroundColor: `${style.getPropertyValue('--yellow-color').trim()}`,
        // pointHoverBorderColor: `${style.getPropertyValue('--main-blue-color').trim()}`
        order: 2
      }],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: chartMax,
          title: {
            display: true,
            text: `Carbon Intensity (gCO${'\u2082'} /kWh)`,
            font: {
              family: "'Roboto', sans-serif",
              size: 14
            } 
          }
        }, 
        x: {
          title: {
            display: true,
            text: 'Time (Local Time)',
            font: {
              family: "'Roboto', sans-serif",
              size: 14
            } 
          }
        }
      },
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 12 / 7, //width = 1.75height
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

//Energy Generation Mix
const energyMix_api_url = `https://api.carbonintensity.org.uk/generation/${currentDate}${currentTime}/pt24h`;
async function getEnergyMix() {
  const response = await fetch(energyMix_api_url);
  const dataArray = await response.json();
  const { data } = dataArray;
  // let fuelTypeArray = [[], [], [], [], [], [], [], [], [];

  let fuelTypeArray = [
    {fuel: 'gas', percentage: []}, 
    {fuel: 'coal', percentage: []}, 
    {fuel: 'biomass', percentage: []}, 
    {fuel: 'nuclear', percentage: []}, 
    {fuel: 'hydro', percentage: []}, 
    {fuel: 'imports', percentage: []}, 
    {fuel: 'other', percentage: []}, 
    {fuel: 'wind', percentage: []}, 
    {fuel: 'solar', percentage: []}
  ];

  //Iterate over each half-hour data object
  for (let i = 0; i < data.length; i++) {
  // Iterate over each 'generationmix' array in the current object
    let fuelData = data[i]['generationmix'];
      for (let smallestArray_i = 0; smallestArray_i < data[smallestArray_i]['generationmix'].length; smallestArray_i++) {
        let fuelType = fuelData[smallestArray_i]['fuel'];
        let fuelPerc = fuelData[smallestArray_i]['perc'];
        addFuelPercentage();
        function addFuelPercentage() {
          switch (fuelType) {
            case 'gas':
              fuelTypeArray[0].percentage.push(fuelPerc);
              break;
            case 'coal':
              fuelTypeArray[1].percentage.push(fuelPerc);
              break;
            case 'biomass':
              fuelTypeArray[2].percentage.push(fuelPerc);
              break;
            case 'nuclear':
              fuelTypeArray[3].percentage.push(fuelPerc);
              break;
            case 'hydro':
              fuelTypeArray[4].percentage.push(fuelPerc);
              break;
            case 'imports':
              fuelTypeArray[5].percentage.push(fuelPerc);
              break;
            case 'other':
              fuelTypeArray[6].percentage.push(fuelPerc);
              break;
            case 'wind':
              fuelTypeArray[7].percentage.push(fuelPerc);
              break;
            case 'solar':
              fuelTypeArray[8].percentage.push(fuelPerc);
              break;
            default:
              console.error('Switch statement error');
          }
        }
      }
    }
    console.log(fuelTypeArray)

  //Current Generation Mix
  let currentPercArray = [];
  fuelTypeArray.forEach(function(fuelObject) {
    let currentPerc = fuelObject.percentage[47]
    //Append '.0' to integer percentages
    if (Number.isInteger(currentPerc) === true) {
      let intPerc = `${currentPerc}.0`;
      currentPercArray.push(intPerc);
    } else {
      currentPercArray.push(currentPerc);
    }
  });

  //Average Generation Mix over past 24 hours
  let avgPercArray = [];
  let fuelTypeSum = 0;
  fuelTypeArray.forEach(function(fuelObject) {
    let percentageArray = fuelObject.percentage;
    percentageArray.forEach(function(percentage) {
      fuelTypeSum += percentage;
    });
    avgPercArray.push(parseFloat((fuelTypeSum / 48).toFixed(1)));
    fuelTypeSum = 0;
  });
  initialiseCurrentPieChart(currentPercArray, avgPercArray);
}
setInterval(getEnergyMix(), 360000)


function initialiseCurrentPieChart(currentPercArray, avgPercArray) {
  const style = getComputedStyle(document.body);
  const pieChart = document.getElementById('pieChart');
  const sectionLabels = ['Gas', 'Coal', 'Biomass', 'Nuclear', 'Hydro', 'Imports', 'Other', 'Wind', 'Solar'];
  let chartColours = [
      `${style.getPropertyValue('--electric-blue-color').trim()}`,
      `${style.getPropertyValue('--main-orange-color').trim()}`,
      `${style.getPropertyValue('--main-green-color').trim()}`, 
      `${style.getPropertyValue('--main-dark-blue-color').trim()}`,
      `${style.getPropertyValue('--main-grey-color').trim()}`,
      `${style.getPropertyValue('--yellow-color').trim()}`, 
      `${style.getPropertyValue('--opaque-electric-blue-color').trim()}`,
      'hsl(0, 0%, 75%)', 
      `${style.getPropertyValue('--dark-yellow-color').trim()}`
  ];
  const percChart = new Chart(pieChart, {
    type: 'doughnut',
    data: {
      labels: sectionLabels,
      datasets: [{
        label: 'Current Generation Mix',
        data: currentPercArray,
        backgroundColor: chartColours,
        borderColor: `${style.getPropertyValue('--main-white-color').trim()}`,
        tension: 0.3,
        borderWidth: 1,
        fill: {
          target: 'origin',
          below: `${style.getPropertyValue('--main-grey-color').trim()}`
        },
      }], 
    },
    options: {
      plugins: {
        legend: {
          display: false
        }
      },
    }

  });

  createLegend(currentPercArray, avgPercArray, chartColours);
}

function createLegend(currentPercArray, avgPercArray, chartColours) {
  let legendLabel = ['Gas', 'Coal', 'Biomass', 'Nuclear', 'Hydro', 'Imports', 'Other', 'Wind', 'Solar'];
  document.getElementById('piechartLegendContainer').innerHTML = `
    <table id="piechartLegend">
      <tr>
        <th width="33%">Fuel type</th>
        <th width="34%">Proportion of GM</th>
        <th width="33%">24h-average GM</th>
      </tr>
    </table>
    <div>
      <p id="piechartCaption">GM = Generation Mix. Fuel types with a low daily GM contribution may not be visible in the chart.</p>
    </div>
  `;
  let i = 0;
  legendLabel.forEach(function(label) {
    let newTr = document.createElement('tr');
    newTr.innerHTML = `
      <td id="legTab-${label}" class="legTabGroup">${label}</td>
      <td>${currentPercArray[i]}%</td>
      <td>${avgPercArray[i]}%</td>
    `;
    i += 1;
    document.getElementById('piechartLegend').appendChild(newTr);
  });
  for (let i = 0; i < legendLabel.length; i++) {
    let label = legendLabel[i];
    document.getElementById(`legTab-${label}`).style.backgroundColor = `${chartColours[i]}`;
  }
  document.getElementById('piechartCaption').style.fontSize = `${0.8 * 16}px`;
}