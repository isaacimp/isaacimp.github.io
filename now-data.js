// Single source of truth for the "Now" widget on the homepage and its
// history at /now/. Newest entry first — to update what you're doing,
// add a new object to the TOP of this array (leave the old ones below,
// that's what makes /now an archive). Nothing else needs editing: the
// homepage always shows entries[0], and /now lists all of them.
const NOW_ENTRIES = [
  {
    date: '2026-08-19',
    html:  `One of the greatest, most immediately beneficial health interventions that I have done happened the other day. For a long time I have had this problem where I wake up basically every single morning and I just feel groggy and terrible. I have this congestion in my head and my nose and it just makes my whole head feel full and I have brain fog and it was just no good. It would also take a very long time to go away so my mornings were basically just wasted away trying to feel better. 
I’ve had lots of theories as to what it might be overtime and I thought it was due to something I was eating before bed but since I would have different things and it was always the same I gave up on that, I thought it was dust mites so I got dust mite bedding but didn’t notice much, I thought it was a metabolism thing but increasing my metabolism didn’t seem to make it go away. It went on like this for months but then I was doing a bit more research and every seemed to be lining up with a dust mite allergy/ sensitivity again and since I’ve always had issues with dust I thought I would take it more seriously so I washed all the bedding in hot water and a mite/ mold cleaner and used both my mite free pillowcases and even ran two air purifiers right next to my bed. When I woke up the next morning I knew right away that it worked. I felt completely different. There was still some congestion and fog but not much and the fact that I knew that this was the answer meant that I knew if I just got rid of as much dust mites as possible, this would be reduced even further.

Since then I have vacuum the carpet more, cleaned up so there’s less things in the bedroom to collect dust, and moved the air purifiers higher up so they are closer to my head. I have a checklist of a few things to keep up with to ensure a minimal amount of dust mites can mess up my head again:

<H4>Dust Mite Checklist</h4>

<H5>One-time Setup <H5>
- Full zippered dust-mite fitted mattress encasement 
- Dust-mite pillow protectors on both pillows
- Full zippered dust-mite doona encasement fitted
- Air purifier set up and running in bedroom
- Dehumidifier if needed

<H5>Daily<H5>

- Air purifier running (especially overnight)
- Humidity kept between 35–50%
- Saline nasal irrigation (morning and/or evening)
- Head slightly elevated while sleeping
- Good hydration during the day
- Shower before bed and wear clean (or no) clothes to bed

<H5>Weekly</H5>

- Wash all bedding in hottest water possible (≥54–60°C)
- HEPA vacuum carpet thoroughly (under & around bed)
- Vacuum air filters

<H5>6 Months<H5>
- Replace air filters`
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
