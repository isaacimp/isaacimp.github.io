# Personal Website

Simple, clean personal website with good HTML structure, formatting, and basic SEO.

## Articles vs Log — two different things on purpose

- **Articles** are real, considered pieces. Each one is its own HTML page under `articles/`, with its own `<title>`, meta description, and canonical URL — that's what lets an individual article actually turn up in Google, instead of being buried as an anchor on the homepage. They're linked from the `#articles` section on the homepage as a simple list.
- **Log** is informal — short notes, half-finished thoughts, whatever. It stays inline in `index.html` under `#log`, so you can just scroll the homepage and read it. No separate page, no SEO ceremony, low friction to write.

If something feels like it deserves its own audience/search traffic, it's an Article. If it's just "here's a thing I noticed today," it's a Log entry.

## Writing a new Article

1. Copy `articles/template.html` to `articles/your-slug.html`.
2. Fill in the `<title>`, `<meta name="description">`, canonical URL, and OG/Twitter tags at the top — these matter for search and for link previews (Slack/Twitter/iMessage).
3. Change `<meta name="robots">` from `noindex, nofollow` to `index, follow` (the template defaults to noindex so an unfinished copy never accidentally gets indexed).
4. Write the body as plain `p` / `h3` / `ul` / `ol` / `blockquote` / `pre+code` / `table` / `img` — the `.article-content` class (in `style.css`) formats all of it automatically. See `articles/formatting-reference.html` for a live example of every element.
5. Add a `<li>` linking to it from the `#articles` section in `index.html` (newest at the top).
6. Add a `<url><loc>...</loc></url>` entry for it in `sitemap.xml`.

## Writing a new Log entry

Just add a `<li>` inside the `ul.plain` list in the `#log` section of `index.html` — see the commented-out example markup nearby for the pattern (title link, em-dash, short note, `<em>date, tag</em>`).

## Adding a new top-level section

```html
<section id="new-section">
  <h2>New Section</h2>
  <p>Your content here...</p>
</section>
```

Add a matching link in the `.jumplinks` nav in `<header>`.

## SEO / technical basics

- `style.css` — all shared styling, linked from every page (`index.html` and everything in `articles/`). Edit once, applies everywhere.
- `favicon.svg` — the infinity mark, adapts to light/dark tab automatically.
- Every page has its own `<title>`, meta description, canonical link, Open Graph + Twitter card tags, and a `theme-color` for the browser chrome.
- `robots.txt` and `sitemap.xml` at the root — update the sitemap whenever you publish a real article (skip demo/template pages, which are `noindex`).
- JSON-LD structured data: a `Person` schema on the homepage, a `BlogPosting` schema on the article template.

## Site features

- Responsive design (mobile-friendly)
- Dark mode support (follows OS preference)
- Mobile toggle for extras (now info + images)
- Lightbox for images
- Clean typography, tuned for long-form reading

## Files

- `index.html` — homepage: About, Projects, Articles (links out), Log (inline)
- `articles/template.html` — copy this to start a new article
- `articles/formatting-reference.html` — live demo of article formatting
- `style.css` — all shared styles
- `favicon.svg` — site icon
- `sitemap.xml`, `robots.txt` — search engine plumbing
- Images in the root directory

## Style Variables

Defined in `style.css`:
- `--paper` — background color
- `--ink` — text color
- `--ink-soft` — muted text
- `--line` — border color
- `--link` — link color (the only accent color on the site — everything else is black/white)
- `--serif` — font family

Edit these in the `:root` section to change colors.
