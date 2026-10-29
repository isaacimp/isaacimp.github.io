export const FIELDS = {
  title: { key: 'title', label: 'Title', type: 'text', required: true },
  date: { key: 'date', label: 'Date', type: 'date', required: true },
  description: { key: 'description', label: 'Description', type: 'textarea', rows: 2 },
  tags: { key: 'tags', label: 'Tags', type: 'tags', hint: 'Separate with commas.' },
  url: { key: 'url', label: 'Link', type: 'text' },
  images: { key: 'images', label: 'Screenshots', type: 'lines', rows: 2, hint: 'One per line.' },
  order: { key: 'order', label: 'Order on the site', type: 'text', hint: '1 is first.' }
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
      { key: 'enhancedUrl', label: 'Enhanced URL', type: 'text' }
    ]
  },
  {
    id: 'uses', label: 'Uses', kind: 'list', file: 'content/data/uses.json', noun: 'item', titleKey: 'name', addAtTop: false,
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'combo', required: true, optionsFrom: 'category' },
      { key: 'blurb', label: 'Blurb', type: 'textarea', rows: 3 },
      { key: 'link', label: 'Link', type: 'text' },
      { key: 'image', label: 'Image', type: 'text' }
    ]
  },
  { id: 'text', label: 'Home & text', kind: 'text', file: 'content/text.json' },
  { id: 'pages', label: 'Pages', kind: 'raw', dir: 'content/pages', ext: '.html' },
  { id: 'media', label: 'Images', kind: 'media', dir: 'content/media/img', urlPrefix: '/img/' },
  { id: 'settings', label: 'Settings', kind: 'settings', file: 'content/site.json' }
];
