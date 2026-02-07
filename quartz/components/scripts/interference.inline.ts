// Wave interference simulation
// Accurately models wave superposition from two point sources

interface SimulationState {
  frequency: number
  separation: number
  showSources: boolean
  time: number
  animationId: number | null
}

const state: SimulationState = {
  frequency: 5,
  separation: 80,
  showSources: true,
  time: 0,
  animationId: null,
}

function setupInterferenceSimulation() {
  const canvas = document.getElementById("interference-canvas") as HTMLCanvasElement | null
  if (!canvas) return

  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const freqSlider = document.getElementById("frequency") as HTMLInputElement | null
  const sepSlider = document.getElementById("separation") as HTMLInputElement | null
  const showSourcesCheckbox = document.getElementById("show-sources") as HTMLInputElement | null
  const freqValue = document.getElementById("freq-value")
  const sepValue = document.getElementById("sep-value")

  if (!freqSlider || !sepSlider || !showSourcesCheckbox) return

  // Update state from controls
  freqSlider.addEventListener("input", (e) => {
    state.frequency = parseFloat((e.target as HTMLInputElement).value)
    if (freqValue) freqValue.textContent = state.frequency.toFixed(1)
  })

  sepSlider.addEventListener("input", (e) => {
    state.separation = parseFloat((e.target as HTMLInputElement).value)
    if (sepValue) sepValue.textContent = state.separation.toFixed(0)
  })

  showSourcesCheckbox.addEventListener("change", (e) => {
    state.showSources = (e.target as HTMLInputElement).checked
  })

  // Wave calculation: A * sin(kx - ωt + φ)
  function calculateWave(x: number, y: number, sourceX: number, sourceY: number, time: number): number {
    const dx = x - sourceX
    const dy = y - sourceY
    const distance = Math.sqrt(dx * dx + dy * dy)

    const wavelength = 30 // pixels
    const k = (2 * Math.PI) / wavelength // wave number
    const omega = 2 * Math.PI * state.frequency // angular frequency

    // Amplitude decreases with distance (1/r falloff)
    const amplitude = 50 / (1 + distance / 50)

    // Wave equation
    return amplitude * Math.sin(k * distance - omega * time)
  }

  function drawFrame() {
    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, width, height)

    // Source positions (centered vertically, on left side)
    const source1X = 100
    const source1Y = height / 2 - state.separation / 2
    const source2X = 100
    const source2Y = height / 2 + state.separation / 2

    // Create image data for pixel manipulation
    const imageData = ctx.createImageData(width, height)
    const data = imageData.data

    // Calculate interference pattern
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Wave from source 1
        const wave1 = calculateWave(x, y, source1X, source1Y, state.time)

        // Wave from source 2
        const wave2 = calculateWave(x, y, source2X, source2Y, state.time)

        // Superposition: add waves together
        const totalWave = wave1 + wave2

        // Map wave amplitude to color
        // Positive = cyan/blue, Negative = red/magenta
        const idx = (y * width + x) * 4

        if (totalWave > 0) {
          // Constructive interference regions (blue-cyan)
          const intensity = Math.min(255, Math.abs(totalWave) * 2.5)
          data[idx] = 0 // R
          data[idx + 1] = intensity * 0.6 // G
          data[idx + 2] = intensity // B
          data[idx + 3] = 255 // A
        } else {
          // Destructive interference regions (red-magenta)
          const intensity = Math.min(255, Math.abs(totalWave) * 2.5)
          data[idx] = intensity // R
          data[idx + 1] = 0 // G
          data[idx + 2] = intensity * 0.3 // B
          data[idx + 3] = 255 // A
        }
      }
    }

    // Draw the interference pattern
    ctx.putImageData(imageData, 0, 0)

    // Draw sources if enabled
    if (state.showSources) {
      ctx.fillStyle = "#FFFF00"
      ctx.strokeStyle = "#FFFFFF"
      ctx.lineWidth = 2

      // Source 1
      ctx.beginPath()
      ctx.arc(source1X, source1Y, 6, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()

      // Source 2
      ctx.beginPath()
      ctx.arc(source2X, source2Y, 6, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
    }

    // Update time
    state.time += 0.03
  }

  function animate() {
    drawFrame()
    state.animationId = requestAnimationFrame(animate)
  }

  // Start animation
  animate()

  // Cleanup on page navigation
  window.addCleanup(() => {
    if (state.animationId !== null) {
      cancelAnimationFrame(state.animationId)
      state.animationId = null
    }
  })
}

// Initialize when page loads
document.addEventListener("nav", () => {
  setupInterferenceSimulation()
})
