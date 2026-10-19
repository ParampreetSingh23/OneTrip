// Synthesizes music + SFX as one piece (A minor, 120 BPM) and writes audio.wav.
import { writeFileSync } from "node:fs";

const SR = 44100, DUR = 25, N = SR * DUR, BEAT = 0.5;
const dry = [new Float32Array(N), new Float32Array(N)];
const send = new Float32Array(N); // reverb send (mono in, stereo out)
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
let seed = 12345; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

function add(t0, len, gain, pan, fn, wet = 0.25) {
  const s0 = Math.round(t0 * SR), n = Math.round(len * SR);
  const gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < n && s0 + i < N; i++) {
    if (s0 + i < 0) continue;
    const v = fn(i / SR);
    dry[0][s0 + i] += v * gl; dry[1][s0 + i] += v * gr; send[s0 + i] += v * gain * wet;
  }
}
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));

// ---- instruments ----
const kick = (t0, g = 1) => add(t0, .45, .55 * g, 0, (t) => Math.sin(2 * Math.PI * (45 * t + 90 * (1 - Math.exp(-t * 28)) / 28)) * env(t, .002, .16), 0);
const hat = (t0, g = 1) => add(t0, .08, .07 * g, .3, (t) => { let x = rnd() * 2 - 1; return (x - (hat.p ?? 0)) * env(t, .001, .018); }, .1);
const clap = (t0) => add(t0, .25, .22, -.1, (t) => (rnd() * 2 - 1) * (env(t, .002, .05) + .4 * env(Math.max(0, t - .012), .001, .03)) * .7, .4);
const bass = (t0, m, len) => add(t0, len, .22, 0, (t) => { const f = hz(m); return (Math.sin(2 * Math.PI * f * t) + .3 * Math.sin(4 * Math.PI * f * t)) * env(t, .005, .22) * Math.min(1, (len - t) * 40); }, 0);
const pluck = (t0, m, g = .1, pan = 0, wet = .35) => add(t0, .6, g, pan, (t) => { const f = hz(m); return (Math.sin(2 * Math.PI * f * t) + .45 * Math.sin(4 * Math.PI * f * t) * Math.exp(-t * 12) + .2 * Math.sin(6 * Math.PI * f * t) * Math.exp(-t * 20)) * env(t, .003, .16); }, wet);
const pad = (t0, notes, len, g = .045) => notes.forEach((m, k) => add(t0, len, g, k % 2 ? .4 : -.4, (t) => { const f = hz(m); return (Math.sin(2 * Math.PI * f * t) + .25 * Math.sin(2 * Math.PI * f * 2.003 * t)) * Math.min(1, t / .35, (len - t) / .5); }, .6));
const bell = (t0, m, g = .12, pan = 0) => add(t0, 2.2, g, pan, (t) => { const f = hz(m); return (Math.sin(2 * Math.PI * f * t) + .4 * Math.sin(2 * Math.PI * f * 2.76 * t) * Math.exp(-t * 6) + .2 * Math.sin(2 * Math.PI * f * 5.4 * t) * Math.exp(-t * 12)) * env(t, .002, .7); }, .6);
const pop = (t0, m, g = .14, pan = 0) => add(t0, .25, g, pan, (t) => Math.sin(2 * Math.PI * hz(m) * (t + .015 * (1 - Math.exp(-t * 40)))) * env(t, .002, .07), .4);
const tick = (t0, m, g = .035, pan = 0) => add(t0, .12, g, pan, (t) => Math.sin(2 * Math.PI * hz(m) * t) * env(t, .001, .03), .3);
const tap = (t0) => { add(t0, .05, .12, .1, (t) => (rnd() * 2 - 1) * env(t, .0005, .006), .1); pop(t0, 81, .08, .1); };
function whoosh(t0, len = .5, g = .05) {
  let lp = 0;
  add(t0, len, g, 0, (t) => { const x = t / len, cut = .01 + .12 * Math.sin(Math.PI * x); lp += cut * ((rnd() * 2 - 1) - lp); return lp * Math.sin(Math.PI * x) ** 2 * 3; }, .5);
}

// ---- arrangement ----
// chords per 2s bar: Am F C G | Am F C G | Am, then resolve to C for the end card
const CH = { Am: [57, 60, 64], F: [53, 57, 60], C: [55, 60, 64], G: [55, 59, 62] };
const ROOT = { Am: 45, F: 41, C: 48, G: 43 };
const BARS = ["Am", "F", "C", "G", "Am", "F", "C", "G", "Am", "F", "Am"];
BARS.forEach((c, b) => {
  const t0 = b * 2;
  pad(t0, CH[c].map((m) => m + 12), b === 10 ? 2.7 : 2.05, .06);
  const live = (t) => t < 20.8; // drums drop out for "deletes itself"
  for (let e = 0; e < 4; e++) if (live(t0 + e * BEAT)) kick(t0 + e * BEAT);
  for (let e = 0; e < 8; e++) if (live(t0 + e * BEAT / 2)) bass(t0 + e * BEAT / 2, ROOT[c] + (e % 4 === 3 ? 12 : 0), .24);
  if (t0 >= 2) for (let e = 0; e < 4; e++) if (live(t0 + e * BEAT)) hat(t0 + e * BEAT + BEAT / 2);
  if (t0 >= 4) { if (live(t0 + BEAT)) clap(t0 + BEAT); if (live(t0 + 3 * BEAT)) clap(t0 + 3 * BEAT); }
  // syncopated chord stabs
  [0, .75, 1.5].forEach((o) => t0 + o < 20.8 && CH[c].forEach((m, k) => pluck(t0 + o, m + 12, .075, (k - 1) * .5)));
});
// arp under "Upload once" (5.4 - 9.4), rising, quiet
for (let i = 0; i < 32; i++) {
  const t0 = 5.5 + i * .125, c = BARS[Math.floor(t0 / 2)], m = CH[c][i % 3] + 24 + (i % 6 >= 3 ? 12 : 0);
  pluck(t0, m, .035 + .02 * (i / 32), (i % 2 ? .5 : -.5), .5);
}

// ---- SFX (all in A minor pentatonic) ----
const PENTA = [69, 72, 74, 76, 79, 81, 84, 86, 88];
for (let i = 0; i < 22; i++) tick(.06 + i * .062, PENTA[(i * 3) % PENTA.length], .028, (rnd() - .5) * 1.2);
[2.7, 2.9, 3.1].forEach((t, i) => pop(t, [69, 72, 76][i], .13, (i - 1) * .5));
[3.1, 3.3, 3.5].forEach((t, i) => tick(t, [52, 52, 50][i], .06, (i - 1) * .4));
[2.4, 5.2, 9.25, 12.7, 17.0, 20.55].forEach((t) => whoosh(t - .15, .55));
tap(9.05); tap(11.25);
bell(9.6, 81, .1, -.2); bell(9.72, 88, .07, .2);
pop(11.27, 84, .07);
for (let i = 0; i < 12; i++) tick(18.4 + i * (1.4 / 12), PENTA[i % PENTA.length] + 0, .03, (rnd() - .5));
for (let i = 0; i < 10; i++) tick(21.35 + i * .065, PENTA[PENTA.length - 1 - (i % PENTA.length)], .028, (rnd() - .5));
whoosh(21.85, .75, .06);
// collaboration: switch, typing, join, upload, thanks
tap(13.85); pop(13.9, 76, .08);
for (let i = 0; i < 4; i++) tick(14.1 + i * .13, [72, 74, 76, 79][i], .025);
tap(14.75); pop(14.8, 81, .07); tap(15.4);
for (let i = 0; i < 8; i++) tick(15.6 + i * .1, PENTA[i], .022, (rnd() - .5));
bell(16.45, 84, .08, .2); bell(16.55, 88, .05, -.2);
pop(16.45, 69, .06, -.3); pop(16.75, 72, .06, -.3);
// end card: resolve to C(add9), soft kick + bell
kick(22.55, .8);
pad(22.5, [60, 64, 67, 74], 2.5, .05);
bass(22.55, 36, 2.3);
bell(22.6, 72, .09, -.2); bell(22.75, 76, .07, .2); bell(22.9, 79, .06, 0);

// ---- reverb: 4 combs + 2 allpasses (Schroeder) on the send ----
function reverb(input, combs, aps) {
  const out = new Float32Array(N);
  for (const [d, fb] of combs) { const buf = new Float32Array(d); let k = 0, lp = 0; for (let i = 0; i < N; i++) { const y = buf[k]; lp = .7 * y + .3 * lp; buf[k] = input[i] + lp * fb; k = (k + 1) % d; out[i] += y * .25; } }
  for (const [d, g] of aps) { const buf = new Float32Array(d); let k = 0; for (let i = 0; i < N; i++) { const b = buf[k], x = out[i]; const y = -g * x + b; buf[k] = x + g * y; k = (k + 1) % d; out[i] = y; } }
  return out;
}
const wl = reverb(send, [[1557, .8], [1617, .8], [1491, .8], [1422, .8]], [[225, .5], [556, .5]]);
const wr = reverb(send, [[1580, .8], [1640, .8], [1514, .8], [1445, .8]], [[248, .5], [579, .5]]);

// ---- master: sum, gentle fade-out, soft limit, normalize ----
const L = new Float32Array(N), R = new Float32Array(N);
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR, fade = Math.min(1, t / .02, (DUR - t) / 1.2);
  L[i] = Math.tanh((dry[0][i] + .35 * wl[i]) * 1.1) * fade;
  R[i] = Math.tanh((dry[1][i] + .35 * wr[i]) * 1.1) * fade;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = .89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVEfmt ", 8);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(L[i] * norm * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(R[i] * norm * 32767), 46 + i * 4); }
writeFileSync("audio.wav", buf);
console.log("audio.wav written, peak", peak.toFixed(2));
