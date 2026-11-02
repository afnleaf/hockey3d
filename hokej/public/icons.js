// Hand-authored 24x24 stroke glyphs, one per play-by-play typeDescKey.
// Used inline in the HUD and rasterised into camera-facing sprite badges.

const G = {
    "goal":
        '<path d="M3 19V7h18v12"/><path d="M3 11h18M3 15h18M8 7v12M12 7v12'
        + 'M16 7v12" stroke-width="1" opacity=".6"/>'
        + '<circle cx="12" cy="13" r="3.2" fill="currentColor"/>',
    "shot-on-goal":
        '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/>'
        + '<circle cx="12" cy="12" r="1.6" fill="currentColor"/>',
    "missed-shot":
        '<circle cx="12" cy="15.5" r="5.5"/>'
        + '<path d="M2 5h19M17 2l4 3-4 3"/>',
    "blocked-shot":
        '<path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z"/>'
        + '<path d="M8 12h8"/>',
    "hit":
        '<path d="M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3.5 3.5M15.5 15.5L19 19'
        + 'M19 5l-3.5 3.5M8.5 15.5L5 19"/><circle cx="12" cy="12" r="2"'
        + ' fill="currentColor"/>',
    "faceoff":
        '<path d="M4 3l8 13M20 3l-8 13"/><path d="M12 16l-3 2M12 16l3 2"/>'
        + '<circle cx="12" cy="20.5" r="2" fill="currentColor"/>',
    "giveaway":
        '<ellipse cx="6.5" cy="17" rx="4.5" ry="2.5"/>'
        + '<path d="M6.5 11V4M3.5 7l3-3 3 3M13 17h8M18 14l3 3-3 3"/>',
    "takeaway":
        '<ellipse cx="17.5" cy="17" rx="4.5" ry="2.5"/>'
        + '<path d="M2 17h9M8 14l3 3-3 3M17.5 4v7M14.5 8l3 3 3-3"/>',
    "penalty":
        '<path d="M6 3h12M6 21h12M7 3c0 6 10 6 10 9s-10 3-10 9M17 3c0 6-10 6'
        + '-10 9s10 3 10 9"/>',
    "delayed-penalty":
        '<path d="M8 21v-9l-2-3V4M8 12h7l3-3V3"/><path d="M10 3v6M13 3v6"/>',
    "stoppage":
        '<circle cx="12" cy="12" r="9"/><path d="M9.5 8v8M14.5 8v8"/>',
    "period-start":
        '<circle cx="12" cy="12" r="9"/><path d="M10 8l6 4-6 4z"'
        + ' fill="currentColor"/>',
    "period-end":
        '<circle cx="12" cy="12" r="9"/><rect x="8.5" y="8.5" width="7"'
        + ' height="7" fill="currentColor"/>',
    "game-end":
        '<path d="M5 22V3M5 3h14v10H5"/><path d="M5 3h3.5v3.3H5zM12 3h3.5'
        + 'v3.3H12zM8.5 6.3H12v3.3H8.5zM15.5 6.3H19v3.3h-3.5zM5 9.6h3.5V13H5z'
        + 'M12 9.6h3.5V13H12z" fill="currentColor" stroke="none"/>',
    "failed-shot-attempt":
        '<circle cx="12" cy="12" r="8.5"/><path d="M8 8l8 8M16 8l-8 8"/>',
    "shootout-complete":
        '<path d="M5 22V3M5 3h14v10H5"/>',
};

const FALLBACK = '<circle cx="12" cy="12" r="4" fill="currentColor"/>';

export function hasIcon(type) {
    return type in G;
}

export function iconSvg(type, color = "currentColor", px = 24) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"`
        + ` width="${px}" height="${px}" fill="none" stroke="${color}"`
        + ` color="${color}" stroke-width="2" stroke-linecap="round"`
        + ` stroke-linejoin="round">${G[type] ?? FALLBACK}</svg>`;
}

export function iconElement(type, color, px = 16) {
    const span = document.createElement("span");
    span.style.cssText = `display:inline-flex;width:${px}px;height:${px}px;`
        + "flex:none";
    span.innerHTML = iconSvg(type, color, px);
    return span;
}

const TEX = 256;
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
    ctx.arc(r, r, r - 10, 0, Math.PI * 2);
    ctx.fillStyle = cssColor;
    ctx.fill();
    ctx.lineWidth = 12;
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
    img.src = "data:image/svg+xml;charset=utf-8,"
        + encodeURIComponent(iconSvg(type, "#ffffff", Math.round(TEX * 0.64)));
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
