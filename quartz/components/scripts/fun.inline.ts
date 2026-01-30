// Fun interactive elements for the site

document.addEventListener("nav", () => {
  // Create cursor follower
  let follower = document.getElementById("cursor-follower")
  if (!follower) {
    follower = document.createElement("div")
    follower.id = "cursor-follower"
    document.body.appendChild(follower)
  }

  let mouseX = 0
  let mouseY = 0
  let followerX = 0
  let followerY = 0

  // Track mouse position
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX
    mouseY = e.clientY
    follower!.classList.add("active")
  })

  // Smooth follow animation
  function animate() {
    const dx = mouseX - followerX
    const dy = mouseY - followerY

    followerX += dx * 0.1
    followerY += dy * 0.1

    if (follower) {
      follower.style.left = `${followerX}px`
      follower.style.top = `${followerY}px`
    }

    requestAnimationFrame(animate)
  }
  animate()

  // Click ripple effect
  document.addEventListener("click", (e) => {
    const ripple = document.createElement("div")
    ripple.className = "click-ripple"
    ripple.style.left = `${e.clientX - 25}px`
    ripple.style.top = `${e.clientY - 25}px`
    document.body.appendChild(ripple)

    setTimeout(() => ripple.remove(), 600)
  })
})
