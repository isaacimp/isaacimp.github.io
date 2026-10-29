export const FIELDS = {
  title: { key: 'title', label: 'Title', type: 'text', required: true },
  date: { key: 'date', label: 'Date', type: 'date', required: true },
  description: { key: 'description', label: 'Description', type: 'textarea', rows: 2, hint: 'One or two sentences: shown in search results and link previews.' },
  tags: { key: 'tags', label: 'Tags', type: 'tags', hint: 'Comma separated, e.g. health, philosophy' },
  url: { key: 'url', label: 'Link', type: 'text', hint: 'The live site, e.g. https://example.com' },
  images: { key: 'images', label: 'Screenshots', type: 'lines', rows: 2, hint: 'One path per line, e.g. img/projects/name-1.jpg. The first one is the hover preview on the site page.' },
  order: { key: 'order', label: 'Order on the site', type: 'text', hint: 'A number: 1 comes first in the project list on the full site page.' }
};

export const SECTIONS = [
  { id: 'now', label: 'Now', kind: 'md', dir: 'content/now', noun: 'entry', slugBy: 'date', fields: [] },
  { id: 'posts', label: 'Posts', kind: 'md', dir: 'content/posts', noun: 'post', slugBy: 'title', fields: ['title', 'date', 'description', 'tags'] },
  { id: 'articles', label: 'Articles', kind: 'md', dir: 'content/articles', noun: 'article', slugBy: 'title', fields: ['title', 'date', 'description', 'tags'] },
  { id: 'projects', label: 'Projects', kind: 'md', dir: 'content/projects', noun: 'project', slugBy: 'title', fields: ['title', 'date', 'description', 'url', 'order', 'tags', 'images'] },
  {
    id: 'bookmarks', label: 'Bookmarks', kind: 'list', file: 'content/data/bookmarks.json', noun: 'bookmark', titleKey: 'title', addAtTop: true,
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'url', label: 'URL', type: 'text', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'type', label: 'Type', type: 'combo', options: ['article', 'video', 'post', 'paper', 'tool', 'website', 'link'] },
      { key: 'note', label: 'Note', type: 'textarea', rows: 2 },
      { key: 'enhancedUrl', label: 'Enhanced URL', type: 'text', hint: 'Optional alternative link.' }
    ]
  },
  {
    id: 'uses', label: 'Uses', kind: 'list', file: 'content/data/uses.json', noun: 'item', titleKey: 'name', addAtTop: false,
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'combo', required: true, optionsFrom: 'category' },
      { key: 'blurb', label: 'Blurb', type: 'textarea', rows: 3 },
      { key: 'link', label: 'Link', type: 'text' },
      { key: 'image', label: 'Image', type: 'text', hint: 'e.g. img/macbook.jpg' }
    ]
  },
  { id: 'text', label: 'Home & text', kind: 'text', file: 'content/text.json' },
  { id: 'pages', label: 'Pages', kind: 'raw', dir: 'content/pages', ext: '.html' },
  { id: 'media', label: 'Images', kind: 'media', dir: 'content/media/img', urlPrefix: '/img/' },
  { id: 'settings', label: 'Settings', kind: 'settings', file: 'content/site.json' }
];
