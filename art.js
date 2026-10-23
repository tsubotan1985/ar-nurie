/* ARぬりえ — original fish and little saloon car.
 * Local coordinates: +x forward, +y down; sheet coordinates: millimetres.
 * All paintable shapes are closed polygons; detail lines are open paths.
 * Render outlines with round joins/caps, about 0.7 mm on the printed sheet.
 */
(function (global) {
  'use strict';

  const SHEET = { w: 210, h: 297, qr: { x: 148, y: 236, size: 40 } };

  function chaikin(pts, iters, closed) {
    let p = pts.map(function (pt) { return pt.slice(); });
    if (p.length < 2) return p;
    for (let k = 0; k < iters; k++) {
      const out = [];
      if (!closed) out.push(p[0].slice());
      const count = closed ? p.length : p.length - 1;
      for (let i = 0; i < count; i++) {
        const a = p[i], b = p[(i + 1) % p.length];
        out.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]]);
        out.push([0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
      }
      if (!closed) out.push(p[p.length - 1].slice());
      p = out;
    }
    return p;
  }

  function ellipse(cx, cy, rx, ry, n) {
    n = n || 48;
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = 2 * Math.PI * i / n;
      out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    return out;
  }

  // Sample cubic segments into the same polygon format as ctrl/ell shapes.
  // A segment is [control1, control2, endpoint]; the start is implicit.
  function contour(start, segments, steps) {
    const out = [start.slice()];
    let p = start;
    steps = steps || 16;
    segments.forEach(function (seg) {
      const a = seg[0], b = seg[1], end = seg[2];
      for (let i = 1; i <= steps; i++) {
        const t = i / steps, u = 1 - t;
        out.push([
          u * u * u * p[0] + 3 * u * u * t * a[0] + 3 * u * t * t * b[0] + t * t * t * end[0],
          u * u * u * p[1] + 3 * u * u * t * a[1] + 3 * u * t * t * b[1] + t * t * t * end[1]
        ]);
      }
      p = end;
    });
    // SVG/Canvas closes the last edge; omit a duplicate closing vertex.
    const last = out[out.length - 1];
    if (last[0] === start[0] && last[1] === start[1]) out.pop();
    return out;
  }

  // Broad, shell-like scales rather than spots or fine hatch marks.
  function scaleShape(x, y) {
    return contour([x - 0.058, y - 0.073], [
      [[x + 0.007, y - 0.082], [x + 0.073, y - 0.047], [x + 0.073, y]],
      [[x + 0.073, y + 0.047], [x + 0.007, y + 0.082], [x - 0.058, y + 0.073]],
      [[x - 0.023, y + 0.028], [x - 0.023, y - 0.028], [x - 0.058, y - 0.073]]
    ]);
  }

  const FISH = {
    id: 'ARNURI-01', name: 'さかな', ctr: 0.20,
    print: { cx: 105, cy: 133, s: 76, rot: 0, flip: 1 },
    stage: { x: 44, y: 74, w: 122, h: 118 },
    arScale: 76, bubbles: true,
    colors: {
      body: '#ffb568', tail: '#ff7c83', fin: '#ffd36a',
      scaleA: '#ffdf8d', scaleB: '#ffcf78', scaleC: '#ffad73',
      eye: '#ffffff', pupil: '#182737', line: '#1b2a41'
    },
    parts: [
      // Hidden roots overlap the body generously: no detached fins in motion.
      { id: 'tail', role: 'tail', z: 1, pts: contour([-0.380, -0.085], [
        [[-0.490, -0.085], [-0.580, -0.213], [-0.657, -0.205]],
        [[-0.727, -0.196], [-0.702, -0.067], [-0.669, 0.000]],
        [[-0.702, 0.067], [-0.727, 0.196], [-0.657, 0.205]],
        [[-0.580, 0.213], [-0.490, 0.085], [-0.380, 0.085]],
        [[-0.370, 0.035], [-0.370, -0.035], [-0.380, -0.085]]
      ]) },
      { id: 'dorsal', role: 'fin', z: 2, pts: contour([-0.374, -0.165], [
        [[-0.372, -0.276], [-0.280, -0.367], [-0.221, -0.408]],
        [[-0.209, -0.357], [-0.140, -0.332], [-0.067, -0.327]],
        [[-0.001, -0.323], [0.015, -0.261], [0.026, -0.190]],
        [[-0.097, -0.146], [-0.247, -0.137], [-0.374, -0.165]]
      ]) },
      { id: 'pelvic', role: 'fin', z: 2, pts: contour([-0.251, 0.166], [
        [[-0.255, 0.244], [-0.210, 0.319], [-0.175, 0.360]],
        [[-0.161, 0.309], [-0.074, 0.273], [-0.044, 0.194]],
        [[-0.104, 0.171], [-0.181, 0.153], [-0.251, 0.166]]
      ]) },
      { id: 'body', role: 'body', z: 3, pts: contour([-0.472, 0], [
        [[-0.436, -0.084], [-0.318, -0.207], [-0.162, -0.250]],
        [[0.030, -0.307], [0.238, -0.235], [0.286, -0.086]],
        [[0.319, -0.003], [0.286, 0.130], [0.204, 0.198]],
        [[0.101, 0.281], [-0.065, 0.286], [-0.222, 0.209]],
        [[-0.347, 0.147], [-0.446, 0.073], [-0.472, 0]]
      ]) },
      { id: 'scaleA', role: 'scale', z: 4, pts: scaleShape(-0.307, -0.014) },
      { id: 'scaleB', role: 'scale', z: 4, pts: scaleShape(-0.131, -0.125) },
      { id: 'scaleC', role: 'scale', z: 4, pts: scaleShape(-0.131, 0.117) },
      { id: 'pectoral', role: 'fin', z: 5, pts: contour([0.076, 0.027], [
        [[0.020, 0.049], [-0.012, 0.104], [-0.040, 0.157]],
        [[0.020, 0.168], [0.085, 0.175], [0.121, 0.142]],
        [[0.133, 0.110], [0.110, 0.052], [0.076, 0.027]]
      ]) },
      { id: 'eye', role: 'eye', z: 6, ell: [0.151, -0.089, 0.091, 0.095] },
      { id: 'pupil', role: 'pupil', z: 7, ell: [0.167, -0.082, 0.045, 0.045] },
    ],
    lines: [
      { id: 'gill', z: 6, open: true, pts: contour([0.024, -0.108], [
        [[-0.010, -0.084], [-0.015, -0.033], [0.020, -0.008]]
      ]) },
      { id: 'mouth', z: 7, open: true, pts: contour([0.191, 0.068], [
        [[0.202, 0.108], [0.242, 0.110], [0.260, 0.064]]
      ]) }
    ],
    zones: {
      body: [[-0.310, -0.147], [-0.128, 0.008], [0.071, -0.219]],
      tail: [[-0.634, -0.104], [-0.634, 0.104], [-0.558, 0]],
      fin: [[-0.234, -0.334], [-0.170, 0.301], [0.058, 0.110]],
      dorsal: [[-0.234, -0.334]], pelvic: [[-0.170, 0.301]],
      pectoral: [[0.058, 0.110]],
      scaleA: [[-0.293, -0.014]], scaleB: [[-0.117, -0.125]],
      scaleC: [[-0.117, 0.117]],
      eye: [[0.115, -0.092]], pupil: [[0.167, -0.082]]
    },
    partZone: {
      body: 'body', tail: 'tail', dorsal: 'dorsal', pelvic: 'pelvic',
      pectoral: 'pectoral', scaleA: 'scaleA', scaleB: 'scaleB', scaleC: 'scaleC',
      eye: 'eye', pupil: 'pupil'
    },
    fallback: { dorsal: 'fin', pelvic: 'fin', pectoral: 'fin', scaleA: 'body', scaleB: 'body', scaleC: 'body' },
    deform: function (pt, def, t) {
      let x = pt[0], y = pt[1];
      // Smoothly taper the tail motion to zero at its buried root.
      if (def.id === 'tail') {
        const root = -0.421;
        const weight = Math.max(0, Math.min(1, (root - x) / 0.20));
        const a = 0.20 * weight * Math.sin(t * 5.7);
        const dx = x - root;
        x = root + dx * Math.cos(a) - y * Math.sin(a);
        y = dx * Math.sin(a) + y * Math.cos(a);
      }
      const rear = Math.max(0, -x - 0.05);
      return [x, y + 0.025 * rear * Math.sin(t * 5.7 - 3 * x)];
    },
    center: function (t, st) {
      st = st || this.stage;
      return {
        cx: st.x + st.w * (0.5 + 0.20 * Math.sin(0.37 * t)),
        cy: st.y + st.h * (0.5 + 0.22 * Math.sin(0.51 * t)),
        dirx: st.w * 0.20 * 0.37 * Math.cos(0.37 * t),
        diry: st.h * 0.22 * 0.51 * Math.cos(0.51 * t)
      };
    }
  };

  function wheelParts(cx, suffix) {
    const cy = 0.060;
    const spin = function () { return { pivot: [cx, cy], w: 7 }; };
    const out = [
      { id: 'wheel' + suffix, role: 'wheel', z: 1, ell: [cx, cy, 0.130, 0.130] },
      { id: 'rim' + suffix, role: 'rim', z: 2, ell: [cx, cy, 0.094, 0.094], spin: spin() },
      { id: 'hub' + suffix, role: 'hub', z: 3, ell: [cx, cy, 0.020, 0.020], spin: spin() }
    ];
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + i * 2 * Math.PI / 3;
      out.push({
        id: 'bolt' + suffix + i, role: 'bolt', z: 3,
        ell: [cx + 0.071 * Math.cos(a), cy + 0.071 * Math.sin(a), 0.018, 0.018],
        spin: spin()
      });
    }
    return out;
  }

  function carBody() {
    // Distinct boot, upright cabin, sloping windscreen, and long bonnet.
    const out = contour([-0.510, 0.060], [
      [[-0.518, 0.003], [-0.519, -0.102], [-0.475, -0.135]],
      [[-0.450, -0.156], [-0.392, -0.162], [-0.351, -0.171]],
      [[-0.313, -0.216], [-0.280, -0.307], [-0.236, -0.345]],
      [[-0.213, -0.365], [-0.178, -0.371], [-0.144, -0.371]],
      [[-0.088, -0.371], [-0.016, -0.371], [0.041, -0.364]],
      [[0.097, -0.356], [0.185, -0.232], [0.233, -0.195]],
      [[0.282, -0.182], [0.392, -0.188], [0.453, -0.161]],
      [[0.501, -0.141], [0.517, -0.088], [0.517, -0.041]],
      [[0.517, -0.008], [0.515, 0.035], [0.510, 0.060]]
    ]);
    // Return along the sill, cutting two genuine semicircular wheel openings.
    // Radius is just above the tyre radius: tyres are behind the body, not
    // circles drawn over a bean-shaped silhouette.
    [0.302, -0.291].forEach(function (cx) {
      const radius = 0.168;
      for (let i = 0; i <= 32; i++) {
        const a = -Math.PI * i / 32;
        out.push([cx + radius * Math.cos(a), 0.060 + radius * Math.sin(a)]);
      }
    });
    return out;
  }

  const CAR = {
    id: 'ARNURI-02', name: 'くるま', ctr: 0,
    print: { cx: 105, cy: 150, s: 116, rot: 0, flip: 1 },
    stage: { x: 28, y: 108, w: 154, h: 74 },
    arScale: 116, bubbles: false,
    colors: {
      body: '#f67670', glass: '#b8e7ee', wheel: '#485265', rim: '#e6ebf2',
      hub: '#98acc3', bolt: '#ffd16b', light: '#ffe38c', tail: '#ef635b',
      mirror: '#f7b976', handle: '#ffdeaa', line: '#1b2a41'
    },
    parts: wheelParts(-0.291, 'R').concat(wheelParts(0.302, 'F'), [
      { id: 'body', role: 'body', z: 4, pts: carBody() },
      { id: 'glassR', role: 'glass', z: 5, pts: contour([-0.284, -0.189], [
        [[-0.289, -0.189], [-0.292, -0.193], [-0.288, -0.201]],
        [[-0.267, -0.240], [-0.243, -0.291], [-0.217, -0.311]],
        [[-0.202, -0.322], [-0.153, -0.322], [-0.115, -0.322]],
        [[-0.109, -0.322], [-0.107, -0.319], [-0.107, -0.313]],
        [[-0.107, -0.277], [-0.107, -0.231], [-0.107, -0.198]],
        [[-0.107, -0.192], [-0.109, -0.189], [-0.115, -0.189]],
        [[-0.166, -0.189], [-0.238, -0.189], [-0.284, -0.189]]
      ]) },
      { id: 'glassF', role: 'glass', z: 5, pts: contour([-0.059, -0.322], [
        [[-0.023, -0.322], [0.010, -0.322], [0.033, -0.315]],
        [[0.066, -0.291], [0.114, -0.229], [0.151, -0.198]],
        [[0.157, -0.192], [0.155, -0.189], [0.147, -0.189]],
        [[0.089, -0.189], [0.013, -0.189], [-0.051, -0.189]],
        [[-0.057, -0.189], [-0.059, -0.192], [-0.059, -0.198]],
        [[-0.059, -0.233], [-0.059, -0.279], [-0.059, -0.313]],
        [[-0.059, -0.319], [-0.059, -0.321], [-0.059, -0.322]]
      ]) },
      { id: 'lampF', role: 'light', z: 6, iters: 2, ctrl: [
        [0.408, -0.141], [0.474, -0.133], [0.491, -0.088], [0.419, -0.081]
      ] },
      { id: 'lampR', role: 'tail', z: 6, iters: 2, ctrl: [
        [-0.491, -0.110], [-0.446, -0.111], [-0.444, -0.045], [-0.492, -0.046]
      ] },
      { id: 'handle', role: 'handle', z: 6, iters: 2, ctrl: [
        [-0.015, -0.140], [0.061, -0.140], [0.061, -0.100], [-0.015, -0.100]
      ] },
      { id: 'mirror', role: 'mirror', z: 7, ell: [0.239, -0.139, 0.036, 0.025] }
    ]),
    lines: [
      { id: 'door', z: 6, open: true, pts: [[-0.083, -0.189], [-0.083, 0.035]] },
      { id: 'mirrorArm', z: 6, open: true, pts: contour([0.186, -0.202], [
        [[0.192, -0.180], [0.199, -0.160], [0.211, -0.151]]
      ]) }
    ],
    zones: {
      body: [[-0.020, -0.025], [-0.402, -0.115], [0.380, -0.120]],
      glass: [[-0.191, -0.255], [0.026, -0.250]],
      glassR: [[-0.191, -0.255]], glassF: [[0.026, -0.250]],
      wheel: [[-0.291, 0.190], [0.302, 0.190]],
      rim: [[-0.291, 0.111], [0.302, 0.111]],
      hub: [[-0.291, 0.060], [0.302, 0.060]],
      light: [[0.448, -0.110]], tail: [[-0.468, -0.078]],
      handle: [[0.023, -0.120]], mirror: [[0.239, -0.139]]
    },
    partZone: {
      body: 'body', glassR: 'glassR', glassF: 'glassF',
      wheelR: 'wheel', wheelF: 'wheel', rimR: 'rim', rimF: 'rim',
      hubR: 'hub', hubF: 'hub', lampF: 'light', lampR: 'tail',
      handle: 'handle', mirror: 'mirror'
    },
    fallback: { glassR: 'glass', glassF: 'glass', mirror: 'body', handle: 'body', hubR: 'rim', hubF: 'rim' },
    deform: function (pt, def, t, dir) {
      if (!def.spin) return pt.slice();
      const a = def.spin.w * t * (dir < 0 ? -1 : 1);
      const c = Math.cos(a), s = Math.sin(a), pivot = def.spin.pivot;
      const dx = pt[0] - pivot[0], dy = pt[1] - pivot[1];
      return [pivot[0] + dx * c - dy * s, pivot[1] + dx * s + dy * c];
    },
    center: function (t, st) {
      st = st || this.stage;
      return {
        cx: st.x + st.w * (0.5 + 0.085 * Math.sin(0.44 * t)),
        cy: st.y + st.h * 0.54 + 0.55 * Math.sin(8 * t),
        dirx: Math.cos(0.44 * t), diry: 0
      };
    }
  };

  // Every bolt has its own sampling point (no sampling on the dark outline).
  ['R', 'F'].forEach(function (suffix) {
    CAR.parts.filter(function (p) { return p.role === 'bolt' && p.id.indexOf('bolt' + suffix) === 0; })
      .forEach(function (p) {
        CAR.zones[p.id] = [[p.ell[0], p.ell[1]]];
        CAR.partZone[p.id] = p.id;
        CAR.fallback[p.id] = 'rim';
      });
  });

  const ARTS = { 'ARNURI-01': FISH, 'ARNURI-02': CAR };
  const DEFAULT_ART = 'ARNURI-01';

  function prep(art) {
    function bake(def, closed) {
      const pts = def.pts ? def.pts.map(function (p) { return p.slice(); })
        : def.ell ? ellipse(def.ell[0], def.ell[1], def.ell[2], def.ell[3], 64)
          : chaikin(def.ctrl, def.iters == null ? 2 : def.iters, closed);
      return { def: def, pts: pts };
    }
    // Keep array order and z order consistent for both existing renderers.
    art.parts.sort(function (a, b) { return a.z - b.z; });
    art.lines.sort(function (a, b) { return a.z - b.z; });
    art.geo = art.parts.map(function (p) { return bake(p, true); });
    art.lineGeo = art.lines.map(function (p) { return bake(p, false); });
    return art;
  }
  Object.keys(ARTS).forEach(function (key) { prep(ARTS[key]); });

  function pose(px, ctr) {
    const c = Math.cos(px.rot || 0), s = Math.sin(px.rot || 0);
    const flip = px.flip == null ? 1 : px.flip;
    return function (pt) {
      const x = (pt[0] + (ctr || 0)) * px.s * flip, y = pt[1] * px.s;
      return [px.cx + x * c - y * s, px.cy + x * s + y * c];
    };
  }

  function partPoints(geo, px, opt) {
    opt = opt || {};
    const art = opt.art, transform = pose(px, art ? art.ctr : 0);
    return geo.pts.map(function (pt) {
      const p = opt.wiggle && art && art.deform
        ? art.deform(pt, geo.def, opt.t || 0, opt.dir == null ? 1 : opt.dir) : pt;
      return transform(p);
    });
  }

  function pathD(pts, closed) {
    if (!pts.length) return '';
    const d = 'M' + pts.map(function (p) {
      return p[0].toFixed(2) + ' ' + p[1].toFixed(2);
    }).join('L');
    return closed === false ? d : d + 'Z';
  }

  const Art = {
    ARTS: ARTS, SHEET: SHEET, pose: pose, partPoints: partPoints,
    chaikin: chaikin, ellipse: ellipse, pathD: pathD, prep: prep,
    DEFAULT_ART: DEFAULT_ART
  };
  global.Art = Art;
  if (typeof module !== 'undefined' && module.exports) module.exports = Art;
})(typeof window !== 'undefined' ? window : globalThis);
// 2026-10-23 rev.2
