// Single source of truth for the "Now" widget on the homepage and its
// history at /now/. Newest entry first — to update what you're doing,
// add a new object to the TOP of this array (leave the old ones below,
// that's what makes /now an archive). Nothing else needs editing: the
// homepage always shows entries[0], and /now lists all of them.
const NOW_ENTRIES = [
  {
    date: '2026-07-22',
    html: `
      <p>Reading: <em>Seveneves</em> by Neal Stephenson, <em>Poor Charlies Almanack</em> by Peter D. Kaufman and <em>The Moon Is a Harsh Mistress</em> by Robert A. Heinlein</p>
      <p>Building out a company: <a href="https://fourpots.com/" target="_blank">fourpots</a> where I am creating a voice recording device with transcription which coverts speech to real data for health tracking as well as potentially a air filter for cars but that might just end up as a personal project for myself.</p>
      `
  },
  {
    date: '2026-07-15',
    html: `
      <p>Reading: <em>The Baroque Cycle</em> by Neal Stephenson, <em>The Moon Is a Harsh Mistress</em> by Robert A. Heinlein</p>
      <p>Creating a voice recording device with AI transcription for health tracking. Currently figuring out a name for it and therefore for the company too.</p>
      <p>Currently watching <a href="https://youtu.be/YGeNzpZ5Va4?si=tnEtV_-iLaJqM6yu" target="_blank">this interview</a> with David Deutsch. I'm also trying to figure out how to think about productivity and generally getting things done without coersion.</p>
      <p>Playing deadlock. Currently Emissary V.</p>
      `
  },
  {
    date: '2026-07-09',
    html: `
      <p>Reading: <em>The Baroque Cycle</em> by Neal Stephenson, <em>The Moon Is a Harsh Mistress</em> by Robert A. Heinlein</p>
      <p>Solving: loggt Voice recorded health and life tracking</p>
      <p>I've been working on this site quite a bit recently and trying to clean up the code to make it easier to work with and publish writing and stuff here.</p>
      <p>I'm also playing a lot of deadlock. I'm Emissary V. I am getting better but I'm in a bit of elo hell at the moment.</p>
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
