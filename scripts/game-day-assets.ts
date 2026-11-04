import { mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Sun, TreePine, Home, BookOpen, Star, Clock, Heart, Cloud, Umbrella, Flower2 } from "lucide-react";
import { strToU8, zipSync } from "fflate";

mkdirSync("public/images/game-day-demo", { recursive: true });
const colors = ["#d97706", "#15803d", "#2563eb", "#be123c", "#ca8a04", "#0f766e", "#e11d48", "#0284c7", "#7e22ce", "#db2777"];
[Sun, TreePine, Home, BookOpen, Star, Clock, Heart, Cloud, Umbrella, Flower2].forEach((Icon, index) => {
  writeFileSync(`public/images/game-day-demo/${index + 1}.svg`, renderToStaticMarkup(createElement(Icon, { width: 240, height: 180, color: colors[index], strokeWidth: 1.4 })));
});

mkdirSync("public/animations", { recursive: true });
const animation = {
  v: "5.7.4", fr: 30, ip: 0, op: 90, w: 800, h: 800, nm: "Game Day confetti", ddd: 0, assets: [],
  layers: Array.from({ length: 42 }, (_, index) => ({
    ddd: 0, ind: index + 1, ty: 4, nm: `Confetti ${index + 1}`, sr: 1,
    ks: {
      o: { a: 0, k: 100 }, r: { a: 1, k: [{ t: 0, s: [index * 17], e: [index * 17 + 360], i: { x: [1], y: [1] }, o: { x: [0], y: [0] } }, { t: 90, s: [index * 17 + 360] }] },
      p: { a: 1, k: [{ t: 0, s: [400, 200, 0], e: [((index * 157) % 900) - 50, 900, 0], i: { x: [0.6], y: [0.1] }, o: { x: [0.2], y: [1] } }, { t: 90, s: [((index * 157) % 900) - 50, 900, 0] }] },
      a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] },
    },
    shapes: [{ ty: "rc", d: 1, s: { a: 0, k: [6 + index % 8, 12] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 2 } }, { ty: "fl", c: { a: 0, k: [[0.95, 0.45, 0.1, 1], [0.1, 0.4, 0.85, 1], [0.1, 0.7, 0.45, 1], [0.95, 0.7, 0.05, 1]][index % 4] }, o: { a: 0, k: 100 }, r: 1 }],
    ip: 0, op: 90, st: 0, bm: 0,
  })),
};
writeFileSync("public/animations/game-confetti.lottie", zipSync({
  "manifest.json": strToU8(JSON.stringify({ version: "1.0", generator: "Ashraya Game Day", animations: [{ id: "confetti", loop: false, autoplay: true }] })),
  "animations/confetti.json": strToU8(JSON.stringify(animation)),
}));
writeFileSync("public/animations/hunt-winner.lottie", zipSync({
  "manifest.json": strToU8(JSON.stringify({ version: "1.0", generator: "Ashraya Game Day", animations: [{ id: "hunt-winner", loop: true, autoplay: true }] })),
  "animations/hunt-winner.json": strToU8(JSON.stringify(winnerAnimation())),
}));
copyFileSync("node_modules/@lottiefiles/dotlottie-web/dist/dotlottie-player.wasm", "public/animations/dotlottie-player.wasm");

// Full-screen fireworks and confetti rain for the team that finishes the hunt. Loops seamlessly every 6 s.
function winnerAnimation() {
  const W = 1920, H = 1080, FRAMES = 180;
  const palette = [[0.98, 0.75, 0.14], [0.98, 0.45, 0.09], [0.93, 0.28, 0.6], [0.23, 0.51, 0.96], [0.06, 0.73, 0.51], [0.55, 0.36, 0.96], [1, 1, 1]];
  const random = (() => { let seed = 20261104; return () => (seed = (seed * 16807) % 2147483647) / 2147483647; })();
  const round = (value: number) => Math.round(value * 10) / 10;
  const fixed = (k: unknown) => ({ a: 0, k });
  const linear = (frames: { t: number; s: number[] }[]) => ({ a: 1, k: frames.map((frame, index) => index < frames.length - 1
    ? { t: frame.t, s: frame.s, e: frames[index + 1].s, i: { x: [1], y: [1] }, o: { x: [0], y: [0] } }
    : { t: frame.t, s: frame.s }) });
  const eased = (frames: { t: number; s: number[] }[]) => ({ a: 1, k: frames.map((frame, index) => index < frames.length - 1
    ? { t: frame.t, s: frame.s, e: frames[index + 1].s, i: { x: [0.4], y: [1] }, o: { x: [0.15], y: [0.85] } }
    : { t: frame.t, s: frame.s }) });
  const layerBase = (ind: number, nm: string, ip: number, op: number) => ({ ddd: 0, ind, ty: 4, nm, sr: 1, ip, op, st: 0, bm: 0, ao: 0 });
  const layers: object[] = [];

  const bursts = [[0.2, 0.3], [0.78, 0.24], [0.5, 0.16], [0.1, 0.58], [0.9, 0.6], [0.34, 0.44], [0.66, 0.42], [0.5, 0.66], [0.24, 0.74], [0.8, 0.8]];
  bursts.forEach(([x, y], burstIndex) => {
    const start = burstIndex * 16, life = 48;
    const shapes: object[] = [];
    [{ count: 26, radius: 300, size: 18 }, { count: 16, radius: 160, size: 11 }].forEach((ring, ringIndex) => {
      const color = palette[(burstIndex * 2 + ringIndex) % palette.length];
      for (let particle = 0; particle < ring.count; particle++) {
        const angle = (particle / ring.count) * Math.PI * 2 + burstIndex;
        const dx = Math.cos(angle) * ring.radius, dy = Math.sin(angle) * ring.radius;
        shapes.push({ ty: "gr", nm: `spark ${ringIndex}-${particle}`, it: [
          { ty: "el", d: 1, p: fixed([0, 0]), s: fixed([ring.size, ring.size]) },
          { ty: "fl", c: fixed([...color, 1]), o: fixed(100), r: 1 },
          { ty: "tr", a: fixed([0, 0]), r: fixed(0), sk: fixed(0), sa: fixed(0),
            p: eased([{ t: start, s: [0, 0] }, { t: start + 26, s: [round(dx), round(dy)] }, { t: start + life, s: [round(dx * 1.1), round(dy * 1.1 + 90)] }]),
            s: linear([{ t: start, s: [100, 100] }, { t: start + 26, s: [90, 90] }, { t: start + life, s: [25, 25] }]),
            o: linear([{ t: start, s: [100] }, { t: start + 28, s: [100] }, { t: start + life, s: [0] }]) },
        ] });
      }
    });
    shapes.push({ ty: "gr", nm: "flash", it: [
      { ty: "el", d: 1, p: fixed([0, 0]), s: fixed([120, 120]) },
      { ty: "fl", c: fixed([1, 0.95, 0.8, 1]), o: fixed(100), r: 1 },
      { ty: "tr", a: fixed([0, 0]), r: fixed(0), sk: fixed(0), sa: fixed(0), p: fixed([0, 0]),
        s: eased([{ t: start, s: [10, 10] }, { t: start + 10, s: [260, 260] }]), o: linear([{ t: start, s: [85] }, { t: start + 10, s: [0] }]) },
    ] });
    layers.push({ ...layerBase(layers.length + 1, `burst ${burstIndex + 1}`, start, start + life + 1),
      ks: { o: fixed(100), r: fixed(0), p: fixed([W * x, H * y, 0]), a: fixed([0, 0, 0]), s: fixed([100, 100, 100]) }, shapes });
  });

  for (let piece = 0; piece < 110; piece++) {
    const start = Math.floor(random() * FRAMES), fall = 110 + Math.floor(random() * 90);
    const x0 = random() * W, sway = 30 + random() * 70, swayPeriod = 50 + random() * 50, phase = random() * Math.PI * 2;
    const spin = (random() - 0.5) * 16, flip = 0.08 + random() * 0.12, color = palette[piece % palette.length];
    const at = (local: number) => ({
      p: [round(x0 + sway * Math.sin((local / swayPeriod) * Math.PI * 2 + phase)), round(-40 + ((H + 80) * local) / fall), 0],
      r: [round(spin * local)], s: [round(100 * Math.cos(flip * local + phase)), 100, 100],
    });
    const segments = [[start, Math.min(FRAMES, start + fall), -start], ...(start + fall > FRAMES ? [[0, start + fall - FRAMES, FRAMES - start]] : [])];
    segments.forEach(([from, to, offset]) => {
      const times: number[] = [];
      for (let t = from; t < to; t += 12) times.push(t);
      times.push(to);
      const samples = times.map((t) => ({ t, ...at(t + offset) }));
      layers.push({ ...layerBase(layers.length + 1, `confetti ${piece + 1}`, from, to),
        ks: { o: fixed(100), a: fixed([0, 0, 0]), p: linear(samples.map(({ t, p }) => ({ t, s: p }))), r: linear(samples.map(({ t, r }) => ({ t, s: r }))), s: linear(samples.map(({ t, s }) => ({ t, s }))) },
        shapes: [{ ty: "rc", d: 1, s: fixed([12 + (piece % 3) * 4, 22]), p: fixed([0, 0]), r: fixed(3) }, { ty: "fl", c: fixed([...color, 1]), o: fixed(100), r: 1 }] });
    });
  }
  return { v: "5.7.4", fr: 30, ip: 0, op: FRAMES, w: W, h: H, nm: "Treasure hunt winner", ddd: 0, assets: [], layers };
}
console.log("Generated rehearsal drawings and self-hosted celebration assets.");