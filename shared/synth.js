/* shared/synth.js — Síntesis básica de notas y percusión para Tools_Music
 * Generaliza el patrón synthFallback de bateria.html (osciladores + ruido
 * filtrado con envolventes) y añade síntesis de notas tonales con ADSR.
 * Depende de TMAudio.getCtx (shared/audio.js) pero acepta cualquier contexto.
 * Expone window.TMSynth.
 */
(function (global) {
  'use strict';

  // Frecuencia de una nota MIDI (A4 = 69 = 440 Hz).
  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Genera un AudioBuffer de ruido blanco de la duración dada.
  function noiseBuffer(c, dur) {
    const len = Math.ceil(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // Reproduce una nota tonal con envolvente ADSR sencilla.
  //   freq:  frecuencia en Hz (usa midiToFreq para notas MIDI)
  //   opts: { type='triangle', dur=0.6, gain=0.5, attack=0.01,
  //           decay=0.1, sustain=0.6, release=0.2, dest, ctx }
  function playNote(freq, opts) {
    opts = opts || {};
    const c = opts.ctx || global.TMAudio.getCtx();
    const now = opts.when || c.currentTime;
    const dur = opts.dur == null ? 0.6 : opts.dur;
    const peak = opts.gain == null ? 0.5 : opts.gain;
    const attack = opts.attack == null ? 0.01 : opts.attack;
    const decay = opts.decay == null ? 0.1 : opts.decay;
    const sustain = opts.sustain == null ? 0.6 : opts.sustain;
    const release = opts.release == null ? 0.2 : opts.release;
    const dest = opts.dest || c.destination;

    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = opts.type || 'triangle';
    osc.frequency.value = freq;
    osc.connect(g); g.connect(dest);

    const sustainLevel = peak * sustain;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(peak, now + attack);
    g.gain.exponentialRampToValueAtTime(Math.max(sustainLevel, 0.0001), now + attack + decay);
    const end = now + dur;
    g.gain.setValueAtTime(Math.max(sustainLevel, 0.0001), Math.max(end - release, now + attack + decay));
    g.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.start(now);
    osc.stop(end + 0.02);
    return osc;
  }

  // Reproduce varias frecuencias simultáneas (acorde).
  function playChord(freqs, opts) {
    (freqs || []).forEach(f => playNote(f, opts));
  }

  // Síntesis de percusión (fallback de batería). Conecta a opts.dest o destino.
  //   id ∈ kick|snare|hihat|crash|ride|tom1|tom2|floor
  function playDrum(id, opts) {
    opts = opts || {};
    const c = opts.ctx || global.TMAudio.getCtx();
    const now = opts.when || c.currentTime;
    const out = opts.dest || c.destination;

    if (id === 'kick') {
      const s = c.createOscillator(), g = c.createGain(); s.connect(g); g.connect(out);
      s.frequency.setValueAtTime(100, now); s.frequency.exponentialRampToValueAtTime(30, now + 0.3);
      g.gain.setValueAtTime(1.4, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      s.start(now); s.stop(now + 0.45);
    } else if (id === 'snare') {
      const b = c.createBufferSource(); b.buffer = noiseBuffer(c, 0.2);
      const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1200;
      const g = c.createGain(); b.connect(f); f.connect(g); g.connect(out);
      g.gain.setValueAtTime(0.9, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      b.start(now); b.stop(now + 0.2);
      const o = c.createOscillator(), g2 = c.createGain(); o.connect(g2); g2.connect(out);
      o.frequency.value = 200; g2.gain.setValueAtTime(0.5, now); g2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      o.start(now); o.stop(now + 0.08);
    } else if (id === 'hihat') {
      const b = c.createBufferSource(); b.buffer = noiseBuffer(c, 0.08);
      const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
      const g = c.createGain(); b.connect(f); f.connect(g); g.connect(out);
      g.gain.setValueAtTime(0.6, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      b.start(now); b.stop(now + 0.08);
    } else if (id === 'crash') {
      const b = c.createBufferSource(); b.buffer = noiseBuffer(c, 1.2);
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 5000; f.Q.value = 0.3;
      const g = c.createGain(); b.connect(f); f.connect(g); g.connect(out);
      g.gain.setValueAtTime(0.8, now); g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      b.start(now); b.stop(now + 1.2);
    } else if (id === 'ride') {
      const b = c.createBufferSource(); b.buffer = noiseBuffer(c, 0.9);
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 7000; f.Q.value = 1;
      const g = c.createGain(); b.connect(f); f.connect(g); g.connect(out);
      g.gain.setValueAtTime(0.5, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      b.start(now); b.stop(now + 0.9);
    } else {
      const freq = { tom1: 200, tom2: 150, floor: 100 }[id] || 150;
      const o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(out);
      o.frequency.setValueAtTime(freq, now); o.frequency.exponentialRampToValueAtTime(freq * 0.4, now + 0.25);
      g.gain.setValueAtTime(1.0, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      o.start(now); o.stop(now + 0.35);
    }
  }

  global.TMSynth = { midiToFreq, noiseBuffer, playNote, playChord, playDrum };
})(window);
