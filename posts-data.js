// Single source of truth for the Posts list. Add a new object to the TOP
// of this array each time you publish a post (newest first) — nothing
// else needs manual updating anywhere else on the site.
//
// The homepage "Posts" section pulls the full content of POSTS[0]
// straight from its standalone page (see below), and /posts/ lists every
// entry here, newest first, linking out to its own page.
//
// slug: matches the filename in /posts/ (without .html) — e.g. slug
//       'my-idea' -> posts/my-idea.html
// tags: an array of short free-text labels — as many as you want, e.g.
//       ['idea', 'health']. Each renders as a clickable chip that links to
//       /tags.html?t=<tag>, showing every post/article sharing that tag.
const POSTS = [
  { slug: 'thoughts-on-you-and-your-research-speech', title: 'My thoughts on: You and Your Research', date: '2026-08-06', tags: ['philosophy', 'life'] },
];
