# Notes

## Layout
- `content/` is everything written
  - `site.json`: site name, address, email, colours, fonts
  - `text.json`: page wording (home paragraph, headings, intros)
  - `now/`: one markdown file per entry, named by date
  - `posts/`, `articles/`, `projects/`: markdown with front matter
  - `pages/`: hand-written pages
  - `data/`: `bookmarks.json`, `uses.json`
  - `media/`: images and pdfs
- `theme/`: stylesheet, browser scripts, fonts, favicon
- `public/`: `CNAME`, `robots.txt`
- `admin/`: the `/admin/` page
- `engine/`: `build.js` and tools
- `dist/`: the built site, not committed

## Commands
- `npm run dev`: builds, previews at localhost:8000, rebuilds on save
- `npm run build`: builds into `dist/`
- `npm run check`: builds, then layout check in Chrome and Safari engines
- `npm run test:admin`: admin test against a fake GitHub

## How it works
- Push to `main`, the GitHub Action builds and deploys `dist/`
- The build never edits source files, `dist/` is rebuilt every time
- Page wording comes from `text.json` through tokens in the page HTML
  - `{{home.lead}}` is markdown, so `[words](address)` makes a link
  - `{{!site.name}}` is plain text, used inside attributes
  - `{{projects}}` is the project list, built from `content/projects/`
- Project order comes from `order:` in each project's front matter
- Each content folder has a `_template.md`
- New now entry is `content/now/<date>.md`
- Colours and fonts are in `site.json`
- Font files are added with `node engine/tools/add-font.js <fontsource-id>`

## Admin
- `/admin/` edits through the GitHub API, each save is a commit to `main`
- Tabs: Now, Posts, Articles, Projects, Bookmarks, Uses, Home & text, Pages, Images, Settings
- Pages tab has title and description fields, with the raw HTML underneath
- Sign-in is a fine-grained token for this repo only, Contents read and write
- The token is stored on the device encrypted with a passphrase, and only sent to api.github.com
- Edits go straight to `main`, so a local `git pull` comes first
- Branch protection that blocks direct pushes would stop saves

## Engine and admin
- The GitHub address is hard-coded in `admin/js/github.js`, if it came from the URL a link could send the token elsewhere
- Content goes into the admin page as text, never HTML, and the preview stays in the sandboxed iframe
- Values written to front matter have to read back exactly, `npm run test:admin` checks this, worth running after changing `admin/js/frontmatter.js`
