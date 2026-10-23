/* art.js — ぬりえの絵の形（印刷ページとARの両方がこのファイルを使う）
   座標系:
     シート座標 = mm（A4 210x297、原点は左上）
     作品ローカル座標 = 長さ1、+x が進行方向、+y が下

   用紙は複数。QRの中身（ARNURI-xx）で作品を切り替える。
   QRの位置・大きさは用紙共通（1か所）なので、ホモグラフィの計算は全用紙で同じ。 */
(function (global) {
  'use strict';

  const SHEET = {
    w: 210, h: 297,
    // QRは共通位置・大きさ。大きいほど紙面の遠くまで精度が出る（30→40mmに拡大）
    qr: { x: 148, y: 236, size: 40 }
  };

  /* ---------- 形状ユーティリティ ---------- */
  function chaikin(pts, iters, closed) {
    let p = pts.slice();
    for (let k = 0; k < iters; k++) {
      const out = [];
      const n = p.length;
      if (!closed) out.push(p[0]);
      const last = closed ? n : n - 1;
      for (let i = 0; i < last; i++) {
        const a = p[i], b = p[(i + 1) % n];
        out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
        out.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
      }
      if (!closed) out.push(p[n - 1]);
      p = out;
    }
    return p;
  }

  function ellipse(cx, cy, rx, ry, n) {
    n = n || 28;
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return out;
  }

  /* =====================================================================
     さかな（ARNURI-01）
     ===================================================================== */
  const FISH = {
    id: 'ARNURI-01',
    name: 'さかな',
    ctr: 0.20,                       // 尾の先端(-0.90)と鼻先(0.50)の中点を cx に合わせる
    print: { cx: 105, cy: 133, s: 68, rot: 0, flip: 1 },
    stage: { x: 44, y: 74, w: 122, h: 118 },
    arScale: 68,
    bubbles: true,
    colors: { body: '#ff9f45', tail: '#ff6b4a', fin: '#ffd166', spot: '#c98a2e', eye: '#ffffff', pupil: '#132132', line: '#1b2a41' },
    parts: [
      { id: 'tail', role: 'tail', z: 1, iters: 3, ctrl: [
        [-0.50, -0.05], [-0.66, -0.23], [-0.90, -0.31], [-0.80, -0.02],
        [-0.90, 0.27], [-0.66, 0.23], [-0.50, 0.05]
      ]},
      { id: 'dorsal', role: 'fin', z: 2, iters: 2, ctrl: [
        [0.07, -0.22], [-0.02, -0.47], [-0.13, -0.46], [-0.21, -0.30], [-0.31, -0.15]
      ]},
      { id: 'anal', role: 'fin', z: 2, iters: 2, ctrl: [
        [-0.05, 0.22], [-0.11, 0.43], [-0.23, 0.40], [-0.30, 0.13]
      ]},
      { id: 'body', role: 'body', z: 3, iters: 3, ctrl: [
        [0.50, 0.00], [0.36, -0.15], [0.14, -0.26], [-0.08, -0.26], [-0.30, -0.17],
        [-0.46, -0.06], [-0.52, 0.00], [-0.46, 0.06], [-0.30, 0.17], [-0.08, 0.26],
        [0.14, 0.26], [0.36, 0.15]
      ]},
      { id: 'spot1', role: 'spot', z: 4, ell: [-0.06, -0.07, 0.055, 0.050] },
      { id: 'spot2', role: 'spot', z: 4, ell: [-0.22, 0.04, 0.048, 0.044] },
      { id: 'spot3', role: 'spot', z: 4, ell: [0.13, -0.16, 0.040, 0.036] },
      { id: 'pect', role: 'fin', z: 5, iters: 2, ctrl: [
        [0.22, 0.01], [0.09, 0.21], [-0.02, 0.16], [0.02, 0.03]
      ]},
      { id: 'eye', role: 'eye', z: 6, ell: [0.35, -0.07, 0.055, 0.055] },
      { id: 'pupil', role: 'pupil', z: 7, ell: [0.365, -0.065, 0.026, 0.026] }
    ],
    lines: [
      { id: 'gill', z: 6, open: true, iters: 2, ctrl: [
        [0.26, -0.19], [0.31, -0.10], [0.325, 0.00], [0.30, 0.10], [0.26, 0.19]
      ]},
      { id: 'mouth', z: 7, open: true, iters: 2, ctrl: [
        [0.435, 0.055], [0.472, 0.038], [0.492, 0.018]
      ]}
    ],
    zones: {
      body: [[-0.02, -0.07], [0.10, -0.12], [-0.16, -0.10], [-0.05, 0.12], [-0.25, 0.02]],
      tail: [[-0.75, -0.11], [-0.80, 0.11], [-0.66, 0.00]],
      fin: [[-0.11, -0.34], [0.13, 0.08], [-0.19, 0.30]],
      dorsal: [[-0.06, -0.36], [-0.16, -0.31]],
      anal: [[-0.15, 0.32], [-0.24, 0.30]],
      pect: [[0.14, 0.09], [0.06, 0.14]],
      spot1: [[-0.06, -0.07]],
      spot2: [[-0.22, 0.04]],
      spot3: [[0.13, -0.16]]
    },
    partZone: {
      body: 'body', tail: 'tail', dorsal: 'dorsal', anal: 'anal', pect: 'pect',
      spot1: 'spot1', spot2: 'spot2', spot3: 'spot3'
    },
    fallback: { dorsal: 'fin', anal: 'fin', pect: 'fin', spot1: 'fin', spot2: 'fin', spot3: 'fin' },
    // 遊泳: 体をくねらせ、尾びれを付け根で回す
    deform: function (pt, def, t) {
      let x = pt[0], y = pt[1];
      if (def.id === 'tail') {
        const ax = -0.52, ang = 0.26 * Math.sin(t * 6.2 + 1.0);
        const c = Math.cos(ang), s = Math.sin(ang);
        const dx = x - ax, dy = y;
        return [ax + dx * c - dy * s, dx * s + dy * c];
      }
      const w = Math.max(0, 0.5 - x);
      y += 0.05 * Math.sin(t * 6.2 - x * 2.0) * Math.pow(w, 1.5);
      return [x, y];
    },
    center: function (t, st) {
      const b1 = t * 0.33, b2 = t * 0.47;
      const cx = st.x + st.w / 2 + st.w * 0.30 * Math.sin(b1);
      const cy = st.y + st.h / 2 + st.h * 0.26 * Math.sin(b2);
      const vx = Math.cos(b1), vy = Math.cos(b2) * (st.h * 0.47) / (st.w * 0.33);
      return { cx: cx, cy: cy, dirx: vx, diry: vy };
    }
  };

  /* =====================================================================
     くるま（ARNURI-02）
     ===================================================================== */
  function wheel(cx, cy, r1, r2, rd, rdot, z0) {
    const parts = [
      { id: 'wheel' + (cx > 0 ? 'F' : 'R'), role: 'wheel', z: z0, ell: [cx, cy, r1, r1] },
      { id: 'hub' + (cx > 0 ? 'F' : 'R'), role: 'hub', z: z0 + 1, ell: [cx, cy, r2, r2],
        spin: { pivot: [cx, cy], w: 7 } }
    ];
    for (let i = 0; i < 3; i++) {
      const a = i * 2 * Math.PI / 3 + 0.4;
      parts.push({
        id: 'dot' + (cx > 0 ? 'F' : 'R') + i, role: 'dot', z: z0 + 1,
        ell: [cx + Math.cos(a) * rd, cy + Math.sin(a) * rd, rdot, rdot],
        spin: { pivot: [cx, cy], w: 7 }
      });
    }
    return parts;
  }

  const CAR = {
    id: 'ARNURI-02',
    name: 'くるま',
    ctr: 0.0,
    print: { cx: 105, cy: 150, s: 92, rot: 0, flip: 1 },
    stage: { x: 34, y: 112, w: 142, h: 78 },
    arScale: 92,
    bubbles: false,
    colors: {
      body: '#ef5350', glass: '#a9d9f2', wheel: '#3b4a5f',
      hub: '#dbe4ef', dot: '#dbe4ef', light: '#ffe066', tail: '#ffab6b', line: '#1b2a41'
    },
    parts: [
      // タイヤ（体の後ろ）
      { id: 'wheelR', role: 'wheel', z: 1, ell: [-0.30, 0.05, 0.168, 0.168] },
      { id: 'wheelF', role: 'wheel', z: 1, ell: [0.30, 0.05, 0.168, 0.168] },
      { id: 'hubR', role: 'hub', z: 2, ell: [-0.30, 0.05, 0.060, 0.060], spin: { pivot: [-0.30, 0.05], w: 7 } },
      { id: 'hubF', role: 'hub', z: 2, ell: [0.30, 0.05, 0.060, 0.060], spin: { pivot: [0.30, 0.05], w: 7 } },
      { id: 'dotR0', role: 'dot', z: 2, ell: [-0.30 + Math.cos(0.4) * 0.10, 0.02 + Math.sin(0.4) * 0.10, 0.019, 0.019], spin: { pivot: [-0.30, 0.02], w: 7 } },
      { id: 'dotR1', role: 'dot', z: 2, ell: [-0.30 + Math.cos(2.49) * 0.10, 0.02 + Math.sin(2.49) * 0.10, 0.019, 0.019], spin: { pivot: [-0.30, 0.02], w: 7 } },
      { id: 'dotR2', role: 'dot', z: 2, ell: [-0.30 + Math.cos(4.58) * 0.10, 0.02 + Math.sin(4.58) * 0.10, 0.019, 0.019], spin: { pivot: [-0.30, 0.02], w: 7 } },
      { id: 'dotF0', role: 'dot', z: 2, ell: [0.30 + Math.cos(0.4) * 0.10, 0.02 + Math.sin(0.4) * 0.10, 0.019, 0.019], spin: { pivot: [0.30, 0.02], w: 7 } },
      { id: 'dotF1', role: 'dot', z: 2, ell: [0.30 + Math.cos(2.49) * 0.10, 0.02 + Math.sin(2.49) * 0.10, 0.019, 0.019], spin: { pivot: [0.30, 0.02], w: 7 } },
      { id: 'dotF2', role: 'dot', z: 2, ell: [0.30 + Math.cos(4.58) * 0.10, 0.02 + Math.sin(4.58) * 0.10, 0.019, 0.019], spin: { pivot: [0.30, 0.02], w: 7 } },
      // 車体
      { id: 'body', role: 'body', z: 3, iters: 3, ctrl: [
        [0.50, 0.07], [0.505, -0.04], [0.46, -0.12], [0.30, -0.15], [0.20, -0.24],
        [0.13, -0.31], [-0.13, -0.31], [-0.20, -0.24], [-0.30, -0.16], [-0.46, -0.13],
        [-0.505, -0.04], [-0.50, 0.07]
      ]},
      // 窓
      { id: 'glassF', role: 'glass', z: 4, iters: 2, ctrl: [
        [0.175, -0.155], [0.115, -0.275], [-0.005, -0.275], [-0.005, -0.155]
      ]},
      { id: 'glassR', role: 'glass', z: 4, iters: 2, ctrl: [
        [-0.045, -0.155], [-0.045, -0.275], [-0.125, -0.275], [-0.205, -0.155]
      ]},
      // ライト
      { id: 'lampF', role: 'light', z: 4, ell: [0.455, -0.055, 0.042, 0.036] },
      { id: 'lampR', role: 'tail', z: 4, ell: [-0.46, -0.055, 0.036, 0.032] }
    ],
    lines: [
      { id: 'door', z: 5, open: true, iters: 1, ctrl: [[-0.02, -0.14], [-0.015, 0.05]] },
      { id: 'handle', z: 5, open: true, iters: 1, ctrl: [[-0.10, -0.09], [-0.05, -0.09]] },
      { id: 'bumperF', z: 5, open: true, iters: 2, ctrl: [[0.44, 0.05], [0.48, 0.06]] },
      { id: 'bumperR', z: 5, open: true, iters: 2, ctrl: [[-0.44, 0.05], [-0.48, 0.06]] }
    ],
    zones: {
      body: [[0.40, 0.00], [-0.40, 0.00], [0.06, 0.02], [0.26, -0.02], [-0.26, -0.02]],
      glass: [[0.12, -0.20], [-0.10, -0.20]],
      wheel: [[0.30, 0.15], [-0.30, 0.15]],
      hub: [[0.30, 0.05], [-0.30, 0.05]],
      light: [[0.455, -0.055]],
      tail: [[-0.46, -0.055]]
    },
    partZone: {
      body: 'body', glassF: 'glass', glassR: 'glass',
      wheelF: 'wheel', wheelR: 'wheel', hubF: 'hub', hubR: 'hub',
      lampF: 'light', lampR: 'tail'
    },
    fallback: { glassF: 'glass', glassR: 'glass', hubF: 'wheel', hubR: 'wheel' },
    // 走行: タイヤ（ハブ・スポーク）が回る
    deform: function (pt, def, t, dir) {
      if (!def.spin) return pt;
      const a = def.spin.w * t * (dir < 0 ? -1 : 1);
      const c = Math.cos(a), s = Math.sin(a);
      const dx = pt[0] - def.spin.pivot[0], dy = pt[1] - def.spin.pivot[1];
      return [def.spin.pivot[0] + dx * c - dy * s, def.spin.pivot[1] + dx * s + dy * c];
    },
    center: function (t, st) {
      const b = t * 0.42;
      const cx = st.x + st.w / 2 + st.w * 0.34 * Math.sin(b);
      const cy = st.y + st.h / 2 + 2.2 * Math.sin(t * 9.0);
      return { cx: cx, cy: cy, dirx: Math.cos(b), diry: 0.02 * Math.cos(t * 9.0) };
    }
  };

  const ARTS = { 'ARNURI-01': FISH, 'ARNURI-02': CAR };
  const DEFAULT_ART = 'ARNURI-01';

  /* ---------- 前計算（各作品の点列を焼く） ---------- */
  function prep(a) {
    a.geo = a.parts.map(function (p) {
      const pts = p.ell ? ellipse(p.ell[0], p.ell[1], p.ell[2], p.ell[3], 30)
                        : chaikin(p.ctrl, p.iters == null ? 2 : p.iters, true);
      return { def: p, pts: pts };
    });
    a.lineGeo = a.lines.map(function (l) {
      return { def: l, pts: chaikin(l.ctrl, l.iters == null ? 2 : l.iters, false) };
    });
    return a;
  }
  Object.keys(ARTS).forEach(function (k) { prep(ARTS[k]); });

  /* ---------- 変換 ---------- */
  function pose(px, ctr) {
    const c = Math.cos(px.rot || 0), si = Math.sin(px.rot || 0), s = px.s, f = px.flip == null ? 1 : px.flip;
    const off = ctr || 0;
    return function (pt) {
      const X = f * (pt[0] + off) * s, Y = pt[1] * s;
      return [px.cx + X * c - Y * si, px.cy + X * si + Y * c];
    };
  }

  // 1部品の密な点列をシートmmで返す
  function partPoints(g, px, opt) {
    opt = opt || {};
    const art = opt.art;
    const poseF = pose(px, art ? art.ctr : 0);
    const out = [];
    for (let i = 0; i < g.pts.length; i++) {
      let p = g.pts[i];
      if (opt.wiggle && art && art.deform) p = art.deform(p, g.def, opt.t || 0, opt.dir || 1);
      out.push(poseF(p));
    }
    return out;
  }

  const Art = {
    SHEET: SHEET, ARTS: ARTS, DEFAULT_ART: DEFAULT_ART,
    chaikin: chaikin, ellipse: ellipse, pose: pose, partPoints: partPoints, prep: prep,
    pathD: function (pts, closed) {
      let d = 'M' + pts.map(function (p) { return p[0].toFixed(2) + ' ' + p[1].toFixed(2); }).join('L');
      return closed === false ? d : d + 'Z';
    }
  };

  global.Art = Art;
  if (typeof module !== 'undefined' && module.exports) module.exports = Art;
})(typeof window !== 'undefined' ? window : globalThis);
