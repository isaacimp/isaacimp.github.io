// Magnetic cursor effect - elements move toward mouse

document.addEventListener("nav", () => {
  let mouseX = 0
  let mouseY = 0

  // Track mouse position
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX
    mouseY = e.clientY
  })

  // Elements that should be magnetic
  const magneticElements = document.querySelectorAll("a, button, .magnetic")

  function updateMagnetic() {
    magneticElements.forEach((element) => {
      const htmlElement = element as HTMLElement
      const rect = element.getBoundingClientRect()
      const elementX = rect.left + rect.width / 2
      const elementY = rect.top + rect.height / 2

      const dx = mouseX - elementX
      const dy = mouseY - elementY
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Magnetic radius (how close mouse needs to be)
      const magneticRadius = 80

      if (distance < magneticRadius) {
        // Calculate pull strength (stronger when closer)
        const strength = (magneticRadius - distance) / magneticRadius
        const maxPull = 8 // Maximum pixels to move

        const pullX = (dx / distance) * strength * maxPull
        const pullY = (dy / distance) * strength * maxPull

        htmlElement.style.transform = `translate(${pullX}px, ${pullY}px)`
      } else {
        // Snap back sharply when mouse moves away
        htmlElement.style.transform = "translate(0, 0)"
      }
    })

    requestAnimationFrame(updateMagnetic)
  }

  updateMagnetic()
})
