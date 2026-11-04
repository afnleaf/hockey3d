// Audits every ordered away/home pairing chosen by gameColors() and writes
// a CSV plus an HTML swatch sheet ranked by perceptual distance (CIEDE2000).
// events.js imports scene.js, which builds a renderer on load; parse the
// colour logic out of events.js instead of importing it.
const src = await Bun.file(new URL("./public/events.js", import.meta.url)).text();
const start = src.indexOf("export const teamColors");
const end = src.indexOf("// rendered:");
const { gameColors, teamColors } = new Function(
    src.slice(start, end).replace(/export /g, "") + "return { gameColors, teamColors };")();

const ABBR: Record<number, string> = {
    1: "NJD", 2: "NYI", 3: "NYR", 4: "PHI", 5: "PIT", 6: "BOS", 7: "BUF",
    8: "MTL", 9: "OTT", 10: "TOR", 12: "CAR", 13: "FLA", 14: "TBL", 15: "WSH",
    16: "CHI", 17: "DET", 18: "NSH", 19: "STL", 20: "CGY", 21: "COL", 22: "EDM",
    23: "VAN", 24: "ANA", 25: "DAL", 26: "LAK", 28: "SJS", 29: "CBJ", 30: "MIN",
    52: "WPG", 53: "ARI", 54: "VGK", 55: "SEA", 59: "UTA",
};
// Below this dE2000 two team colours read as the same family on ice.
const FAIL_DE = 20;

function lab(c: number): [number, number, number] {
    const lin = (v: number) => {
        v /= 255;
        return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    const r = lin((c >> 16) & 255), g = lin((c >> 8) & 255), b = lin(c & 255);
    const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
    const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
    return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

// Sharma, Wu, Dalal (2005) formulation.
function deltaE2000(c1: number, c2: number): number {
    const [L1, a1, b1] = lab(c1), [L2, a2, b2] = lab(c2);
    const rad = Math.PI / 180;
    const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2);
    const Cm = (C1 + C2) / 2;
    const G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)));
    const a1p = a1 * (1 + G), a2p = a2 * (1 + G);
    const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
    const hp = (b: number, a: number) => {
        if (a === 0 && b === 0) return 0;
        const h = Math.atan2(b, a) / rad;
        return h < 0 ? h + 360 : h;
    };
    const h1p = hp(b1, a1p), h2p = hp(b2, a2p);
    const dLp = L2 - L1, dCp = C2p - C1p;
    let dhp = 0;
    if (C1p * C2p !== 0) {
        dhp = h2p - h1p;
        if (dhp > 180) dhp -= 360;
        else if (dhp < -180) dhp += 360;
    }
    const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * rad);
    const Lmp = (L1 + L2) / 2, Cmp = (C1p + C2p) / 2;
    let hmp = h1p + h2p;
    if (C1p * C2p !== 0) {
        if (Math.abs(h1p - h2p) > 180) hmp += h1p + h2p < 360 ? 360 : -360;
        hmp /= 2;
    }
    const T = 1 - 0.17 * Math.cos((hmp - 30) * rad) + 0.24 * Math.cos(2 * hmp * rad)
        + 0.32 * Math.cos((3 * hmp + 6) * rad) - 0.2 * Math.cos((4 * hmp - 63) * rad);
    const dTheta = 30 * Math.exp(-(((hmp - 275) / 25) ** 2));
    const Rc = 2 * Math.sqrt(Cmp ** 7 / (Cmp ** 7 + 25 ** 7));
    const Sl = 1 + (0.015 * (Lmp - 50) ** 2) / Math.sqrt(20 + (Lmp - 50) ** 2);
    const Sc = 1 + 0.045 * Cmp, Sh = 1 + 0.015 * Cmp * T;
    const Rt = -Math.sin(2 * dTheta * rad) * Rc;
    return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2
        + Rt * (dCp / Sc) * (dHp / Sh));
}

const hex = (c: number) => "#" + c.toString(16).padStart(6, "0");
const ids = Object.keys(teamColors).map(Number);
const rows: { away: number; home: number; a: number; h: number; de: number; fallback: boolean }[] = [];
for (const away of ids) for (const home of ids) {
    if (away === home) continue;
    const m = gameColors(away, home);
    const a = m.get(away)!, h = m.get(home)!;
    const fallback = !(teamColors as Record<number, number[]>)[away].includes(a);
    rows.push({ away, home, a, h, de: deltaE2000(a, h), fallback });
}
rows.sort((x, y) => x.de - y.de);
const failing = rows.filter((r) => r.de < FAIL_DE);

const outDir = new URL("../output/", import.meta.url).pathname;
await Bun.write(outDir + "team_color_audit.csv",
    "away,home,away_color,home_color,de2000,fallback\n"
    + rows.map((r) => `${ABBR[r.away]},${ABBR[r.home]},${hex(r.a)},${hex(r.h)},${r.de.toFixed(1)},${r.fallback}`).join("\n") + "\n");

const card = (r: typeof rows[number]) => `<div class="c"><div class="ice">
<span class="dot" style="background:${hex(r.a)}"></span><span class="dot" style="background:${hex(r.h)}"></span></div>
<b>${ABBR[r.away]} @ ${ABBR[r.home]}</b><br>${hex(r.a)} / ${hex(r.h)}<br>dE ${r.de.toFixed(1)}${r.fallback ? " (hue fallback)" : ""}</div>`;
await Bun.write(outDir + "team_color_audit.html", `<!doctype html><meta charset="utf-8">
<title>Team colour audit</title><style>
body{font:13px system-ui;background:#222;color:#eee;margin:16px}
.g{display:flex;flex-wrap:wrap;gap:8px}.c{width:150px;background:#333;padding:6px;border-radius:4px}
.ice{background:#f3f6f9;height:56px;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:4px}
.dot{width:34px;height:34px;border-radius:50%}</style>
<h2>${failing.length} of ${rows.length} ordered matchups below dE2000 ${FAIL_DE}</h2>
<div class="g">${failing.map(card).join("")}</div>
<h2>Next 60 closest</h2><div class="g">${rows.slice(failing.length, failing.length + 60).map(card).join("")}</div>`);
console.log(`${failing.length}/${rows.length} below dE ${FAIL_DE}; worst: `
    + failing.slice(0, 12).map((r) => `${ABBR[r.away]}@${ABBR[r.home]} ${r.de.toFixed(1)}`).join(", "));
