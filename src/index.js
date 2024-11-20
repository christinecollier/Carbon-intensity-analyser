//Disappearing navbar
window.addEventListener('scroll', function() {
  let header = document.getElementById('header');
  let headerStyle = header.style;
  let cssStyles = getComputedStyle(document.body);
  if (window.scrollY >= 60) {
    headerStyle.color = 'transparent';
    headerStyle.background = 'transparent';
    header.addEventListener('mouseover', function() {
      headerStyle.color = `${cssStyles.getPropertyValue('--main-white-color')}`;
      headerStyle.background =`${cssStyles.getPropertyValue('--main-background-color')}`; 
    })
    header.addEventListener('mouseout', function() {
      if (window.scrollY >= 60) {
        headerStyle.color = 'transparent';
        headerStyle.background = 'transparent';
      } else {
        headerStyle.color = `${cssStyles.getPropertyValue('--main-background-color')}`;
        headerStyle.background =`${cssStyles.getPropertyValue('--main-white-color')}`; 
      };
    })
  } else {
    if (headerStyle.color = 'transparent') {
      headerStyle.color = `${cssStyles.getPropertyValue('--main-background-color')}`;
      headerStyle.background =`${cssStyles.getPropertyValue('--main-white-color')}`;  
    }
    header.addEventListener('mouseover', function() {
      headerStyle.color = `${cssStyles.getPropertyValue('--main-background-color')}`;
      headerStyle.background =`${cssStyles.getPropertyValue('--main-white-color')}`;  
    })
  }
});

//Navbar buttons
document.getElementById('title').addEventListener('click', function() {
  window.scroll ({
    top:0,
    left: 0,
    behavior: 'smooth'
  })
});
document.getElementById('navCap_1').addEventListener('click', function() {
  document.getElementById('chartWrapper').scrollIntoView({ behavior: 'smooth', block: 'center'});
});
document.getElementById('navCap_2').addEventListener('click', function() {
  document.getElementById('piechartSection').scrollIntoView({ behavior: 'smooth', block: 'start'});
});
document.getElementById('navCap_3').addEventListener('click', scrollToBottom);
document.getElementById('navCap_4').addEventListener('click', scrollToBottom);

function scrollToBottom() {
  document.getElementById('creditsWrapper').scrollIntoView({ behavior: 'smooth', block: 'start'});
}

//Get current date and time, apply this to the today_api_url
let date = new Date().toJSON();
let currentDate = date.slice(0, 10);
let currentTime = `${date.slice(10, 16)}Z`;
let currentHour = date.slice(11, 13);
let currentMinute = date.slice(14, 16);
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
  let maxGmIndex = dailyForecastArray.indexOf(dailyMaxForecast);
  let dailyMaxTimeFrom = data[maxGmIndex].from.slice(11, 16);
  let dailyMaxTimeTo = data[maxGmIndex].to.slice(11, 16);
  let dailyMinForecast = Math.min(...dailyForecastArray);
  let minGmIndex = dailyForecastArray.indexOf(dailyMinForecast);
  let dailyMinTimeFrom = data[minGmIndex].from.slice(11, 16);
  let dailyMinTimeTo = data[minGmIndex].to.slice(11, 16);
  let intensityLabel = intensity['index'][0].toUpperCase() + intensity['index'].slice(1);

  document.getElementById('forecastTime').innerHTML = `
    <div id="timePeriodCaption">Latest carbon intensity data available  
       ${timeIndex >= 2 ? 'for ' : 'in '}
    </div>
    <div id="timePeriod" class="chartSummaryStats">
      ${timeIndex >= 2 ? `${timeFrom} - ${timeTo}` : `${60 - currentMinute} minutes.`}
    </div>
  `;
  document.getElementById('latestIntensity').innerHTML = `
    <div id="colourTab1" class="colourTabs"></div>
    <div class="tabTitles">Carbon Intensity*</div>
    <div id="intensityContainer" class="flex">
      <div class="chartSummaryStats">
        ${timeIndex >= 2 ? `${intensity['actual']}` : `Pending*`}
      </div>
      <div id="intensityGauge" class="gauge">
        <img src="./images/intensity_indicator.svg" alt="intensity gauge icon" width="20" height="20">
      </div>
    </div>
    <div id="intensityCaption" class="flex intensityCaptions">
      ${timeIndex >= 2 ? `${intensityLabel}` : 'Pending'}
    </div>
    `;
  document.getElementById('latestIntensity').style.color = 'var(--main-background-color)';
  document.getElementById('intensityCaption').style.color = '#6a8eb9';
  
  document.getElementById('forecastMax').innerHTML = `
    <div id="colourTab2" class="colourTabs"></div>
    <div id="maxCaption" class="tabTitles"flex">Forecasted Maximum</div>

    <div id="maxContainer" class="flex">
      <div class="chartSummaryStats">
        <div id="dailyMaxIntensity" class="chartSummaryStats">${dailyMaxForecast}</div>
      </div>
      <div id="maxGauge" class="gauge">
        <img src="./images/arrow_up.svg" alt="intensity gauge icon" width="20" height="20">
      </div>
    </div>
    <div id="maxIntensity" class="flex intensityCaptions">
      ${`${dailyMaxTimeFrom} - ${dailyMaxTimeTo}`}
    </div>
  `;
  document.getElementById('forecastMax').style.color = 'var(--main-background-color)';
  document.getElementById('maxIntensity').style.color = '#6a8eb9';

  document.getElementById('forecastMin').innerHTML = `
    <div id="colourTab3" class="colourTabs"></div>
    <div id="minCaption" class="tabTitles" flex">Forecasted Minimum</div>

    <div id="minContainer" class="flex">
      <div class="chartSummaryStats">
        <div id="dailyMinIntensity" class="chartSummaryStats">${dailyMinForecast}</div>
      </div>
      <div id="minGauge" class="gauge">
        <img src="./images/arrow_down.svg" alt="intensity gauge icon" width="20" height="20">
      </div>
    </div>
    <div id="minIntensity" class="flex intensityCaptions">
      ${`${dailyMinTimeFrom} - ${dailyMinTimeTo}`}
    </div>
  `;
  document.getElementById('forecastMin').style.color = 'var(--main-background-color)';
  document.getElementById('minIntensity').style.color = '#6a8eb9';
  
  previousDataObject = data[timeIndex - 1]
  latestDataObject = data[timeIndex];
  initialiseChart(xlabels, intensityLabels, forecastLabels, dailyMaxForecast);
  return previousDataObject, latestDataObject;
  }
}

let mixedChart;
//Initialise chart.js
function initialiseChart(xlabels, intensityLabels, forecastLabels, dailyMaxForecast) {
  const style = getComputedStyle(document.body);
  const ctx = document.getElementById('chart');
  //Set the y-axis maximum to the maximum daily forecasted carbon intensity added to 200, rounded up to the nearest hundred
  let chartMax = Math.ceil(((dailyMaxForecast + 200)) / 100) * 100;
  mixedChart = new Chart(ctx, {
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
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
  return mixedChart;
}

//Generation Mix
const energyMix_api_url = `https://api.carbonintensity.org.uk/generation/${currentDate}${currentTime}/pt24h`;
async function getEnergyMix() {
  const response = await fetch(energyMix_api_url);
  const dataArray = await response.json();
  const { data } = dataArray;
  const style = getComputedStyle(document.body);

  let fuelTypeArray = [
    {fuel: 'gas', allPercArray: [], 'current percentage': 0, 'average percentage': [], bgColor: `${style.getPropertyValue('--electric-blue-color').trim()}`, fontColor: 'white'}, 
    {fuel: 'coal', allPercArray: [], 'current percentage': 0, 'average percentage': [], bgColor: `${style.getPropertyValue('--main-orange-color').trim()}`, fontColor: 'white'},
    {fuel: 'biomass', allPercArray: [], 'current percentage': 0, 'average percentage': [], bgColor: `${style.getPropertyValue('--main-green-color').trim()}`, fontColor: `${style.getPropertyValue('--main-background-color').trim()}`},
    {fuel: 'nuclear', allPercArray: [], 'current percentage': 0, 'average percentage': [], bgColor: `${style.getPropertyValue('--main-dark-blue-color').trim()}`, fontColor: 'white'}, 
    {fuel: 'hydro', allPercArray: [], 'current percentage': 0, 'average percentage': [], bgColor: `${style.getPropertyValue('--main-grey-color').trim()}`, fontColor: `${style.getPropertyValue('--main-background-color').trim()}`}, 
    {fuel: 'imports', allPercArray: [], 'current percentage': 0, 'average percentage': [], bgColor: `${style.getPropertyValue('--yellow-color').trim()}`, fontColor: `${style.getPropertyValue('--main-background-color').trim()}`}, 
    {fuel: 'other', allPercArray: [], 'current percentage': 0, 'average percentage': [], bgColor: 'hsl(239, 100%, 85%)', fontColor: `${style.getPropertyValue('--main-background-color').trim()}`}, 
    {fuel: 'wind', allPercArray: [], 'current percentage': 0, 'average percentage': [], bgColor: `${style.getPropertyValue('--opaque-electric-blue-color').trim()}`, fontColor: `${style.getPropertyValue('--main-background-color').trim()}`}, 
    {fuel: 'solar', allPercArray: [], 'current percentage': 0, 'average percentage': [], bgColor: `${style.getPropertyValue('--dark-yellow-color').trim()}`, fontColor: `${style.getPropertyValue('--main-background-color').trim()}`}
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
              fuelTypeArray[0].allPercArray.push(fuelPerc);
              break;
            case 'coal':
              fuelTypeArray[1].allPercArray.push(fuelPerc);
              break;
            case 'biomass':
              fuelTypeArray[2].allPercArray.push(fuelPerc);
              break;
            case 'nuclear':
              fuelTypeArray[3].allPercArray.push(fuelPerc);
              break;
            case 'hydro':
              fuelTypeArray[4].allPercArray.push(fuelPerc);
              break;
            case 'imports':
              fuelTypeArray[5].allPercArray.push(fuelPerc);
              break;
            case 'other':
              fuelTypeArray[6].allPercArray.push(fuelPerc);
              break;
            case 'wind':
              fuelTypeArray[7].allPercArray.push(fuelPerc);
              break;
            case 'solar':
              fuelTypeArray[8].allPercArray.push(fuelPerc);
              break;
            default:
              console.error('Switch statement error');
          }
        }
      }
    }

  //Current Generation Mix
  fuelTypeArray.forEach(function(fuelObject) {
    let currentPerc = fuelObject.allPercArray[47];
    fuelObject['current percentage'] = currentPerc;
  });

  //Average Generation Mix over past 24 hours
  let fuelTypeSum = 0;
  fuelTypeArray.forEach(function(fuelObject) {
    let percentageArray = fuelObject.allPercArray;
    percentageArray.forEach(function(percentage) {
      fuelTypeSum += percentage;
    });
    let avgPerc = parseFloat((fuelTypeSum / 48).toFixed(1));
    fuelObject['average percentage'] = avgPerc;
    fuelTypeSum = 0;
  });

  let fuelTypeArrayCopy = fuelTypeArray.slice();

  let currentPercStorage = [];
  let currentMaxGM;
  let sectionLabels = [];
  let currentPercArray = [];
  let avgPercArray = [];
  let chartColours = [];
  let fontColours = [];
  console.log(fuelTypeArrayCopy)

  // (1) Add all 'current percentage' values to a new array
  for (let i = 0; i < fuelTypeArrayCopy.length; i++) {
    currentPercStorage.push(fuelTypeArrayCopy[i]['current percentage']);
  }
  console.log(currentPercStorage)

  // (2) Find the maximum value in the new array from step (1). Remove the item at that index from the fuelTypeArrayCopy. Repeat till all it's contents are gone.
  for (let i = 0; i < currentPercStorage.length; i++) {
    currentMaxGM = Math.max(...currentPercStorage);
    console.log(currentMaxGM);
    let index = currentPercStorage.indexOf(currentMaxGM);
    //Append '.0' to integer percentages
    console.log(Number.isInteger(currentMaxGM))
    if (Number.isInteger(currentMaxGM) === true) {
      let intPerc = parseFloat(`${currentMaxGM}.0`);
      currentPercStorage.splice(index, 1, -1);
      fuelTypeArrayCopy[index]['current percentage'] = intPerc;
    } else {
      fuelTypeArrayCopy[index]['current percentage'] = currentMaxGM;
    }

    sectionLabels.push(fuelTypeArrayCopy[index].fuel[0].toUpperCase() + fuelTypeArrayCopy[index].fuel.slice(1));
    currentPercArray.push(fuelTypeArrayCopy[index]['current percentage']);
    avgPercArray.push(fuelTypeArrayCopy[index]['average percentage']);
    chartColours.push(fuelTypeArrayCopy[index].bgColor);
    fontColours.push(fuelTypeArrayCopy[index].fontColor)
    currentPercStorage.splice(index, 1, -1);
  }
  initialiseCurrentPieChart(sectionLabels, currentPercArray, avgPercArray, chartColours, fontColours);
  createGmObjects(data, fuelTypeArray)
}
setInterval(getEnergyMix(), 360000)


function initialiseCurrentPieChart(sectionLabels, currentPercArray, avgPercArray, chartColours, fontColours) {
  const style = getComputedStyle(document.body);
  const pieChart = document.getElementById('pieChart');
  const percChart = new Chart(pieChart, {
    type: 'doughnut',
    data: {
      labels: sectionLabels,
      datasets: [{
        label: 'Current GM%',
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
  createPieLegend(sectionLabels, currentPercArray, avgPercArray, chartColours, fontColours);
}

function createPieLegend(sectionLabels, currentPercArray, avgPercArray, chartColours, fontColours) {
  let legendLabel = sectionLabels;
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
    document.getElementById(`legTab-${label}`).style.color = `${fontColours[i]}`
  }
  document.getElementById('piechartCaption').style.fontSize = `${0.8 * 16}px`;
}

function createGmObjects(data, fuelTypeArray) {
  //Get x-axis labels
  let timeLabels = [];
  data.forEach(function(timeIntervalObject) {
    let timeStart = timeIntervalObject.from.slice(11, 16);
    timeLabels.push(timeStart)
  })

  //Graph colours
  const style = getComputedStyle(document.body);
  let colourArray = [
    `${style.getPropertyValue('--electric-blue-color').trim()}`,
    `${style.getPropertyValue('--main-orange-color').trim()}`,
    `${style.getPropertyValue('--main-green-color').trim()}`,
    `${style.getPropertyValue('--main-dark-blue-color').trim()}`,
    `${style.getPropertyValue('--main-grey-color').trim()}`,
    `${style.getPropertyValue('--yellow-color').trim()}`,
    'hsl(239, 100%, 85%)',
    `${style.getPropertyValue('--opaque-electric-blue-color').trim()}`,
    `${style.getPropertyValue('--dark-yellow-color').trim()}`
  ];

  //Calculate the max percentage across all fuel types, acroll the 24h time period
  let fuelMaxArray = []
  fuelTypeArray.forEach(function(fuelTypeObject) {
    let arrayMax = Math.max(...fuelTypeObject.allPercArray);
    fuelMaxArray.push(arrayMax)
  })
  let dailyMaxGm = Math.max(...fuelMaxArray);
  //Set the y-axis maximum to the maximum 24h GM% added to 20, rounded up to the nearest ten
  let yAxisMax = Math.ceil(((dailyMaxGm + 20)) / 10) * 10;

  //Create dataset for each fuel type
  let graphDataset = [];
  for (let i = 0; i < fuelTypeArray.length; i++) {
    let graphDataObject = {};
    graphDataObject.label = fuelTypeArray[i].fuel;
    graphDataObject.data = fuelTypeArray[i].allPercArray;
    graphDataObject.borderColor = colourArray[i];
    graphDataObject.tension = 0.3;
    graphDataObject.borderWidth = 2;
    graphDataObject.hoverBackgroundColor = colourArray[i];
    graphDataObject.pointRadius = 0;
    graphDataObject.pointHitRadius = 10;
    graphDataObject.pointBorderColor = colourArray[i];
    graphDataObject.pointBorderWidth = 2;
    graphDataObject.pointHoverBackgroundColor = colourArray[i];
    graphDataObject.order = 1;
    graphDataset.push(graphDataObject)
  }
  initialiseDailyGM(timeLabels, graphDataset, yAxisMax)
}

//Initialise 24h GM distribution line graph
function initialiseDailyGM(timeLabels, graphDataset, yAxisMax) {
  const ctx = document.getElementById('gmLineChart');
  let chartMax = yAxisMax;
  const gmTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: timeLabels,
      datasets: graphDataset
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: chartMax,
          title: {
            display: true,
            text: 'GM Distribution (%)',
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
      maintainAspectRatio: false,
      aspectRatio: 1 / 1, 
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

document.getElementById('gmAccordion').addEventListener('click', function() {
  let container =  document.getElementById('gmLineContainer');
  let chevronIcon = document.getElementById('caret');
  if (container.style.display === 'flex') {
    container.style.display = 'none';
    chevronIcon.style.transform = 'rotate(360deg)';
    document.getElementById('piechartSection').scrollIntoView({ behavior: 'smooth', block: 'center'});
  } else {
    container.style.display = 'flex';
    chevronIcon.style.transform = 'rotate(180deg)';
    document.getElementById('gmLineContainer').scrollIntoView({ behavior: 'smooth', block: 'center'});
  }
})