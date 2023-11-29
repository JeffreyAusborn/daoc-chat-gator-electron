// renderer.js
const { ipcRenderer } = window.electron;

ipcRenderer.on('update-values', (event, values) => {
  document.getElementById('damageOut').textContent = `Damage: ${values.damageOut}`;
  document.getElementById('heals').textContent = `Heals: ${values.heals}`;
  document.getElementById('dps').textContent = `DPS: ${values.dps}`;
  document.getElementById('hps').textContent = `HPS: ${values.hps}`;

  document.getElementById('damageInc').textContent = `Damage Inc: ${values.damageInc}`;
  document.getElementById('idps').textContent = `IDPS: ${values.idps}`;
});

// Add event listener for the 'Select Chat Log' button
document.getElementById('selectFile').addEventListener('click', () => {
    ipcRenderer.send('select-file');
  });

  let damageMap = new Map();
  let healMap = new Map();
  let combinedMap = new Map();
  let damageIncMap = new Map();
  let chart;

  ipcRenderer.on('update-damage-map', (_, updatedDamageMap) => {
    console.log(updatedDamageMap);
    damageMap = new Map(updatedDamageMap);
    updateChart("damage");
  });

  ipcRenderer.on('update-chart-map', (_, updatedDamageMap, updatedHealsMap, updatedDamageIncMap, updatedCombinedMap) => {
    damageMap = new Map(updatedDamageMap);
    healMap = new Map(updatedHealsMap);
    combinedMap = new Map(updatedCombinedMap)
    damageIncMap = new Map(updatedDamageIncMap)
    updateChart();
  });

  function toggleChart() {
    const chartContainer = document.getElementById('damageChart');
  
    // Toggle the visibility of the chart container
    chartContainer.style.display = chartContainer.style.display === 'none' ? 'block' : 'none';
  
    // If the chart becomes visible, update it
    if (chartContainer.style.display === 'block') {
      updateChart();
    }
  }
  document.getElementById('toggleChartButton').addEventListener('click', toggleChart);



  function updateChart(labelName) {
    const canvas = document.getElementById('damageChart');
    const ctx = canvas.getContext('2d');
  
    if (!chart) {
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [{
            label: "damage",
            data: [],
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            fill: false,
          },
          {
            label: "damage inc",
            data: [], 
            borderColor: 'rgba(75, 80, 192, 1)',
            borderWidth: 2,
            fill: false,
          },
          {
            label: "heals",
            data: [],
            borderColor: 'rgba(75, 192, 88, 1)',
            borderWidth: 2,
            fill: false,
          }],
        },
        options: {
          scales: {
            x: [{
              type: 'time',
              time: {
                parser: 'HH:mm:ss',
                unit: 'second',
                displayFormats: {
                  second: 'HH:mm:ss',
                },
              },
              scaleLabel: {
                display: true,
                labelString: 'Time',
              },
            }],
            // y: {
            //   scaleLabel: {
            //     display: true,
            //     labelString: "",
            //   },
            // },
          },
        },
      });
    }
    const labels = Array.from(combinedMap.keys());

    const damageData = labels.map(timestamp => ({
      x: timestamp,
      y: damageMap.get(timestamp),
    }));
    const healsData = labels.map(timestamp => ({
      x: timestamp,
      y: healMap.get(timestamp),
    }));
    const damageIncData = labels.map(timestamp => ({
      x: timestamp,
      y: damageIncMap.get(timestamp),
    }));

    const sortedLabels = labels
      .map(timestamp => {
        const [hours, minutes, seconds] = timestamp.split(':');
        return new Date(1970, 0, 1, hours, minutes, seconds).getTime();
      })
      .sort((a, b) => a - b)
      .map(milliseconds => {
        const date = new Date(milliseconds);
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
      });

    chart.data.labels = sortedLabels;
    chart.data.datasets[0].data = damageData;
    chart.data.datasets[1].data = damageIncData;
    chart.data.datasets[2].data = healsData;
    
    chart.update();

    // Get the height of the chart
    const chartHeight = document.getElementById('damageChart').offsetHeight;

    // Set the window size based on the chart height
    const { width } = win.getContentBounds(); // Preserve the existing width
    win.setSize(width, chartHeight, true);
  }