 

/* -------------------------
   1) Utility: seeded random
------------------------- */
function hashString(str){
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0);
}
function mulberry32(a){
  return function(){
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}
function clamp(x,min,max){ return Math.max(min, Math.min(max, x)); }

/* -------------------------
   2) Mapping: answers -> params
------------------------- */
function getAnswers(){
  const moveCount = document.getElementById('moveCount').value; // F1/F2/F3
  const scaleMax  = document.getElementById('scaleMax').value;  // S1..S4
  const stability = document.getElementById('stability').value; // low/med/high
  const control   = document.getElementById('control').value;   // none/weak/strong
  const tr        = document.getElementById('tr').value;        // T1..T5
  const externalArc = document.getElementById('externalArc').value; // none/subtle/moderate/strong
  const whiteOrbit = document.getElementById('whiteOrbit').value; // yes/no
  
  // Get anchor ratings (0-3 for each anchor type)
  const anchorRatings = {
    place: parseInt(document.querySelector('input[name="place"]:checked')?.value || '0'),
    object: parseInt(document.querySelector('input[name="object"]:checked')?.value || '0'),
    person: parseInt(document.querySelector('input[name="person"]:checked')?.value || '0'),
    lang: parseInt(document.querySelector('input[name="lang"]:checked')?.value || '0')
  };
  
  return { moveCount, scaleMax, stability, control, tr, externalArc, whiteOrbit, anchorRatings };
}

function mapAnswersToParams(a){
  const ghostCount = (a.moveCount === 'F1') ? 1 : (a.moveCount === 'F2' ? 3 : (a.moveCount === 'F3' ? 5 : 0));

  // scale offset bins (pixels)
  const scaleOffset = ({S1:20, S2:35, S3:50, S4:70})[a.scaleMax] ?? 35;

  // stability -> 用于渐变纹理
  const stability = a.stability; // low/med/high

  // outer boundary style
  const boundary = a.control; // none/weak/strong

  // TR -> connection style + curve intensity
  const connection = a.tr; // T1..T5
  const curveIntensity = ({T1:0.0, T2:0.35, T3:0.55, T4:0.8, T5:0.95})[a.tr] ?? 0.6;

  // colored dots with ratings
  const dotSpecs = [];
  // palette (close to your original vibe)
  const C = {
    place:  '#2f5a3a',  // green
    object: '#d0b24a',  // yellow
    person: '#b15a3c',  // orange
    lang:   '#3b6ea8'   // blue
  };
  // Build dot specs: only include anchors with rating > 0
  ['place', 'object', 'person', 'lang'].forEach(key => {
    const rating = a.anchorRatings[key];
    if (rating > 0) {
      dotSpecs.push({ type: key, color: C[key], rating });
    }
  });

  // external arc params - 所有选项都显示90°总弧，但实线/虚线比例不同
  let arcStartDeg, arcEndDeg, arcOpacity, arcWidth, arcSolidDeg, arcDashedDeg;
  if (!a.externalArc) {
    // Empty/not selected - don't show arc
    arcStartDeg = 0;
    arcEndDeg = 0;
    arcOpacity = 0;
    arcWidth = 0;
    arcSolidDeg = 0;
    arcDashedDeg = 0;
  } else if (a.externalArc === 'none') {
    // Mostly inward: 不显示
    arcStartDeg = 0;
    arcEndDeg = 0;
    arcOpacity = 0;
    arcWidth = 0;
    arcSolidDeg = 0;
    arcDashedDeg = 0;
  } else if (a.externalArc === 'subtle') {
    // Occasional: 60° 虚线 + 30° 实线
    arcStartDeg = 45;
    arcEndDeg = 135;    // 90度总弧
    arcOpacity = 0.95;
    arcWidth = 2.5;
    arcSolidDeg = 30;   // 后30度实线
    arcDashedDeg = 60;  // 前60度虚线
  } else if (a.externalArc === 'moderate') {
    // Regular: 30° 虚线 + 60° 实线
    arcStartDeg = 45;
    arcEndDeg = 135;    // 90度总弧
    arcOpacity = 0.95;
    arcWidth = 2.5;
    arcSolidDeg = 60;   // 后60度实线
    arcDashedDeg = 30;  // 前30度虚线
  } else { // strong
    // Sustained: 90° 实线
    arcStartDeg = 45;
    arcEndDeg = 135;    // 90度总弧
    arcOpacity = 0.95;
    arcWidth = 2.5;
    arcSolidDeg = 90;   // 全90度实线
    arcDashedDeg = 0;
  }

  // deterministic randomness seed (only based on moveCount and scaleMax)
  const seed = hashString(JSON.stringify({moveCount: a.moveCount, scaleMax: a.scaleMax}));
  return {
    ghostCount, scaleOffset, stability, boundary,
    connection, curveIntensity, dotSpecs, seed,
    arcOpacity, arcWidth, arcStartDeg, arcEndDeg, arcSolidDeg, arcDashedDeg,
    showWhiteOrbit: a.whiteOrbit === 'selective' || a.whiteOrbit === 'mixed',
    orbitStyle: a.whiteOrbit === 'selective' ? 'solid' : 'dashed'
  };
}

/* -------------------------
   3) SVG renderer
------------------------- */
function buildIconSVG(p){
  const W=720, H=420;
  const cx=340, cy=210;
  const R=120;

  const rnd = mulberry32(p.seed);

  // ghost circles: only show if ghostCount is valid (user has selected moveCount)
  let ghosts = '';
  if (p.ghostCount > 0) {
    for (let i = 0; i < p.ghostCount; i++) {
      // 根据 ghostCount 确定角度范围
      let minAngle, maxAngle;
      if (p.ghostCount === 1) {
        // F1：单个，固定在 225°
        minAngle = 225;
        maxAngle = 225;
      } else if (p.ghostCount === 3) {
        // F2：3个，都在 180°-270° 范围
        minAngle = 180;
        maxAngle = 270;
      } else {
        // F3：5个，在 160°-290° 范围
        minAngle = 160;
        maxAngle = 290;
      }

      // 分配角度：第一个取最小，最后一个取最大，中间随机
      let angleDeg;
      if (i === 0) {
        angleDeg = minAngle;  // 第一个确保达到最小角度
      } else if (i === p.ghostCount - 1) {
        angleDeg = maxAngle;  // 最后一个确保达到最大角度
      } else {
        // 中间的随机分布在范围内
        angleDeg = minAngle + rnd() * (maxAngle - minAngle);
      }
      let offsetPx;
      if (i === p.ghostCount - 1) {
        offsetPx = p.scaleOffset; // 最后一个 ghost 确保达到最大偏移
      } else {
        offsetPx = (rnd() * 0.9 + 0.1) * p.scaleOffset;
      }
      const rad = angleDeg * Math.PI / 180;
      const dx = Math.cos(rad) * offsetPx;
      const dy = Math.sin(rad) * offsetPx;
      const gx = cx + dx;
      const gy = cy + dy;

    // “点”的密度（越小越密）
    const DOT_GAP = 10;        // 你可以试 12~18
    const DOT_LEN = 1;      // 关键：接近 0 才会是圆点
    const GHOST_STROKE = 3;  // 粗细：你可以试 8~12

    // 每个 ghost circle 的流动速度略有不同
    const speed = (18 + i*6 + rnd()*6).toFixed(1);

    ghosts += `<circle
      class="ghost-circle"
      style="--spd:${speed}s"
      cx="${gx.toFixed(2)}"
      cy="${gy.toFixed(2)}"
      r="${R}"
      fill="none"
      stroke="#666"
      stroke-width="${GHOST_STROKE}"
      stroke-linecap="round"
      stroke-dasharray="${DOT_LEN} ${DOT_GAP}"
      stroke-dashoffset="0"
      opacity="1"
      shape-rendering="crispEdges"
    />`;
    }
  }

  // outer boundary: subtle color halo instead of stroke
  let boundary = '';
  if (p.boundary === 'strong'){
    boundary = `<circle cx="${cx}" cy="${cy}" r="${R+8}" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="8" opacity="1"/>`;
  } else if (p.boundary === 'weak'){
    boundary = `<circle cx="${cx}" cy="${cy}" r="${R+5}" fill="none" stroke="rgba(0,0,0,0.10)" stroke-width="5" opacity="1"/>`;
  }

  // black form
  const black = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#stabilityGradient)" opacity="1"/>`;

  // meaning white form (under black), 45° down-right offset
  const wx = cx + 40, wy = cy + 40;
  const white = `<circle cx="${wx}" cy="${wy}" r="${R}" fill="#fff" opacity="0.95"/>`;

  // highlight crescent feel (mask-ish) — keep simple: a white arc "slice"
  const crescent = `<path d="
    M ${cx+R*0.55} ${cy-R*0.95}
    A ${R*0.95} ${R*0.95} 0 0 1 ${cx+R*0.55} ${cy+R*0.95}
    A ${R*0.55} ${R*0.55} 0 0 0 ${cx+R*0.55} ${cy-R*0.95}
  " fill="#fff" opacity="0.95"/>`;

  // orbit: dashed (mixed) or solid (selective)
  const orbitDasharray = p.orbitStyle === 'solid' ? 'none' : '1 10';
  const orbit = p.showWhiteOrbit ? `<circle cx="${cx+60}" cy="${cy+60}" r="${R}" fill="none"
    stroke="#fff" stroke-width="3" ${orbitDasharray !== 'none' ? `stroke-dasharray="${orbitDasharray}"` : ''} stroke-linecap="round" opacity="1"/>` : '';

  /* -------------------------
     TR connections (T1..T5) — wavy style
  ------------------------- */

  // 统一线条风格
  const TR_STROKE = "#d0b24a";
  const TR_OPACITY = 1;

  // 生成直线路径（从曲线改为直线）
  function straightPath(x1, y1, x2, y2) {
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }

  function wavyStroke(pathD, {
    width = 6,
    dashed = false,
    dash = "10 10",
    opacity = TR_OPACITY
  } = {}) {
    return `<path d="${pathD}" fill="none"
      stroke="${TR_STROKE}"
      stroke-width="${width}"
      stroke-linecap="butt"
      stroke-linejoin="round"
      ${dashed ? `stroke-dasharray="${dash}"` : ""}
      opacity="${opacity}"
    />`;
  }

  // 两个参考点：黑圈中心 & 白圈中心（你现有逻辑）
  const bx = cx, by = cy;
  const mx = wx, my = wy;

  // 偏移量：往右下角移动，距离黑圈圆心更远
  const offsetX = 40, offsetY = 40;

  // 你希望：T2/T3/T4 是“斜向 45° 相互平行”
  // 我建议固定为从黑圈内部某个起始带（右下区域）指向白圈方向，
  // 再用 phase / 小偏移保证三条线平行但不重叠。
  const baseStart = { x: bx + 10 + offsetX, y: by + 10 + offsetY };
  const baseEnd   = { x: mx + 30 + offsetX, y: my + 30 + offsetY };

  // 一条平行位移（让三条线保持 45°视觉、并且彼此平行）
  // 这里用“法向位移”来做平行线
  function parallelShift(pt, nx, ny, s){
    return { x: pt.x + nx*s, y: pt.y + ny*s };
  }

  // 计算 base 向量的法向（用于平行偏移）
  (function(){
    // 仅用于下面 connections 的计算，不污染全局
  })();

  const baseDx = baseEnd.x - baseStart.x;
  const baseDy = baseEnd.y - baseStart.y;
  const baseLen = Math.hypot(baseDx, baseDy) || 1;
  const baseNx = -baseDy / baseLen;
  const baseNy =  baseDx / baseLen;

  let connections = "";

  // ========== T1 ==========
  // T1: Internalization — no visible connection
  if (p.connection === "T1") {
    connections = "";

  // ========== T2 ==========
  // T2: Small adjustments — 2条平行虚线
  } else if (p.connection === "T2") {
    const offsets = [-7, 7];
    connections = offsets.map((off) => {
      const s = parallelShift(baseStart, baseNx, baseNy, off);
      const e = parallelShift(baseEnd,   baseNx, baseNy, off);
      const d = straightPath(s.x, s.y, e.x, e.y);
      return wavyStroke(d, { width: 4, dashed: true, dash: "8 10", opacity: 0.9 });
    }).join("");

  // ========== T3 ==========
  // T3: Speak up / direct change — 2条平行实线
  } else if (p.connection === "T3") {
    const offsets = [-7, 7];
    connections = offsets.map((off) => {
      const s = parallelShift(baseStart, baseNx, baseNy, off);
      const e = parallelShift(baseEnd,   baseNx, baseNy, off);
      const d = straightPath(s.x, s.y, e.x, e.y);
      return wavyStroke(d, { width: 5, dashed: false, opacity: 0.95 });
    }).join("");

  // ========== T4 ==========
  // T4: Construction — 3条平行实线直线（45°并行）
  } else if (p.connection === "T4") {
    const offsets = [-14, 0, 14];
    connections = offsets.map((off, i) => {
      const s = parallelShift(baseStart, baseNx, baseNy, off);
      const e = parallelShift(baseEnd,   baseNx, baseNy, off);
      const d = straightPath(s.x, s.y, e.x, e.y);
      return wavyStroke(d, { width: 5, dashed: false, opacity: 0.95 });
    }).join("");

  // ========== T5 ==========
  // T5: Collective construction — 三条线都直接从黑圈内部出发，参考同一条方向基准，中线=T4中线，另外两条在两侧轻微偏移
  } else if (p.connection === "T5") {
    // Start points: offset from baseStart
    const start_mid = baseStart;
    const start_left = parallelShift(baseStart, baseNx, baseNy, -25);
    const start_right = parallelShift(baseStart, baseNx, baseNy, 25);
    
    // End points: offset from baseEnd
    const end_mid = baseEnd;
    const end_left = parallelShift(baseEnd, baseNx, baseNy, -35);
    const end_right = parallelShift(baseEnd, baseNx, baseNy, 35);
    
    const d_mid = straightPath(start_mid.x, start_mid.y, end_mid.x, end_mid.y);
    const d_left = straightPath(start_left.x, start_left.y, end_left.x, end_left.y);
    const d_right = straightPath(start_right.x, start_right.y, end_right.x, end_right.y);

    connections = [
      wavyStroke(d_mid, { width: 5, dashed: false, opacity: 0.95 }),
      wavyStroke(d_left, { width: 5, dashed: false, opacity: 0.95 }),
      wavyStroke(d_right, { width: 5, dashed: false, opacity: 0.95 })
    ].join("");
  }

  /* -------------------------
     External curved line (beyond-self engagement)
     圆弧几何：
     - 圆心 (cxExt, cyExt): 沿T-direction向外延伸，位于黑圆外围
     - 半径 rExt: 大半径 (~2.5 * R)，创建浅扫掠弧
     - 只有弧角度在选项间变化；圆心和半径保持固定
  ------------------------- */

  // Calculate T-direction unit vector (from baseStart to baseEnd)
  const tDirX = baseEnd.x - baseStart.x;
  const tDirY = baseEnd.y - baseStart.y;
  const tDirLen = Math.hypot(tDirX, tDirY) || 1;
  const tUnitX = tDirX / tDirLen;
  const tUnitY = tDirY / tDirLen;
  
  // External arc center: use fixed coordinates, independent of any options
  // 圆心固定，不会随选项改变
  const cxExt = 490;   // 固定的 x 坐标（可调整）
  const cyExt = 220;   // 固定的 y 坐标（可调整）
  
  // Large fixed radius for shallow sweeping arc
  const rExt = 1.5 * R;  // ~300px
  
  // Helper function to convert polar to cartesian (standard: 0°=right, 90°=down in SVG coords)
  function polarToCartesian(cx, cy, radius, angleDeg) {
    const angleRad = angleDeg * Math.PI / 180.0;
    return {
      x: cx + (radius * Math.cos(angleRad)),
      y: cy + (radius * Math.sin(angleRad))
    };
  }
  
  // Use original angles directly (no confusing offsets)
  // Note: angles are measured from standard polar (0°=right, increases counterclockwise)
  const baseStartPt = polarToCartesian(cxExt, cyExt, rExt, p.arcStartDeg);
  const baseEndPt = polarToCartesian(cxExt, cyExt, rExt, p.arcEndDeg);

  // 不旋转，不缩放，直接使用计算出来的端点
  // 这样圆心和圆弧都完全独立于选项变化
  const startFinal = baseStartPt;
  const endFinal = baseEndPt;
  
  // Determine arc flags: use sweep=0 for clockwise direction (downward smile arc)
  let arcSpan = p.arcEndDeg - p.arcStartDeg;

  // 保底：如果将来出现 end < start，统一成正跨度（不改视觉逻辑）
  if (arcSpan < 0) arcSpan += 360;

  // 你现在的 subtle/moderate/strong 都是 30/60/90，永远应该走"小弧"=0
  const largeArcFlag = arcSpan > 180 ? 1 : 0;

  // 方向保持你目前满意的（向下的"笑脸"那侧）
  const sweepFlag = 1;  // counterclockwise sweep
  
  // Generate external arc - support solid + dashed segments
  let externalArc = '';
  if (p.arcOpacity > 0.02 && arcSpan > 0 && p.arcWidth) {
    // If only solid segment
    if (p.arcDashedDeg === 0) {
      externalArc = `<path d="M ${startFinal.x.toFixed(2)} ${startFinal.y.toFixed(2)}
        A ${rExt.toFixed(2)} ${rExt.toFixed(2)} 0 ${largeArcFlag} ${sweepFlag} ${endFinal.x.toFixed(2)} ${endFinal.y.toFixed(2)}"
        fill="none"
        stroke="#d0b24a"
        stroke-width="${p.arcWidth.toFixed(1)}"
        stroke-linecap="butt"
        opacity="${p.arcOpacity.toFixed(2)}"
      />`;
    } else {
      // Draw dashed segment first, then solid segment
      const dashedEndDeg = p.arcStartDeg + p.arcDashedDeg;
      const dashedEndPt = polarToCartesian(cxExt, cyExt, rExt, dashedEndDeg);
      
      // Dashed part first
      const dashedArc = `<path d="M ${startFinal.x.toFixed(2)} ${startFinal.y.toFixed(2)}
        A ${rExt.toFixed(2)} ${rExt.toFixed(2)} 0 0 ${sweepFlag} ${dashedEndPt.x.toFixed(2)} ${dashedEndPt.y.toFixed(2)}"
        fill="none"
        stroke="#d0b24a"
        stroke-width="${p.arcWidth.toFixed(1)}"
        stroke-linecap="butt"
        stroke-dasharray="6 4"
        opacity="${p.arcOpacity.toFixed(2)}"
      />`;
      
      // Solid part after
      const solidArc = `<path d="M ${dashedEndPt.x.toFixed(2)} ${dashedEndPt.y.toFixed(2)}
        A ${rExt.toFixed(2)} ${rExt.toFixed(2)} 0 0 ${sweepFlag} ${endFinal.x.toFixed(2)} ${endFinal.y.toFixed(2)}"
        fill="none"
        stroke="#d0b24a"
        stroke-width="${p.arcWidth.toFixed(1)}"
        stroke-linecap="butt"
        opacity="${p.arcOpacity.toFixed(2)}"
      />`;
      
      externalArc = dashedArc + solidArc;
    }
  }


  // colored dots with rating-based sizing and center-angle positioning
  let dots = '';

  function polarOnCircle(cx, cy, r, deg){
    const rad = deg * Math.PI / 180;
    return { x: cx + Math.cos(rad) * r, y: cy + Math.sin(rad) * r };
  }

  if (p.dotSpecs.length > 0) {
    // Center angle: the "home" position for highest-rated dot
    const CENTER_DEG = 225; // lower-left quadrant (matching single-dot position)
    const DOT_R = R - 40; // fixed radius inside black circle
    
    // Sort dots by rating (highest first)
    const sortedDots = [...p.dotSpecs].sort((a, b) => b.rating - a.rating);
    
    // Map rating to size
    const ratingToRadius = { 1: 10, 2: 14, 3: 18 };
    
    // Fixed edge-to-edge gap between dots (pixels)
    const EDGE_GAP = 6;
    
    // Calculate angle offset needed to maintain fixed edge gap
    // Given two dots with radii r1 and r2 on circle of radius DOT_R,
    // chord length = 2*DOT_R*sin(θ/2) should equal r1 + r2 + EDGE_GAP
    function calcAngleOffset(r1, r2) {
      const chordLength = r1 + r2 + EDGE_GAP;
      const sinHalfTheta = chordLength / (2 * DOT_R);
      // Clamp to valid range for asin
      const clamped = Math.min(1, Math.max(-1, sinHalfTheta));
      const thetaRad = 2 * Math.asin(clamped);
      return thetaRad * 180 / Math.PI; // convert to degrees
    }
    
    // Position dots around center angle
    const positioned = [];
    
    if (sortedDots.length === 1) {
      // Single dot: exactly at center
      positioned.push({ 
        angle: CENTER_DEG, 
        radius: ratingToRadius[sortedDots[0].rating] || 14,
        color: sortedDots[0].color
      });
    } else {
      // Multiple dots: place highest at center, alternate left/right
      const centerRadius = ratingToRadius[sortedDots[0].rating] || 14;
      positioned.push({ angle: CENTER_DEG, radius: centerRadius, color: sortedDots[0].color });
      
      let leftAngle = CENTER_DEG;   // track left side position
      let rightAngle = CENTER_DEG;  // track right side position
      let leftRadius = centerRadius;
      let rightRadius = centerRadius;
      
      for (let i = 1; i < sortedDots.length; i++) {
        const currentRadius = ratingToRadius[sortedDots[i].rating] || 14;
        
        // Alternate: odd goes left, even goes right
        if (i % 2 === 1) {
          // Place on left (negative direction)
          const angleOffset = calcAngleOffset(leftRadius, currentRadius);
          leftAngle -= angleOffset;
          positioned.push({ angle: leftAngle, radius: currentRadius, color: sortedDots[i].color });
          leftRadius = currentRadius;
        } else {
          // Place on right (positive direction)
          const angleOffset = calcAngleOffset(rightRadius, currentRadius);
          rightAngle += angleOffset;
          positioned.push({ angle: rightAngle, radius: currentRadius, color: sortedDots[i].color });
          rightRadius = currentRadius;
        }
      }
    }
    
    // Render all positioned dots
    positioned.forEach(dot => {
      const pos = polarOnCircle(cx, cy, DOT_R, dot.angle);
      dots += `<circle cx="${pos.x.toFixed(2)}" cy="${pos.y.toFixed(2)}" r="${dot.radius}" fill="${dot.color}" opacity="0.95"/>`;
    });
  }

  // compose layers (note: white under black)
  // stability gradient for black form
  let stabilityGradient = '';
  if (p.stability === 'high') {
    stabilityGradient = `<linearGradient id="stabilityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#000" stop-opacity="1"/>
      <stop offset="100%" stop-color="#000" stop-opacity="1"/>
    </linearGradient>`;
  } else if (p.stability === 'med') {
    stabilityGradient = `<linearGradient id="stabilityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#000" stop-opacity="1"/>
      <stop offset="50%" stop-color="#000" stop-opacity="1"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.5"/>
    </linearGradient>`;
  } else { // low
    stabilityGradient = `<linearGradient id="stabilityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#000" stop-opacity="1"/>
      <stop offset="30%" stop-color="#000" stop-opacity="1"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.5"/>
    </linearGradient>`;
  }

  const defs = `
<defs>
  ${stabilityGradient}  
  <style>
    @keyframes ghostDrift {
      from { stroke-dashoffset: 0; }
      to   { stroke-dashoffset: -200; }
    }
    .ghost-circle {
      animation: ghostDrift var(--spd, 24s) linear infinite;
    }
    @media (prefers-reduced-motion: reduce) {
      .ghost-circle {
        animation: none;
      }
    }
  </style>
  <!-- 只显示“圆外部”的区域：白=可见，黑=不可见 -->
  <mask id="ghostOutsideMask">
    <rect x="0" y="0" width="${W}" height="${H}" fill="white"/>
    <!-- 这里挖掉主黑圈内部；半径给一点余量，避免边缘露点 -->
    <circle cx="${cx}" cy="${cy}" r="${R-2}" fill="black"/>
  </mask>
</defs>`;

  const ghostsMasked = `<g mask="url(#ghostOutsideMask)">${ghosts}</g>`;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${defs}
     
    ${white}
    ${orbit}
    ${externalArc}
    ${black}
    ${boundary}
    ${crescent}
    ${connections}
    ${dots}
    ${ghostsMasked}
  </svg>`;
  return svg;
}

/* -------------------------
   4) Export helpers
------------------------- */
function downloadText(filename, text, mime){
  const blob = new Blob([text], {type: mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 400);
}

async function svgToPng(svgText, scale=2){
  const svgBlob = new Blob([svgText], {type:'image/svg+xml'});
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  await img.decode();

  const canvas = document.createElement('canvas');
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  URL.revokeObjectURL(url);
  return new Promise((resolve)=> canvas.toBlob(resolve, 'image/png'));
}

/* -------------------------
   5) Share link encode/decode
------------------------- */
function encodeState(a){
  const json = JSON.stringify(a);
  return btoa(unescape(encodeURIComponent(json)));
}
function decodeState(s){
  const json = decodeURIComponent(escape(atob(s)));
  return JSON.parse(json);
}
function setFormFromAnswers(a){
  document.getElementById('moveCount').value = a.moveCount ?? '';
  document.getElementById('scaleMax').value  = a.scaleMax ?? '';
  document.getElementById('stability').value = a.stability ?? '';
  document.getElementById('control').value   = a.control ?? '';
  document.getElementById('tr').value        = a.tr ?? '';
  document.getElementById('externalArc').value = a.externalArc ?? '';
  document.getElementById('whiteOrbit').value = a.whiteOrbit ?? '';
  
  // Set anchor ratings (default to 0 if not specified)
  const ratings = a.anchorRatings ?? { place: 0, object: 0, person: 0, lang: 0 };
  ['place', 'object', 'person', 'lang'].forEach(key => {
    const value = ratings[key] ?? 0;
    const radio = document.querySelector(`input[name="${key}"][value="${value}"]`);
    if (radio) radio.checked = true;
  });
}

/* -------------------------
   6) Render loop
------------------------- */
let current = {answers:null, params:null, svgText:null};

function render(){
  const answers = getAnswers();
  const params = mapAnswersToParams(answers);
  const svgText = buildIconSVG(params);

  current = {answers, params, svgText};
  document.getElementById('mount').innerHTML = svgText;

  // update share url
  const token = encodeState(answers);
  const url = new URL(window.location.href);
  url.searchParams.set('p', token);
  document.getElementById('shareUrl').value = url.toString();
}

function attach(){
  ['moveCount','scaleMax','stability','control','tr','externalArc','whiteOrbit'].forEach(id=>{
    document.getElementById(id).addEventListener('change', render);
  });
  [...document.querySelectorAll('#anchors input[type=radio]')].forEach(el=>{
    el.addEventListener('change', render);
  });

  document.getElementById('downloadSvg').addEventListener('click', ()=>{
    downloadText('belonging-icon.svg', current.svgText, 'image/svg+xml');
  });

  document.getElementById('downloadPng').addEventListener('click', async ()=>{
    const blob = await svgToPng(current.svgText, 2);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'belonging-icon.png';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 400);
  });

  document.getElementById('copyLink').addEventListener('click', async ()=>{
    const v = document.getElementById('shareUrl').value;
    await navigator.clipboard.writeText(v);
  });

  document.getElementById('submit').addEventListener('click', async ()=>{
    try {
    const result = {
      svg: current.svgText,
      answers: current.answers,
      params: current.params
    };
    console.log("Saved!", result);

    const res = await fetch("/api/submitIcon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result)
    });
  } catch (e) {
    console.error(e);
  } 
  });
}

(function init(){
  // load from share link if exists
  const url = new URL(window.location.href);
  const p = url.searchParams.get('p');
  if (p){
    try { setFormFromAnswers(decodeState(p)); } catch(e){}
  }
  attach();
  render();
})();