// Single source of truth for the "Now" widget on the homepage and its
// history at /now/. Newest entry first — to update what you're doing,
// add a new object to the TOP of this array (leave the old ones below,
// that's what makes /now an archive). Nothing else needs editing: the
// homepage always shows entries[0], and /now lists all of them.
const NOW_ENTRIES = [
  {
    date: '2026-08-04',
    html: `
      <p>Reading <em>Seveneves</em> (almost finished), <a href="/articles/poorcharlie.html" >Poor Charlies Almanack</a></em> by Peter D. Kaufman and flipping through various others like <em>Generative Energy</em> by Raymond Peat and <em>Hypothyroidism: The Unexpected Illness</em> by Broda O. Barnes and Lawrence Galton</p>
      <p>Out of the blue I realised that I would like to learn a second language. I think it would be very cool. After some thought, I decided on Traditional Mandarin Chinese for a few reasons. 1: It is the most spoken first language in the world. 2: It seems hard and interesting. 3: It would be very cool to be able to speak Mandarin and would surprise a lot of people. 4: I would like to visit/ live in Taiwan for a while. (also Taiwan makes most of the worlds semiconductors and other cool computing hardware)</p>
      <p>I've arrived at a very basic diet -- hopefully it can help me to heal my gut by giving it rest and providing nutrient dense whole meals. Basically just eating rice, chicken, beef mince, milk, and some fruits and well cooked veggies sometimes.</p>
      `
  },
  {
    date: '2026-07-29',
    html: `
      <p>Reading <em>Seveneves</em> (almost finished), <a href="/articles/poorcharlie.html" >Poor Charlies Almanack</a></em> by Peter D. Kaufman and flipping through various others like <em>Generative Energy</em> by Raymond Peat and <em>Hypothyroidism: The Unexpected Illness</em> by Broda O. Barnes and Lawrence Galton</p>
      <p>Im now at the stage where I have basically all of the parts needed to make a prototype of my voice health tracking device so I am starting to piece it together and work through the documentation for the nRF52840-DK and the software so I can get an initial prototype in my hands and start testing it.</p>
      <p>I also just read this article: <a href="https://wiki.chadnet.org/files/using-sunlight-to-sustain-life.pdf" target=_blank">Using Sunlight to Sustain Life</a> which I think provides a quite good explaination and description of light and its important in our successful biological functioning and energy production. Its winter now so I have not been getting enough light but I will try to get more artificial light while indoors as well as keep blinds open to get sun through the window. If I notice skin issues I will further reduce PUFA consumption or wear a safe sunscreen like zinc maybe but my skin is pretty robust it seems.</p>
      `
  },
  {
    date: '2026-07-22',
    html: `
      <p>Reading: <em>Seveneves</em> by Neal Stephenson, <em><a href="/articles/poorcharlie.html" >Poor Charlies Almanack</a></em> by Peter D. Kaufman and <em>The Moon Is a Harsh Mistress</em> by Robert A. Heinlein</p>
      <p>Building out a company: <a href="https://fourpots.com/" target="_blank">fourpots</a> where I am creating a voice recording device with transcription which coverts speech to real data for health tracking as well as potentially an air filter for cars but that might just end up as a personal project for myself.</p>
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
