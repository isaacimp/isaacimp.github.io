import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"
import { version } from "../../package.json"
import { i18n } from "../i18n"

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

`
  return Footer
}) satisfies QuartzComponentConstructor
