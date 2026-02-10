// Variables globales
let planetCardTimer = null
let allPlanetsData = []
let data = []
let filteredData = []
let currentYearIndex = 0
let previousYearIndex = 0
let yearToIndexMap = {}
let selectedPlanetElement = null
let planetsData = []

// Constantes para visualización
const PLANET_COLOR = 'rgb(51, 255, 246)'
const HIGHLIGHT_COLOR = 'rgb(253, 243, 39)'
const SIZE_MULTIPLIER = 2.5

// Configuración de los efectos de clic en planetas
function setupTimelineClickEffects() {
  setTimeout(() => {
    const timelinePoints = document.querySelectorAll(
      '#timeline .scatterlayer .trace .points path'
    )

    if (timelinePoints.length === 0) {
      setupTimelineClickEffects()
      return
    }

    timelinePoints.forEach((point, index) => {
      point.style.cursor = 'pointer'

      if (!point.style.transition) {
        point.style.transition =
          'transform 0.3s ease-out, filter 0.3s ease, stroke 0.3s ease, stroke-width 0.3s ease'
      }

      point.removeEventListener('click', handlePlanetClick)

      point.addEventListener('click', function (event) {
        if (index <= currentYearIndex) {
          handlePlanetClick(event.target, index)
        }
      })
    })
  }, 1000)
}

function handlePlanetClick(planetElement, index) {
  if (selectedPlanetElement) {
    selectedPlanetElement.style.transform = ''
    selectedPlanetElement.style.filter = ''
    selectedPlanetElement.style.stroke = ''
    selectedPlanetElement.style.strokeWidth = ''
    selectedPlanetElement.style.zIndex = ''
  }

  planetElement.style.transform = 'scale(1.5)'
  planetElement.style.filter =
    'brightness(1.3) drop-shadow(0 0 5px rgba(255, 215, 0, 0.6))'
  planetElement.style.stroke = '#ffd700'
  planetElement.style.strokeWidth = '2px'
  planetElement.style.zIndex = '20'

  selectedPlanetElement = planetElement
  showPlanetCard(filteredData[index])

  if (planetCardTimer) {
    clearTimeout(planetCardTimer)
    planetCardTimer = null
  }
}

function updateRangeSliderAppearance() {
  const minVal = parseInt(document.getElementById('min-year').value)
  const maxVal = parseInt(document.getElementById('max-year').value)
  const sliderMin = parseInt(document.getElementById('min-year').min)
  const sliderMax = parseInt(document.getElementById('min-year').max)
  const range = sliderMax - sliderMin

  const minPosition = ((minVal - sliderMin) / range) * 100
  const maxPosition = ((maxVal - sliderMin) / range) * 100

  const sliderTrack = document.querySelector('.slider-track')
  sliderTrack.style.background = `linear-gradient(to right,
                               #1a3a6a 0%,
                               #1a3a6a ${minPosition}%,
                               rgba(100, 150, 255, 0.7) ${minPosition}%,
                               rgba(100, 150, 255, 0.7) ${maxPosition}%,
                               #1a3a6a ${maxPosition}%,
                               #4682b4 100%)`

  const minCap = document.querySelector('.slider-cap-min')
  const maxCap = document.querySelector('.slider-cap-max')

  minCap.style.left = `calc(${minPosition}% - 13px)`
  maxCap.style.left = `calc(${maxPosition}% - 13px)`
  maxCap.style.right = 'auto'
}

function createStars() {
  const background = document.getElementById('space-background')
  const starCount = 200

  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div')
    star.className = 'star'

    const size = Math.random() * 3
    star.style.width = size + 'px'
    star.style.height = size + 'px'

    star.style.left = Math.random() * 100 + '%'
    star.style.top = Math.random() * 100 + '%'

    star.style.animationDelay = Math.random() * 4 + 's'

    background.appendChild(star)
  }
}

createStars()

// Configuración de la gráfica
const layout = {
  title: {
    text: 'Timeline of Exoplanet Discoveries',
    font: {
      color: '#FFD700',
      size: 24,
    },
  },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  xaxis: {
    title: {
      text: 'Year of Discovery',
      font: {
        color: '#adf',
        size: 14,
      },
    },
    tickfont: {
      color: '#adf',
    },
    showgrid: false,
    tickmode: 'array',
    tickvals: [
      2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022,
      2023, 2024,
    ],
    range: [2010, 2025],
  },
  yaxis: {
    title: {
      text: 'Earth Similarity Index (ESI)',
      font: {
        color: '#adf',
        size: 14,
      },
    },
    tickfont: {
      color: '#adf',
    },
    showgrid: false,
    range: [0, 1],
  },
  hovermode: 'closest',
  dragmode: false,
}

const config = {
  displayModeBar: false,
  responsive: true,
  scrollZoom: false,
  showTips: false,
  modeBarButtonsToRemove: ['select2d', 'lasso2d'],
}

Plotly.newPlot(
  'timeline',
  [
    {
      x: [],
      y: [],
      mode: 'markers',
      type: 'scatter',
      marker: {
        size: [],
        color: PLANET_COLOR,
        showscale: false,
        line: {
          color: 'rgba(100, 150, 255, 0.5)',
          width: 1,
        },
        opacity: 0.8,
      },
      text: [],
      hoverinfo: 'none',
    },
  ],
  layout,
  config
).then(() => {
  setupTimelineClickEffects()
})

// Carga y procesamiento de datos
fetch('timeline.json')
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  })
  .then((jsonData) => {
    data = jsonData
    allPlanetsData = jsonData

    const planetsByYear = {}
    data.forEach((planet) => {
      if (!planet.disc_year) return

      const year = planet.disc_year
      const esiValue =
        typeof planet.ESI === 'number' && !isNaN(planet.ESI) ? planet.ESI : 0
      if (!planetsByYear[year] || esiValue > planetsByYear[year].ESI) {
        planetsByYear[year] = { ...planet, ESI: esiValue }
      }
    })

    filteredData = Object.values(planetsByYear).sort(
      (a, b) => a.disc_year - b.disc_year
    )

    filteredData.forEach((planet, index) => {
      yearToIndexMap[planet.disc_year] = index
    })

    planetsData.length = 0
    for (let i = 0; i < filteredData.length; i++) {
      const planet = filteredData[i]
      planetsData.push({
        x: planet.disc_year,
        y: Math.max(0, planet.ESI),
        baseSize: (planet.pl_rade || 1) * 10,
        text: `Planet: ${planet.pl_name}<br>Year: ${
          planet.disc_year
        }<br>ESI: ${planet.ESI.toFixed(2)}<br>Radius: ${
          planet.pl_rade || 'N/A'
        } Earth radius`,
      })
    }

    createScatterPlot()

    const plotDiv = document.getElementById('timeline')
    plotDiv.on('plotly_click', function (eventData) {
      if (eventData.points && eventData.points.length > 0) {
        const point = eventData.points[0]
        const pointIndex = point.pointNumber

        if (
          pointIndex >= 0 &&
          pointIndex < filteredData.length &&
          pointIndex <= currentYearIndex
        ) {
          showPlanetCard(filteredData[pointIndex])

          if (planetCardTimer) {
            clearTimeout(planetCardTimer)
            planetCardTimer = null
          }
        }
      }
    })
  })
  .catch((error) => {
    console.error('Error loading or processing timeline.json:', error)
    const header = document.getElementById('header')
    const errorMsg = document.createElement('p')
    errorMsg.style.color = 'red'
    errorMsg.textContent =
      'Error loading planet data. Please check the console for details.'
    header.appendChild(errorMsg)
  })

// Actualización de la línea de tiempo
function updateTimeline() {
  if (planetCardTimer) {
    clearTimeout(planetCardTimer)
    planetCardTimer = null
  }

  closePlanetCard()

  if (selectedPlanetElement) {
    selectedPlanetElement.style.transform = ''
    selectedPlanetElement.style.filter = ''
    selectedPlanetElement.style.stroke = ''
    selectedPlanetElement.style.strokeWidth = ''
    selectedPlanetElement.style.zIndex = ''
    selectedPlanetElement = null
  }

  if (currentYearIndex >= 0 && currentYearIndex < filteredData.length) {
    const planet = filteredData[currentYearIndex]

    const isForward = currentYearIndex >= previousYearIndex
    previousYearIndex = currentYearIndex

    const visibleX = []
    const visibleY = []
    const visibleSizes = []
    const visibleColors = []
    const visibleTexts = []

    for (let i = 0; i <= currentYearIndex; i++) {
      if (planetsData[i]) {
        visibleX.push(planetsData[i].x)
        visibleY.push(planetsData[i].y)
        visibleSizes.push(planetsData[i].baseSize)
        visibleColors.push(PLANET_COLOR)
        visibleTexts.push(planetsData[i].text)
      }
    }

    Plotly.react(
      'timeline',
      [
        {
          x: visibleX,
          y: visibleY,
          mode: 'markers',
          type: 'scatter',
          marker: {
            size: visibleSizes,
            color: visibleColors,
            showscale: false,
            line: {
              color: 'rgba(100, 150, 255, 0.5)',
              width: 1,
            },
            opacity: 0.8,
            symbol: 'circle',
          },
          text: visibleTexts,
          hoverinfo: 'none',
        },
      ],
      layout,
      {
        transition: {
          duration: 500,
          easing: 'linear',
        },
        frame: {
          duration: 500,
          redraw: false,
        },
      }
    ).then(() => {
      setPointCursor()
      setupTimelineClickEffects()
    })

    if (!document.getElementById('planet-card').classList.contains('visible')) {
      planetCardTimer = setTimeout(() => {
        showPlanetCard(planet)
        planetCardTimer = null
      }, 1000)
    }
  }
}

// Configuración de interacciones
function setPointCursor() {
  const points = document.querySelectorAll(
    '#timeline .scatterlayer .trace .points path'
  )
  points.forEach((point) => {
    point.style.cursor = 'pointer'

    if (!point.style.transition) {
      point.style.transition = 'transform 0.3s ease-out, opacity 0.2s ease'
    }
  })

  const plotBg = document.querySelector(
    '#timeline .plot-container .svg-container'
  )
  if (plotBg) {
    plotBg.style.cursor = 'default'
  }
}

function loadScatterPlotData() {
  return fetch('all_exo.csv')
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.text()
    })
    .then((csvText) => {
      const lines = csvText.split('\n')
      const headers = lines[0].split(',').map((header) => header.trim())

      const planets = lines
        .slice(1)
        .filter((line) => line.trim())
        .map((line) => {
          const values = line.split(',').map((val) => val.trim())
          const planet = {}

          headers.forEach((header, i) => {
            planet[header] = values[i]
          })

          return planet
        })

      return planets
    })
}

function createScatterPlot() {
  fetch('all_exo.csv')
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.text()
    })
    .then((csvText) => {
      const lines = csvText.split('\n')
      const headers = lines[0].split(',').map((header) => header.trim())

      const planets = lines
        .slice(1)
        .filter((line) => line.trim())
        .map((line) => {
          const values = line.split(',').map((val) => val.trim())
          const planet = {}

          headers.forEach((header, i) => {
            planet[header] = values[i]
          })

          return planet
        })

      const discoveryMethods = [
        ...new Set(
          planets.filter((p) => p.discoverymethod).map((p) => p.discoverymethod)
        ),
      ].sort()

      const methodsContainer = document.getElementById(
        'discovery-methods-container'
      )

      methodsContainer.innerHTML = ''

      discoveryMethods.forEach((method) => {
        const methodDiv = document.createElement('div')
        methodDiv.className = 'method-checkbox'

        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.id = `method-${method.replace(/\s+/g, '-')}`
        checkbox.value = method
        checkbox.checked = true

        const label = document.createElement('label')
        label.htmlFor = checkbox.id
        label.textContent = method

        methodDiv.appendChild(checkbox)
        methodDiv.appendChild(label)
        methodsContainer.appendChild(methodDiv)
      })

      const minYearSlider = document.getElementById('min-year')
      const maxYearSlider = document.getElementById('max-year')
      const minYearValue = document.getElementById('min-year-value')
      const maxYearValue = document.getElementById('max-year-value')
      const applyButton = document.getElementById('apply-filters')
      const resetButton = document.getElementById('reset-filters')
      const selectAllButton = document.getElementById('select-all-methods')
      const deselectAllButton = document.getElementById('deselect-all-methods')

      const years = planets
        .map((p) => parseInt(p.disc_year))
        .filter((y) => y && !isNaN(y))

      if (years.length > 0) {
        const minYear = Math.min(...years)
        const maxYear = Math.max(...years)

        minYearSlider.min = minYear
        minYearSlider.max = maxYear
        minYearSlider.value = minYear
        minYearValue.textContent = minYear

        maxYearSlider.min = minYear
        maxYearSlider.max = maxYear
        maxYearSlider.value = maxYear
        maxYearValue.textContent = maxYear
      }

      minYearSlider.addEventListener('input', () => {
        const minVal = parseInt(minYearSlider.value)
        const maxVal = parseInt(maxYearSlider.value)

        if (minVal > maxVal) {
          minYearSlider.value = maxVal
          minYearValue.textContent = maxVal
        } else {
          minYearValue.textContent = minVal
        }

        updateRangeSliderAppearance()
      })

      maxYearSlider.addEventListener('input', () => {
        const minVal = parseInt(minYearSlider.value)
        const maxVal = parseInt(maxYearSlider.value)

        if (maxVal < minVal) {
          maxYearSlider.value = minVal
          maxYearValue.textContent = minVal
        } else {
          maxYearValue.textContent = maxVal
        }

        updateRangeSliderAppearance()
      })

      selectAllButton.addEventListener('click', () => {
        document
          .querySelectorAll(
            '#discovery-methods-container input[type="checkbox"]'
          )
          .forEach((checkbox) => {
            checkbox.checked = true
          })
      })

      deselectAllButton.addEventListener('click', () => {
        document
          .querySelectorAll(
            '#discovery-methods-container input[type="checkbox"]'
          )
          .forEach((checkbox) => {
            checkbox.checked = false
          })
      })

      window.csvPlanetsData = planets

      updateRangeSliderAppearance()
      updateScatterPlot()

      applyButton.addEventListener('click', updateScatterPlot)

      resetButton.addEventListener('click', () => {
        minYearSlider.value = minYearSlider.min
        minYearValue.textContent = minYearSlider.min

        maxYearSlider.value = maxYearSlider.max
        maxYearValue.textContent = maxYearSlider.max

        document
          .querySelectorAll(
            '#discovery-methods-container input[type="checkbox"]'
          )
          .forEach((checkbox) => {
            checkbox.checked = true
          })

        updateScatterPlot()
      })
    })
    .catch((error) => {
      console.error('Error loading scatter plot data:', error)
    })
}

function updateScatterPlot() {
  const minSelectedYear = parseInt(document.getElementById('min-year').value)
  const maxSelectedYear = parseInt(document.getElementById('max-year').value)

  const selectedMethods = []
  document
    .querySelectorAll(
      '#discovery-methods-container input[type="checkbox"]:checked'
    )
    .forEach((checkbox) => {
      selectedMethods.push(checkbox.value)
    })

  if (!window.csvPlanetsData) {
    return
  }

  updateRangeSliderAppearance()

  const filteredPlanets = window.csvPlanetsData.filter((planet) => {
    const year = parseInt(planet.disc_year)
    if (isNaN(year) || year < minSelectedYear || year > maxSelectedYear)
      return false

    if (
      selectedMethods.length > 0 &&
      planet.discoverymethod &&
      !selectedMethods.includes(planet.discoverymethod)
    )
      return false

    const esi = parseFloat(planet.ESI)
    const orbsmax = parseFloat(planet.pl_orbsmax)
    return !isNaN(esi) && !isNaN(orbsmax)
  })

  const scatterData = [
    {
      x: filteredPlanets.map((planet) => parseFloat(planet.pl_orbsmax)),
      y: filteredPlanets.map((planet) => parseFloat(planet.ESI)),
      mode: 'markers',
      type: 'scatter',
      marker: {
        size: 12,
        color: filteredPlanets.map((planet) => parseInt(planet.disc_year)),
        colorscale: 'Viridis',
        colorbar: {
          title: 'Discovery Year',
          titlefont: { color: '#adf' },
          tickfont: { color: '#adf' },
        },
        line: { color: 'white', width: 1 },
        opacity: 0.9,
      },
      text: filteredPlanets.map(
        (planet) =>
          `${planet.pl_name}<br>ESI: ${parseFloat(planet.ESI).toFixed(2)}<br>` +
          `Radius: ${
            planet.pl_rade ? parseFloat(planet.pl_rade).toFixed(2) : 'Unknown'
          } Times Earth<br>` +
          `Orbital distance: ${parseFloat(planet.pl_orbsmax).toFixed(
            3
          )} AU<br>` +
          `Year: ${planet.disc_year}<br>` +
          `Method: ${planet.discoverymethod || 'Unknown'}`
      ),
      hoverinfo: 'text',
    },
  ]

  const scatterLayout = {
    title: {
      text: 'ESI (Earth Similiraty Index )vs Orbital Distance',
      font: { color: '#FFD700', size: 22 },
      y: 0.97,
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    showlegend: false,
    xaxis: {
      title: {
        text: 'Orbital Distance (AU)',
        font: { color: '#adf', size: 16 },
      },
      type: 'linear',
      showgrid: true,
      gridcolor: 'rgba(100, 150, 255, 0.2)',
      zeroline: false,
      tickfont: { color: '#adf', size: 14 },
      fixedrange: true,
      autorange: false,
      range: [0, 1.5],
      tickmode: 'array',
      tickvals: [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5],
      ticktext: ['0', '0.25', '0.5', '0.75', '1.0', '1.25', '1.5'],
    },
    yaxis: {
      title: {
        text: 'Earth Similarity Index (ESI)',
        font: { color: '#adf', size: 16 },
      },
      type: 'linear',
      showgrid: true,
      gridcolor: 'rgba(100, 150, 255, 0.2)',
      zeroline: false,
      tickfont: { color: '#adf', size: 14 },
      fixedrange: true,
      autorange: false,
      range: [0, 1],
      tickmode: 'array',
      tickvals: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
      ticktext: ['0', '0.2', '0.4', '0.6', '0.8', '1.0'],
    },
    hovermode: 'closest',
    hoverlabel: {
      bgcolor: 'rgba(20, 40, 80, 0.9)',
      bordercolor: '#adf',
      font: { color: '#fff', size: 14 },
    },
    margin: { l: 70, r: 40, t: 70, b: 70 },
    shapes: [
      {
        type: 'rect',
        xref: 'x',
        yref: 'paper',
        x0: 0.75,
        x1: 1.5,
        y0: 0,
        y1: 1,
        fillcolor: 'rgba(0, 255, 0, 0.1)',
        line: {
          width: 1,
          color: 'rgba(0, 255, 0, 0.3)',
        },
        layer: 'below',
      },
      {
        type: 'line',
        xref: 'paper',
        yref: 'y',
        x0: 0,
        x1: 1,
        y0: 0.8,
        y1: 0.8,
        line: {
          color: 'rgba(0, 255, 255, 0.5)',
          width: 1,
          dash: 'dash',
        },
      },
    ],
    annotations: [
      {
        text: 'Inhabitable zone (0.75-1.5 AU)',
        showarrow: false,
        font: { color: 'rgba(0, 255, 0, 0.8)', size: 12 },
        x: 1.1,
        y: 0.5,
        xanchor: 'left',
        yanchor: 'middle',
      },
    ],
  }

  const config = {
    responsive: true,
    displayModeBar: false,
    staticPlot: false,
  }

  Plotly.react('scatter-plot', scatterData, scatterLayout, config)

  setTimeout(() => {
    const points = document.querySelectorAll(
      '#scatter-plot .scatterlayer .trace .points path'
    )
    points.forEach((point, index) => {
      point.style.cursor = 'pointer'

      point.addEventListener('click', function (event) {
        if (index >= 0 && index < filteredPlanets.length) {
          showPlanetCard(filteredPlanets[index])
        }
      })
    })
  }, 500)
}

function showPlanetCard(planet) {
  if (!planet) {
    return
  }

  const planetCard = document.getElementById('planet-card')
  const overlay = document.getElementById('overlay')

  planetCard.querySelector('.planet-name').textContent =
    planet.pl_name || 'Unknown Planet'

  document.getElementById('disc-year').textContent =
    planet.disc_year || 'Unknown'

  const esiValue =
    typeof planet.ESI === 'number' && !isNaN(planet.ESI)
      ? planet.ESI.toFixed(2)
      : 'N/A'
  document.getElementById('esi-value').textContent = esiValue

  document.getElementById('radius-value').innerHTML = planet.pl_rade
    ? `${planet.pl_rade.toFixed(2)} Times Earth`
    : 'Unknown'

  document.getElementById('mass-value').innerHTML = planet.pl_bmasse
    ? `${planet.pl_bmasse.toFixed(2)} Times Earth`
    : 'Unknown'

  document.getElementById('temp-value').textContent = planet.pl_eqt
    ? `${planet.pl_eqt} K`
    : 'Unknown'

  document.getElementById('facility-value').textContent =
    planet.disc_facility || 'Unknown'

  document.getElementById('hostname-value').textContent =
    planet.hostname || 'Unknown'
  document.getElementById('sysnum-value').textContent =
    planet.sy_snum || 'Unknown'
  document.getElementById('sypnum-value').textContent =
    planet.sy_pnum || 'Unknown'

  if (planet.pl_refname) {
    const hrefMatch = planet.pl_refname.match(/href=([^ >]+)/)
    if (hrefMatch) {
      const url = hrefMatch[1]
      document.getElementById(
        'refname-value'
      ).innerHTML = `<a href="${url}" target="_blank">Reference</a>`
    } else {
      document.getElementById('refname-value').textContent =
        'NASA Exoplanet Archive'
    }
  } else {
    document.getElementById('refname-value').textContent =
      'NASA Exoplanet Archive'
  }

  document.getElementById('distance-value').textContent = planet.sy_dist
    ? `${planet.sy_dist.toFixed(1)} pc`
    : 'Unknown'

  document.getElementById('orbper-value').textContent = planet.pl_orbper
    ? `${planet.pl_orbper.toFixed(1)} days`
    : 'Unknown'
  document.getElementById('orbsmax-value').textContent = planet.pl_orbsmax
    ? `${planet.pl_orbsmax.toFixed(3)} AU`
    : 'Unknown'

  generatePlanetImage(planet)

  overlay.classList.add('active')
  planetCard.classList.add('visible')
}

function closePlanetCard() {
  const planetCard = document.getElementById('planet-card')
  const overlay = document.getElementById('overlay')

  planetCard.classList.remove('visible')
  overlay.classList.remove('active')

  if (selectedPlanetElement) {
    selectedPlanetElement.style.transform = ''
    selectedPlanetElement.style.filter = ''
    selectedPlanetElement.style.stroke = ''
    selectedPlanetElement.style.strokeWidth = ''
    selectedPlanetElement.style.zIndex = ''
    selectedPlanetElement = null
  }
}

function generatePlanetImage(planet) {
  const container = document.querySelector('.planet-image-container')

  while (container.firstChild) {
    container.firstChild.remove()
  }

  const planetType = document.createElement('div')
  planetType.className = 'planet-type'
  container.appendChild(planetType)

  const esiNum =
    typeof planet.ESI === 'number' && !isNaN(planet.ESI) ? planet.ESI : -1
  const temperature = planet.pl_eqt || 300
  const radius = planet.pl_rade || 1
  const mass = planet.pl_bmasse || 1
  const orbitalPeriod = planet.pl_orbper || 365

  const cardShine = document.createElement('div')
  cardShine.className = 'card-shine'
  container.appendChild(cardShine)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
  camera.position.z = 2

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  })
  renderer.setSize(180, 180)
  renderer.setClearColor(0x000000, 0)
  container.appendChild(renderer.domElement)

  const geometry = new THREE.SphereGeometry(1, 32, 32)

  let planetMaterial
  let atmosphereColor

  if (esiNum >= 0.8) {
    planetMaterial = createEarthLikeMaterial(planet)
    atmosphereColor = new THREE.Color(
      0.55 - Math.min(0.3, (temperature - 250) / 500),
      0.8,
      1.0
    )
  } else if (esiNum >= 0.6) {
    planetMaterial = createSemiHabitableMaterial(planet)
    atmosphereColor = new THREE.Color(
      0.7,
      0.7 + Math.min(0.3, (temperature - 250) / 1000),
      0.8
    )
  } else {
    planetMaterial = createAlienPlanetMaterial(planet)
    atmosphereColor = new THREE.Color(
      0.9 + Math.min(0.1, (temperature - 400) / 1000),
      0.6 - Math.min(0.3, (temperature - 300) / 700),
      0.4 - Math.min(0.3, (temperature - 300) / 1000)
    )
  }

  const planet3D = new THREE.Mesh(geometry, planetMaterial)
  scene.add(planet3D)

  const atmosphereSize = 1.05 + radius * 0.05
  const atmosphereGeometry = new THREE.SphereGeometry(atmosphereSize, 32, 32)
  const atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: atmosphereColor,
    transparent: true,
    opacity: 0.2,
  })
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
  scene.add(atmosphere)

  const ambientLight = new THREE.AmbientLight(0x404040)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(5, 3, 5)
  scene.add(directionalLight)

  const rotationSpeed = 0.005 * (365 / Math.max(50, orbitalPeriod))
  function animate() {
    requestAnimationFrame(animate)

    planet3D.rotation.y += rotationSpeed
    atmosphere.rotation.y += rotationSpeed * 0.4

    renderer.render(scene, camera)
  }

  animate()

  function createEarthLikeMaterial(planet) {
    const planetName = planet.pl_name || ''
    const temperature = planet.pl_eqt || 300
    const radius = planet.pl_rade || 1
    const mass = planet.pl_bmasse || 1

    const seed = hashString(planetName)
    const seededRandom = createSeededRandom(seed)

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 256
    const ctx = canvas.getContext('2d')

    const blueValue =
      200 + Math.min(55, Math.max(-55, (300 - temperature) * 0.5))
    ctx.fillStyle = `rgb(28, ${Math.max(
      80,
      106 + (300 - temperature) * 0.1
    )}, ${blueValue})`
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const continentCount = 5 + Math.floor(mass)
    const continentColor = `rgb(${39 + (temperature - 280) * 0.1}, ${
      160 + (300 - temperature) * 0.1
    }, ${70 + (300 - temperature) * 0.2})`
    ctx.fillStyle = continentColor

    for (let i = 0; i < continentCount; i++) {
      const x = seededRandom() * canvas.width
      const y = seededRandom() * canvas.height
      const size = 30 + seededRandom() * 80

      ctx.beginPath()
      for (let j = 0; j < 10; j++) {
        const angle = (j / 10) * Math.PI * 2
        const radius = size * (0.7 + seededRandom() * 0.6)
        const xPoint = x + Math.cos(angle) * radius
        const yPoint = y + Math.sin(angle) * radius

        if (j === 0) {
          ctx.moveTo(xPoint, yPoint)
        } else {
          ctx.lineTo(xPoint, yPoint)
        }
      }
      ctx.closePath()
      ctx.fill()
    }

    const iceCapsSize = Math.max(0, (350 - temperature) * 0.001)
    if (iceCapsSize > 0) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height * iceCapsSize)
      ctx.fillRect(
        0,
        canvas.height * (1 - iceCapsSize),
        canvas.width,
        canvas.height * iceCapsSize
      )
    }

    const texture = new THREE.CanvasTexture(canvas)

    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.7,
      metalness: 0.1,
    })
  }

  function createSemiHabitableMaterial(planet) {
    const planetName = planet.pl_name || ''
    const temperature = planet.pl_eqt || 300
    const radius = planet.pl_rade || 1
    const mass = planet.pl_bmasse || 1

    const seed = hashString(planetName)
    const seededRandom = createSeededRandom(seed)

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 256
    const ctx = canvas.getContext('2d')

    const redValue =
      185 + Math.min(70, Math.max(-50, (temperature - 300) * 0.4))
    const greenValue =
      118 + Math.min(40, Math.max(-50, (300 - temperature) * 0.2))
    ctx.fillStyle = `rgb(${redValue}, ${greenValue}, 64)`
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const vegetationCount = Math.max(5, 15 - Math.abs(temperature - 300) / 20)
    const vegetationColor = `rgb(${93 + (temperature - 300) * 0.2}, ${
      148 + (300 - temperature) * 0.3
    }, ${81 - Math.abs(temperature - 300) * 0.1})`
    ctx.fillStyle = vegetationColor

    for (let i = 0; i < vegetationCount; i++) {
      const x = seededRandom() * canvas.width
      const y = seededRandom() * canvas.height
      const size = 10 + seededRandom() * (40 * (radius / 2))

      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }

    const waterCount = Math.max(2, 8 - (temperature - 280) / 40)
    const waterColor = `rgb(65, ${Math.max(
      100,
      135 - (temperature - 280) * 0.3
    )}, ${Math.max(120, 170 - (temperature - 280) * 0.5)})`
    ctx.fillStyle = waterColor

    for (let i = 0; i < waterCount; i++) {
      const x = seededRandom() * canvas.width
      const y = seededRandom() * canvas.height
      const size = 20 + seededRandom() * (60 * mass)

      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }

    if (temperature > 350) {
      ctx.fillStyle = `rgba(255, ${120 + seededRandom() * 50}, 30, 0.7)`
      for (let i = 0; i < 8; i++) {
        const x = seededRandom() * canvas.width
        const y = seededRandom() * canvas.height
        const size = 5 + seededRandom() * 20

        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const texture = new THREE.CanvasTexture(canvas)

    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.2,
    })
  }

  function createAlienPlanetMaterial(planet) {
    const planetName = planet.pl_name || ''
    const temperature = planet.pl_eqt || 300
    const radius = planet.pl_rade || 1
    const mass = planet.pl_bmasse || 1

    const seed = hashString(planetName)
    const seededRandom = createSeededRandom(seed)

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 256
    const ctx = canvas.getContext('2d')

    const redBase = 140 + Math.min(115, (temperature - 200) / 3)
    const greenBase = Math.max(30, 80 + (350 - temperature) * 0.2)
    const blueBase = Math.max(20, 40 + (350 - temperature) * 0.15)

    const baseColor = `rgb(${redBase}, ${greenBase}, ${blueBase})`
    ctx.fillStyle = baseColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const numberOfBands = 2 + Math.floor(radius * 0.8)
    for (let i = 0; i < numberOfBands; i++) {
      const bandRed = Math.min(255, redBase + 40 + seededRandom() * 35)
      const bandGreen = Math.min(255, greenBase + 40 + seededRandom() * 30)
      const bandBlue = Math.min(255, blueBase + 20 + seededRandom() * 20)

      const bandColor = `rgba(${bandRed}, ${bandGreen}, ${bandBlue}, 0.7)`
      ctx.fillStyle = bandColor

      const yPos = i * (canvas.height / numberOfBands)
      const height = canvas.height / (numberOfBands * (1 + seededRandom()))

      ctx.fillRect(0, yPos, canvas.width, height)
    }

    const spotCount = 20 + Math.floor(mass * 10)
    const spotColor = `rgba(${Math.min(255, redBase - 60)}, ${Math.max(
      0,
      greenBase - 40
    )}, ${Math.max(0, blueBase - 20)}, 0.6)`
    ctx.fillStyle = spotColor

    for (let i = 0; i < spotCount; i++) {
      const x = seededRandom() * canvas.width
      const y = seededRandom() * canvas.height
      const size = 2 + seededRandom() * 15

      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }

    if (temperature > 600) {
      ctx.fillStyle = `rgba(255, 200, 100, 0.3)`
      for (let i = 0; i < 5; i++) {
        const x = seededRandom() * canvas.width
        const y = seededRandom() * canvas.height
        const size = 10 + seededRandom() * 30

        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    if (radius > 3) {
      ctx.fillStyle = `rgba(255, 255, 255, 0.2)`
      const stormX = seededRandom() * canvas.width
      const stormY = seededRandom() * canvas.height
      const stormSize = 30 + seededRandom() * 50

      ctx.beginPath()
      ctx.arc(stormX, stormY, stormSize, 0, Math.PI * 2)
      ctx.fill()

      const swirls = 5 + Math.floor(seededRandom() * 5)
      ctx.strokeStyle = `rgba(255, 255, 255, 0.3)`
      ctx.lineWidth = 2

      for (let i = 0; i < swirls; i++) {
        const swirlRadius = (i / swirls) * stormSize
        ctx.beginPath()
        ctx.arc(
          stormX,
          stormY,
          swirlRadius,
          0,
          Math.PI * (1.5 + seededRandom())
        )
        ctx.stroke()
      }
    }

    const texture = new THREE.CanvasTexture(canvas)

    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.3,
    })
  }

  function hashString(str) {
    let hash = 0
    if (!str) str = 'defaultSeed'
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return hash
  }

  function createSeededRandom(seed) {
    return function () {
      const x = Math.sin(seed++) * 10000
      return x - Math.floor(x)
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const tabButtons = document.querySelectorAll('.tab-button')

  tabButtons.forEach((button) => {
    button.addEventListener('click', function () {
      tabButtons.forEach((btn) => btn.classList.remove('active'))
      document
        .querySelectorAll('.tab-content')
        .forEach((tab) => tab.classList.add('hidden'))

      button.classList.add('active')
      const tabId = button.getAttribute('data-tab')
      document.getElementById(`${tabId}-tab`).classList.remove('hidden')
    })
  })

  const startButton = document.getElementById('start-button')
  const splashScreen = document.getElementById('splash-screen')

  if (startButton && splashScreen) {
    startButton.addEventListener('click', function () {
      splashScreen.classList.add('hidden')

      setTimeout(() => {
        document.querySelectorAll('.content-container').forEach((container) => {
          container.classList.add('visible')
        })

        setTimeout(() => {
          if (
            typeof Plotly !== 'undefined' &&
            document.getElementById('timeline')
          ) {
            Plotly.react(
              'timeline',
              [
                {
                  x: [],
                  y: [],
                  mode: 'markers',
                  type: 'scatter',
                  marker: {
                    size: [],
                    color: PLANET_COLOR,
                    showscale: false,
                    line: {
                      color: 'rgba(100, 150, 255, 0.5)',
                      width: 1,
                    },
                    opacity: 0.8,
                  },
                  text: [],
                  hoverinfo: 'none',
                },
              ],
              layout,
              config
            )

            if (filteredData && filteredData.length > 0) {
              updateTimeline()
            }
          }
        }, 500)
      }, 800)
    })
  }
})

document
  .querySelector('.close-button')
  .addEventListener('click', closePlanetCard)
document.getElementById('overlay').addEventListener('click', closePlanetCard)

document.getElementById('prev').addEventListener('click', () => {
  if (currentYearIndex > 0) {
    currentYearIndex--
    updateTimeline()
    animateButton('prev')
  } else {
    shakeButton('prev')
  }
})

document.getElementById('next').addEventListener('click', () => {
  if (currentYearIndex < filteredData.length - 1) {
    currentYearIndex++
    updateTimeline()
    animateButton('next')
  } else {
    shakeButton('next')
  }
})

function animateButton(buttonId) {
  const button = document.getElementById(buttonId)
  button.style.transform = 'scale(1.2)'
  button.style.boxShadow = '0 0 25px rgba(100, 150, 255, 0.8)'

  setTimeout(() => {
    button.style.transform = 'scale(1)'
    button.style.boxShadow =
      '0 4px 10px rgba(0, 0, 0, 0.5), 0 0 15px rgba(100, 150, 255, 0.3)'
  }, 200)
}

function shakeButton(buttonId) {
  const button = document.getElementById(buttonId)
  button.style.animation = 'shake 0.5s'

  setTimeout(() => {
    button.style.animation = ''
  }, 500)
}

document.addEventListener('keydown', function (event) {
  if (event.key === 'ArrowLeft') {
    if (currentYearIndex > 0) {
      animateButton('prev')
      currentYearIndex--
      updateTimeline()
    } else {
      shakeButton('prev')
    }
  } else if (event.key === 'ArrowRight') {
    if (currentYearIndex < filteredData.length - 1) {
      animateButton('next')
      currentYearIndex++
      updateTimeline()
    } else {
      shakeButton('next')
    }
  } else if (event.key === 'Escape') {
    closePlanetCard()
  }
})
