/* art.js — ぬりえの絵の形（印刷ページとARの両方がこのファイルを使う）
   座標系:
     シート座標 = mm（A4 210x297、原点は左上）
     さかなローカル座標 = 体長1、原点は体の中心、+x が頭の向き、+y が下 */
(function (global) {
  'use strict';

  const SHEET = {
    w: 210, h: 297,
    qr: { x: 150, y: 246, size: 30, text: 'ARNURI-01' },
    // さかなを印刷する位置（mm / mm per unit）
    print: { cx: 105, cy: 133, s: 78, rot: 0, flip: 1 },
    // ARで泳ぎ回る範囲（mm）
    stage: { x: 42, y: 70, w: 126, h: 126 }
  };

  /* ---------- 形状ユーティリティ ---------- */

  // Chaikin の角切り法。制御点列 → なめらかな密な点列
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

  /* ---------- さかな本体 ---------- */
  // z が小さいほど奥。finsBehind は体の後ろ、pect は手前。
  const PARTS = [
    { id: 'tail', role: 'tail', z: 1, closed: true, iters: 3, ctrl: [
      [-0.50, -0.05], [-0.66, -0.23], [-0.90, -0.31], [-0.80, -0.02],
      [-0.90, 0.27], [-0.66, 0.23], [-0.50, 0.05]
    ]},
    { id: 'dorsal', role: 'fin', z: 2, closed: true, iters: 2, ctrl: [
      [0.07, -0.22], [-0.02, -0.47], [-0.13, -0.46], [-0.21, -0.30], [-0.31, -0.15]
    ]},
    { id: 'anal', role: 'fin', z: 2, closed: true, iters: 2, ctrl: [
      [-0.05, 0.22], [-0.11, 0.43], [-0.23, 0.40], [-0.30, 0.13]
    ]},
    { id: 'body', role: 'body', z: 3, closed: true, iters: 3, ctrl: [
      [0.50, 0.00], [0.36, -0.15], [0.14, -0.26], [-0.08, -0.26], [-0.30, -0.17],
      [-0.46, -0.06], [-0.52, 0.00], [-0.46, 0.06], [-0.30, 0.17], [-0.08, 0.26],
      [0.14, 0.26], [0.36, 0.15]
    ]},
    { id: 'spot1', role: 'spot', z: 4, closed: true, ell: [-0.06, -0.07, 0.055, 0.050] },
    { id: 'spot2', role: 'spot', z: 4, closed: true, ell: [-0.22, 0.04, 0.048, 0.044] },
    { id: 'spot3', role: 'spot', z: 4, closed: true, ell: [0.04, 0.10, 0.040, 0.036] },
    { id: 'pect', role: 'fin', z: 5, closed: true, iters: 2, ctrl: [
      [0.22, 0.01], [0.09, 0.21], [-0.02, 0.16], [0.02, 0.03]
    ]},
    { id: 'eye', role: 'eye', z: 6, closed: true, ell: [0.35, -0.07, 0.055, 0.055] },
    { id: 'pupil', role: 'pupil', z: 7, closed: true, ell: [0.365, -0.065, 0.026, 0.026] }
  ];

  // 線として描くもの（塗りなし）
  const LINES = [
    { id: 'gill', z: 6, open: true, iters: 2, ctrl: [
      [0.26, -0.19], [0.31, -0.10], [0.325, 0.00], [0.30, 0.10], [0.26, 0.19]
    ]},
    { id: 'mouth', z: 7, open: true, iters: 2, ctrl: [
      [0.435, 0.055], [0.472, 0.038], [0.492, 0.018]
    ]}
  ];

  // 色を採る場所（ローカル座標）。印刷された「静止した」さかなから採る。
  const ZONES = {
    body: [[-0.02, -0.09], [0.11, -0.16], [-0.21, -0.14], [0.03, 0.13], [-0.25, 0.07]],
    tail: [[-0.75, -0.11], [-0.80, 0.11], [-0.66, 0.00]],
    fin: [[-0.11, -0.34], [0.13, 0.08], [-0.19, 0.30]]
  };

  // 未塗装のときの色（クレヨンで塗ったような既定色）
  const DEFAULT_COLORS = {
    body: '#ff9f45', tail: '#ff6b4a', fin: '#ffd166', spot: '#ffd166',
    eye: '#ffffff', pupil: '#1b2a41', line: '#1b2a41'
  };

  /* ---------- 幾何の前計算 ---------- */
  const geo = PARTS.concat(LINES).map(function (p) {
    let pts;
    if (p.ell) pts = ellipse(p.ell[0], p.ell[1], p.ell[2], p.ell[3], 30);
    else if (p.ctrl) pts = chaikin(p.ctrl, p.iters == null ? 2 : p.iters, p.closed !== false);
    return { def: p, pts: pts };
  });

  /* ---------- 変形（遊泳アニメ） ---------- */
  // 体をくねらせる + 尾びれを付け根で回す
  function deformLocal(pt, t) {
    let x = pt[0], y = pt[1];
    // 体のくねり: 頭では0、尾に向かって大きくなる
    const w = Math.max(0, 0.5 - x);
    y += 0.05 * Math.sin(t * 6.2 - x * 2.0) * Math.pow(w, 1.5);
    return [x, y];
  }
  function deformTail(pt, t) {
    const ax = -0.52, ay = 0.0;
    const ang = 0.26 * Math.sin(t * 6.2 + 1.0);
    const c = Math.cos(ang), s = Math.sin(ang);
    const x = pt[0] - ax, y = pt[1] - ay;
    return [ax + x * c - y * s, ay + x * s + y * c];
  }

  // 尾びれ先端(-0.90)と鼻先(0.50)の中点が cx に来るようにする補正
  const CTR = 0.20;

  // ローカル → シートmm
  function pose(px) {
    // px: {cx, cy, s, rot, flip}
    const c = Math.cos(px.rot || 0), si = Math.sin(px.rot || 0), s = px.s, f = px.flip == null ? 1 : px.flip;
    return function (pt) {
      const X = f * (pt[0] + CTR) * s, Y = pt[1] * s;
      return [px.cx + X * c - Y * si, px.cy + X * si + Y * c];
    };
  }

  // 1つの部品の密な点列をシートmmで返す
  function partPoints(g, px, opt) {
    opt = opt || {};
    const poseF = pose(px);
    const out = [];
    for (let i = 0; i < g.pts.length; i++) {
      let p = g.pts[i];
      if (opt.wiggle) {
        p = g.def.id === 'tail' ? deformTail(p, opt.t) : deformLocal(p, opt.t);
      }
      out.push(poseF(p));
    }
    return out;
  }

  const Art = {
    SHEET: SHEET, PARTS: PARTS, LINES: LINES, ZONES: ZONES,
    DEFAULT_COLORS: DEFAULT_COLORS, geo: geo,
    chaikin: chaikin, ellipse: ellipse, pose: pose,
    deformLocal: deformLocal, deformTail: deformTail,
    partPoints: partPoints,
    // 印刷用: 点列 → SVGパス文字列（小数2桁）
    pathD: function (pts, closed) {
      let d = 'M' + pts.map(function (p) { return p[0].toFixed(2) + ' ' + p[1].toFixed(2); }).join('L');
      return closed === false ? d : d + 'Z';
    }
  };

  global.Art = Art;
  if (typeof module !== 'undefined' && module.exports) module.exports = Art;
})(typeof window !== 'undefined' ? window : globalThis);
