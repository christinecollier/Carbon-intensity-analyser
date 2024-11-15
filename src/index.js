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
  initialiseChart(xlabels, intensityLabels);
  return previousDataObject, latestDataObject;
}

//Initialise chart.js
initialiseChart(xlabels, intensityLabels);
function initialiseChart(xlabels, intensityLabels) {
  const ctx = document.getElementById('chart');
  const myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: xlabels,
      datasets: [{
        label: 'Daily National Carbon Intensity',
        // data: [12, 19, 3, 5, 2, 3],
        data: intensityLabels,
        backgroundColor: 'rgba(40, 115, 255, 0.7)',
        borderColor: 'rgba(40, 115, 255, 0.7)',
        tension: 0.3,
        borderWidth: 2
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}