'use strict';

const STORAGE_KEY = 'sabore-posts-local-v1';
const categoryLabels = {
  'cafe-da-manha': 'Café da manhã',
  almoco: 'Almoço',
  sobremesas: 'Sobremesas',
  lanches: 'Lanches'
};

const postGrid = document.querySelector('#post-grid');
const countNode = document.querySelector('#post-count');
const searchInput = document.querySelector('#search-input');
const postDialog = document.querySelector('#post-dialog');
const detailDialog = document.querySelector('#detail-dialog');
const postForm = document.querySelector('#post-form');
const toast = document.querySelector('#toast');
let selectedCategory = 'todas';
let toastTimer;
let posts = readLocalPosts();

function readLocalPosts() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter((post) => post && typeof post === 'object'
      && typeof post.id === 'string'
      && typeof post.title === 'string'
      && typeof post.author === 'string'
      && typeof post.category === 'string'
      && typeof post.summary === 'string'
      && typeof post.content === 'string');
  } catch {
    return [];
  }
}

function persistLocalPosts(nextPosts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPosts));
    return true;
  } catch {
    showToast('O navegador não conseguiu guardar esta história. Verifique o espaço de armazenamento e tente novamente.');
    return false;
  }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Agora mesmo';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 4200);
}

function scrollToPublications() {
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelector('#publicacoes').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}

function emptyState(hasPosts, hasFilters) {
  const box = element('div', 'empty-state');
  const bowl = element('span', 'empty-bowl', '✳');
  bowl.setAttribute('aria-hidden', 'true');
  box.append(bowl);
  box.append(element('p', 'eyebrow', hasPosts && hasFilters ? 'Ainda não encontramos' : 'Um lugar à mesa'));
  box.append(element('h3', '', hasPosts && hasFilters
    ? 'Nenhuma história combina com sua busca.'
    : 'O mural está pronto para a primeira história.'));
  box.append(element('p', '', hasPosts && hasFilters
    ? 'Tente outro termo ou escolha uma categoria diferente.'
    : 'Compartilhe uma receita, uma lembrança ou aquele jeito especial de cozinhar.'));

  const action = element('button', hasPosts && hasFilters ? 'text-link' : 'button-primary',
    hasPosts && hasFilters ? 'Limpar filtros' : 'Escrever a primeira história');
  action.type = 'button';
  if (hasPosts && hasFilters) action.dataset.clearFilters = 'true';
  else action.dataset.openPost = 'true';
  box.append(action);
  return box;
}

function makePostCard(post) {
  const card = element('article', 'post-card');
  const meta = element('div', 'post-meta');
  meta.append(element('span', 'post-tag', categoryLabels[post.category] || 'Culinária de casa'));
  meta.append(element('span', 'post-date', formatDate(post.createdAt)));
  card.append(meta);
  card.append(element('h3', '', post.title));
  card.append(element('p', '', post.summary));

  const footer = element('div', 'post-card-footer');
  const author = element('span', 'post-author');
  author.append(document.createTextNode('Uma história de '));
  author.append(element('strong', '', post.author));
  footer.append(author);
  const read = element('button', 'read-button', 'Ler história →');
  read.type = 'button';
  read.dataset.readPost = post.id;
  footer.append(read);
  card.append(footer);
  return card;
}

function renderPosts() {
  const query = searchInput.value.trim().toLocaleLowerCase('pt-BR');
  const visible = posts.filter((post) => {
    const categoryMatches = selectedCategory === 'todas' || post.category === selectedCategory;
    const searchable = [post.title, post.author, post.summary, post.content, categoryLabels[post.category] || '']
      .join(' ').toLocaleLowerCase('pt-BR');
    return categoryMatches && (!query || searchable.includes(query));
  });

  countNode.textContent = `${visible.length} ${visible.length === 1 ? 'história' : 'histórias'}`;
  postGrid.replaceChildren();
  if (!visible.length) {
    postGrid.append(emptyState(posts.length > 0, Boolean(query) || selectedCategory !== 'todas'));
    return;
  }
  const fragment = document.createDocumentFragment();
  visible.forEach((post) => fragment.append(makePostCard(post)));
  postGrid.append(fragment);
}

function openPostDetail(postId) {
  const post = posts.find((item) => item.id === postId);
  if (!post) return;
  document.querySelector('#detail-category').textContent = categoryLabels[post.category] || 'Culinária de casa';
  document.querySelector('#detail-date').textContent = formatDate(post.createdAt);
  document.querySelector('#detail-title').textContent = post.title;
  document.querySelector('#detail-summary').textContent = post.summary;
  document.querySelector('#detail-author').textContent = `Uma história de ${post.author}`;
  document.querySelector('#detail-content').textContent = post.content;
  detailDialog.showModal();
}

function resetFilters() {
  selectedCategory = 'todas';
  searchInput.value = '';
  document.querySelectorAll('[data-category]').forEach((button) => {
    const active = button.dataset.category === 'todas';
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  renderPosts();
}

document.querySelectorAll('[data-category]').forEach((button) => {
  button.addEventListener('click', () => {
    selectedCategory = button.dataset.category;
    document.querySelectorAll('[data-category]').forEach((item) => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    renderPosts();
  });
});

searchInput.addEventListener('input', renderPosts);
document.querySelector('#search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  renderPosts();
  scrollToPublications();
});

document.addEventListener('click', (event) => {
  const openButton = event.target.closest('[data-open-post]');
  if (openButton) {
    postDialog.showModal();
    return;
  }
  const closeButton = event.target.closest('[data-close-dialog]');
  if (closeButton) {
    document.querySelector(`#${closeButton.dataset.closeDialog}`)?.close();
    return;
  }
  const readButton = event.target.closest('[data-read-post]');
  if (readButton) {
    openPostDetail(readButton.dataset.readPost);
    return;
  }
  if (event.target.closest('[data-clear-filters]')) resetFilters();
});

postForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(postForm);
  const author = String(formData.get('author') || '').trim();
  const title = String(formData.get('title') || '').trim();
  const category = String(formData.get('category') || '');
  const summary = String(formData.get('summary') || '').trim();
  const content = String(formData.get('content') || '').trim();

  if (author.length < 2 || title.length < 4 || !categoryLabels[category] || summary.length < 20 || content.length < 40) {
    document.querySelector('#form-error').textContent = 'Confira os campos: nome (2+), título (4+), resumo (20+) e história (40+ caracteres).';
    return;
  }

  const post = {
    id: window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    author: author.slice(0, 80),
    title: title.slice(0, 140),
    category,
    summary: summary.slice(0, 240),
    content: content.slice(0, 8000),
    createdAt: new Date().toISOString()
  };
  const nextPosts = [post, ...posts];
  if (!persistLocalPosts(nextPosts)) return;

  posts = nextPosts;
  postForm.reset();
  document.querySelector('#form-error').textContent = '';
  postDialog.close();
  resetFilters();
  showToast('História salva neste navegador. Ela não foi enviada nem compartilhada.');
  scrollToPublications();
});

renderPosts();
