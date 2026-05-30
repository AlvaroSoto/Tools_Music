/* shared/audio.js — Núcleo de audio reutilizable para Tools_Music
 * Extraído de bateria.html: AudioContext, carga de samples,
 * exportación WAV (render offline con loop perfecto) y bufferToWav.
 * Sin dependencias. Expone window.TMAudio.
 */
(function (global) {
  'use strict';

  const AC = global.AudioContext || global.webkitAudioContext;
  let actx = null;

  // Devuelve un AudioContext único, reanudándolo si está suspendido.
  function getCtx() {
    if (!actx) actx = new AC();
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }

  // Carga y decodifica un sample de audio desde una URL.
  async function loadSample(url, ctx) {
    const c = ctx || getCtx();
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const arr = await resp.arrayBuffer();
    return await c.decodeAudioData(arr);
  }

  // Carga un mapa { id: url } y devuelve { buffers, ok, total }.
  // onProgress(id, success, loaded, total) se llama por cada item.
  async function loadSamples(map, onProgress) {
    const c = getCtx();
    const ids = Object.keys(map);
    const buffers = {};
    let loaded = 0, ok = 0;
    for (const id of ids) {
      try {
        buffers[id] = await loadSample(map[id], c);
        ok++;
        if (onProgress) onProgress(id, true, ++loaded, ids.length);
      } catch (e) {
        console.error('Failed to load', id, e);
        buffers[id] = null;
        if (onProgress) onProgress(id, false, ++loaded, ids.length);
      }
    }
    return { buffers, ok, total: ids.length };
  }

  // Reproduce un AudioBuffer en el destino con ganancia opcional.
  function playBuffer(buffer, ctx, when, gain) {
    const c = ctx || getCtx();
    if (!buffer) return;
    when = when || c.currentTime;
    const src = c.createBufferSource();
    src.buffer = buffer;
    const g = c.createGain();
    g.gain.value = (gain == null) ? 1.0 : gain;
    src.connect(g);
    g.connect(c.destination);
    src.start(when);
    return src;
  }

  // Serializa un AudioBuffer (o un objeto compatible getChannelData/length/
  // numberOfChannels/sampleRate) a un Blob WAV PCM 16-bit.
  function bufferToWav(buffer) {
    const nCh = buffer.numberOfChannels, sr = buffer.sampleRate, len = buffer.length * nCh * 2;
    const ab = new ArrayBuffer(44 + len), view = new DataView(ab);
    const ws = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
    ws(0, 'RIFF'); view.setUint32(4, 36 + len, true); ws(8, 'WAVE');
    ws(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, nCh, true); view.setUint32(24, sr, true);
    view.setUint32(28, sr * nCh * 2, true); view.setUint16(32, nCh * 2, true);
    view.setUint16(34, 16, true); ws(36, 'data'); view.setUint32(40, len, true);
    let off = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < nCh; ch++) {
        const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
        view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true); off += 2;
      }
    }
    return new Blob([ab], { type: 'audio/wav' });
  }

  // Renderiza un loop perfecto fuera de línea.
  //   loopDur:   duración musical exacta del loop (segundos)
  //   schedule(offCtx): coloca las fuentes en el contexto offline
  //   opts: { sampleRate=44100, tailExtra=3.0, channels=2 }
  // Las colas (decays) posteriores a loopDur se "envuelven" al inicio para
  // que el archivo encadene sin costuras al reproducirse en bucle.
  async function renderLoop(loopDur, schedule, opts) {
    opts = opts || {};
    const sr = opts.sampleRate || 44100;
    const tailExtra = opts.tailExtra == null ? 3.0 : opts.tailExtra;
    const channels = opts.channels || 2;
    const renderDur = loopDur + tailExtra;
    const offCtx = new OfflineAudioContext(channels, Math.ceil(sr * renderDur), sr);

    schedule(offCtx);

    const rendered = await offCtx.startRendering();
    const loopSamples = Math.round(sr * loopDur);
    const out = [];
    for (let ch = 0; ch < rendered.numberOfChannels; ch++) {
      const data = rendered.getChannelData(ch);
      const buf = new Float32Array(loopSamples);
      for (let i = 0; i < loopSamples; i++) buf[i] = data[i] || 0;
      for (let i = loopSamples; i < data.length; i++) buf[i % loopSamples] += data[i];
      out.push(buf);
    }
    return {
      numberOfChannels: out.length,
      sampleRate: sr,
      length: loopSamples,
      getChannelData: (ch) => out[ch]
    };
  }

  // Dispara la descarga de un Blob con el nombre dado.
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  global.TMAudio = {
    getCtx, loadSample, loadSamples, playBuffer,
    bufferToWav, renderLoop, downloadBlob
  };
})(window);
