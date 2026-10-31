# Notes

## Layout
- `content/index.md` is the home page, plain text and links
- `content/bookmarks.md` and `content/uses.md` are pages written as markdown lists
- `content/articles/`, `posts/`, `projects/` hold one markdown file per item
- `content/now/` holds one file per entry, named by date
- Each of those folders has an `index.md` (the intro on its list page) and a `_template.md`
- `content/site.json` has the name, address, email, nav links and social links
- `content/img/` and `content/pdfs/` are copied as they are
- `theme/style.css` is all the CSS, inlined into every page
- Colours, fonts and widths are the variables at the top of `theme/style.css`, dark mode just below them
- `--ui` is the monospace font for structure, `--read` the serif for long text, `--display` the pixel font for titles
- `engine/build.js` reads the content and writes the pages
- `engine/templates.js` is all the HTML
- `engine/lib.js` has the helpers, `engine/serve.js` is the preview
- `public/` has `CNAME` and `robots.txt`

## How it works
- A page is a markdown file, or a list of markdown files
- Front matter: `title`, `date`, `description`, `tags: [a, b]`
- Projects also have `url` and `order`
- `robots: "noindex, follow"` keeps a page out of search and the sitemap
- `/site.html`, `/tags/` and `/feed.xml` are built from everything else
- Articles with three or more `##` headings get a contents box
- Item pages link to the newer and older item in the same list
- Task lists `- [ ]` render as labelled checkboxes
- The only JavaScript is on the home page: it sizes the text to fill the screen, and the page looks normal without it
- `speculationrules` in the head prerenders a link when it is hovered
- Push to `main`, the GitHub Action runs `node engine/build.js` and publishes `dist/`

## URLs
- Articles are `/<slug>.html`, posts `/posts/<slug>.html`, projects `/projects/<slug>.html`
- Lists are `/articles/`, `/posts/`, `/projects/`, `/now/`
- Also `/bookmarks.html`, `/uses.html`, `/site.html`, `/tags/`, `/feed.xml`

## Commands
- `npm run dev`: preview at localhost:8000, rebuilds on save
- `npm run build`: builds into `dist/`
