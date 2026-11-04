// Google Earth-style camera for a Z-up rink with the ice at z=0. The state
// is a ground target plus distance, azimuth and tilt, so the camera can
// never roll and never pass under the ice.

const DEG = Math.PI / 180;
const TILT_MIN = 10 * DEG;
const TILT_MAX = 85 * DEG;
// At MIN_DIST and TILT_MIN the eye sits about 1.4ft above the ice.
const MIN_DIST = 8;
const MAX_DIST = 400;
// Below FLATTEN_DIST the tilt cap falls linearly to TILT_MIN at MIN_DIST.
const FLATTEN_DIST = 70;
// Rink boards sit at x=±100, y=±42.5.
const BOUND_X = 97;
const BOUND_Y = 40;
// Below this eye height the camera must stay inside the boards and glass.
const LOW_Z = 12;
// Rays that hit the ice beyond this are near the horizon and too unstable to drag.
const MAX_HIT = 1500;
const DRAG_PX = 4;
const TAP_MS = 300;
const TAP_PX = 24;
// Wheel zoom closes this share of the remaining gap every 16ms (~150ms settle).
const ZOOM_EASE = 0.25;

export class RinkControls {
    constructor(camera, dom) {
        this.camera = camera;
        this.dom = dom;
        this.target = new THREE.Vector3();
        this.dist = 100;
        this.az = -Math.PI / 2;
        this.tilt = 35 * DEG;
        this._eff = this.tilt;
        this.anim = null;
        this._zoom = null;
        this._t = performance.now();
        this.from = { x: 0, y: 0, dist: 0, az: 0, tilt: 0 };
        this.to = { x: 0, y: 0, dist: 0, az: 0, tilt: 0 };

        this._ray = new THREE.Raycaster();
        this._ndc = new THREE.Vector2();
        this._plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        this._hit = new THREE.Vector3();
        this._grab = new THREE.Vector3();
        this._pointers = new Map();
        this._mode = null;
        this._downX = 0;
        this._downY = 0;
        this._moved = false;
        this._lastTap = { t: -1e9, x: 0, y: 0 };
        this._two = { mx: 0, my: 0, len: 0, ang: 0, acc: 0, accTilt: 0, lock: null };
        this._g = { mx: 0, my: 0, len: 0, ang: 0 };

        dom.style.touchAction = "none";
        dom.addEventListener("pointerdown", (e) => this._onDown(e));
        dom.addEventListener("pointermove", (e) => this._onMove(e));
        dom.addEventListener("pointerup", (e) => this._onUp(e));
        dom.addEventListener("pointercancel", (e) => this._onUp(e));
        dom.addEventListener("wheel", (e) => this._onWheel(e), { passive: false });
        dom.addEventListener("dblclick", (e) => {
            if (this._ground(e.clientX, e.clientY)) this._flyIn(this._hit);
        });
        dom.addEventListener("contextmenu", (e) => e.preventDefault());
        this.update();
    }

    // Animates to state {x, y, dist, az, tilt}; az takes the short way round.
    flyTo(s, ms) {
        const f = this.from;
        f.x = this.target.x; f.y = this.target.y;
        f.dist = this.dist; f.az = this.az; f.tilt = this._eff;
        Object.assign(this.to, s);
        let d = this.to.az - f.az;
        d -= Math.round(d / (2 * Math.PI)) * 2 * Math.PI;
        this.to.az = f.az + d;
        if (ms > 0) this.anim = { t0: performance.now(), ms };
        else { this.anim = null; this._apply(this.to, 1); }
    }

    update(now = performance.now()) {
        const dt = Math.min(100, now - this._t);
        this._t = now;
        if (this.anim) {
            const k = Math.min(1, (now - this.anim.t0) / this.anim.ms);
            this._apply(this.to, k * k * (3 - 2 * k));
            if (k === 1) this.anim = null;
        }
        const z = this._zoom;
        if (z) {
            const k = 1 - Math.pow(1 - ZOOM_EASE, dt / 16);
            this.dist *= Math.pow(z.goal / this.dist, k);
            if (Math.abs(Math.log(z.goal / this.dist)) < 1e-3) {
                this.dist = z.goal;
                this._zoom = null;
            }
            this._place();
            if (z.has && this._ground(z.x, z.y)) {
                this.target.x += z.gx - this._hit.x;
                this.target.y += z.gy - this._hit.y;
            }
        }
        this._place();
    }

    _place() {
        this._clamp();
        const c = Math.cos(this._eff);
        this.camera.position.set(
            this.target.x + this.dist * c * Math.cos(this.az),
            this.target.y + this.dist * c * Math.sin(this.az),
            this.dist * Math.sin(this._eff),
        );
        const p = this.camera.position;
        if (p.z < LOW_Z) {
            const x = Math.min(BOUND_X, Math.max(-BOUND_X, p.x));
            const y = Math.min(BOUND_Y, Math.max(-BOUND_Y, p.y));
            this.target.x += x - p.x;
            this.target.y += y - p.y;
            p.x = x;
            p.y = y;
        }
        this.camera.up.set(0, 0, 1);
        this.camera.lookAt(this.target);
        this.camera.updateMatrixWorld();
    }

    _apply(b, e) {
        const a = this.from;
        this.target.set(a.x + (b.x - a.x) * e, a.y + (b.y - a.y) * e, 0);
        this.dist = a.dist + (b.dist - a.dist) * e;
        this.az = a.az + (b.az - a.az) * e;
        this.tilt = a.tilt + (b.tilt - a.tilt) * e;
    }

    _clamp() {
        this.dist = Math.min(MAX_DIST, Math.max(MIN_DIST, this.dist));
        const k = Math.min(1, (this.dist - MIN_DIST) / (FLATTEN_DIST - MIN_DIST));
        // tilt is what the user chose; it returns once the camera backs out.
        this.tilt = Math.min(TILT_MAX, Math.max(TILT_MIN, this.tilt));
        this._eff = Math.min(this.tilt, TILT_MIN + (TILT_MAX - TILT_MIN) * k);
        this.target.x = Math.min(BOUND_X, Math.max(-BOUND_X, this.target.x));
        this.target.y = Math.min(BOUND_Y, Math.max(-BOUND_Y, this.target.y));
        this.target.z = 0;
    }

    // Writes the ice point under client (x, y) to this._hit; false if none.
    _ground(x, y) {
        const r = this.dom.getBoundingClientRect();
        this._ndc.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
        this._ray.setFromCamera(this._ndc, this.camera);
        const ray = this._ray.ray;
        if (!ray.intersectPlane(this._plane, this._hit)) return false;
        return ray.origin.distanceTo(this._hit) < MAX_HIT;
    }

    // Shifts the target so the stored grab point sits under client (x, y).
    _keepUnder(x, y) {
        this._place();
        if (!this._ground(x, y)) return;
        this.target.x += this._grab.x - this._hit.x;
        this.target.y += this._grab.y - this._hit.y;
        this._place();
    }

    // Bursts of wheel events share one anchor and one eased goal distance.
    _zoomAt(x, y, factor) {
        this.anim = null;
        let z = this._zoom;
        if (!z || Math.hypot(x - z.x, y - z.y) > TAP_PX) {
            const has = this._ground(x, y);
            z = this._zoom = { x, y, has, gx: this._hit.x, gy: this._hit.y, goal: this.dist };
        }
        z.x = x; z.y = y;
        z.goal = Math.min(MAX_DIST, Math.max(MIN_DIST, z.goal * factor));
    }

    _flyIn(p) {
        const dist = Math.max(MIN_DIST, this.dist * 0.4);
        this.flyTo({ x: p.x, y: p.y, dist, az: this.az, tilt: this.tilt }, 400);
    }

    _onDown(e) {
        this.anim = null;
        this._zoom = null;
        this.dom.setPointerCapture(e.pointerId);
        this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        this._downX = e.clientX;
        this._downY = e.clientY;
        this._moved = false;
        if (this._pointers.size === 2) this._startTwo();
        else if (this._pointers.size === 1) {
            const alt = e.button === 2 || e.ctrlKey;
            // Touch keeps one-finger pan; only the mouse swaps.
            this._mode = e.pointerType === "mouse" && !alt ? "rotate" : "pan";
            if (this._mode === "pan" && this._ground(e.clientX, e.clientY)) {
                this._grab.copy(this._hit);
            } else if (this._mode === "pan") this._mode = null;
        }
    }

    _onMove(e) {
        const p = this._pointers.get(e.pointerId);
        if (!p) return;
        const dx = e.clientX - p.x;
        const dy = e.clientY - p.y;
        p.x = e.clientX;
        p.y = e.clientY;
        if (Math.hypot(e.clientX - this._downX, e.clientY - this._downY) > DRAG_PX) this._moved = true;
        if (this._pointers.size >= 2) { this._moveTwo(); return; }
        if (this._mode === "pan") this._keepUnder(e.clientX, e.clientY);
        else if (this._mode === "rotate") {
            const h = this.dom.clientHeight;
            this.az -= dx / h * Math.PI;
            this.tilt = this._eff + dy / h * Math.PI;
            this.update();
        }
    }

    _onUp(e) {
        if (!this._pointers.delete(e.pointerId)) return;
        if (e.type === "pointerup" && e.pointerType === "touch" && !this._moved
            && this._pointers.size === 0 && this._mode === "pan") this._tap(e);
        if (this._pointers.size === 1) {
            // Back to one finger: regrab under it so the ice does not jump.
            for (const q of this._pointers.values()) {
                this._mode = this._ground(q.x, q.y) ? "pan" : null;
                if (this._mode) this._grab.copy(this._hit);
            }
        } else if (this._pointers.size === 0) this._mode = null;
    }

    _tap(e) {
        const t = this._lastTap;
        const now = performance.now();
        if (now - t.t < TAP_MS && Math.hypot(e.clientX - t.x, e.clientY - t.y) < TAP_PX) {
            t.t = -1e9;
            if (this._ground(e.clientX, e.clientY)) this._flyIn(this._hit);
            return;
        }
        t.t = now; t.x = e.clientX; t.y = e.clientY;
    }

    _twoGeom() {
        const it = this._pointers.values();
        const a = it.next().value;
        const b = it.next().value;
        const g = this._g;
        g.mx = (a.x + b.x) / 2;
        g.my = (a.y + b.y) / 2;
        g.len = Math.hypot(b.x - a.x, b.y - a.y);
        g.ang = Math.atan2(b.y - a.y, b.x - a.x);
        return g;
    }

    _startTwo() {
        this._mode = "two";
        this._moved = true;
        Object.assign(this._two, this._twoGeom(), { acc: 0, accTilt: 0, lock: null });
    }

    _moveTwo() {
        const g = this._twoGeom();
        const s = this._two;
        const dLen = g.len - s.len;
        let dAng = g.ang - s.ang;
        dAng -= Math.round(dAng / (2 * Math.PI)) * 2 * Math.PI;
        const dmy = g.my - s.my;
        // A parallel vertical drag tilts; anything else pinches and twists.
        if (!s.lock) {
            s.acc += Math.abs(dLen) + Math.abs(dAng) * s.len;
            s.accTilt += dmy;
            if (Math.abs(s.accTilt) > 12 && Math.abs(s.accTilt) > s.acc) s.lock = "tilt";
            else if (s.acc > 12) s.lock = "pinch";
        }
        if (s.lock === "tilt") {
            this.tilt = this._eff + dmy / this.dom.clientHeight * Math.PI;
            this.update();
        } else if (s.lock === "pinch") {
            if (this._ground(s.mx, s.my)) {
                this._grab.copy(this._hit);
                // Raw 1:1 pinch ratio felt too fast on phones.
                if (g.len > 1 && s.len > 1) this.dist *= Math.pow(s.len / g.len, 0.6);
                this.az -= dAng;
                this._keepUnder(g.mx, g.my);
            }
        }
        s.mx = g.mx; s.my = g.my; s.len = g.len; s.ang = g.ang;
    }

    _onWheel(e) {
        e.preventDefault();
        let d = e.deltaY;
        if (e.deltaMode === 1) d *= 16;
        else if (e.deltaMode === 2) d *= this.dom.clientHeight;
        // Trackpad pinch arrives as ctrl+wheel with small deltas.
        const k = e.ctrlKey ? 0.01 : 0.0015;
        this._zoomAt(e.clientX, e.clientY, Math.exp(Math.max(-1, Math.min(1, d * k))));
    }
}
