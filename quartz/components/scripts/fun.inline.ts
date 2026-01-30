// Geometric companion that moves around the screen

document.addEventListener("nav", () => {
  // Create the geometric companion
  let companion = document.getElementById("geo-companion")
  if (!companion) {
    companion = document.createElement("div")
    companion.id = "geo-companion"
    document.body.appendChild(companion)
  }

  let currentX = Math.random() * (window.innerWidth - 40)
  let currentY = Math.random() * (window.innerHeight - 40)
  let targetX = currentX
  let targetY = currentY
  let rotation = 0

  companion.style.left = `${currentX}px`
  companion.style.top = `${currentY}px`

  // Pick a new random position to move to
  function pickNewTarget() {
    const positions = [
      { x: 20, y: 20 }, // top left
      { x: window.innerWidth - 60, y: 20 }, // top right
      { x: 20, y: window.innerHeight - 60 }, // bottom left
      { x: window.innerWidth - 60, y: window.innerHeight - 60 }, // bottom right
      { x: window.innerWidth / 2 - 20, y: 20 }, // top center
      { x: window.innerWidth / 2 - 20, y: window.innerHeight - 60 }, // bottom center
    ]

    const target = positions[Math.floor(Math.random() * positions.length)]
    targetX = target.x
    targetY = target.y
  }

  // Animation loop
  function animate() {
    const dx = targetX - currentX
    const dy = targetY - currentY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < 5) {
      // Reached target, pick a new one after a pause
      setTimeout(() => pickNewTarget(), 2000 + Math.random() * 3000)
    }

    // Smooth movement
    currentX += dx * 0.01
    currentY += dy * 0.01

    // Rotate as it moves
    rotation += distance > 5 ? 1 : 0.2

    if (companion) {
      companion.style.left = `${currentX}px`
      companion.style.top = `${currentY}px`
      companion.style.transform = `rotate(${rotation}deg)`
    }

    requestAnimationFrame(animate)
  }

  // Start moving
  pickNewTarget()
  animate()

  // Make it interactive - jump to mouse on click
  companion.addEventListener("click", (e) => {
    e.stopPropagation()
    // Do a little spin
    rotation += 360
    companion!.classList.add("spinning")
    setTimeout(() => companion!.classList.remove("spinning"), 600)
  })
})
