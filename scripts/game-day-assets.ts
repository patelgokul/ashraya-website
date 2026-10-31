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
copyFileSync("node_modules/@lottiefiles/dotlottie-web/dist/dotlottie-player.wasm", "public/animations/dotlottie-player.wasm");
console.log("Generated rehearsal drawings and self-hosted celebration assets.");