const mov = document.querySelector('.mov');
const heroBackdrop = document.getElementById('heroBackdrop');
const heroTitle = document.getElementById('heroTitle');
const heroDesc = document.getElementById('heroDesc');
const heroCard = document.getElementById('heroCard');
const emptyState = document.getElementById('emptyState');
const pageInfo = document.getElementById('pageInfo');
const searchBox = document.getElementById('searchBox');
const searchI = document.getElementById('searchI');

const API_KEY = 'a2f9167784a7eccf1191ea866d2884ae';
const IMG = 'https://image.tmdb.org/t/p/w500';
const BACKDROP = 'https://image.tmdb.org/t/p/original';

let currentPage = 1;
let totalPages = 1;
let currentQuery = '';
let currentGenre = '';

// helpers
function buildUrl({page=1, query='', genre=''}){
  if(query){
    return `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
  }
  if(genre){
    return `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=${genre}&page=${page}&sort_by=popularity.desc`;
  }
  return `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&page=${page}&sort_by=popularity.desc`;
}

function setHero(movie){
  if(!movie) return;
  if(movie.backdrop_path){
    heroBackdrop.style.backgroundImage = `url(${BACKDROP}${movie.backdrop_path})`;
  }
  heroTitle.textContent = movie.title || movie.original_title || 'Stories that stay with you';
  heroDesc.textContent = movie.overview ? movie.overview.slice(0,180) + '…' : 'Hand-picked from thousands of titles. Search, discover and open any film on its own page.';
  // hero card
  const poster = movie.poster_path ? `${IMG}${movie.poster_path}` : 'https://via.placeholder.com/400x600?text=No+Poster';
  heroCard.innerHTML = `
    <img src="${poster}" alt="${movie.title}">
    <div class="hero-card-body">
      <div class="hero-card-title">${movie.title}</div>
      <div class="hero-card-sub">${(movie.release_date||'').slice(0,4)} • ★ ${movie.vote_average?.toFixed(1) || '—'} • ${movie.original_language?.toUpperCase()||''}</div>
      <a href="moviepage.html?id=${movie.id}" class="btn-view" style="margin-top:10px;display:inline-flex">View <i class="fa-solid fa-arrow-right" style="font-size:11px"></i></a>
    </div>
  `;
}

function cardTemplate(movie){
  const poster = movie.poster_path ? `${IMG}${movie.poster_path}` : 'https://via.placeholder.com/400x600?text=No+Poster';
  const year = (movie.release_date||'').slice(0,4) || '—';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '—';
  const lang = (movie.original_language||'EN').toUpperCase();
  return `
    <a href="moviepage.html?id=${movie.id}" class="card" aria-label="${movie.title}">
      <img src="${poster}" alt="${movie.title}" loading="lazy">
      <div class="card-shade"></div>
      <div class="top-badges">
        <span class="year-pill">${year}</span>
        <span class="rating-pill"><i class="fa-solid fa-star" style="font-size:9px"></i> ${rating}</span>
      </div>
      <div class="card-foot">
        <div class="card-sub"><span>${lang}</span><span class="dot-sep"></span><span>Film</span></div>
        <div class="card-action">
          <span class="btn-view">View <i class="fa-solid fa-arrow-right" style="font-size:10px"></i></span>
        </div>
      </div>
    </a>
  `;
}

function getVisiblePages(current, total){
  const pages = [];
  const delta = 2;
  // always show first, last, and window around current
  const range = [];
  for(let i=1;i<=total;i++){
    if(i===1 || i===total || (i>=current-delta && i<=current+delta)){
      range.push(i);
    }
  }
  let last = 0;
  for(const p of range){
    if(last && p - last > 1){
      pages.push('…');
    }
    pages.push(p);
    last = p;
  }
  return pages;
}

function renderPagination(){
  const container = document.getElementById('pageNumbers');
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  if(!container) return;
  // prev/next state
  if(prevBtn) prevBtn.disabled = currentPage <= 1;
  if(nextBtn) nextBtn.disabled = currentPage >= totalPages;

  const visible = getVisiblePages(currentPage, totalPages);
  container.innerHTML = visible.map(p=>{
    if(p==='…') return `<span class="page ellipsis">…</span>`;
    const active = p===currentPage ? ' active' : '';
    return `<button class="page${active}" data-page="${p}">${p}</button>`;
  }).join('');
  container.querySelectorAll('[data-page]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const p = parseInt(btn.getAttribute('data-page'),10);
      load({page:p, query:currentQuery, genre:currentGenre});
    });
  });
}

async function load({page=1, query='', genre='' }={}){
  currentPage = page; currentQuery = query; currentGenre = genre;
  mov.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--muted);padding:40px">Loading…</div>';
  emptyState.hidden = true;
  try{
    const res = await fetch(buildUrl({page, query, genre}));
    const data = await res.json();
    const films = data.results || [];
    totalPages = Math.min(data.total_pages || 1, 500); // TMDB caps at 500
    if(!films.length){
      mov.innerHTML = '';
      emptyState.hidden = false;
      pageInfo.textContent = 'No results';
      renderPagination();
      return;
    }
    if(page===1 && !query && !genre && films[0]){
      setHero(films[0]);
    }
    mov.innerHTML = films.map(cardTemplate).join('');
    const label = query ? `Search “${query}”` : genre ? `Genre` : 'Discover';
    pageInfo.textContent = `Page ${page} of ${totalPages} • ${label} • ${films.length} titles`;
    renderPagination();
    window.scrollTo({top: document.querySelector('.movie-panel').offsetTop - 80, behavior:'smooth'});
  }catch(err){
    mov.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--muted);padding:40px">Failed to load. Check your connection.</div>`;
  }
}

// initial — respect ?search= from detail page
const urlParams = new URLSearchParams(location.search);
const initSearch = urlParams.get('search');
if(initSearch){
  searchBox.value = initSearch;
  load({page:1, query:initSearch});
} else {
  load({page:1});
}

// pagination — dynamic prev/next
document.getElementById('prevPage')?.addEventListener('click', ()=>{
  if(currentPage>1) load({page:currentPage-1, query:currentQuery, genre:currentGenre});
});
document.getElementById('nextPage')?.addEventListener('click', ()=>{
  if(currentPage<totalPages) load({page:currentPage+1, query:currentQuery, genre:currentGenre});
});

// search
function doSearch(){
  const q = searchBox.value.trim();
  if(!q) return load({page:1});
  load({page:1, query:q});
}
searchI.addEventListener('click', doSearch);
searchBox.addEventListener('keydown', e=>{ if(e.key==='Enter') doSearch(); });

// genre pills + dropdown
document.querySelectorAll('[data-genre]').forEach(btn=>{
  btn.addEventListener('click', (e)=>{
    const g = e.currentTarget.getAttribute('data-genre');
    // update pills active
    document.querySelectorAll('.genre-pills .pill').forEach(p=>p.classList.remove('active'));
    const pill = document.querySelector(`.genre-pills .pill[data-genre="${g}"]`);
    if(pill) pill.classList.add('active');
    load({page:1, genre:g});
    // close dropdown
    document.querySelector('.dropdown')?.classList.remove('show');
    const navBtn = document.querySelector('.nav-btn');
    if(navBtn) navBtn.setAttribute('aria-expanded','false');
  });
});

// dropdown toggle
const moviesBtn = document.querySelector('.movies') || document.querySelector('.nav-btn');
const movieDropdown = document.querySelector('.movie') || document.querySelector('.dropdown');
if(moviesBtn && movieDropdown){
  // new markup uses .nav-btn and .dropdown, old used .movies/.movie — support both
  const toggle = document.querySelector('.nav-btn');
  if(toggle){
    toggle.addEventListener('click', (e)=>{
      e.stopPropagation();
      const dd = document.querySelector('.dropdown');
      const show = dd.classList.toggle('show');
      toggle.setAttribute('aria-expanded', String(show));
    });
  }
}
document.addEventListener('click', (e)=>{
  const dd = document.querySelector('.dropdown');
  const btn = document.querySelector('.nav-btn');
  if(dd && btn && !e.target.closest('.has-dropdown')){
    dd.classList.remove('show');
    btn.setAttribute('aria-expanded','false');
  }
});

// mobile nav
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
if(menuToggle && mainNav){
  menuToggle.addEventListener('click', ()=> mainNav.classList.toggle('open'));
}
