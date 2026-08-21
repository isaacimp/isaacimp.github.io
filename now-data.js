// Single source of truth for the "Now" widget on the homepage and its
// history at /now/. Newest entry first — to update what you're doing,
// add a new object to the TOP of this array (leave the old ones below,
// that's what makes /now an archive). Nothing else needs editing: the
// homepage always shows entries[0], and /now lists all of them.
const NOW_ENTRIES = [
  {
    date: `2026-08-21`,
    html:  `<p>I'm going to the only two countries in the world starting with the /taɪ/ sound in a couple of months. Thailand and Taiwan. I haven't been to either one and I am really looking forward to it. The most recent of my travels was in January 2026 to Vietnam, Bali, and Singapore. Amy and I are only really going to Thailand to help my sister out for a week but then Amy is heading back to Australia for school and I will continue on to Taiwan which is where I really want to go. I have about 60 days to prepare and hopefully learn a good amount of Mandarin but we'll see. In the meantime I will try and save some money so I can actually take my time there and not have to worry too much about money.</p>
            <p>I feel like my website is in a pretty good spot now where I can just focus on writing and posting to it. There are a few things I am not yet satisfied with but I'll figure that out when they become problematic.</p>
            <p>I have been hanging a lot lately too as well as doing pull ups and some gym ring exercises and it feels great.</p>
            <img src="/img/hang.jpg" alt="pull-up bar">`
  },
  {
    date: '2026-08-10',
    html:  `<p>I'm 23 now.</p>`
  },
  {
    date: '2026-08-06',
    html: `
      <p>Keeping my eye on: <a href="https://keepsite.org">keepsite</a> by Derek <a href="https://sive.rs">sive.rs</a> which looks like a very interesting idea and one which I would likely use for my own site.</p>
      <p>I have a new design for my speech to data, ai, health tracking device to allow for entering of specific values which will help with the accuracy issue of using voice to text and ai.</p>
    `
  },
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
      <p>I also just read this article: <a href="https://wiki.chadnet.org/files/using-sunlight-to-sustain-life.pdf">Using Sunlight to Sustain Life</a> which I think provides a quite good explaination and description of light and its important in our successful biological functioning and energy production. Its winter now so I have not been getting enough light but I will try to get more artificial light while indoors as well as keep blinds open to get sun through the window. If I notice skin issues I will further reduce PUFA consumption or wear a safe sunscreen like zinc maybe but my skin is pretty robust it seems.</p>
      `
  },
  {
    date: '2026-07-22',
    html: `
      <p>Reading: <em>Seveneves</em> by Neal Stephenson, <em><a href="/articles/poorcharlie.html" >Poor Charlies Almanack</a></em> by Peter D. Kaufman and <em>The Moon Is a Harsh Mistress</em> by Robert A. Heinlein</p>
      <p>Building out a company: <a href="https://fourpots.com/">fourpots</a> where I am creating a voice recording device with transcription which coverts speech to real data for health tracking as well as potentially an air filter for cars but that might just end up as a personal project for myself.</p>
      `
  },
  {
    date: '2026-07-15',
    html: `
      <p>Reading: <em>The Baroque Cycle</em> by Neal Stephenson, <em>The Moon Is a Harsh Mistress</em> by Robert A. Heinlein</p>
      <p>Creating a voice recording device with AI transcription for health tracking. Currently figuring out a name for it and therefore for the company too.</p>
      <p>Currently watching <a href="https://youtu.be/YGeNzpZ5Va4?si=tnEtV_-iLaJqM6yu">this interview</a> with David Deutsch. I'm also trying to figure out how to think about productivity and generally getting things done without coersion.</p>
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
