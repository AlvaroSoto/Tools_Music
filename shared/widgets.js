(function() {
  'use strict';

  // --- Dependency Loader ---
  function loadScript(src) {
    return new Promise((resolve) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      document.body.appendChild(s);
    });
  }

  // --- Widget Container & CSS ---
  const style = document.createElement('style');
  style.textContent = `
    .tm-widget-panel {
      position: fixed;
      z-index: 2000;
      background: var(--tm-panel);
      border: 1px solid var(--tm-overlay-15);
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      padding: 20px;
      display: none;
      flex-direction: column;
      box-sizing: border-box;
      font-family: 'Space Mono', monospace;
      color: var(--tm-text);
      /* Desktop defaults */
      bottom: 20px;
      right: 20px;
      width: 320px;
      max-height: calc(100vh - 90px);
      overflow-y: auto;
    }
    .tm-widget-panel.open { display: flex; }
    
    .tm-widget-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--tm-overlay-10); padding-bottom: 10px; }
    .tm-widget-title { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 3px; color: var(--tm-color-white); }
    .tm-widget-close { background: none; border: none; color: var(--tm-muted); font-size: 20px; cursor: pointer; }
    .tm-widget-close:hover { color: var(--tm-accent); }

    @media (max-width: 600px) {
      .tm-widget-panel {
        bottom: 0; right: 0; left: 0; width: 100%;
        border-radius: 20px 20px 0 0;
        border-bottom: none;
        border-left: none;
        border-right: none;
      }
    }

    /* Metronome Styles */
    .w-bpm-display { text-align:center; margin:0 0 14px; }
    .w-bpm-num { font-family:'Bebas Neue',sans-serif; font-size:72px; line-height:1; color:var(--tm-color-white); letter-spacing:2px; }
    .w-bpm-unit { font-size:11px; color:var(--tm-muted); letter-spacing:2px; }
    .w-bpm-row { display:flex; align-items:center; justify-content:center; gap:12px; margin-bottom:14px; }
    .w-bpm-row input[type=range] { flex:1; accent-color:var(--tm-accent); }
    .w-beats { display:flex; justify-content:center; gap:8px; margin:14px 0; flex-wrap:wrap; }
    .w-beat-dot { width:22px; height:22px; border-radius:50%; background:var(--tm-panel-2); border:1px solid var(--tm-overlay-15); transition:transform 0.05s, background 0.05s; cursor:pointer; }
    .w-beat-dot.accent { border-color:var(--tm-accent); }
    .w-beat-dot.on { background:var(--tm-color-white); transform:scale(1.3); }
    .w-beat-dot.accent.on { background:var(--tm-accent); box-shadow:0 0 10px rgba(231,76,60,0.6); }
    .w-opt-grid { display:flex; gap:10px; flex-wrap:wrap; justify-content:center; font-size:10px; color:var(--tm-muted); margin-bottom:14px; }
    .w-opt-grid select { background:var(--tm-panel-2); color:var(--tm-text); border:0.5px solid var(--tm-overlay-18); border-radius:6px; padding:4px 6px; font-family:'Space Mono',monospace; font-size:11px; }
    .w-big-play { display:block; margin:0 auto; width:100%; padding:10px 0; font-size:12px; }
    .w-tap-btn { display:block; margin:10px auto 0; font-size:10px; padding:6px 14px; }

    /* Tuner Styles */
    .w-note-big { font-family:'Bebas Neue',sans-serif; font-size:96px; line-height:1; color:var(--tm-muted); letter-spacing:2px; margin:6px 0; transition:color 0.15s; text-align:center;}
    .w-note-big.intune { color:var(--tm-ok); }
    .w-freq-line { font-size:11px; color:#777; letter-spacing:1px; text-align:center;}
    .w-target { font-size:10px; color:var(--tm-muted); margin-top:4px; text-align:center;}
    .w-meter { position:relative; height:60px; margin:20px 0 8px; }
    .w-meter-bar { position:absolute; top:25px; left:0; right:0; height:6px; background:var(--tm-panel-2); border-radius:3px; }
    .w-meter-center { position:absolute; top:15px; left:50%; width:2px; height:26px; background:var(--tm-ok); transform:translateX(-1px); }
    .w-meter-needle { position:absolute; top:8px; left:50%; width:4px; height:40px; background:var(--tm-accent); border-radius:2px; transition:left 0.08s, background 0.1s; transform:translateX(-2px); }
    .w-meter-needle.intune { background:var(--tm-ok); }
    .w-scale-marks { position:absolute; top:36px; left:0; right:0; display:flex; justify-content:space-between; font-size:9px; color:var(--tm-muted); }
    .w-cents { font-size:11px; color:var(--tm-muted); letter-spacing:1px; min-height:16px; text-align:center;}
    .w-status { font-size:10px; color:var(--tm-muted); margin-top:14px; min-height:16px; letter-spacing:1px; text-align:center;}
    .w-a4row { font-size:10px; color:var(--tm-muted); margin-top:18px; text-align:center;}
    .w-a4row input { width:50px; background:var(--tm-panel-2); color:var(--tm-text); border:0.5px solid var(--tm-overlay-18); border-radius:5px; padding:3px 6px; font-family:'Space Mono',monospace; text-align:center; }
  `;
  document.head.appendChild(style);

  // --- HTML Injection ---
  const container = document.createElement('div');
  container.innerHTML = `
    <!-- Metronome Widget -->
    <div id="w-metro-panel" class="tm-widget-panel">
      <div class="tm-widget-header">
        <div class="tm-widget-title"><i class="ti ti-metronome"></i> METRÓNOMO</div>
        <button class="tm-widget-close" id="w-metro-close"><i class="ti ti-x"></i></button>
      </div>
      <div class="w-bpm-display">
        <div class="w-bpm-num" id="w-bpmNum">120</div>
        <div class="w-bpm-unit">BPM</div>
      </div>
      <div class="w-bpm-row">
        <button class="tm-step-btn" id="w-bpmDown">&minus;</button>
        <input type="range" min="30" max="300" value="120" id="w-bpmSlider" step="1">
        <button class="tm-step-btn" id="w-bpmUp">+</button>
      </div>
      <div class="w-opt-grid">
        <label>Compás:
          <select id="w-meterSel">
            <option value="2">2/4</option><option value="3">3/4</option><option value="4" selected>4/4</option>
            <option value="5">5/4</option><option value="6">6/8</option><option value="7">7/8</option>
          </select>
        </label>
        <label>Div:
          <select id="w-subSel">
            <option value="1" selected>1x</option><option value="2">2x</option><option value="3">3x</option><option value="4">4x</option>
          </select>
        </label>
      </div>
      <div class="w-beats" id="w-beats"></div>
      <button class="tm-btn w-big-play accent" id="w-metroPlay"><i class="ti ti-player-play"></i> INICIAR</button>
      <button class="tm-btn w-tap-btn" id="w-tapBtn"><i class="ti ti-hand-finger"></i> TAP TEMPO</button>
    </div>

    <!-- Tuner Widget -->
    <div id="w-tuner-panel" class="tm-widget-panel">
      <div class="tm-widget-header">
        <div class="tm-widget-title"><i class="ti ti-microphone"></i> AFINADOR</div>
        <button class="tm-widget-close" id="w-tuner-close"><i class="ti ti-x"></i></button>
      </div>
      <div class="w-note-big" id="w-noteName">—</div>
      <div class="w-freq-line" id="w-freqLine">&nbsp;</div>
      <div class="w-target" id="w-targetLine">&nbsp;</div>
      <div class="w-meter">
        <div class="w-meter-bar"></div>
        <div class="w-meter-center"></div>
        <div class="w-meter-needle" id="w-needle"></div>
        <div class="w-scale-marks"><span>-50</span><span>-25</span><span>0</span><span>+25</span><span>+50</span></div>
      </div>
      <div class="w-cents" id="w-centsLine">&nbsp;</div>
      <button class="tm-btn accent w-big-play" style="margin-top:14px;" id="w-tunerStart"><i class="ti ti-microphone"></i> ACTIVAR MICRÓFONO</button>
      <div class="w-status" id="w-status">Pulsa para afinar</div>
      <div class="w-a4row">A4: <input type="number" id="w-a4" value="440" min="400" max="480" step="1"> Hz</div>
    </div>
  `;
  document.body.appendChild(container);

  // --- Toggle Logic ---
  const mBtn = document.getElementById('tm-widget-metronome');
  const tBtn = document.getElementById('tm-widget-tuner');
  const mPanel = document.getElementById('w-metro-panel');
  const tPanel = document.getElementById('w-tuner-panel');

  if(mBtn) mBtn.addEventListener('click', () => { mPanel.classList.toggle('open'); tPanel.classList.remove('open'); initMetronome(); });
  if(tBtn) tBtn.addEventListener('click', () => { tPanel.classList.toggle('open'); mPanel.classList.remove('open'); initTuner(); });
  
  document.getElementById('w-metro-close').addEventListener('click', () => mPanel.classList.remove('open'));
  document.getElementById('w-tuner-close').addEventListener('click', () => tPanel.classList.remove('open'));

  // --- Metronome Logic ---
  let metroInited = false;
  async function initMetronome() {
    if(metroInited) return;
    await loadScript('./shared/audio.js');
    metroInited = true;

    const A = window.TMAudio;
    let bpm = 120, meter = 4, sub = 1;
    let playing = false, timer = null;
    let beatIndex = 0, subIndex = 0;

    function click(accent, when){
      const c = A.getCtx();
      when = when || c.currentTime;
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.frequency.value = accent ? 1800 : 1000;
      const peak = accent ? 0.9 : 0.4;
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(peak, when+0.001);
      g.gain.exponentialRampToValueAtTime(0.0001, when+0.05);
      o.start(when); o.stop(when+0.06);
    }

    function buildBeats(){
      const wrap = document.getElementById('w-beats');
      wrap.innerHTML = '';
      for(let i=0;i<meter;i++){
        const d = document.createElement('div');
        d.className = 'w-beat-dot' + (i===0?' accent':'');
        d.dataset.i = i;
        d.addEventListener('click', ()=> d.classList.toggle('accent'));
        wrap.appendChild(d);
      }
    }

    function flash(i){
      document.querySelectorAll('.w-beat-dot').forEach(d=>d.classList.remove('on'));
      const el = document.querySelector('.w-beat-dot[data-i="'+i+'"]');
      if(el){ el.classList.add('on'); setTimeout(()=>el.classList.remove('on'), 90); }
    }

    function tick(){
      const c = A.getCtx();
      const isBeat = (subIndex === 0);
      const dot = document.querySelector('.w-beat-dot[data-i="'+beatIndex+'"]');
      const isAccent = isBeat && dot && dot.classList.contains('accent');
      if(isBeat){ click(isAccent, c.currentTime); flash(beatIndex); }
      else { click(false, c.currentTime); }
      subIndex++;
      if(subIndex >= sub){ subIndex = 0; beatIndex = (beatIndex + 1) % meter; }
    }

    function start(){
      playing = true; beatIndex = 0; subIndex = 0;
      const btn = document.getElementById('w-metroPlay');
      btn.innerHTML = '<i class="ti ti-player-stop"></i> DETENER';
      btn.classList.add('playing');
      tick();
      timer = setInterval(tick, (60/bpm/sub)*1000);
    }
    function stop(){
      playing = false; clearInterval(timer);
      const btn = document.getElementById('w-metroPlay');
      btn.innerHTML = '<i class="ti ti-player-play"></i> INICIAR';
      btn.classList.remove('playing');
      document.querySelectorAll('.w-beat-dot').forEach(d=>d.classList.remove('on'));
    }
    function restart(){ if(playing){ clearInterval(timer); timer=setInterval(tick,(60/bpm/sub)*1000); } }

    function setBpm(v){
      bpm = Math.max(30, Math.min(300, v|0));
      document.getElementById('w-bpmNum').textContent = bpm;
      document.getElementById('w-bpmSlider').value = bpm;
      restart();
    }

    document.getElementById('w-bpmSlider').addEventListener('input', function(){ setBpm(parseInt(this.value)); });
    document.getElementById('w-bpmDown').addEventListener('click', ()=>setBpm(bpm-1));
    document.getElementById('w-bpmUp').addEventListener('click', ()=>setBpm(bpm+1));
    document.getElementById('w-meterSel').addEventListener('change', function(){ meter=parseInt(this.value); buildBeats(); if(playing){ beatIndex=0; subIndex=0; } });
    document.getElementById('w-subSel').addEventListener('change', function(){ sub=parseInt(this.value); subIndex=0; restart(); });
    document.getElementById('w-metroPlay').addEventListener('click', ()=>{ if(playing) stop(); else start(); });

    let taps = [];
    document.getElementById('w-tapBtn').addEventListener('click', ()=>{
      const now = performance.now();
      taps = taps.filter(t => now - t < 2000);
      taps.push(now);
      if(taps.length >= 2){
        let sum = 0;
        for(let i=1;i<taps.length;i++) sum += taps[i]-taps[i-1];
        setBpm(Math.round(60000/(sum/(taps.length-1))));
      }
    });

    buildBeats();
  }

  // --- Tuner Logic ---
  let tunerInited = false;
  async function initTuner() {
    if(tunerInited) return;
    await loadScript('./shared/theory.js');
    tunerInited = true;

    const T = window.TMTheory;
    let actx = null, analyser = null, stream = null, rafId = null, running = false;
    let a4 = 440;
    const buf = new Float32Array(2048);

    function autoCorrelate(buffer, sampleRate){
      const SIZE = buffer.length;
      let rms = 0;
      for(let i=0;i<SIZE;i++){ rms += buffer[i]*buffer[i]; }
      rms = Math.sqrt(rms/SIZE);
      if(rms < 0.01) return -1;
      let r1=0, r2=SIZE-1, thres=0.2;
      for(let i=0;i<SIZE/2;i++){ if(Math.abs(buffer[i])<thres){ r1=i; break; } }
      for(let i=1;i<SIZE/2;i++){ if(Math.abs(buffer[SIZE-i])<thres){ r2=SIZE-i; break; } }
      const b = buffer.slice(r1, r2);
      const n = b.length;
      const c = new Array(n).fill(0);
      for(let i=0;i<n;i++) for(let j=0;j<n-i;j++) c[i] += b[j]*b[j+i];
      let d=0; while(d<n-1 && c[d]>c[d+1]) d++;
      let maxval=-1, maxpos=-1;
      for(let i=d;i<n;i++){ if(c[i]>maxval){ maxval=c[i]; maxpos=i; } }
      let t0 = maxpos;
      if(t0<=0) return -1;
      const x1=c[t0-1]||0, x2=c[t0], x3=c[t0+1]||0;
      const a=(x1+x3-2*x2)/2, bb=(x3-x1)/2;
      if(a) t0 = t0 - bb/(2*a);
      return sampleRate/t0;
    }

    function update(){
      if(!running) return;
      analyser.getFloatTimeDomainData(buf);
      const freq = autoCorrelate(buf, actx.sampleRate);
      if(freq > 0 && freq < 2000){
        const midiF = 69 + 12*Math.log2(freq/a4);
        const midi = Math.round(midiF);
        const cents = Math.round((midiF - midi) * 100);
        const name = T.midiToName(midi, false);
        document.getElementById('w-noteName').textContent = name.replace(/(\d+)$/,'');
        document.getElementById('w-freqLine').textContent = freq.toFixed(1)+' Hz';
        document.getElementById('w-targetLine').textContent = 'objetivo '+name+' · '+T.midiToFreq(midi).toFixed(1)+' Hz';
        const intune = Math.abs(cents) <= 5;
        document.getElementById('w-centsLine').textContent = (cents>0?'+':'')+cents+' cents'+(intune?'  ✓':'');
        const needle = document.getElementById('w-needle');
        needle.style.left = (50 + Math.max(-50, Math.min(50, cents))) + '%';
        needle.classList.toggle('intune', intune);
        document.getElementById('w-noteName').classList.toggle('intune', intune);
      }
      rafId = requestAnimationFrame(update);
    }

    async function startMic(){
      try {
        document.getElementById('w-status').textContent = 'Solicitando micro...';
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation:false, noiseSuppression:false, autoGainControl:false } });
        actx = new (window.AudioContext||window.webkitAudioContext)();
        const src = actx.createMediaStreamSource(stream);
        analyser = actx.createAnalyser();
        analyser.fftSize = 2048;
        src.connect(analyser);
        running = true;
        document.getElementById('w-status').textContent = 'Escuchando...';
        const btn = document.getElementById('w-tunerStart');
        btn.innerHTML = '<i class="ti ti-microphone-off"></i> DETENER';
        btn.classList.add('playing');
        update();
      } catch(e){
        document.getElementById('w-status').textContent = 'Error: ' + e.name;
      }
    }

    function stopMic(){
      running = false;
      if(rafId) cancelAnimationFrame(rafId);
      if(stream) stream.getTracks().forEach(t=>t.stop());
      if(actx) actx.close();
      stream = actx = analyser = null;
      const btn = document.getElementById('w-tunerStart');
      btn.innerHTML = '<i class="ti ti-microphone"></i> ACTIVAR MICRÓFONO';
      btn.classList.remove('playing');
      document.getElementById('w-status').textContent = 'Detenido';
      document.getElementById('w-noteName').textContent = '—';
      document.getElementById('w-noteName').classList.remove('intune');
      document.getElementById('w-needle').style.left = '50%';
    }

    document.getElementById('w-tunerStart').addEventListener('click', ()=>{ if(running) stopMic(); else startMic(); });
    document.getElementById('w-a4').addEventListener('change', function(){ a4 = parseInt(this.value)||440; });
  }

})();
