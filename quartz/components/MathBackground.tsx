import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

export default (() => {
  const MathBackground: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return (
      <div class={classNames(displayClass, "math-background")}>
        <canvas id="math-canvas"></canvas>
      </div>
    )
  }

  MathBackground.css = `
    .math-background {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      pointer-events: none;
      opacity: 0.15;
    }

    #math-canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
  `

  MathBackground.afterDOMLoaded = `
    const canvas = document.getElementById('math-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const particles = [];
    let width, height;

    // Resize canvas to fill window
    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Particle class for animated elements
    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2 + 1;
        
        // Mathematical symbols to display
        const symbols = ['π', 'Σ', '∫', '∂', '∇', '∞', 'α', 'β', 'γ', 'θ', 'λ', 'μ', 'φ', 'ψ', 'ω'];
        // 70% chance of symbol, 30% chance of dot
        this.symbol = Math.random() > 0.7 ? symbols[Math.floor(Math.random() * symbols.length)] : null;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Reset particle if it goes off screen
        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
          this.reset();
        }
      }

      draw() {
        if (this.symbol) {
          ctx.font = (this.radius * 8) + 'px Arial';
          ctx.fillText(this.symbol, this.x, this.y);
        } else {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Create initial particles
    for (let i = 0; i < 50; i++) {
      particles.push(new Particle());
    }

    // Animation loop
    function animate() {
      // Check if dark mode is active
      const isDark = document.documentElement.classList.contains('dark');
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Set color based on theme
      ctx.fillStyle = isDark ? 'rgba(167, 139, 250, 0.3)' : 'rgba(124, 58, 237, 0.3)';

      // Update and draw all particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Draw connections between nearby particles
      ctx.strokeStyle = isDark ? 'rgba(167, 139, 250, 0.1)' : 'rgba(124, 58, 237, 0.1)';
      ctx.lineWidth = 1;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Draw line if particles are close enough
          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    }

    // Start animation
    animate();
    
    // Listen for theme changes to update colors
    const observer = new MutationObserver(() => {
      // Colors will update on next frame
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
  `

  return MathBackground
}) satisfies QuartzComponentConstructor
