// The packed page served over http(s) comes from the relay itself, so it uses
// its own origin; a cross-origin call to 127.0.0.1 would trigger Chrome's
// Local Network Access prompt. file:// and the unbundled dev page (port 8000)
// fall back to __RELAY_BASE__ from pack.sh. "#relay=URL" overrides per tab.
export const RELAY_BASE = (() => {
    const fromHash = new URLSearchParams(location.hash.slice(1)).get("relay");
    if (fromHash) sessionStorage.setItem("relay", fromHash);
    const packed = typeof __RELAY_BASE__ !== "undefined";
    const served = location.protocol === "http:" || location.protocol === "https:";
    return sessionStorage.getItem("relay")
        ?? (packed && served ? location.origin
            : packed ? __RELAY_BASE__ : "http://127.0.0.1:8790");
})();

// NHL logo URLs carry a "?season=" suffix on some feeds; the file name alone
// identifies the art, and the relay serves it with CORS for WebGL textures.
export function logoUrl(nhlUrl) {
    if (!nhlUrl) return nhlUrl;
    const file = new URL(nhlUrl).pathname.split("/").pop();
    return RELAY_BASE + "/logo/" + file;
}
