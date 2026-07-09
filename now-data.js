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
      <p>Solving: loggt Voice recorded health and life tracking</p>
      <p>I've been working on this site quite a bit recently and trying to clean up the code to make it easier to work with and publish writing and stuff here.</p>
      <p>I'm also playing a lot of deadlock. I'm Emissary V. I am getting better but I'm in a bit of elo hell at the moment.
      `
  },
  {
    date: '2026-07-08',
    html: `
      <p>Reading: <em>The Baroque Cycle</em> by Neal Stephenson, <em>The Moon Is a Harsh Mistress</em> by Robert A. Heinlein</p>
      <p>Solving: health tracker</p>
    `
  }
];
