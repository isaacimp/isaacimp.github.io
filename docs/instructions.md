# Instructions

Content you write lives in `content/`. The look lives in `theme/`. One script
(`engine/build.js`) turns them into the finished site in `dist/`, which is
what gets published. Source files are never modified by the build.

```
content/
  site.json        site name, url, colours (light/dark), fonts
  now/             one markdown file per entry, named by date: 2026-10-28.md
  posts/           markdown + front matter  -> /posts/<slug>.html
  articles/        markdown + front matter  -> /<slug>.html
  projects/        markdown + front matter  -> /projects/<slug>.html
  pages/           hand-written pages (writing, uses, bookmarks, ...)
  data/            lists as JSON (uses.json, bookmarks.json)
  media/           img/ and pdfs/, copied as-is
theme/             style.css, js/ (browser scripts), fonts/, favicon.svg
public/            CNAME, robots.txt (copied to the site root)
admin/             the /admin/ editing page (see below)
engine/            build.js and tools/ (serve, add-font, check-layout, test-admin)
dist/              the built site (not committed)
```

## Everyday

```bash
npm run dev      # build, serve on http://localhost:8000, rebuild on every save
npm run build    # just build into dist/
npm run check    # build, then test layout in Chrome + Safari engines
npm run test:admin   # end-to-end test of the admin page (fake GitHub, real browser)
```

- **New now entry:** copy `content/now/_template.md` to `content/now/<today>.md` and write.
- **New post / article / project:** copy the `_template.md` in its folder.
- **Change colours or fonts:** edit `content/site.json` (`theme`). To add a font file, `node engine/tools/add-font.js <fontsource-id>`.
- **New hand-written page:** add an `.html` file to `content/pages/` with front matter (`title`, `description`, `path`) and the page body.

Publishing = commit and push to `main`; the GitHub Action in
`.github/workflows/deploy.yml` builds and deploys.

## The admin page (edit from any browser)

`https://isaacmp.xyz/admin/` edits the site without a computer: write now
entries, posts, articles and projects (with live preview), manage bookmarks and
"uses", upload images, edit hand-written pages, and change the site name,
colours and fonts. Each save is a commit to `main`; the deploy action then
publishes it (about a minute).

**Sign-in.** The admin is a static page, so the only thing that can change the
site is a GitHub token with write access to this repo. Create one once:
GitHub > Settings > Developer settings > Fine-grained tokens > Generate.
Repository access: only `isaacimp/isaacimp.github.io`. Permissions: Contents
Read and write. Paste it into the admin with a passphrase; it is kept on that
device encrypted by the passphrase (nothing readable is stored) and is only
ever sent to api.github.com. Use a different token per device and set an
expiry; revoke it on GitHub at any time to cut a device off.

**Good to know**
- Edits go straight to `main`. If you also edit locally, `git pull` before you
  start and before you push, or you will hit a conflict.
- If you turn on branch protection that blocks direct pushes, the admin cannot save.
- Hand-written pages are edited as raw HTML; a typo there can break the page
  (git history can undo it).
- The admin loads no scripts from other sites and runs under a strict
  Content-Security-Policy. Settings live in `content/site.json` > `admin`.

## If you change the engine or admin

- The admin talks only to api.github.com, and that address must stay hard-coded in `admin/js/github.js`. If it ever came from the URL, a crafted link could send your token elsewhere.
- Never put content into the admin page as HTML. Text goes in as text, and the markdown preview stays in the sandboxed iframe.
- The build never edits files in `content/`, `theme/` or `admin/`; `dist/` is wiped and rebuilt every run.
- Values the admin writes into front matter must read back exactly. `npm run test:admin` checks this, so run it after touching `admin/js/frontmatter.js`.
