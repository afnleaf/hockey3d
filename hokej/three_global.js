// The app modules read THREE as a global; this keeps that contract while the
// library comes from the pinned npm package instead of a CDN.
import * as THREE from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";

globalThis.THREE = { ...THREE, TrackballControls };
