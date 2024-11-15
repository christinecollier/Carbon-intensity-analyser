//TASK: get current date and time, apply this to the api_url

let date = new Date().toJSON();
let currentDate = date.slice(0, 10);
let currentTime = `${date.slice(10, 16)}Z`;
let currentHour = date.slice(11, 13);
let currentMinute = date.slice(14, 16);
console.log(`date is ${currentDate}`);
console.log(`time is ${currentTime}`);
const api_url = `https://api.carbonintensity.org.uk/intensity/date/${currentDate}`

//Get index of latest data
let timeIndex;
async function getTimeIndex() {
  const response = await fetch(api_url);
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
  const { from, to, intensity } = data[timeIndex];
  let fromTime = from.slice(11, 16);
  let toTime = to.slice(11, 16);
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

  document.getElementById('timePeriod').innerHTML = `From ${fromTime} to ${toTime}`
  document.getElementById('intensity').innerHTML = `Intensity: ${intensity['actual']} (${intensity['index']})`
  previousDataObject = data[timeIndex - 1]
  latestDataObject = data[timeIndex];
  initialiseChart(xlabels, intensityLabels, forecastLabels);
  return previousDataObject, latestDataObject;
}

//Initialise chart.js
initialiseChart(xlabels, intensityLabels);
function initialiseChart(xlabels, intensityLabels, forecastLabels) {
  const style = getComputedStyle(document.body);
  const ctx = document.getElementById('chart');
  const mixedChart = new Chart(ctx, {
    data: {
      labels: xlabels,
      datasets: [{
        type: 'line',
        label: 'Daily National Carbon Intensity',
        data: intensityLabels,
        backgroundColor: `${style.getPropertyValue('--main-grey-color').trim()}`,
        borderColor: `${style.getPropertyValue('--main-dark-blue-color').trim()}`,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 0,
        //point styles
        pointHitRadius: 10,
        pointBackgroundColor: `${style.getPropertyValue('--main-dark-blue-color').trim()}`, 
        pointBorderColor: `${style.getPropertyValue('--main-dark-blue-color').trim()}`, 
        pointBorderWidth: 2,
        pointHoverBackgroundColor: `${style.getPropertyValue('--main-grey-color').trim()}`,
        // pointHoverBorderColor: `${style.getPropertyValue('--main-blue-color').trim()}`
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
        pointBackgroundColor: `${style.getPropertyValue('--dark-yellow-color').trim()}`, 
        pointBorderColor: `${style.getPropertyValue('--dark-yellow-color').trim()}`, 
        pointBorderWidth: 2,
        pointHoverBackgroundColor: `${style.getPropertyValue('--yellow-color').trim()}`,
        // pointHoverBorderColor: `${style.getPropertyValue('--main-blue-color').trim()}`
        fill: {
          target: 'origin',
          below: `${style.getPropertyValue('--main-grey-color').trim()}`
        },
        order: 2
      }],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 500,
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
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}