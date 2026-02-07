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

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      let slit1_open = true;
      let slit2_open = true;

      const inferno = [
        { pos: 0, color: [0, 0, 4] },
        { pos: 0.1, color: [31, 12, 72] },
        { pos: 0.2, color: [66, 10, 102] },
        { pos: 0.3, color: [106, 23, 110] },
        { pos: 0.4, color: [146, 34, 104] },
        { pos: 0.5, color: [188, 42, 90] },
        { pos: 0.6, color: [225, 58, 69] },
        { pos: 0.7, color: [246, 95, 46] },
        { pos: 0.8, color: [252, 145, 33] },
        { pos: 0.9, color: [248, 201, 34] },
        { pos: 1, color: [240, 249, 79] },
      ];

      function getColor(i: number): [number, number, number] {
        for (let j = 0; j < inferno.length - 1; j++) {
          if (i <= inferno[j + 1].pos) {
            const t = (i - inferno[j].pos) / (inferno[j + 1].pos - inferno[j].pos);
            return inferno[j].color.map((c, k) => Math.floor(c + t * (inferno[j + 1].color[k] - c))) as [number, number, number];
          }
        }
        return inferno[inferno.length - 1].color as [number, number, number];
      }

      const draw = () => {
        canvas.width = 1920;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imageData = ctx.createImageData(canvas.width, canvas.height);
        const data = imageData.data;

        const sep = 0.2;
        const lambda = 0.02;
        const D = 2.0;
        const k = 2 * Math.PI / lambda;
        const slit1_x = -sep / 2;
        const slit2_x = sep / 2;

        const x_min = -1.5;
        const x_max = 1.5;
        const y_min = -0.4;
        const y_max = 0.4;

        for (let px = 0; px < canvas.width; px++) {
          const X = x_min + (x_max - x_min) * (px / (canvas.width - 1));
          for (let py = 0; py < canvas.height; py++) {
            const Y = y_min + (y_max - y_min) * (py / (canvas.height - 1));
            const r1 = Math.sqrt((X - slit1_x) ** 2 + (Y - 0) ** 2 + D ** 2);
            const r2 = Math.sqrt((X - slit2_x) ** 2 + (Y - 0) ** 2 + D ** 2);
            const delta = k * (r1 - r2);
            let intens: number;
            if (slit1_open && slit2_open) {
              intens = 4 * (Math.cos(delta / 2) ** 2);
            } else if (slit1_open || slit2_open) {
              intens = 1;
            } else {
              intens = 0;
            }
            intens /= 4;

            const [r, g, b] = getColor(intens);
            const idx = (py * canvas.width + px) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
          }
        }
        ctx.putImageData(imageData, 0, 0);
      };

      const updateSlits = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const third = canvas.width / 3;
        if (mx < third) {
          slit1_open = false;
          slit2_open = true;
        } else if (mx > 2 * third) {
          slit1_open = true;
          slit2_open = false;
        } else {
          slit1_open = true;
          slit2_open = true;
        }
        draw();
      };

      canvas.addEventListener('mousemove', updateSlits);
      canvas.addEventListener('mouseout', () => {
        slit1_open = true;
        slit2_open = true;
        draw();
      });

      draw(); // Initial draw

      return () => {
        canvas.removeEventListener('mousemove', updateSlits);
        canvas.removeEventListener('mouseout', () => {});
      };
    }, []);

    return (
      <footer class={`${displayClass ?? ""}`}>
        <p>
          {i18n(cfg.locale).components.footer.createdWith}{" "}
          <a href="https://quartz.jzhao.xyz/">Quartz v{version}</a> © {year}
        </p>
        {/**/}
        <ul class="social-links">
          {socialLinks.map((link) => (
            <li key={link.text}>
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                {link.text}
              </a>
            </li>
          ))}
        </ul>
        <canvas ref={canvasRef} class="footer-banner" />
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
    }
  `
  return Footer
}) satisfies QuartzComponentConstructor