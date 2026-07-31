// Single source of truth for the Bookmarks page. Newest entry first — to
// save something, copy the template block below, paste it at the TOP of
// the array, and fill in url + title. Everything else is optional.
//
// {
//   date: 'YYYY-MM-DD',
//   url: '',
//   title: '',
//   type: 'article', // article / video / post / paper / tool / link
//   note: '',
//   enhancedUrl: '' // optional: link to a locally-hosted improved version,
//                   // e.g. 'pdfs/my-file.pdf' — drop the file in /pdfs first
// },
//
const BOOKMARKS = [
  {
    date: '2026-07-31',
    url: 'https://takingchildrenseriously.com/taking-ourselves-seriously/',
    title: 'Taking Ourselves Seriously - Cody Baldwin',
    type: 'article',
  },
  {
     date: '2026-07-31',
     url: 'https://takingchildrenseriously.com/wp-content/uploads/2023/12/The-Evolution-of-Culture.pdf',
     title: 'The Evolution of Culture - David Deutsch',
     type: 'article',
     note: ''
   },
  {
    date: '2026-07-29',
    url: 'https://wiki.chadnet.org/files/using-sunlight-to-sustain-life.pdf',
    title: 'Using Sunlight to Sustain Life - Ray Peat',
    type: 'article',
    note: 'A nice article on light and its importance.',
    enhancedUrl: 'pdfs/using-sunlight-restored.pdf'
  },
  {
    date: '2026-07-15',
    url: 'https://youtu.be/YGeNzpZ5Va4?si=tnEtV_-iLaJqM6yu',
    title: 'Cool in person interview with David Deutsch',
    type: 'video',
    note: ''
  }
];
