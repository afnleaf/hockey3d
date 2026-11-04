// Glyphs live in ../icons/<typeDescKey>.svg; build_icons.ts generates
// icon_glyphs.js. Used inline in the HUD and rasterised into sprite badges.
import { GLYPHS, VIEWBOX } from "./icon_glyphs.js";

const { fallback: FALLBACK, ...G } = GLYPHS;

export function hasIcon(type) {
    return type in G;
}

export function iconSvg(type, color = "currentColor", px = 24) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}"`
        + ` width="${px}" height="${px}" fill="none" stroke="${color}"`
        + ` color="${color}" stroke-width="8" stroke-linecap="round"`
        + ` stroke-linejoin="round">${G[type] ?? FALLBACK}</svg>`;
}

export function iconElement(type, color, px = 16) {
    const span = document.createElement("span");
    // Dark disc keeps the white glyph legible over white ice.
    span.style.cssText = `display:inline-flex;width:${px + 6}px;`
        + `height:${px + 6}px;flex:none;align-items:center;`
        + "justify-content:center;border-radius:50%;"
        + "background:rgba(12,18,26,0.72)";
    span.innerHTML = iconSvg(type, color, px);
    return span;
}

const TEX = 512;
const cache = new Map();

// Team-coloured disc with a white rim and white glyph. The glyph image
// decodes asynchronously; the texture refreshes when it lands.
export function iconTexture(type, cssColor) {
    const key = type + cssColor;
    if (cache.has(key)) return cache.get(key);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = TEX;
    const ctx = canvas.getContext("2d");
    const r = TEX / 2;
    ctx.beginPath();
    ctx.arc(r, r, r - TEX * 10 / 256, 0, Math.PI * 2);
    ctx.fillStyle = cssColor;
    ctx.fill();
    ctx.lineWidth = TEX * 12 / 256;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    const tex = new THREE.CanvasTexture(canvas);
    tex.encoding = THREE.sRGBEncoding;
    const img = new Image();
    img.onload = () => {
        const s = TEX * 0.64;
        ctx.drawImage(img, r - s / 2, r - s / 2, s, s);
        tex.needsUpdate = true;
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
        iconSvg(type, "#ffffff", Math.round(TEX * 0.64)));
    cache.set(key, tex);
    return tex;
}

// Soft radial dot for additive goal glow.
let glow = null;
export function glowTexture() {
    if (glow) return glow;
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.3, "rgba(255,230,120,0.8)");
    g.addColorStop(1, "rgba(255,160,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    glow = new THREE.CanvasTexture(c);
    return glow;
}
