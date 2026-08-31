const API_KEY = 'a2f9167784a7eccf1191ea866d2884ae';
const IMG = 'https://image.tmdb.org/t/p/w500';
const mount = document.getElementById('detailMount');
const similarGrid = document.getElementById('similarGrid');

function qs(name){
  return new URLSearchParams(location.search).get(name);
}
function cardTemplate(m){
  const poster = m.poster_path ? `${IMG}${m.poster_path}` : 'https://via.placeholder.com/400x600?text=No+Poster';
  const year = (m.release_date||'').slice(0,4) || '—';
  const rating = m.vote_average ? m.vote_average.toFixed(1) : '—';
  const lang = (m.original_language||'EN').toUpperCase();
  return `
    <a href="moviepage.html?id=${m.id}" class="card" aria-label="${m.title}">
      <img src="${poster}" alt="${m.title}" loading="lazy">
      <div class="card-shade"></div>
      <div class="top-badges">
        <span class="year-pill">${year}</span>
        <span class="rating-pill"><i class="fa-solid fa-star" style="font-size:9px"></i> ${rating}</span>
      </div>
      <div class="card-foot">
        <div class="card-sub"><span>${lang}</span><span class="dot-sep"></span><span>Film</span></div>
        <div class="card-action"><span class="btn-view">View <i class="fa-solid fa-arrow-right" style="font-size:10px"></i></span></div>
      </div>
    </a>
  `;
}

async function loadFilm(){
  const id = qs('id');
  if(!id){
    mount.innerHTML = '<div style="text-align:center;color:var(--muted);padding:40px">No film selected. <a href="index.html" style="text-decoration:underline">Go back</a></div>';
    return;
  }
  try{
    const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&append_to_response=credits`);
    const data = await res.json();
    if(data.success===false){
      mount.innerHTML = '<div style="text-align:center;color:var(--muted);padding:40px">Film not found.</div>';
      return;
    }
    document.title = `${data.title} — Moviedom`;
    const poster = data.poster_path ? `${IMG}${data.poster_path}` : 'https://via.placeholder.com/400x600?text=No+Poster';
    const backdrop = data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : '';
    const genres = (data.genres||[]).map(g=>g.name).join(' • ') || '—';
    const runtime = data.runtime ? `${Math.floor(data.runtime/60)}h ${data.runtime%60}m` : '—';
    const rating = data.vote_average ? data.vote_average.toFixed(1) : '—';
    const year = (data.release_date||'').slice(0,4) || '—';
    const director = (data.credits?.crew||[]).find(c=>c.job==='Director')?.name || '—';
    mount.innerHTML = `
      ${backdrop ? `<div style="height:220px;border-radius:20px;overflow:hidden;border:1px solid var(--border);margin-bottom:18px;background:#111 url(${backdrop}) center/cover no-repeat"></div>` : ''}
      <div class="detail-grid">
        <div class="poster-card"><img src="${poster}" alt="${data.title}"></div>
        <div class="detail-main">
          <div class="detail-eyebrow">${year} • ${data.original_language?.toUpperCase()||'EN'} • ${runtime}</div>
          <h1 class="detail-title">${data.title}</h1>
          <div class="detail-meta">
            <span class="meta-pill">★ ${rating} / 10</span>
            <span class="meta-pill">${genres}</span>
            <span class="meta-pill">${data.status || 'Released'}</span>
          </div>
          <p class="detail-overview">${data.overview || 'No overview available.'}</p>
          <div class="detail-grid-2">
            <div class="info-box"><strong>Director</strong><span>${director}</span></div>
            <div class="info-box"><strong>Release</strong><span>${data.release_date || '—'}</span></div>
            <div class="info-box"><strong>Runtime</strong><span>${runtime}</span></div>
          </div>
          <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">
            <a href="index.html" class="btn-view" style="background:var(--text);color:var(--bg);padding:10px 16px;border-radius:999px;font-weight:700"><i class="fa-solid fa-arrow-left"></i> Back</a>
            <span class="meta-pill" style="display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-clapperboard" style="font-size:12px"></i> TMDB ID: ${data.id}</span>
          </div>
        </div>
      </div>
    `;

    // similar
    try{
      const simRes = await fetch(`https://api.themoviedb.org/3/movie/${id}/similar?api_key=${API_KEY}&page=1`);
      const simData = await simRes.json();
      const sims = (simData.results||[]).slice(0,4);
      if(sims.length){
        similarGrid.innerHTML = sims.map(cardTemplate).join('');
      } else {
        similarGrid.innerHTML = '<div style="color:var(--muted);font-size:13px">No similar titles found.</div>';
      }
    }catch{}
  }catch(e){
    mount.innerHTML = '<div style="text-align:center;color:var(--muted);padding:40px">Failed to load film. Check connection.</div>';
  }
}
loadFilm();

// simple search on detail page redirects to index search
const searchBox = document.getElementById('searchBox');
const searchI = document.getElementById('searchI');
function doSearch(){
  const q = (searchBox.value||'').trim();
  if(!q) return;
  location.href = `index.html?search=${encodeURIComponent(q)}`;
}
searchI?.addEventListener('click', doSearch);
searchBox?.addEventListener('keydown', e=>{ if(e.key==='Enter') doSearch(); });

// support ?search on detail page coming from index? not needed
