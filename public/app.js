(function(){
  function $(id){ return document.getElementById(id); }
  function clear(el){ while(el.firstChild) el.removeChild(el.firstChild); }
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }

  // ---------- clock ----------
  var DAYS = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  var MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
  function pad(n){ return String(n).padStart(2,'0'); }
  function updateClock(){
    var now = new Date();
    $('clockTime').textContent = pad(now.getHours()) + '.' + pad(now.getMinutes()) + '.' + pad(now.getSeconds());
    $('clockDate').textContent = DAYS[now.getDay()] + ', ' + now.getDate() + ' ' + MONTHS[now.getMonth()] + ' ' + now.getFullYear();
  }

  // ---------- render ----------
  function render(cfg){
    document.documentElement.style.setProperty('--accent', cfg.accent || '#C9A15A');
    $('companyName').textContent = cfg.companyName || '';
    $('tagline').textContent = cfg.tagline || '';
    $('liveLabel').textContent = cfg.liveLabel || '';
    $('eventTitle').textContent = cfg.eventTitle || '';
    $('eventDesc').textContent = cfg.eventDesc || '';
    $('eventDate').textContent = cfg.eventDate || '';
    $('eventTime').textContent = cfg.eventTime || '';
    $('eventLocation').textContent = cfg.eventLocation || '';
    $('employeeCount').textContent = cfg.employeeCount || '';
    $('employeeCaption').textContent = cfg.employeeCaption || '';
    $('clientCount').textContent = cfg.clientCount || '';
    $('jobsContact').textContent = cfg.jobsContact || '';
    $('jobsCount').textContent = (cfg.jobs ? cfg.jobs.length : 0) + ' Posisi';
    renderHero(cfg);
    renderJobs(cfg.jobs || []);
    renderKpis(cfg.kpis || []);
    renderTicker(cfg);
  }

  function renderTicker(cfg){
    var ticker = $('ticker');
    var text = (cfg.runningText || '').trim();
    if(!text){
      ticker.style.display = 'none';
      return;
    }
    ticker.style.display = 'flex';
    $('tickerText1').textContent = text;
    $('tickerText2').textContent = text;
    var duration = Math.max(text.length * 0.28, 12);
    $('tickerTrack').style.animationDuration = duration + 's';
  }

  function renderHero(cfg){
    var slot = $('heroMediaSlot');
    clear(slot);
    var hasMedia = cfg.heroAssetId && cfg.heroType !== 'none';
    $('heroPlaceholder').style.display = hasMedia ? 'none' : 'flex';
    if(hasMedia){
      var src = '/uploads/' + cfg.heroAssetId;
      if(cfg.heroType === 'video'){
        var v = document.createElement('video');
        v.src = src; v.autoplay = true; v.muted = true; v.loop = true; v.playsInline = true;
        slot.appendChild(v);
      } else {
        var img = document.createElement('img');
        img.src = src; img.alt = '';
        slot.appendChild(img);
      }
    }
  }

  function renderJobs(jobs){
    var list = $('jobsList');
    clear(list);
    jobs.forEach(function(job){
      var row = el('div', 'job-row row');
      var left = el('div', 'col');
      left.appendChild(el('span', 'job-title', job.title || ''));
      left.appendChild(el('span', 'job-meta', (job.dept || '') + ' · ' + (job.location || '')));
      var badge = el('span', 'job-badge ' + (job.status === 'Baru' ? 'new' : 'open'), job.status || 'Dibuka');
      row.appendChild(left);
      row.appendChild(badge);
      list.appendChild(row);
    });
  }

  function pctNumber(v){
    var n = parseFloat(String(v || '').replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  function appendKpiCompareRow(card, tag, pct){
    var n = pctNumber(pct);
    if(n === null) return;
    var row = el('div', 'kpi-compare-row');
    row.appendChild(el('span', 'kpi-compare-tag', tag));
    var bar = el('div', 'kpi-bar');
    var fill = el('div', 'kpi-bar-fill');
    fill.style.width = Math.max(0, Math.min(100, n)) + '%';
    bar.appendChild(fill);
    row.appendChild(bar);
    row.appendChild(el('span', 'kpi-compare-pct', n + '%'));
    card.appendChild(row);
  }

  function renderKpis(kpis){
    var footer = $('footer');
    clear(footer);
    footer.style.gridTemplateColumns = 'repeat(' + Math.max(kpis.length,1) + ', minmax(0,1fr))';
    kpis.forEach(function(kpi){
      var card = el('div', 'kpi-card' + (kpi.highlight ? ' highlight' : ''));
      card.appendChild(el('span', 'kpi-label label', kpi.label || ''));
      var valWrap = el('div', 'kpi-value');
      valWrap.appendChild(document.createTextNode(kpi.value || ''));
      if(kpi.suffix){ valWrap.appendChild(el('span', 'kpi-suffix', kpi.suffix)); }
      card.appendChild(valWrap);

      if(pctNumber(kpi.ytdPercent) !== null || pctNumber(kpi.fyPercent) !== null){
        var compare = el('div', 'kpi-compare');
        appendKpiCompareRow(compare, 'YTD', kpi.ytdPercent);
        appendKpiCompareRow(compare, 'FY', kpi.fyPercent);
        card.appendChild(compare);
      }

      footer.appendChild(card);
    });
  }

  // ---------- data loading ----------
  function fetchConfig(){
    fetch('/api/config').then(function(r){ return r.json(); }).then(render).catch(function(e){
      console.error('Gagal memuat konfigurasi:', e);
    });
  }

  function connectLive(){
    if(!window.EventSource){
      setInterval(fetchConfig, 15000);
      return;
    }
    var es = new EventSource('/api/events');
    es.onmessage = function(evt){
      try { render(JSON.parse(evt.data)); } catch(e){ console.error(e); }
    };
    es.onerror = function(){
      // browser auto-reconnects EventSource; fall back to polling meanwhile
    };
  }

  updateClock();
  setInterval(updateClock, 1000);
  fetchConfig();
  connectLive();
})();
