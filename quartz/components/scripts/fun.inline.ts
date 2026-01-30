// Geometric companion that stays on the edges

document.addEventListener("nav", () => {
  // Create the geometric companion
  let companion = document.getElementById("geo-companion")
  if (!companion) {
    companion = document.createElement("div")
    companion.id = "geo-companion"

    // Add eyes for cuteness
    const eye1 = document.createElement("div")
    eye1.className = "eye eye-left"
    const eye2 = document.createElement("div")
    eye2.className = "eye eye-right"

    companion.appendChild(eye1)
    companion.appendChild(eye2)
    document.body.appendChild(companion)
  }

  let currentX = 20
  let currentY = 20
  let targetX = currentX
  let targetY = currentY
  let rotation = 0
  let isHovered = false

  companion.style.left = `${currentX}px`
  companion.style.top = `${currentY}px`

  // Only pick edge positions (perimeter of screen)
  function pickNewEdgeTarget() {
    const margin = 20
    const positions = [
      // Top edge
      { x: margin, y: margin },
      { x: window.innerWidth / 2, y: margin },
      { x: window.innerWidth - 40, y: margin },

      // Right edge
      { x: window.innerWidth - 40, y: window.innerHeight / 3 },
      { x: window.innerWidth - 40, y: (window.innerHeight * 2) / 3 },
      { x: window.innerWidth - 40, y: window.innerHeight - 40 },

      // Bottom edge
      { x: window.innerWidth - 40, y: window.innerHeight - 40 },
      { x: window.innerWidth / 2, y: window.innerHeight - 40 },
      { x: margin, y: window.innerHeight - 40 },

      // Left edge
      { x: margin, y: window.innerHeight - 40 },
      { x: margin, y: (window.innerHeight * 2) / 3 },
      { x: margin, y: window.innerHeight / 3 },
    ]

    const target = positions[Math.floor(Math.random() * positions.length)]
    targetX = target.x
    targetY = target.y
  }

  // Animation loop
  let isPaused = false

  function animate() {
    if (isPaused) {
      requestAnimationFrame(animate)
      return
    }

    const dx = targetX - currentX
    const dy = targetY - currentY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < 5) {
      // Reached target, pause for much longer
      isPaused = true
      setTimeout(() => {
        pickNewEdgeTarget()
        isPaused = false
      }, 8000 + Math.random() * 7000) // 8-15 seconds pause
    }

    // Extremely slow movement - barely perceptible
    currentX += dx * 0.001
    currentY += dy * 0.001

    // Very gentle rotation
    rotation += distance > 5 ? 0.2 : 0.05

    if (companion) {
      companion.style.left = `${currentX}px`
      companion.style.top = `${currentY}px`
      companion.style.transform = `rotate(${rotation}deg)`
    }

    requestAnimationFrame(animate)
  }

  // Start moving
  pickNewEdgeTarget()
  animate()

  // Hover interactions
  companion.addEventListener("mouseenter", () => {
    isHovered = true
    companion!.classList.add("hovered")
  })

  companion.addEventListener("mouseleave", () => {
    isHovered = false
    companion!.classList.remove("hovered")
  })

  // Click to spin
  companion.addEventListener("click", (e) => {
    e.stopPropagation()
    rotation += 360
    companion!.classList.add("spinning")
    setTimeout(() => companion!.classList.remove("spinning"), 600)
  })
})
