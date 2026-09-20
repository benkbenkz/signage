(function(){
  function $(id){ return document.getElementById(id); }
  function clear(el){ while(el.firstChild) el.removeChild(el.firstChild); }
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }

  var editing = null;

  function deepClone(o){ return JSON.parse(JSON.stringify(o)); }

  // ---------- API helpers ----------
  function api(path, opts){
    opts = opts || {};
    opts.headers = Object.assign({}, opts.headers);
    if(opts.body && typeof opts.body === 'string'){
      opts.headers['Content-Type'] = 'application/json';
    }
    return fetch(path, opts).then(function(res){
      if(!res.ok){
        return res.json().catch(function(){ return {}; }).then(function(err){
          throw new Error(err.error || ('Permintaan gagal (' + res.status + ')'));
        });
      }
      return res.json();
    });
  }

  // ---------- auth ----------
  function showLogin(){
    $('loginScreen').style.display = 'flex';
    $('dashboard').style.display = 'none';
  }
  function showDashboard(){
    $('loginScreen').style.display = 'none';
    $('dashboard').style.display = 'flex';
    loadConfig();
  }

  function checkAuth(){
    api('/api/auth/me').then(function(res){
      if(res.loggedIn) showDashboard(); else showLogin();
    }).catch(showLogin);
  }

  $('loginBtn').onclick = function(){
    var username = $('loginUsername').value;
    var password = $('loginPassword').value;
    $('loginError').style.display = 'none';
    api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: username, password: password }) })
      .then(function(){ $('loginPassword').value = ''; showDashboard(); })
      .catch(function(e){
        $('loginError').textContent = e.message;
        $('loginError').style.display = 'block';
      });
  };
  ['loginUsername','loginPassword'].forEach(function(id){
    $(id).addEventListener('keydown', function(e){ if(e.key === 'Enter') $('loginBtn').click(); });
  });

  $('logoutBtn').onclick = function(){
    api('/api/auth/logout', { method: 'POST' }).then(showLogin).catch(showLogin);
  };

  // ---------- form <-> config ----------
  function loadConfig(){
    api('/api/config').then(function(cfg){
      editing = cfg;
      populateForm();
    }).catch(function(e){ alert('Gagal memuat konfigurasi: ' + e.message); });
  }

  function populateForm(){
    $('f_companyName').value = editing.companyName || '';
    $('f_tagline').value = editing.tagline || '';
    $('f_accent').value = editing.accent || '#C9A15A';
    $('f_liveLabel').value = editing.liveLabel || '';
    $('f_eventTitle').value = editing.eventTitle || '';
    $('f_eventDesc').value = editing.eventDesc || '';
    $('f_eventDate').value = editing.eventDate || '';
    $('f_eventTime').value = editing.eventTime || '';
    $('f_eventLocation').value = editing.eventLocation || '';
    $('f_employeeCount').value = editing.employeeCount || '';
    $('f_clientCount').value = editing.clientCount || '';
    $('f_employeeCaption').value = editing.employeeCaption || '';
    $('f_jobsContact').value = editing.jobsContact || '';
    if(!editing.jobs) editing.jobs = [];
    if(!editing.kpis) editing.kpis = [];
    renderHeroPreview();
    renderJobsEditor();
    renderKpisEditor();
  }

  function collectForm(){
    editing.companyName = $('f_companyName').value;
    editing.tagline = $('f_tagline').value;
    editing.accent = $('f_accent').value;
    editing.liveLabel = $('f_liveLabel').value;
    editing.eventTitle = $('f_eventTitle').value;
    editing.eventDesc = $('f_eventDesc').value;
    editing.eventDate = $('f_eventDate').value;
    editing.eventTime = $('f_eventTime').value;
    editing.eventLocation = $('f_eventLocation').value;
    editing.employeeCount = $('f_employeeCount').value;
    editing.clientCount = $('f_clientCount').value;
    editing.employeeCaption = $('f_employeeCaption').value;
    editing.jobsContact = $('f_jobsContact').value;
  }

  // ---------- hero media ----------
  function renderHeroPreview(){
    var box = $('heroPreviewBox');
    clear(box);
    if(editing.heroAssetId && editing.heroType !== 'none'){
      var src = '/uploads/' + editing.heroAssetId;
      if(editing.heroType === 'video'){
        var v = document.createElement('video');
        v.src = src; v.muted = true; v.autoplay = true; v.loop = true; v.playsInline = true;
        box.appendChild(v);
      } else {
        var img = document.createElement('img');
        img.src = src;
        box.appendChild(img);
      }
    } else {
      box.textContent = 'Belum ada media';
    }
  }

  $('uploadHeroBtn').onclick = function(){ $('heroFileInput').click(); };
  $('removeHeroBtn').onclick = function(){
    editing.heroAssetId = null;
    editing.heroType = 'none';
    renderHeroPreview();
  };
  $('heroFileInput').onchange = function(){
    var file = this.files[0];
    this.value = '';
    if(!file) return;
    var formData = new FormData();
    formData.append('file', file);
    fetch('/api/upload', { method: 'POST', body: formData }).then(function(res){
      if(!res.ok) return res.json().then(function(err){ throw new Error(err.error || 'Unggah gagal'); });
      return res.json();
    }).then(function(result){
      editing.heroAssetId = result.id;
      editing.heroType = result.contentType && result.contentType.indexOf('video') === 0 ? 'video' : 'image';
      renderHeroPreview();
    }).catch(function(e){
      alert('Gagal mengunggah media: ' + e.message);
    });
  };

  // ---------- jobs editor ----------
  function renderJobsEditor(){
    var wrap = $('jobsEditorList');
    clear(wrap);
    editing.jobs.forEach(function(job, idx){
      var item = el('div', 'repeat-item');
      var head = el('div', 'repeat-item-head');
      var rm = el('button', 'btn small ghost', 'Hapus');
      rm.type = 'button';
      rm.onclick = function(){ editing.jobs.splice(idx,1); renderJobsEditor(); };
      head.appendChild(rm);
      item.appendChild(head);

      var g1 = el('div', 'fgroup');
      g1.appendChild(el('label', null, 'Nama Posisi'));
      var titleInput = document.createElement('input');
      titleInput.type = 'text'; titleInput.value = job.title || '';
      titleInput.oninput = function(){ job.title = titleInput.value; };
      g1.appendChild(titleInput);
      item.appendChild(g1);

      var r3 = el('div', 'row3');
      var deptInput = document.createElement('input');
      deptInput.type = 'text'; deptInput.placeholder = 'Departemen'; deptInput.value = job.dept || '';
      deptInput.oninput = function(){ job.dept = deptInput.value; };
      var locInput = document.createElement('input');
      locInput.type = 'text'; locInput.placeholder = 'Lokasi'; locInput.value = job.location || '';
      locInput.oninput = function(){ job.location = locInput.value; };
      var statusSelect = document.createElement('select');
      ['Baru','Dibuka'].forEach(function(s){
        var opt = document.createElement('option'); opt.value = s; opt.textContent = s;
        if(job.status === s) opt.selected = true;
        statusSelect.appendChild(opt);
      });
      statusSelect.onchange = function(){ job.status = statusSelect.value; };
      r3.appendChild(deptInput); r3.appendChild(locInput); r3.appendChild(statusSelect);
      item.appendChild(r3);

      wrap.appendChild(item);
    });
  }

  $('addJobBtn').onclick = function(){
    editing.jobs.push({ title: '[Nama Posisi]', dept: '[Departemen]', location: '[Lokasi]', status: 'Dibuka' });
    renderJobsEditor();
  };

  // ---------- kpis editor ----------
  function renderKpisEditor(){
    var wrap = $('kpisEditorList');
    clear(wrap);
    editing.kpis.forEach(function(kpi, idx){
      var item = el('div', 'repeat-item');
      var head = el('div', 'repeat-item-head');
      var rm = el('button', 'btn small ghost', 'Hapus');
      rm.type = 'button';
      rm.onclick = function(){ editing.kpis.splice(idx,1); renderKpisEditor(); };
      head.appendChild(rm);
      item.appendChild(head);

      var g1 = el('div', 'fgroup');
      g1.appendChild(el('label', null, 'Label'));
      var labelInput = document.createElement('input');
      labelInput.type = 'text'; labelInput.value = kpi.label || '';
      labelInput.oninput = function(){ kpi.label = labelInput.value; };
      g1.appendChild(labelInput);
      item.appendChild(g1);

      var r3 = el('div', 'row3');
      var valInput = document.createElement('input');
      valInput.type = 'text'; valInput.placeholder = 'Nilai'; valInput.value = kpi.value || '';
      valInput.oninput = function(){ kpi.value = valInput.value; };
      var sufInput = document.createElement('input');
      sufInput.type = 'text'; sufInput.placeholder = 'Satuan'; sufInput.value = kpi.suffix || '';
      sufInput.oninput = function(){ kpi.suffix = sufInput.value; };
      var hlWrap = document.createElement('label');
      hlWrap.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-dim);text-transform:none;font-weight:600;';
      var hlInput = document.createElement('input');
      hlInput.type = 'checkbox'; hlInput.checked = !!kpi.highlight;
      hlInput.onchange = function(){ kpi.highlight = hlInput.checked; };
      hlWrap.appendChild(hlInput);
      hlWrap.appendChild(document.createTextNode('Sorot'));
      r3.appendChild(valInput); r3.appendChild(sufInput); r3.appendChild(hlWrap);
      item.appendChild(r3);

      wrap.appendChild(item);
    });
  }

  $('addKpiBtn').onclick = function(){
    editing.kpis.push({ label: 'Label KPI', value: '0', suffix: '', highlight: false });
    renderKpisEditor();
  };

  // ---------- save ----------
  $('saveBtn').onclick = function(){
    collectForm();
    $('saveStatus').textContent = 'Menyimpan...';
    api('/api/config', { method: 'PUT', body: JSON.stringify(editing) })
      .then(function(saved){
        editing = saved;
        $('saveStatus').textContent = 'Tersimpan';
        setTimeout(function(){ $('saveStatus').textContent = ''; }, 2000);
        var frame = $('previewFrame');
        frame.src = frame.src; // reload preview to reflect immediately
      })
      .catch(function(e){
        $('saveStatus').textContent = '';
        alert('Gagal menyimpan: ' + e.message);
      });
  };

  checkAuth();
})();
