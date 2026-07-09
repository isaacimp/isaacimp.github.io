// Single source of truth for the "Now" widget on the homepage and its
// history at /now/. Newest entry first — to update what you're doing,
// add a new object to the TOP of this array (leave the old ones below,
// that's what makes /now an archive). Nothing else needs editing: the
// homepage always shows entries[0], and /now lists all of them.
const NOW_ENTRIES = [
  {
    date: '2026-07-09',
    html: `
      <p>Reading: <em>The Baroque Cycle</em> by Neal Stephenson, <em>The Moon Is a Harsh Mistress</em> by Robert A. Heinlein</p>
      <p>Working: loggt Voice recorded health and life tracking</p>
      `
  },
  {
    date: '2026-07-08',
    html: `
      <p>Reading: <em>The Baroque Cycle</em> by Neal Stephenson, <em>The Moon Is a Harsh Mistress</em> by Robert A. Heinlein</p>
      <p>Working: Karl Popper's epistemology</p>
      <p>Building: at1a v0.3 health tracker</p>
    `
  }
];
