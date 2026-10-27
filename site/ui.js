const menuButton = document.querySelector('.menu-toggle');
const menu = document.getElementById('mobile-menu');
function closeMenu() {
  if (!menu || !menuButton) return;
  menu.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', '開啟導覽選單');
}
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? '關閉導覽選單' : '開啟導覽選單');
});
menu?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu && !menu.hidden) { closeMenu(); menuButton.focus(); }
});
matchMedia('(min-width:1001px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)');
const filters = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('[data-story]')];
const categories = new Set(filters.map(button => button.dataset.filter));
function filterStories(value, animate = false) {
  const selected = categories.has(value) ? value : 'all';
  filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === selected)));
  cards.forEach(card => {
    const visible = selected === 'all' || card.dataset.category === selected;
    card.getAnimations().forEach(animation => animation.cancel());
    card.hidden = !visible;
    if (visible && animate && !reducedMotion.matches) {
      card.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 240, easing: 'cubic-bezier(.22,1,.36,1)' });
    }
  });
  const status = document.getElementById('filter-status');
  if (status) status.textContent = `顯示 ${cards.filter(card => !card.hidden).length} 個內容欄目`;
}
filters.forEach(button => button.addEventListener('click', () => {
  const value = button.dataset.filter;
  filterStories(value, true);
  const url = new URL(location.href);
  if (value === 'all') url.searchParams.delete('content'); else url.searchParams.set('content', value);
  url.hash = 'stories';
  history.replaceState(null, '', url);
}));
if (filters.length) filterStories(new URL(location.href).searchParams.get('content') || 'all');
window.addEventListener('popstate', () => { if (filters.length) filterStories(new URL(location.href).searchParams.get('content') || 'all'); });

const storyDialog = document.getElementById('story-dialog');
function allowedContentUrl(value) {
  if (!value) return '';
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; }
}
cards.forEach(card => {
  const content = (window.FULIN_CONTENT || []).find(item => item.id === card.dataset.story);
  if (!content) { card.disabled = true; return; }
  const url = allowedContentUrl(content.url);
  if (url) {
    card.querySelector('[data-story-status]').textContent = '現已上線 ↗';
    card.setAttribute('aria-label', `了解${content.title}`);
  }
  card.addEventListener('click', () => {
    if (!storyDialog) return;
    document.getElementById('story-dialog-title').textContent = content.title;
    document.getElementById('story-dialog-description').textContent = content.description;
    document.getElementById('story-dialog-status').textContent = url ? '將於新分頁開啟作品。' : '內容準備中；推出後會在 WhatsApp 社群分享，這裡也會提供觀看入口。';
    const watch = document.getElementById('story-watch');
    watch.hidden = !url;
    if (url) watch.href = url; else watch.removeAttribute('href');
    storyDialog.showModal();
  });
});
storyDialog?.querySelector('.dialog-close').addEventListener('click', () => storyDialog.close());
document.getElementById('story-dialog-done')?.addEventListener('click', () => storyDialog.close());
storyDialog?.addEventListener('click', event => {
  if (event.target !== storyDialog) return;
  const rect = storyDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) storyDialog.close();
});
