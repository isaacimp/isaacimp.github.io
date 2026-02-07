import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"
import { version } from "../../package.json"
import { i18n } from "../i18n"
import { useEffect, useRef } from 'preact/hooks'

interface Options {
  links: Record<string, string>
}

export default ((opts?: Options) => {
  const Footer: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
    const year = new Date().getFullYear()
    const socialLinks = [
      { text: "X", href: "https://x.com/ubrainonsugar" },
      { text: "Email", href: "mailto:" },
      { text: "YouTube", href: "https://www.youtube.com/@snw_crsh" },
    ]

    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) {
        console.error("Canvas ref not attached")
        return
      }

      let slit1_open = true
      let slit2_open = true

      // Simple inferno-like colormap (array of [r,g,b])
      const colormap = [
        [0,0,4], [31,12,72], [66,10,102], [106,23,110], [146,34,104],
        [188,42,90], [225,58,69], [246,95,46], [252,145,33], [248,201,34], [240,249,79]
      ]

      function getColor(value: number): [number, number, number] {
        const idx = Math.floor(value * (colormap.length - 1))
        const frac = value * (colormap.length - 1) - idx
        const c1 = colormap[idx]
        const c2 = colormap[Math.min(idx + 1, colormap.length - 1)]
        return [
          Math.round(c1[0] + frac * (c2[0] - c1[0])),
          Math.round(c1[1] + frac * (c2[1] - c1[1])),
          Math.round(c1[2] + frac * (c2[2] - c1[2])),
        ]
      }

      const draw = () => {
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          console.error("Failed to get 2D context")
          return
        }

        canvas.width = 1920   // or use window.innerWidth for responsive?
        canvas.height = 400

        const imageData = ctx.createImageData(canvas.width, canvas.height)
        const data = imageData.data

        const sep = 0.25        // adjusted for better visibility
        const lambda = 0.015    // tighter fringes
        const D = 1.5
        const k = 2 * Math.PI / lambda
        const slit1_y = -sep / 2
        const slit2_y = sep / 2

        const xScale = 3.0      // wider field
        const yScale = 0.8

        for (let px = 0; px < canvas.width; px++) {
          const X = (px / canvas.width - 0.5) * xScale
          for (let py = 0; py < canvas.height; py++) {
            const Y = (py / canvas.height - 0.5) * yScale
            const r1 = Math.sqrt(X**2 + (Y - slit1_y)**2 + D**2)
            const r2 = Math.sqrt(X**2 + (Y - slit2_y)**2 + D**2)
            const delta = k * (r1 - r2)
            let intens = 0
            if (slit1_open && slit2_open) {
              intens = 4 * Math.pow(Math.cos(delta / 2), 2)  // normalized max=4 → 1
            } else if (slit1_open || slit2_open) {
              intens = 1
            }
            intens = Math.min(1, intens / 4)

            const [r, g, b] = getColor(intens)
            const idx = (py * canvas.width + px) * 4
            data[idx]     = r
            data[idx + 1] = g
            data[idx + 2] = b
            data[idx + 3] = 255
          }
        }

        ctx.putImageData(imageData, 0, 0)
      }

      // Initial draw
      draw()

      // Mouse interaction (cover left = block slit1, right = block slit2, middle = both open)
      let timeout: number | null = null
      const onMouseMove = (e: MouseEvent) => {
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => {
          const rect = canvas.getBoundingClientRect()
          const mx = e.clientX - rect.left
          const third = rect.width / 3

          if (mx < third) {
            slit1_open = false
            slit2_open = true
          } else if (mx > 2 * third) {
            slit1_open = true
            slit2_open = false
          } else {
            slit1_open = true
            slit2_open = true
          }
          draw()
        }, 50)  // light throttle
      }

      canvas.addEventListener('mousemove', onMouseMove)
      canvas.addEventListener('mouseout', () => {
        slit1_open = true
        slit2_open = true
        draw()
      })

      return () => {
        canvas.removeEventListener('mousemove', onMouseMove)
        canvas.removeEventListener('mouseout', () => {})
        if (timeout) clearTimeout(timeout)
      }
    }, [])

    return (
      <footer class={`${displayClass ?? ""}`}>
        <p>
          {i18n(cfg.locale).components.footer.createdWith}{" "}
          <a href="https://quartz.jzhao.xyz/">Quartz v{version}</a> © {year}
        </p>
        <ul class="social-links">
          {socialLinks.map((link) => (
            <li key={link.text}>
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                {link.text}
              </a>
            </li>
          ))}
        </ul>

        <div style={{ position: "relative", width: "100%", marginTop: "1rem" }}>
          <canvas
            ref={canvasRef}
            class="footer-banner"
            width="1920"
            height="400"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
          {/* Fallback if JS off or error */}
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--gray)",
            fontSize: "1.2rem",
            pointerEvents: "none",
            background: "rgba(0,0,0,0.4)",
            opacity: 0.7,
          }}>
            Double-Slit Interference (hover to block slits)
          </div>
        </div>
      </footer>
    )
  }

  Footer.css = `
    ${style}
    .social-links {
      list-style: none;
      padding: 0;
      margin: 0.75rem 0 0;
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      font-size: 0.95rem;
    }
    .social-links a {
      color: var(--gray);
      text-decoration: none;
    }
    .social-links a:hover {
      color: var(--secondary);
      text-decoration: underline;
    }
    .footer-banner {
      display: block;
      width: 100%;
      height: auto;
      margin-top: 1rem;
      border-radius: 8px; /* optional style */
    }
  `

  return Footer
}) satisfies QuartzComponentConstructor