# Personal Website

Simple, clean personal website with good HTML structure and formatting.

## Writing Articles

Everything lives in `index.html` — there's no separate file to manage. Open the `#articles` section and you'll find an HTML comment with a ready-to-copy `<article>` block:

```html
<article id="article-your-slug" class="article-content">
  <header class="article-header">
    <h3>Your Article Title</h3>
    <p class="article-meta"><time datetime="2026-07-08">Jul 8, 2026</time> <span class="tag">category</span></p>
  </header>

  <p>Opening paragraph — renders slightly larger, like a lede.</p>
  <p>More paragraphs, <strong>bold</strong>, <em>italic</em>, and <a href="#">links</a> all work as normal.</p>

  <h3>A subheading</h3>
  <p>Keep going.</p>

  <blockquote><p>A pulled quote or a point worth highlighting.</p></blockquote>

  <ul>
    <li>Bullet</li>
    <li>Points</li>
  </ul>

  <pre><code>const example = "code renders like this";</code></pre>
</article>
```

Copy that block, paste it directly above the comment (so newest articles stay on top), then edit the `id`, title, date, and tag, and write the body as plain `p` / `h3` / `ul` / `blockquote` / `pre` — the `.article-content` class formats all of it automatically:

- Paragraph spacing, with the first paragraph rendered slightly larger as a lede
- Styled `h2`/`h3` headings
- Lists, blockquotes (accent-colored rule), inline `code` and full code blocks
- Tables, `figure`/`figcaption`, and images
- `.tag` pill spans for categories in the meta line

A live example (`#article-demo-format`) is left in the Articles section as a formatting reference — delete it once you've written a real post, or keep it as a cheat sheet.

## HTML Structure

### Current sections in index.html:
- About
- Projects
- Articles
- Log

### Adding a new top-level section:

```html
<section id="new-section">
  <h2>New Section</h2>
  <p>Your content here...</p>
</section>
```

Add a matching link in the `.jumplinks` nav in `<header>`.

### The site includes:
- Responsive design (mobile-friendly)
- Dark mode support
- Mobile toggle for extras (now info + images)
- Lightbox for images
- Clean typography, tuned for long-form reading

## Files

- `index.html` - the entire site: homepage, sections, and all articles
- Images in root directory

## Style Variables

The site uses CSS variables for easy customization:
- `--paper` - Background color
- `--ink` - Text color
- `--ink-soft` - Muted text
- `--line` - Border color
- `--link` - Link color
- `--serif` - Font family

Edit these in the `:root` section to change colors.
