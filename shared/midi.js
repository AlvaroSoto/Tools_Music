/* shared/midi.js — Escritor mínimo de archivos MIDI (SMF tipo 0) para Tools_Music
 * Sin dependencias. Genera un Blob .mid a partir de una lista de notas.
 * Expone window.TMMidi.
 */
(function (global) {
  'use strict';

  // Codifica un entero como "variable-length quantity" (formato MIDI).
  function vlq(value) {
    const bytes = [value & 0x7f];
    value >>= 7;
    while (value > 0) {
      bytes.unshift((value & 0x7f) | 0x80);
      value >>= 7;
    }
    return bytes;
  }

  function pushU16(arr, v) { arr.push((v >> 8) & 0xff, v & 0xff); }
  function pushU32(arr, v) { arr.push((v >> 24) & 0xff, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff); }
  function pushStr(arr, s) { for (let i = 0; i < s.length; i++) arr.push(s.charCodeAt(i)); }

  // Construye un Blob MIDI tipo 0.
  //   notes: [{ midi, start, dur, velocity? }]  start/dur en NEGRAS (beats)
  //   opts:  { bpm=120, ppq=480, channel=0 }
  function build(notes, opts) {
    opts = opts || {};
    const bpm = opts.bpm || 120;
    const ppq = opts.ppq || 480;
    const ch = opts.channel || 0;

    // Eventos absolutos (tick, tipo, data) → ordenar → delta-time.
    const events = [];
    notes.forEach(n => {
      const startTick = Math.round(n.start * ppq);
      const endTick = Math.round((n.start + n.dur) * ppq);
      const vel = n.velocity == null ? 90 : n.velocity;
      events.push({ tick: startTick, on: true, midi: n.midi, vel });
      events.push({ tick: endTick, on: false, midi: n.midi, vel: 0 });
    });
    // Orden estable: por tick; note-off antes de note-on al mismo tick
    events.sort((a, b) => a.tick - b.tick || (a.on === b.on ? 0 : a.on ? 1 : -1));

    const track = [];
    // Tempo meta-evento (microsegundos por negra)
    const usPerBeat = Math.round(60000000 / bpm);
    track.push(...vlq(0), 0xff, 0x51, 0x03, (usPerBeat >> 16) & 0xff, (usPerBeat >> 8) & 0xff, usPerBeat & 0xff);

    let prev = 0;
    events.forEach(ev => {
      const delta = ev.tick - prev; prev = ev.tick;
      track.push(...vlq(delta));
      track.push((ev.on ? 0x90 : 0x80) | ch, ev.midi & 0x7f, ev.vel & 0x7f);
    });
    // End of track
    track.push(...vlq(0), 0xff, 0x2f, 0x00);

    const out = [];
    pushStr(out, 'MThd'); pushU32(out, 6); pushU16(out, 0); pushU16(out, 1); pushU16(out, ppq);
    pushStr(out, 'MTrk'); pushU32(out, track.length);
    for (const b of track) out.push(b & 0xff);

    return new Blob([new Uint8Array(out)], { type: 'audio/midi' });
  }

  global.TMMidi = { build };
})(window);
