/* shared/theory.js — Datos y utilidades de teoría musical para Tools_Music
 * Nombres de notas, conversión MIDI/frecuencia, intervalos, fórmulas de
 * escalas y acordes. Sin dependencias. Expone window.TMTheory.
 */
(function (global) {
  'use strict';

  // Nombres de las 12 clases de altura (con sostenidos) y bemoles.
  const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const NOTES_FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

  // Frecuencia de una nota MIDI (A4 = 69 = 440 Hz).
  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Nombre de nota a partir de un número MIDI (incluye octava: C4 = 60).
  function midiToName(midi, useFlats) {
    const names = useFlats ? NOTES_FLAT : NOTES_SHARP;
    const octave = Math.floor(midi / 12) - 1;
    return names[((midi % 12) + 12) % 12] + octave;
  }

  // Intervalos en semitonos con nombre corto y largo.
  const INTERVALS = [
    { semis: 0,  short: 'P1', name: 'Unísono' },
    { semis: 1,  short: 'm2', name: 'Segunda menor' },
    { semis: 2,  short: 'M2', name: 'Segunda mayor' },
    { semis: 3,  short: 'm3', name: 'Tercera menor' },
    { semis: 4,  short: 'M3', name: 'Tercera mayor' },
    { semis: 5,  short: 'P4', name: 'Cuarta justa' },
    { semis: 6,  short: 'TT', name: 'Tritono' },
    { semis: 7,  short: 'P5', name: 'Quinta justa' },
    { semis: 8,  short: 'm6', name: 'Sexta menor' },
    { semis: 9,  short: 'M6', name: 'Sexta mayor' },
    { semis: 10, short: 'm7', name: 'Séptima menor' },
    { semis: 11, short: 'M7', name: 'Séptima mayor' },
    { semis: 12, short: 'P8', name: 'Octava' }
  ];

  // Fórmulas de escalas (semitonos desde la tónica).
  const SCALES = {
    major:           { name: 'Mayor (Jónico)',  steps: [0, 2, 4, 5, 7, 9, 11] },
    natural_minor:   { name: 'Menor natural (Eólico)', steps: [0, 2, 3, 5, 7, 8, 10] },
    harmonic_minor:  { name: 'Menor armónica', steps: [0, 2, 3, 5, 7, 8, 11] },
    melodic_minor:   { name: 'Menor melódica', steps: [0, 2, 3, 5, 7, 9, 11] },
    dorian:          { name: 'Dórico',  steps: [0, 2, 3, 5, 7, 9, 10] },
    phrygian:        { name: 'Frigio',  steps: [0, 1, 3, 5, 7, 8, 10] },
    lydian:          { name: 'Lidio',   steps: [0, 2, 4, 6, 7, 9, 11] },
    mixolydian:      { name: 'Mixolidio', steps: [0, 2, 4, 5, 7, 9, 10] },
    locrian:         { name: 'Locrio',  steps: [0, 1, 3, 5, 6, 8, 10] },
    pentatonic_major:{ name: 'Pentatónica mayor', steps: [0, 2, 4, 7, 9] },
    pentatonic_minor:{ name: 'Pentatónica menor', steps: [0, 3, 5, 7, 10] },
    blues:           { name: 'Blues',   steps: [0, 3, 5, 6, 7, 10] },
    chromatic:       { name: 'Cromática', steps: [0,1,2,3,4,5,6,7,8,9,10,11] }
  };

  // Fórmulas de acordes (semitonos desde la fundamental).
  const CHORDS = {
    maj:     { name: 'Mayor',          symbol: '',     steps: [0, 4, 7] },
    min:     { name: 'Menor',          symbol: 'm',    steps: [0, 3, 7] },
    dim:     { name: 'Disminuido',     symbol: 'dim',  steps: [0, 3, 6] },
    aug:     { name: 'Aumentado',      symbol: 'aug',  steps: [0, 4, 8] },
    sus2:    { name: 'Suspendido 2',   symbol: 'sus2', steps: [0, 2, 7] },
    sus4:    { name: 'Suspendido 4',   symbol: 'sus4', steps: [0, 5, 7] },
    maj7:    { name: 'Mayor séptima',  symbol: 'maj7', steps: [0, 4, 7, 11] },
    min7:    { name: 'Menor séptima',  symbol: 'm7',   steps: [0, 3, 7, 10] },
    dom7:    { name: 'Séptima dominante', symbol: '7', steps: [0, 4, 7, 10] },
    dim7:    { name: 'Séptima disminuida', symbol: 'dim7', steps: [0, 3, 6, 9] },
    m7b5:    { name: 'Semidisminuido', symbol: 'm7b5', steps: [0, 3, 6, 10] }
  };

  // Grados diatónicos de la escala mayor (cifrado funcional).
  const DIATONIC_MAJOR = ['maj', 'min', 'min', 'maj', 'dom7', 'min', 'dim'];
  const ROMAN_MAJOR = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];

  // Devuelve las notas MIDI de una escala desde una tónica MIDI.
  function scaleNotes(rootMidi, scaleKey) {
    const sc = SCALES[scaleKey];
    if (!sc) return [];
    return sc.steps.map(s => rootMidi + s);
  }

  // Devuelve las notas MIDI de un acorde desde una fundamental MIDI.
  function chordNotes(rootMidi, chordKey) {
    const ch = CHORDS[chordKey];
    if (!ch) return [];
    return ch.steps.map(s => rootMidi + s);
  }

  // Nombre de un intervalo dado en semitonos (0-12).
  function intervalName(semis) {
    const found = INTERVALS.find(i => i.semis === (semis % 12 === 0 && semis > 0 ? 12 : semis % 12));
    return found || { semis, short: '?', name: 'Desconocido' };
  }

  global.TMTheory = {
    NOTES_SHARP, NOTES_FLAT, INTERVALS, SCALES, CHORDS,
    DIATONIC_MAJOR, ROMAN_MAJOR,
    midiToFreq, midiToName, scaleNotes, chordNotes, intervalName
  };
})(window);
