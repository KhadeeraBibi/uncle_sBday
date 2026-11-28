// ============================================================================
// GLOBAL NAVIGATION & PAGE STATE MANAGEMENT (7 INTERCONNECTED PAGES)
// ============================================================================
const pages = {
  1: document.getElementById('page-1'),
  2: document.getElementById('page-2'),
  3: document.getElementById('page-3'),
  4: document.getElementById('page-4'),
  5: document.getElementById('page-5'),
  6: document.getElementById('page-6'),
  7: document.getElementById('page-7')
};

let currentPage = 1;
let isNavigating = false;

function navigateToPage(fromPageNum, toPageNum, onEnterCallback) {
  if (isNavigating || currentPage === toPageNum) return;
  isNavigating = true;

  const fromEl = pages[fromPageNum];
  const toEl = pages[toPageNum];
  if (!fromEl || !toEl) {
    isNavigating = false;
    return;
  }

  fromEl.classList.add('scale-95', 'opacity-0');

  setTimeout(() => {
    fromEl.classList.add('hidden');
    fromEl.classList.remove('scale-95');

    toEl.classList.remove('hidden');
    currentPage = toPageNum;

    requestAnimationFrame(() => {
      toEl.classList.remove('opacity-0');
      isNavigating = false;
      if (typeof onEnterCallback === 'function') {
        onEnterCallback();
      }
    });
  }, 450);
}

// ============================================================================
// SHARED RESPONSIVE AMBIENT SPARKLE SCATTER HELPER (PAGES 1, 4 & 7 ONLY)
// ============================================================================
function scatterAmbientSparkles({
  container,
  targetCount,
  minDist,
  exclusionZones = [],
  edgeMarginPct = 5,
  sizeScale = 1
}) {
  if (!container) return;
  container.innerHTML = '';

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const placedCoords = [];
  const hexColors = ['#fde68a', '#fef3c7', '#fbcfe8', '#f9a8d4', '#fbbf24'];

  const isExcluded = (px, py) => {
    return exclusionZones.some(
      (zone) =>
        px >= zone.left &&
        px <= zone.right &&
        py >= zone.top &&
        py <= zone.bottom
    );
  };

  let placed = 0;
  let attempts = 0;
  const maxAttempts = targetCount * 35;

  while (placed < targetCount && attempts < maxAttempts) {
    attempts++;
    const span = 100 - edgeMarginPct * 2;
    const topPct = Math.random() * span + edgeMarginPct;
    const leftPct = Math.random() * span + edgeMarginPct;
    const px = (leftPct / 100) * vw;
    const py = (topPct / 100) * vh;

    if (isExcluded(px, py)) continue;

    const tooClose = placedCoords.some(
      (pt) => Math.hypot(pt.x - px, pt.y - py) < minDist
    );
    if (tooClose) continue;

    placedCoords.push({ x: px, y: py });

    const el = document.createElement('div');
    const colorHex = hexColors[placed % hexColors.length];
    const duration = (Math.random() * 2.4 + 3.2).toFixed(2);
    const delay = (Math.random() * 3.5).toFixed(2);

    el.style.top = `${topPct.toFixed(2)}%`;
    el.style.left = `${leftPct.toFixed(2)}%`;
    el.style.setProperty('--duration', `${duration}s`);
    el.style.setProperty('--delay', `${delay}s`);

    // Balanced mix: ~50% tiny glowing dots, ~35% delicate small stars, ~15% subtle accent stars
    const mod = placed % 6;
    if (mod === 1 || mod === 3 || mod === 5) {
      const dotSize = Math.max(2, Math.round((Math.random() * 1.4 + 2.2) * sizeScale));
      el.className = 'glow-dot-particle';
      el.style.width = `${dotSize}px`;
      el.style.height = `${dotSize}px`;
      el.style.backgroundColor = colorHex;
      el.style.opacity = '0.78';
      el.style.boxShadow = `0 0 ${dotSize * 2}px ${colorHex}`;
    } else if (mod === 0) {
      // Occasional slightly larger accent sparkle (never placed adjacent due to minDist)
      const accentSize = Math.max(8, Math.round((Math.random() * 2 + 9.5) * sizeScale));
      el.className = 'diamond-sparkle';
      el.style.width = `${accentSize}px`;
      el.style.height = `${accentSize}px`;
      el.innerHTML = `
        <svg viewBox="0 0 24 24" class="w-full h-full">
          <path fill="${colorHex}" d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
        </svg>
      `;
    } else {
      // Fine, delicate small diamond stars
      const smallSize = Math.max(5, Math.round((Math.random() * 2 + 5.8) * sizeScale));
      el.className = 'diamond-sparkle';
      el.style.width = `${smallSize}px`;
      el.style.height = `${smallSize}px`;
      el.innerHTML = `
        <svg viewBox="0 0 24 24" class="w-full h-full">
          <path fill="${colorHex}" d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
        </svg>
      `;
    }

    container.appendChild(el);
    placed++;
  }
}

// ============================================================================
// SHARED MICRO-SQUARE CONFETTI ENGINE (USED BY PAGE 2 & PAGE 4)
// ============================================================================
const confettiCanvas = document.getElementById('confetti-canvas');
const confettiCtx = confettiCanvas ? confettiCanvas.getContext('2d') : null;

let activeConfettiParticles = [];
let confettiAnimFrameId = null;
let activeStormTimers = 0;

function resizeConfettiCanvas() {
  if (confettiCanvas) {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
}
window.addEventListener('resize', resizeConfettiCanvas);
resizeConfettiCanvas();

class SquareConfettiParticle {
  constructor(x, y, mode = 'burst') {
    this.x = x;
    this.y = y;
    this.mode = mode;

    const palette = [
      '#f472b6', '#fbcfe8', '#fb7185', '#fde68a',
      '#e11d48', '#ffffff', '#f9a8d4'
    ];
    this.color = palette[Math.floor(Math.random() * palette.length)];

    this.size = mode === 'burst'
      ? Math.random() * 1.8 + 3.0
      : Math.random() * 2.0 + 3.2;

    if (mode === 'burst') {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.6 + 1.5;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - 2.0;
      this.gravity = 0.14;
      this.friction = 0.95;
      this.alpha = 1;
      this.decay = 0.017 + Math.random() * 0.006;
    } else {
      this.vx = (Math.random() - 0.5) * 2.0;
      this.vy = Math.random() * 2.8 + 2.2;
      this.gravity = 0.045;
      this.friction = 0.99;
      this.alpha = 1;
      this.decay = 0.005 + Math.random() * 0.003;
    }

    this.rotation = Math.random() * 360;
    this.rotSpeed = (Math.random() - 0.5) * 7;
    this.tilt = Math.random() * 360;
    this.tiltSpeed = (Math.random() - 0.5) * 6;
  }

  update() {
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;

    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotSpeed;
    this.tilt += this.tiltSpeed;
    this.alpha -= this.decay;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(this.alpha, 0);
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.scale(1, Math.cos((this.tilt * Math.PI) / 180));

    ctx.fillStyle = this.color;
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    ctx.restore();
  }
}

function ensureConfettiLoop() {
  if (confettiAnimFrameId) return;
  resizeConfettiCanvas();

  function renderConfetti() {
    if (!confettiCtx || !confettiCanvas) return;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    for (let i = activeConfettiParticles.length - 1; i >= 0; i--) {
      const p = activeConfettiParticles[i];
      p.update();
      p.draw(confettiCtx);

      if (p.alpha <= 0 || p.y > confettiCanvas.height + 20) {
        activeConfettiParticles.splice(i, 1);
      }
    }

    if (activeConfettiParticles.length > 0 || activeStormTimers > 0) {
      confettiAnimFrameId = requestAnimationFrame(renderConfetti);
    } else {
      cancelAnimationFrame(confettiAnimFrameId);
      confettiAnimFrameId = null;
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  confettiAnimFrameId = requestAnimationFrame(renderConfetti);
}

function clearAllConfetti() {
  activeConfettiParticles = [];
  if (confettiCtx && confettiCanvas) {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}

function triggerOneSecondConfettiBurst(x, y, particleCount = 24) {
  ensureConfettiLoop();
  for (let i = 0; i < particleCount; i++) {
    activeConfettiParticles.push(new SquareConfettiParticle(x, y, 'burst'));
  }
}

function triggerTwoSecondConfettiStorm(onCompleteCallback) {
  ensureConfettiLoop();
  resizeConfettiCanvas();

  const duration = 2000;
  const startTime = Date.now();
  activeStormTimers++;

  const intervalId = setInterval(() => {
    const elapsed = Date.now() - startTime;
    if (elapsed >= duration) {
      clearInterval(intervalId);
      activeStormTimers = Math.max(0, activeStormTimers - 1);
      if (typeof onCompleteCallback === 'function') {
        onCompleteCallback();
      }
      return;
    }

    const width = confettiCanvas ? confettiCanvas.width : window.innerWidth;
    for (let i = 0; i < 14; i++) {
      const x = Math.random() * width;
      const y = -8 - Math.random() * 16;
      activeConfettiParticles.push(new SquareConfettiParticle(x, y, 'storm'));
    }
  }, 45);
}

// ============================================================================
// PAGE 1: WELCOME SCREEN (HEY UNCLE!) - EXTERIOR REFINED SPARKLES & GLOW DOTS
// ============================================================================
const sparkleField = document.getElementById('sparkle-field');
const heroCard = document.getElementById('page-1');
const btnPage1Next = document.getElementById('btn-page1-next');

function spawnDiamondSparkles() {
  if (!sparkleField) return;
  const vw = window.innerWidth;
  const isMobile = vw < 640;
  const isTablet = vw >= 640 && vw < 1024;

  const cardRect = heroCard && !heroCard.classList.contains('hidden')
    ? heroCard.getBoundingClientRect()
    : null;
  const pad = 18;

  const exclusionZones = cardRect && cardRect.width > 0
    ? [{
        left: cardRect.left - pad,
        right: cardRect.right + pad,
        top: cardRect.top - pad,
        bottom: cardRect.bottom + pad
      }]
    : [];

  scatterAmbientSparkles({
    container: sparkleField,
    targetCount: isMobile ? 14 : isTablet ? 20 : 28,
    minDist: isMobile ? 54 : isTablet ? 64 : 74,
    exclusionZones,
    edgeMarginPct: 6,
    sizeScale: isMobile ? 0.85 : 1.0
  });
}

spawnDiamondSparkles();
window.addEventListener('resize', () => {
  if (currentPage === 1) spawnDiamondSparkles();
});

document.addEventListener('mousemove', (e) => {
  if (currentPage !== 1 || !heroCard || heroCard.classList.contains('hidden')) return;
  const { innerWidth, innerHeight } = window;
  const rotateY = ((e.clientX - innerWidth / 2) / (innerWidth / 2)) * 5;
  const rotateX = -((e.clientY - innerHeight / 2) / (innerHeight / 2)) * 5;
  heroCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
});

document.addEventListener('mouseleave', () => {
  if (heroCard) {
    heroCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
  }
});

let page1Clicked = false;
if (btnPage1Next) {
  btnPage1Next.addEventListener('click', () => {
    if (page1Clicked) return;
    page1Clicked = true;

    if (sparkleField) {
      sparkleField.classList.add('hidden');
    }

    navigateToPage(1, 2, () => {
      initMemoryGame();
    });
  });
}

// ============================================================================
// PAGE 2: MEMORY MATCHING GAME (CHROME & BRAVE CONSISTENT PROPORTIONS)
// ============================================================================
const cardGrid = document.getElementById('card-grid');
const matchCounter = document.getElementById('match-counter');
const moveCounter = document.getElementById('move-counter');
const gameSuccessContainer = document.getElementById('game-success-container');
const btnPage2Next = document.getElementById('btn-page2-next');

const GAME_ICONS = ['💖', '🎂', '🎁'];
let gameCards = [];
let flippedCardIndices = [];
let matchedPairIds = new Set();
let totalMoves = 0;
let isGameBoardLocked = false;

function initMemoryGame() {
  gameCards = [...GAME_ICONS, ...GAME_ICONS]
    .sort(() => Math.random() - 0.5)
    .map((icon, idx) => ({
      index: idx,
      icon,
      matched: false
    }));

  flippedCardIndices = [];
  matchedPairIds.clear();
  totalMoves = 0;
  isGameBoardLocked = false;

  if (matchCounter) matchCounter.innerText = 'MATCHES: 0 / 3';
  if (moveCounter) moveCounter.innerText = 'MOVES: 0';
  if (gameSuccessContainer) gameSuccessContainer.classList.add('hidden');

  renderMemoryCardsDOM();
}

function renderMemoryCardsDOM() {
  if (!cardGrid) return;
  cardGrid.innerHTML = '';

  gameCards.forEach((card, index) => {
    const cardContainer = document.createElement('div');
    cardContainer.className = 'card-container';

    cardContainer.innerHTML = `
      <div class="card-inner" id="card-inner-${index}">
        <div class="card-back bg-gradient-to-br from-[#3d0d26] via-[#260717] to-[#14030c] border border-pink-400/45 rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.5)] p-2 sm:p-2.5">
          <div class="w-full h-full rounded-xl border border-amber-200/30 flex items-center justify-center bg-[#1f0613]/65">
            <span class="font-['Bangers'] text-base sm:text-2xl tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white via-pink-200 to-amber-200 select-none">
              UNCLE
            </span>
          </div>
        </div>

        <div class="card-front bg-gradient-to-br from-[#4a102f] via-[#2b081b] to-[#14030c] border-2 border-amber-200/65 rounded-2xl shadow-[0_0_20px_rgba(244,114,182,0.3)] text-3xl sm:text-5xl">
          ${card.icon}
        </div>
      </div>
    `;

    cardContainer.addEventListener('click', () => handleCardTap(index));
    cardGrid.appendChild(cardContainer);
  });
}

function handleCardTap(index) {
  if (isGameBoardLocked) return;

  const clickedCard = gameCards[index];
  if (!clickedCard || clickedCard.matched || flippedCardIndices.includes(index)) return;

  const innerEl = document.getElementById(`card-inner-${index}`);
  if (!innerEl) return;

  innerEl.classList.add('is-flipped');
  flippedCardIndices.push(index);

  if (flippedCardIndices.length === 2) {
    isGameBoardLocked = true;
    totalMoves++;
    if (moveCounter) moveCounter.innerText = `MOVES: ${totalMoves}`;

    const [firstIdx, secondIdx] = flippedCardIndices;
    const firstCard = gameCards[firstIdx];
    const secondCard = gameCards[secondIdx];

    if (firstCard.icon === secondCard.icon) {
      handleMatchSuccess(firstIdx, secondIdx, firstCard.icon);
    } else {
      setTimeout(() => {
        const el1 = document.getElementById(`card-inner-${firstIdx}`);
        const el2 = document.getElementById(`card-inner-${secondIdx}`);
        if (el1) el1.classList.remove('is-flipped');
        if (el2) el2.classList.remove('is-flipped');

        flippedCardIndices = [];
        isGameBoardLocked = false;
      }, 850);
    }
  }
}

function handleMatchSuccess(idx1, idx2, pairKey) {
  if (matchedPairIds.has(pairKey)) {
    flippedCardIndices = [];
    isGameBoardLocked = false;
    return;
  }

  matchedPairIds.add(pairKey);
  gameCards[idx1].matched = true;
  gameCards[idx2].matched = true;

  const currentMatchCount = matchedPairIds.size;
  if (matchCounter) matchCounter.innerText = `MATCHES: ${currentMatchCount} / 3`;

  const el1 = document.getElementById(`card-inner-${idx1}`);
  const el2 = document.getElementById(`card-inner-${idx2}`);
  [el1, el2].filter(Boolean).forEach((el) => {
    const rect = el.getBoundingClientRect();
    triggerOneSecondConfettiBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 20);
  });

  flippedCardIndices = [];
  isGameBoardLocked = false;

  if (currentMatchCount === 3) {
    setTimeout(() => {
      if (gameSuccessContainer) gameSuccessContainer.classList.remove('hidden');
      triggerTwoSecondConfettiStorm();
    }, 550);
  }
}

if (btnPage2Next) {
  btnPage2Next.addEventListener('click', () => {
    clearAllConfetti();
    navigateToPage(2, 3, () => {
      resizeFireworksCanvas();
      launch7SecondFireworks();
    });
  });
}

// ============================================================================
// PAGE 3: BIRTHDAY GREETING AND FIREWORKS
// ============================================================================
const page3Section = document.getElementById('page-3');
const btnPage3Next = document.getElementById('btn-page3-next');
const fwCanvas = document.getElementById('fireworks-canvas');
const fwCtx = fwCanvas ? fwCanvas.getContext('2d') : null;

let shells = [];
let pyroParticles = [];
let fwAnimationLoopId = null;
let canTapFireworksSky = false;

function resizeFireworksCanvas() {
  if (fwCanvas) {
    fwCanvas.width = window.innerWidth;
    fwCanvas.height = window.innerHeight;
  }
}
window.addEventListener('resize', resizeFireworksCanvas);
resizeFireworksCanvas();

const pyroPalettes = [
  { main: '#f472b6', second: '#fce7f3' },
  { main: '#fb7185', second: '#ffe4e6' },
  { main: '#fde68a', second: '#fffbeb' },
  { main: '#e879f9', second: '#fae8ff' },
  { main: '#f43f5e', second: '#fecdd3' }
];

class MortarShell {
  constructor(launchX, targetX, targetY) {
    this.x = launchX;
    this.y = fwCanvas ? fwCanvas.height : 800;
    this.targetX = targetX;
    this.targetY = targetY;

    const flightFrames = 45 + Math.random() * 15;
    this.vx = (targetX - this.x) / flightFrames;
    this.vy = (targetY - this.y) / flightFrames - 0.5 * 0.12 * flightFrames;
    this.gravity = 0.12;
    this.framesLeft = flightFrames;

    this.prevX = this.x;
    this.prevY = this.y;
    this.palette = pyroPalettes[Math.floor(Math.random() * pyroPalettes.length)];
    this.shellType = Math.random() > 0.35 ? 'chrysanthemum' : 'double-ring';
    this.exploded = false;
  }

  update() {
    this.prevX = this.x;
    this.prevY = this.y;

    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.framesLeft--;

    if (Math.random() < 0.6) {
      pyroParticles.push(new PyroSpark(this.x, this.y, '#f472b6', 0.6, true));
    }

    if (this.framesLeft <= 0 || this.vy >= 0) {
      this.exploded = true;
      detonateShell(this.x, this.y, this.palette, this.shellType);
    }
  }

  draw() {
    if (!fwCtx) return;
    fwCtx.beginPath();
    fwCtx.moveTo(this.prevX, this.prevY);
    fwCtx.lineTo(this.x, this.y);
    fwCtx.strokeStyle = '#fbcfe8';
    fwCtx.lineWidth = 1.6;
    fwCtx.stroke();
  }
}

class PyroSpark {
  constructor(x, y, color, maxSpeed, isTailSpark = false) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;

    if (isTailSpark) {
      this.vx = (Math.random() - 0.5) * 0.8;
      this.vy = Math.random() * 1.2;
      this.friction = 0.94;
      this.gravity = 0.04;
      this.decay = 0.05 + Math.random() * 0.04;
      this.size = 1;
      this.strobable = false;
    } else {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = maxSpeed * (0.82 + Math.random() * 0.18);

      this.vx = Math.sin(phi) * Math.cos(theta) * speed;
      this.vy = Math.sin(phi) * Math.sin(theta) * speed;
      this.friction = 0.962;
      this.gravity = 0.065;
      this.decay = 0.009 + Math.random() * 0.008;
      this.size = 1.4;
      this.strobable = Math.random() < 0.28;
    }

    this.color = color;
    this.alpha = 1;
  }

  update() {
    this.prevX = this.x;
    this.prevY = this.y;

    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;

    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
  }

  draw() {
    if (!fwCtx || this.alpha <= 0) return;
    if (this.strobable && this.alpha < 0.45 && Math.random() < 0.45) return;

    fwCtx.save();
    fwCtx.globalAlpha = Math.max(this.alpha, 0);

    fwCtx.beginPath();
    fwCtx.moveTo(this.prevX, this.prevY);
    fwCtx.lineTo(this.x, this.y);
    fwCtx.strokeStyle = this.color;
    fwCtx.lineWidth = this.size;
    fwCtx.lineCap = 'round';
    fwCtx.stroke();

    if (this.alpha > 0.55) {
      fwCtx.fillStyle = '#ffffff';
      fwCtx.fillRect(this.x - 0.6, this.y - 0.6, 1.2, 1.2);
    }

    fwCtx.restore();
  }
}

function detonateShell(x, y, palette, type) {
  const baseRadiusSpeed = 6.5 + Math.random() * 2.5;

  if (type === 'double-ring') {
    for (let i = 0; i < 95; i++) {
      pyroParticles.push(new PyroSpark(x, y, palette.main, baseRadiusSpeed));
    }
    for (let i = 0; i < 45; i++) {
      pyroParticles.push(new PyroSpark(x, y, palette.second, baseRadiusSpeed * 0.55));
    }
  } else {
    for (let i = 0; i < 130; i++) {
      const color = i % 4 === 0 ? palette.second : palette.main;
      pyroParticles.push(new PyroSpark(x, y, color, baseRadiusSpeed));
    }
  }
}

function renderFireworksLoop() {
  if (!fwCtx || !fwCanvas) return;
  fwAnimationLoopId = requestAnimationFrame(renderFireworksLoop);

  fwCtx.globalCompositeOperation = 'destination-out';
  fwCtx.fillStyle = 'rgba(18, 4, 11, 0.24)';
  fwCtx.fillRect(0, 0, fwCanvas.width, fwCanvas.height);

  fwCtx.globalCompositeOperation = 'source-over';

  for (let i = shells.length - 1; i >= 0; i--) {
    shells[i].update();
    shells[i].draw();
    if (shells[i].exploded) shells.splice(i, 1);
  }

  for (let i = pyroParticles.length - 1; i >= 0; i--) {
    pyroParticles[i].update();
    pyroParticles[i].draw();
    if (pyroParticles[i].alpha <= 0) pyroParticles.splice(i, 1);
  }
}

let lastZoneIndex = 0;
const skyZones = [
  { xMin: 0.06, xMax: 0.24, yMin: 0.12, yMax: 0.45 },
  { xMin: 0.76, xMax: 0.94, yMin: 0.12, yMax: 0.45 },
  { xMin: 0.25, xMax: 0.42, yMin: 0.08, yMax: 0.26 },
  { xMin: 0.58, xMax: 0.75, yMin: 0.08, yMax: 0.26 },
  { xMin: 0.08, xMax: 0.22, yMin: 0.48, yMax: 0.68 },
  { xMin: 0.78, xMax: 0.92, yMin: 0.48, yMax: 0.68 }
];

function spawnZonedShell() {
  if (!fwCanvas) return;
  const zone = skyZones[lastZoneIndex % skyZones.length];
  lastZoneIndex++;

  const targetX = (zone.xMin + Math.random() * (zone.xMax - zone.xMin)) * fwCanvas.width;
  const targetY = (zone.yMin + Math.random() * (zone.yMax - zone.yMin)) * fwCanvas.height;
  const launchX = targetX + (Math.random() - 0.5) * 90;

  shells.push(new MortarShell(launchX, targetX, targetY));
}

function launch7SecondFireworks() {
  if (!fwAnimationLoopId) renderFireworksLoop();

  canTapFireworksSky = false;
  const duration = 7000;
  const end = Date.now() + duration;

  if (fwCanvas) {
    detonateShell(fwCanvas.width * 0.14, fwCanvas.height * 0.28, pyroPalettes[0], 'chrysanthemum');
    detonateShell(fwCanvas.width * 0.86, fwCanvas.height * 0.28, pyroPalettes[1], 'double-ring');
  }
  spawnZonedShell();

  const interval = setInterval(() => {
    if (Date.now() > end || currentPage !== 3) {
      clearInterval(interval);
      if (currentPage === 3) canTapFireworksSky = true;
      return;
    }
    spawnZonedShell();
  }, 380);
}

if (page3Section) {
  page3Section.addEventListener('click', (e) => {
    if (!canTapFireworksSky || e.target.closest('#btn-page3-next')) return;
    const palette = pyroPalettes[Math.floor(Math.random() * pyroPalettes.length)];
    detonateShell(e.clientX, e.clientY, palette, 'double-ring');
  });
}

if (btnPage3Next) {
  btnPage3Next.addEventListener('click', (e) => {
    e.stopPropagation();
    if (fwAnimationLoopId) {
      cancelAnimationFrame(fwAnimationLoopId);
      fwAnimationLoopId = null;
    }
    navigateToPage(3, 4, () => {
      initPage4Cake();
    });
  });
}

// ============================================================================
// PAGE 4: INTERACTIVE BIRTHDAY CAKE & REFINED PERIMETER SPARKLES
// ============================================================================
const page4Section = document.getElementById('page-4');
const page4ContinueWrapper = document.getElementById('page4-continue-wrapper');
const btnPage4Next = document.getElementById('btn-page4-next');
const page4DecorStage = document.getElementById('page4-decor-stage');

const candleStates = { candle1: false, candle2: false, candle3: false };
let finalCakeStormFinished = false;

function initPage4Decorations() {
  if (!page4DecorStage) return;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isMobile = vw < 640;
  const isTablet = vw >= 640 && vw < 1024;

  // Keep the center cake, candles, and heading clear while framing the edges gently
  const centerZone = {
    left: vw * (isMobile ? 0.14 : 0.28),
    right: vw * (isMobile ? 0.86 : 0.72),
    top: vh * 0.24,
    bottom: vh * 0.76
  };

  scatterAmbientSparkles({
    container: page4DecorStage,
    targetCount: isMobile ? 16 : isTablet ? 22 : 28,
    minDist: isMobile ? 52 : 66,
    exclusionZones: [centerZone],
    edgeMarginPct: 5,
    sizeScale: isMobile ? 0.8 : 0.92
  });
}

function initPage4Cake() {
  candleStates.candle1 = false;
  candleStates.candle2 = false;
  candleStates.candle3 = false;
  finalCakeStormFinished = false;

  if (page4ContinueWrapper) page4ContinueWrapper.classList.add('hidden');

  document.querySelectorAll('#page-4 .candle-unit').forEach((unit) => {
    const flameBody = unit.querySelector('.flame-body');
    const flameWrapper = unit.querySelector('.flame-wrapper');
    if (flameBody) flameBody.classList.remove('is-extinguished');
    if (flameWrapper) flameWrapper.classList.remove('is-extinguished');
  });

  initPage4Decorations();
}

window.addEventListener('resize', () => {
  if (currentPage === 4) initPage4Decorations();
});

document.querySelectorAll('#page-4 .candle-unit').forEach((unit) => {
  unit.addEventListener('click', (e) => {
    e.stopPropagation();
    const key = unit.getAttribute('data-candle-key');
    if (!key || candleStates[key] === true) return;

    candleStates[key] = true;

    const flameBody = unit.querySelector('.flame-body');
    const flameWrapper = unit.querySelector('.flame-wrapper');
    if (flameBody) flameBody.classList.add('is-extinguished');
    if (flameWrapper) flameWrapper.classList.add('is-extinguished');

    const rect = (flameBody || unit).getBoundingClientRect();
    triggerOneSecondConfettiBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 24);

    if (candleStates.candle1 && candleStates.candle2 && candleStates.candle3) {
      setTimeout(() => {
        if (page4ContinueWrapper) page4ContinueWrapper.classList.remove('hidden');

        triggerTwoSecondConfettiStorm(() => {
          finalCakeStormFinished = true;
        });
      }, 450);
    }
  });
});

if (page4Section) {
  page4Section.addEventListener('click', (e) => {
    if (!finalCakeStormFinished) return;
    if (e.target.closest('#btn-page4-next') || e.target.closest('.candle-unit')) return;

    triggerTwoSecondConfettiStorm();
  });
}

if (btnPage4Next) {
  btnPage4Next.addEventListener('click', (e) => {
    e.stopPropagation();
    clearAllConfetti();
    navigateToPage(4, 5);
  });
}

// ============================================================================
// PAGE 5: CHEERS TO 20!
// ============================================================================
const page5Section = document.getElementById('page-5');
const emojiStreamStage = document.getElementById('emoji-stream-stage');

const EXACT_EMOJI_SEQUENCE = [
  '🎉', '✨', '💖', '🫀', '💖', '✨', '🌺', '✨', '💖', '🌙',
  '💖', '✨', '🌏', '✨', '💖', '🕊️', '💖', '✨', '🎉'
];

function launchEmojiSequence() {
  if (!emojiStreamStage) return;

  const rowEl = document.createElement('div');
  rowEl.className = 'horizontal-emoji-stream-row';

  EXACT_EMOJI_SEQUENCE.forEach((emojiChar) => {
    const span = document.createElement('span');
    span.innerText = emojiChar;
    span.className = 'text-xl sm:text-2xl';
    rowEl.appendChild(span);
  });

  emojiStreamStage.appendChild(rowEl);

  setTimeout(() => {
    rowEl.remove();
  }, 4500);
}

if (page5Section) {
  page5Section.addEventListener('click', (e) => {
    if (e.target.closest('#btn-page5-next')) return;
    launchEmojiSequence();
  });
}

const btnPage5Next = document.getElementById('btn-page5-next');
if (btnPage5Next) {
  btnPage5Next.addEventListener('click', (e) => {
    e.stopPropagation();
    navigateToPage(5, 6, () => {
      initPage6ShootingStars();
    });
  });
}

// ============================================================================
// PAGE 6: SHOOTING STAR – MAKE A WISH (STRICTLY EXCLUDED / UNCHANGED)
// ============================================================================
const CHOREOGRAPHED_WISH_SEQUENCES = [
  {
    text: 'A lifetime of happiness and peace.',
    desktop: { start: { x: 0.08, y: 0.16 }, ctrl: { x: 0.44, y: 0.30 }, end: { x: 0.78, y: 0.56 }, wishPos: { x: 0.64, y: 0.50 } },
    mobile:  { start: { x: 0.06, y: 0.22 }, ctrl: { x: 0.46, y: 0.34 }, end: { x: 0.88, y: 0.52 }, wishPos: { x: 0.50, y: 0.52 } },
    duration: 1550,
    scale: 1.0
  },
  {
    text: 'Dreams beyond the horizon.',
    desktop: { start: { x: 0.92, y: 0.18 }, ctrl: { x: 0.56, y: 0.34 }, end: { x: 0.22, y: 0.54 }, wishPos: { x: 0.36, y: 0.48 } },
    mobile:  { start: { x: 0.94, y: 0.24 }, ctrl: { x: 0.52, y: 0.36 }, end: { x: 0.12, y: 0.54 }, wishPos: { x: 0.50, y: 0.50 } },
    duration: 1600,
    scale: 1.06
  },
  {
    text: 'Success in every step.',
    desktop: { start: { x: 0.12, y: 0.64 }, ctrl: { x: 0.48, y: 0.44 }, end: { x: 0.82, y: 0.28 }, wishPos: { x: 0.66, y: 0.36 } },
    mobile:  { start: { x: 0.08, y: 0.64 }, ctrl: { x: 0.48, y: 0.48 }, end: { x: 0.90, y: 0.34 }, wishPos: { x: 0.50, y: 0.44 } },
    duration: 1650,
    scale: 1.1
  },
  {
    text: 'Endless reasons to smile.',
    desktop: { start: { x: 0.86, y: 0.12 }, ctrl: { x: 0.58, y: 0.40 }, end: { x: 0.36, y: 0.72 }, wishPos: { x: 0.50, y: 0.62 } },
    mobile:  { start: { x: 0.90, y: 0.18 }, ctrl: { x: 0.56, y: 0.44 }, end: { x: 0.18, y: 0.68 }, wishPos: { x: 0.50, y: 0.58 } },
    duration: 1750,
    scale: 1.24
  }
];

const FINALE_METEOR_PATHS = [
  { delay: 0,    start: { x: 0.10, y: 0.12 }, ctrl: { x: 0.42, y: 0.28 }, end: { x: 0.76, y: 0.50 }, duration: 1250, scale: 0.85 },
  { delay: 220,  start: { x: 0.88, y: 0.14 }, ctrl: { x: 0.56, y: 0.32 }, end: { x: 0.24, y: 0.52 }, duration: 1300, scale: 0.80 },
  { delay: 440,  start: { x: 0.25, y: 0.08 }, ctrl: { x: 0.54, y: 0.30 }, end: { x: 0.85, y: 0.58 }, duration: 1200, scale: 0.75 },
  { delay: 680,  start: { x: 0.74, y: 0.08 }, ctrl: { x: 0.44, y: 0.32 }, end: { x: 0.14, y: 0.58 }, duration: 1280, scale: 0.78 },
  { delay: 920,  start: { x: 0.06, y: 0.30 }, ctrl: { x: 0.46, y: 0.44 }, end: { x: 0.86, y: 0.68 }, duration: 1350, scale: 0.90 },
  { delay: 1160, start: { x: 0.94, y: 0.28 }, ctrl: { x: 0.54, y: 0.44 }, end: { x: 0.16, y: 0.68 }, duration: 1320, scale: 0.88 },
  { delay: 1420, start: { x: 0.36, y: 0.06 }, ctrl: { x: 0.58, y: 0.34 }, end: { x: 0.80, y: 0.66 }, duration: 1180, scale: 0.70 },
  { delay: 1680, start: { x: 0.64, y: 0.06 }, ctrl: { x: 0.42, y: 0.34 }, end: { x: 0.20, y: 0.66 }, duration: 1220, scale: 0.72 },
  { delay: 1960, start: { x: 0.14, y: 0.18 }, ctrl: { x: 0.50, y: 0.38 }, end: { x: 0.88, y: 0.62 }, duration: 1400, scale: 0.95 },
  { delay: 2240, start: { x: 0.86, y: 0.16 }, ctrl: { x: 0.50, y: 0.38 }, end: { x: 0.12, y: 0.64 }, duration: 1450, scale: 0.95 }
];

const shootingStarCanvas = document.getElementById('shooting-star-canvas');
const shootingStarCtx = shootingStarCanvas ? shootingStarCanvas.getContext('2d', { alpha: true }) : null;
const shootingStarOpening = document.getElementById('shooting-star-opening');
const skyWishAnchor = document.getElementById('sky-wish-anchor');
const skyWishText = document.getElementById('sky-wish-text');
const shootingStarFinale = document.getElementById('shooting-star-finale');
const page6ContinueContainer = document.getElementById('page6-continue-container');
const btnPage6Next = document.getElementById('btn-page6-next');

let ssAnimId = null;
let ssTimers = [];
let ssStarfield = [];
let ssAtmosphericDust = [];
let ssNebulaSprites = [];
let ssActiveMeteors = [];
let ssSparks = [];
let ssAmbientGlow = 0;
let ssCameraTime = 0;
let ssLastFrameTime = 0;
let isPage6Running = false;

function isMobileViewport() {
  return window.innerWidth < 768;
}

function resizeShootingStarCanvas() {
  if (!shootingStarCanvas) return;
  const maxDpr = isMobileViewport() ? 1.5 : 2;
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  shootingStarCanvas.width = Math.floor(window.innerWidth * dpr);
  shootingStarCanvas.height = Math.floor(window.innerHeight * dpr);
  if (shootingStarCtx) {
    shootingStarCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

window.addEventListener('resize', () => {
  if (isPage6Running) {
    resizeShootingStarCanvas();
  }
});

function createNebulaSprite(radius, colorStr) {
  const off = document.createElement('canvas');
  const size = Math.ceil(radius * 2);
  off.width = size;
  off.height = size;
  const octx = off.getContext('2d');
  if (octx) {
    const grad = octx.createRadialGradient(radius, radius, 0, radius, radius, radius);
    grad.addColorStop(0, colorStr);
    grad.addColorStop(1, 'rgba(4, 1, 10, 0)');
    octx.fillStyle = grad;
    octx.fillRect(0, 0, size, size);
  }
  return off;
}

function buildGalaxySceneLayers() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const mobile = isMobileViewport();
  ssStarfield = [];
  ssAtmosphericDust = [];
  ssNebulaSprites = [];

  const layerConfigs = mobile
    ? [
        { count: 105, speed: 0.03, minR: 0.6, maxR: 1.2, maxAlpha: 0.72 },
        { count: 60,  speed: 0.07, minR: 1.0, maxR: 1.8, maxAlpha: 0.92 },
        { count: 25,  speed: 0.13, minR: 1.5, maxR: 2.5, maxAlpha: 1.0 }
      ]
    : [
        { count: 180, speed: 0.03, minR: 0.6, maxR: 1.2, maxAlpha: 0.72 },
        { count: 95,  speed: 0.07, minR: 1.0, maxR: 1.8, maxAlpha: 0.92 },
        { count: 40,  speed: 0.13, minR: 1.5, maxR: 2.6, maxAlpha: 1.0 }
      ];

  const starTints = ['#ffffff', '#fef3c7', '#fbcfe8', '#ddd6fe', '#bae6fd', '#fde68a'];

  layerConfigs.forEach((cfg) => {
    for (let i = 0; i < cfg.count; i++) {
      ssStarfield.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: cfg.minR + Math.random() * (cfg.maxR - cfg.minR),
        baseAlpha: 0.35 + Math.random() * (cfg.maxAlpha - 0.35),
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.018 + Math.random() * 0.028,
        driftSpeed: cfg.speed,
        color: starTints[i % starTints.length],
        isCrossSparkle: i % 11 === 0
      });
    }
  });

  const dustCount = mobile ? 24 : 42;
  for (let i = 0; i < dustCount; i++) {
    ssAtmosphericDust.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -0.08 - Math.random() * 0.16,
      size: Math.random() * 1.6 + 0.8,
      phase: Math.random() * Math.PI * 2,
      isGold: i % 2 === 0
    });
  }

  const baseRadius = Math.max(w, h) * 0.36;
  const nebulaSpecs = [
    { rx: 0.26, ry: 0.32, radius: baseRadius,        color: 'rgba(88, 28, 135, 0.16)',  vx: 0.04,  vy: -0.02 },
    { rx: 0.74, ry: 0.58, radius: baseRadius * 1.05, color: 'rgba(131, 24, 67, 0.12)',  vx: -0.03, vy: 0.02 },
    { rx: 0.50, ry: 0.24, radius: baseRadius * 0.9,  color: 'rgba(49, 46, 129, 0.14)',  vx: 0.02,  vy: 0.02 }
  ];

  nebulaSpecs.forEach((n) => {
    ssNebulaSprites.push({
      x: w * n.rx,
      y: h * n.ry,
      radius: n.radius,
      vx: n.vx,
      vy: n.vy,
      sprite: createNebulaSprite(n.radius, n.color)
    });
  });
}

class RealisticMeteor {
  constructor({ start, ctrl, end, duration = 1600, scale = 1.0, onDisappear = null }) {
    this.start = start;
    this.ctrl = ctrl;
    this.end = end;
    this.duration = duration;
    this.scale = scale;
    this.onDisappear = onDisappear;

    this.startTime = performance.now();
    this.history = [];
    this.maxHistory = Math.round((isMobileViewport() ? 22 : 30) * Math.max(0.75, scale));
    this.finished = false;
    this.hasTriggeredCallback = false;
  }

  getQuadraticPoint(t) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const inv = 1 - t;
    const nx = inv * inv * this.start.x + 2 * inv * t * this.ctrl.x + t * t * this.end.x;
    const ny = inv * inv * this.start.y + 2 * inv * t * this.ctrl.y + t * t * this.end.y;
    return { x: nx * w, y: ny * h };
  }

  easeTrajectory(t) {
    return 1 - Math.pow(1 - t, 1.65);
  }

  update(now, dtScale) {
    const rawT = (now - this.startTime) / this.duration;
    const clampedT = Math.min(1, Math.max(0, rawT));
    const easedT = this.easeTrajectory(clampedT);

    let brightness = 1;
    if (clampedT < 0.12) {
      brightness = clampedT / 0.12;
    } else if (clampedT > 0.68) {
      brightness = Math.max(0, 1 - (clampedT - 0.68) / 0.32);
    }
    brightness *= 0.93 + Math.sin(now * 0.045) * 0.07;

    if (clampedT <= 1) {
      const pos = this.getQuadraticPoint(easedT);
      this.history.unshift({ x: pos.x, y: pos.y, brightness });
      if (this.history.length > this.maxHistory) {
        this.history.pop();
      }

      if (brightness > 0.12 && this.history.length > 1) {
        const prev = this.history[1];
        const vx = (pos.x - prev.x) * 0.16;
        const vy = (pos.y - prev.y) * 0.16;
        const maxSparks = isMobileViewport() ? 140 : 240;

        if (ssSparks.length < maxSparks) {
          ssSparks.push({
            x: pos.x + (Math.random() - 0.5) * 4 * this.scale,
            y: pos.y + (Math.random() - 0.5) * 4 * this.scale,
            vx: vx + (Math.random() - 0.5) * 1.0,
            vy: vy + (Math.random() - 0.5) * 1.0 + 0.12,
            size: (Math.random() * 1.5 + 0.8) * Math.min(1.2, this.scale),
            alpha: brightness * (0.72 + Math.random() * 0.28),
            decay: 0.017 + Math.random() * 0.014,
            isGold: Math.random() > 0.35
          });
        }
      }
    }

    if (clampedT >= 0.70 && !this.hasTriggeredCallback) {
      this.hasTriggeredCallback = true;
      if (typeof this.onDisappear === 'function') {
        this.onDisappear();
      }
    }

    if (clampedT >= 1) {
      const drainSteps = Math.max(1, Math.round(dtScale));
      for (let s = 0; s < drainSteps; s++) {
        this.history.pop();
      }
      if (this.history.length === 0) {
        this.finished = true;
      }
    }
  }

  draw(ctx) {
    if (this.history.length < 2) return;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < this.history.length - 1; i++) {
      const curr = this.history[i];
      const next = this.history[i + 1];
      const ratio = 1 - i / this.history.length;
      const alpha = Math.pow(ratio, 1.55) * curr.brightness;
      if (alpha <= 0.01) continue;

      let r, g, b;
      if (ratio > 0.74) {
        r = 255;
        g = 250;
        b = 230;
      } else if (ratio > 0.38) {
        r = 253;
        g = 224;
        b = 135;
      } else {
        r = 244;
        g = 114;
        b = 182;
      }

      ctx.beginPath();
      ctx.moveTo(curr.x, curr.y);
      ctx.lineTo(next.x, next.y);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.34})`;
      ctx.lineWidth = Math.max(0.8, ratio * 9.5 * this.scale);
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(curr.x, curr.y);
      ctx.lineTo(next.x, next.y);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.94})`;
      ctx.lineWidth = Math.max(0.5, ratio * 3.2 * this.scale);
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    const head = this.history[0];
    if (head && head.brightness > 0.03) {
      const glowRadius = 22 * this.scale;
      const radGrad = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, glowRadius);
      radGrad.addColorStop(0, `rgba(255, 255, 255, ${head.brightness})`);
      radGrad.addColorStop(0.24, `rgba(254, 243, 199, ${head.brightness * 0.85})`);
      radGrad.addColorStop(0.56, `rgba(244, 114, 182, ${head.brightness * 0.35})`);
      radGrad.addColorStop(1, 'rgba(244, 114, 182, 0)');

      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(head.x, head.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 255, 255, ${head.brightness})`;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 2.6 * this.scale, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function renderShootingStarLoop(now) {
  if (!shootingStarCtx || !shootingStarCanvas || !isPage6Running) {
    ssAnimId = null;
    return;
  }

  const dt = ssLastFrameTime ? Math.min(50, now - ssLastFrameTime) : 16.67;
  const dtScale = dt / 16.67;
  ssLastFrameTime = now;

  const w = window.innerWidth;
  const h = window.innerHeight;
  ssCameraTime += 0.008 * dtScale;

  shootingStarCtx.clearRect(0, 0, w, h);

  ssNebulaSprites.forEach((cloud) => {
    cloud.x += cloud.vx * dtScale;
    cloud.y += cloud.vy * dtScale;
    if (cloud.x < -cloud.radius * 0.4) cloud.x = w + cloud.radius * 0.3;
    if (cloud.x > w + cloud.radius * 0.4) cloud.x = -cloud.radius * 0.3;
    if (cloud.y < -cloud.radius * 0.4) cloud.y = h + cloud.radius * 0.3;
    if (cloud.y > h + cloud.radius * 0.4) cloud.y = -cloud.radius * 0.3;

    shootingStarCtx.drawImage(
      cloud.sprite,
      cloud.x - cloud.radius,
      cloud.y - cloud.radius
    );
  });

  if (ssAmbientGlow > 0.002) {
    const finaleGrad = shootingStarCtx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, Math.max(w, h) * 0.65);
    finaleGrad.addColorStop(0, `rgba(253, 230, 138, ${ssAmbientGlow * 0.14})`);
    finaleGrad.addColorStop(0.5, `rgba(219, 39, 119, ${ssAmbientGlow * 0.10})`);
    finaleGrad.addColorStop(1, 'rgba(4, 1, 10, 0)');
    shootingStarCtx.fillStyle = finaleGrad;
    shootingStarCtx.fillRect(0, 0, w, h);
    ssAmbientGlow *= Math.pow(0.992, dtScale);
  }

  const camOffsetX = Math.sin(ssCameraTime) * 5;
  const camOffsetY = Math.cos(ssCameraTime * 0.7) * 3.5;

  ssStarfield.forEach((star) => {
    star.twinklePhase += star.twinkleSpeed * dtScale;
    star.x -= star.driftSpeed * dtScale;
    if (star.x < 0) star.x += w;

    const pulse = 0.6 + 0.4 * Math.sin(star.twinklePhase);
    const alpha = star.baseAlpha * pulse;
    const drawX = star.x + camOffsetX * (star.driftSpeed * 8);
    const drawY = star.y + camOffsetY * (star.driftSpeed * 8);

    shootingStarCtx.save();
    shootingStarCtx.globalAlpha = Math.max(0.15, Math.min(1, alpha));
    shootingStarCtx.fillStyle = star.color;
    shootingStarCtx.beginPath();
    shootingStarCtx.arc(drawX, drawY, star.r, 0, Math.PI * 2);
    shootingStarCtx.fill();

    if (star.isCrossSparkle && pulse > 0.82) {
      const ray = star.r * 3.2;
      shootingStarCtx.strokeStyle = star.color;
      shootingStarCtx.lineWidth = 0.7;
      shootingStarCtx.beginPath();
      shootingStarCtx.moveTo(drawX - ray, drawY);
      shootingStarCtx.lineTo(drawX + ray, drawY);
      shootingStarCtx.moveTo(drawX, drawY - ray);
      shootingStarCtx.lineTo(drawX, drawY + ray);
      shootingStarCtx.stroke();
    }

    shootingStarCtx.restore();
  });

  ssAtmosphericDust.forEach((mote) => {
    mote.x += mote.vx * dtScale;
    mote.y += mote.vy * dtScale;
    mote.phase += 0.03 * dtScale;
    if (mote.y < 0) mote.y = h;
    if (mote.x < 0) mote.x = w;
    if (mote.x > w) mote.x = 0;

    const alpha = 0.25 + 0.45 * Math.sin(mote.phase);
    if (alpha <= 0.05) return;

    shootingStarCtx.save();
    shootingStarCtx.globalAlpha = alpha;
    shootingStarCtx.fillStyle = mote.isGold ? '#fde68a' : '#fbcfe8';
    shootingStarCtx.beginPath();
    shootingStarCtx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2);
    shootingStarCtx.fill();
    shootingStarCtx.restore();
  });

  shootingStarCtx.save();
  shootingStarCtx.globalCompositeOperation = 'lighter';
  for (let i = ssSparks.length - 1; i >= 0; i--) {
    const sp = ssSparks[i];
    sp.x += sp.vx * dtScale;
    sp.y += sp.vy * dtScale;
    sp.vx *= Math.pow(0.97, dtScale);
    sp.vy *= Math.pow(0.97, dtScale);
    sp.alpha -= sp.decay * dtScale;
    sp.size *= Math.pow(0.992, dtScale);

    if (sp.alpha <= 0.01) {
      ssSparks.splice(i, 1);
      continue;
    }

    shootingStarCtx.globalAlpha = Math.max(0, sp.alpha);
    shootingStarCtx.fillStyle = sp.isGold ? '#fde68a' : '#f9a8d4';
    shootingStarCtx.beginPath();
    shootingStarCtx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
    shootingStarCtx.fill();
  }
  shootingStarCtx.restore();

  for (let i = ssActiveMeteors.length - 1; i >= 0; i--) {
    const meteor = ssActiveMeteors[i];
    meteor.update(now, dtScale);
    meteor.draw(shootingStarCtx);
    if (meteor.finished) {
      ssActiveMeteors.splice(i, 1);
    }
  }

  ssAnimId = requestAnimationFrame(renderShootingStarLoop);
}

function showSkyWishAt(text, normX, normY) {
  if (!skyWishAnchor || !skyWishText) return;

  const mobile = isMobileViewport();
  const safeX = Math.max(mobile ? 0.48 : 0.28, Math.min(mobile ? 0.52 : 0.72, normX));
  const safeY = Math.max(0.36, Math.min(0.75, normY));

  skyWishAnchor.style.left = `${safeX * 100}%`;
  skyWishAnchor.style.top = `${safeY * 100}%`;

  skyWishText.innerText = `"${text}"`;
  skyWishText.classList.remove('is-hidden', 'is-dissolving');
  skyWishText.classList.add('is-visible');
}

function dissolveSkyWish() {
  if (!skyWishText) return;
  skyWishText.classList.remove('is-visible');
  skyWishText.classList.add('is-dissolving');
}

function clearShootingStarTimers() {
  ssTimers.forEach((id) => clearTimeout(id));
  ssTimers = [];
}

function launchSingleWishSequence(wishIndex) {
  if (!isPage6Running) return;

  if (wishIndex >= CHOREOGRAPHED_WISH_SEQUENCES.length) {
    triggerGrandMeteorShower();
    return;
  }

  const item = CHOREOGRAPHED_WISH_SEQUENCES[wishIndex];
  const layout = isMobileViewport() ? item.mobile : item.desktop;

  ssActiveMeteors.push(
    new RealisticMeteor({
      start: layout.start,
      ctrl: layout.ctrl,
      end: layout.end,
      duration: item.duration,
      scale: item.scale,
      onDisappear: () => {
        showSkyWishAt(item.text, layout.wishPos.x, layout.wishPos.y);

        const dissolveTimer = setTimeout(() => {
          dissolveSkyWish();

          const nextTimer = setTimeout(() => {
            launchSingleWishSequence(wishIndex + 1);
          }, 500);
          ssTimers.push(nextTimer);
        }, 2350);
        ssTimers.push(dissolveTimer);
      }
    })
  );
}

function triggerGrandMeteorShower() {
  if (!isPage6Running) return;

  if (shootingStarOpening) {
    shootingStarOpening.classList.add('opacity-0');
  }

  ssAmbientGlow = 1.0;

  FINALE_METEOR_PATHS.forEach((path) => {
    const tId = setTimeout(() => {
      if (!isPage6Running) return;
      ssActiveMeteors.push(
        new RealisticMeteor({
          start: path.start,
          ctrl: path.ctrl,
          end: path.end,
          duration: path.duration,
          scale: path.scale
        })
      );
    }, path.delay);
    ssTimers.push(tId);
  });

  const finaleRevealTimer = setTimeout(() => {
    if (!isPage6Running) return;
    if (shootingStarFinale) {
      shootingStarFinale.classList.remove('opacity-0');
    }
    const btnTimer = setTimeout(() => {
      if (page6ContinueContainer) {
        page6ContinueContainer.classList.remove('opacity-0', 'translate-y-3');
      }
    }, 850);
    ssTimers.push(btnTimer);
  }, 3600);
  ssTimers.push(finaleRevealTimer);
}

function initPage6ShootingStars() {
  clearShootingStarTimers();
  if (ssAnimId) {
    cancelAnimationFrame(ssAnimId);
    ssAnimId = null;
  }

  isPage6Running = true;
  ssLastFrameTime = 0;
  ssActiveMeteors = [];
  ssSparks = [];
  ssAmbientGlow = 0;

  resizeShootingStarCanvas();
  buildGalaxySceneLayers();

  if (shootingStarOpening) {
    shootingStarOpening.classList.add('opacity-0', 'translate-y-2');
  }
  if (skyWishText) {
    skyWishText.classList.remove('is-visible', 'is-dissolving');
    skyWishText.classList.add('is-hidden');
  }
  if (shootingStarFinale) {
    shootingStarFinale.classList.add('opacity-0');
  }
  if (page6ContinueContainer) {
    page6ContinueContainer.classList.add('opacity-0', 'translate-y-3');
  }

  ssAnimId = requestAnimationFrame(renderShootingStarLoop);

  const openFadeTimer = setTimeout(() => {
    if (shootingStarOpening) {
      shootingStarOpening.classList.remove('opacity-0', 'translate-y-2');
    }
  }, 250);
  ssTimers.push(openFadeTimer);

  const firstMeteorTimer = setTimeout(() => {
    launchSingleWishSequence(0);
  }, 2100);
  ssTimers.push(firstMeteorTimer);
}

if (btnPage6Next) {
  btnPage6Next.addEventListener('click', (e) => {
    e.stopPropagation();
    isPage6Running = false;
    clearShootingStarTimers();
    if (ssAnimId) {
      cancelAnimationFrame(ssAnimId);
      ssAnimId = null;
    }
    clearAllConfetti();
    navigateToPage(6, 7, () => {
      initPage7Farewell();
    });
  });
}

// ============================================================================
// PAGE 7: GOODBYE PAGE (5-MODE LOOPING HEARTS & REFINED BACKGROUND SPARKLES)
// ============================================================================
const page7Section = document.getElementById('page-7');
const page7HorizonGlow = document.getElementById('page7-horizon-glow');
const page7SparkleStage = document.getElementById('page7-sparkle-stage');
const goodbyeText1 = document.getElementById('goodbye-text-1');
const goodbyeText2 = document.getElementById('goodbye-text-2');
const goodbyeTapHint = document.getElementById('goodbye-tap-hint');
const page7InteractionCanvas = document.getElementById('page7-interaction-canvas');
const page7Ctx = page7InteractionCanvas ? page7InteractionCanvas.getContext('2d') : null;

let page7HeartEffects = [];
let page7AnimLoopId = null;
let page7TapCounter = 0;

function resizePage7Canvas() {
  if (page7InteractionCanvas) {
    page7InteractionCanvas.width = window.innerWidth;
    page7InteractionCanvas.height = window.innerHeight;
  }
}
window.addEventListener('resize', resizePage7Canvas);
resizePage7Canvas();

function drawTranslucentHeart(ctx, x, y, size, alpha, fillColor, strokeColor, rotation = 0) {
  if (alpha <= 0.01 || size <= 0.5) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.translate(x, y);
  ctx.rotate(rotation);

  const s = size / 16;
  ctx.beginPath();
  ctx.moveTo(0, 4 * s);
  ctx.bezierCurveTo(0, -3 * s, -12 * s, -3 * s, -12 * s, 4 * s);
  ctx.bezierCurveTo(-12 * s, 11 * s, 0, 16 * s, 0, 21 * s);
  ctx.bezierCurveTo(0, 16 * s, 12 * s, 11 * s, 12 * s, 4 * s);
  ctx.bezierCurveTo(12 * s, -3 * s, 0, -3 * s, 0, 4 * s);
  ctx.closePath();

  ctx.shadowColor = strokeColor;
  ctx.shadowBlur = 14;
  ctx.fillStyle = fillColor;
  ctx.fill();

  ctx.lineWidth = 1.4;
  ctx.strokeStyle = strokeColor;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(-4.5 * s, 3 * s, 1.8 * s, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fill();

  ctx.restore();
}

// MODE 1: HEART MITOSIS
class HeartMitosisEffect {
  constructor(x, y) {
    this.type = 'mitosis';
    this.x = x;
    this.y = y;
    this.age = 0;
    this.splitFrame = 18;
    this.hasSplit = false;
    this.parentSize = 14;
    this.parentAlpha = 0.9;
    this.children = [];
    this.done = false;
  }

  update() {
    this.age++;
    if (!this.hasSplit) {
      this.parentSize = 14 + Math.sin((this.age / this.splitFrame) * Math.PI * 0.8) * 16;
      if (this.age >= this.splitFrame) {
        this.hasSplit = true;
        const colors = [
          { fill: 'rgba(244, 114, 182, 0.38)', stroke: '#fbcfe8' },
          { fill: 'rgba(251, 113, 133, 0.38)', stroke: '#ffe4e6' },
          { fill: 'rgba(253, 230, 138, 0.35)', stroke: '#fef3c7' },
          { fill: 'rgba(232, 121, 249, 0.35)', stroke: '#fae8ff' },
          { fill: 'rgba(244, 63, 94, 0.38)', stroke: '#fecdd3' }
        ];
        for (let i = 0; i < 5; i++) {
          const baseAngle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          this.children.push({
            x: this.x,
            y: this.y,
            angle: baseAngle,
            radius: 6,
            spiralSpeed: 0.045,
            riseOffset: 0,
            size: 11,
            alpha: 0.92,
            color: colors[i]
          });
        }
      }
    } else {
      let aliveCount = 0;
      this.children.forEach((c) => {
        c.angle += c.spiralSpeed;
        c.radius += 1.35;
        c.riseOffset -= 1.35;
        c.x = this.x + Math.cos(c.angle) * c.radius;
        c.y = this.y + Math.sin(c.angle) * (c.radius * 0.65) + c.riseOffset;
        c.alpha -= 0.011;
        if (c.alpha > 0) aliveCount++;
      });
      if (aliveCount === 0) this.done = true;
    }
  }

  draw(ctx) {
    if (!this.hasSplit) {
      drawTranslucentHeart(
        ctx,
        this.x,
        this.y - 10,
        this.parentSize,
        this.parentAlpha,
        'rgba(244, 114, 182, 0.42)',
        '#fde68a'
      );
    } else {
      this.children.forEach((c) => {
        drawTranslucentHeart(
          ctx,
          c.x,
          c.y - 8,
          c.size,
          c.alpha,
          c.color.fill,
          c.color.stroke,
          Math.sin(c.angle) * 0.25
        );
      });
    }
  }
}

// MODE 2: LANTERN-HEART ASCENSION
class LanternHeartEffect {
  constructor(x, y) {
    this.type = 'lantern';
    this.x = x;
    this.y = y;
    this.vy = -1.75;
    this.swayPhase = Math.random() * Math.PI * 2;
    this.size = 18;
    this.alpha = 0.92;
    this.embers = [];
    this.done = false;
  }

  update() {
    this.swayPhase += 0.05;
    this.x += Math.sin(this.swayPhase) * 0.85;
    this.y += this.vy;
    this.alpha -= 0.0065;

    if (this.alpha > 0.2 && Math.random() < 0.65) {
      this.embers.push({
        x: this.x + (Math.random() - 0.5) * 8,
        y: this.y + 14,
        vx: (Math.random() - 0.5) * 0.6,
        vy: Math.random() * 0.8 + 0.3,
        alpha: 0.9,
        size: Math.random() * 1.8 + 1.2
      });
    }

    for (let i = this.embers.length - 1; i >= 0; i--) {
      const em = this.embers[i];
      em.x += em.vx;
      em.y += em.vy;
      em.alpha -= 0.025;
      if (em.alpha <= 0) this.embers.splice(i, 1);
    }

    if (this.alpha <= 0 && this.embers.length === 0) {
      this.done = true;
    }
  }

  draw(ctx, allEffects) {
    allEffects.forEach((other) => {
      if (other !== this && other.type === 'lantern' && other.alpha > 0.15 && this.alpha > 0.15) {
        const dist = Math.hypot(other.x - this.x, other.y - this.y);
        if (dist < 240) {
          ctx.save();
          ctx.globalAlpha = Math.min(this.alpha, other.alpha) * (1 - dist / 240) * 0.65;
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          ctx.quadraticCurveTo(
            (this.x + other.x) / 2,
            (this.y + other.y) / 2 + 22,
            other.x,
            other.y
          );
          ctx.strokeStyle = '#fde68a';
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();
        }
      }
    });

    this.embers.forEach((em) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, em.alpha);
      ctx.fillStyle = '#fde68a';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(em.x, em.y, em.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    drawTranslucentHeart(
      ctx,
      this.x,
      this.y - 10,
      this.size,
      this.alpha,
      'rgba(253, 230, 138, 0.34)',
      '#fbcfe8',
      Math.sin(this.swayPhase) * 0.12
    );
  }
}

// MODE 3: SPIRAL GALAXY HEART VORTEX
class SpiralGalaxyHeartEffect {
  constructor(x, y) {
    this.type = 'galaxy';
    this.x = x;
    this.y = y;
    this.alpha = 0.95;
    this.orbiters = [];
    this.done = false;

    for (let i = 0; i < 8; i++) {
      this.orbiters.push({
        angle: (Math.PI * 2 * i) / 8,
        radius: 14 + (i % 2) * 10,
        speed: 0.065 + (i % 3) * 0.012,
        size: 7 + (i % 3) * 2.2,
        isGold: i % 2 === 0
      });
    }
  }

  update() {
    this.y -= 0.7;
    this.alpha -= 0.011;
    this.orbiters.forEach((o) => {
      o.angle += o.speed;
      o.radius += 0.55;
    });
    if (this.alpha <= 0) {
      this.done = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha * 0.35);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.orbiters[0].radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#fbcfe8';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    this.orbiters.forEach((o) => {
      const ox = this.x + Math.cos(o.angle) * o.radius;
      const oy = this.y + Math.sin(o.angle) * o.radius * 0.78;
      drawTranslucentHeart(
        ctx,
        ox,
        oy - 6,
        o.size,
        this.alpha,
        o.isGold ? 'rgba(253, 230, 138, 0.42)' : 'rgba(244, 114, 182, 0.42)',
        o.isGold ? '#ffffff' : '#fde68a',
        Math.cos(o.angle) * 0.2
      );
    });

    drawTranslucentHeart(
      ctx,
      this.x,
      this.y - 10,
      17,
      this.alpha,
      'rgba(255, 255, 255, 0.35)',
      '#f472b6'
    );
  }
}

// MODE 4: HEARTBEAT ECHO & SAKURA PETAL SHOWER
class HeartbeatPetalEffect {
  constructor(x, y) {
    this.type = 'heartbeat-petal';
    this.x = x;
    this.y = y;
    this.age = 0;
    this.heartSize = 18;
    this.heartAlpha = 0.92;
    this.waves = [
      { radius: 10, alpha: 0.85, speed: 2.1 },
      { radius: 4, alpha: 0.65, speed: 1.55 }
    ];
    this.petals = [];
    this.done = false;

    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.2 + 1.0;
      this.petals.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.8,
        sway: Math.random() * Math.PI * 2,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.08,
        size: Math.random() * 4 + 5,
        alpha: 0.9,
        isMicroHeart: i % 4 === 0
      });
    }
  }

  update() {
    this.age++;
    const beat = Math.sin(this.age * 0.25) * 2.5;
    this.heartSize = Math.max(12, 18 + beat);
    this.heartAlpha -= 0.011;

    this.waves.forEach((w) => {
      w.radius += w.speed;
      w.alpha -= 0.016;
    });

    this.petals.forEach((p) => {
      p.sway += 0.07;
      p.x += p.vx + Math.sin(p.sway) * 0.55;
      p.y += p.vy + 0.35;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.rot += p.rotSpeed;
      p.alpha -= 0.011;
    });

    if (this.heartAlpha <= 0 && this.petals.every((p) => p.alpha <= 0)) {
      this.done = true;
    }
  }

  draw(ctx) {
    this.waves.forEach((w) => {
      if (w.alpha > 0) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, w.alpha);
        ctx.beginPath();
        ctx.arc(this.x, this.y, w.radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#fbcfe8';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
      }
    });

    this.petals.forEach((p) => {
      if (p.alpha <= 0) return;
      if (p.isMicroHeart) {
        drawTranslucentHeart(
          ctx,
          p.x,
          p.y,
          p.size,
          p.alpha,
          'rgba(244, 114, 182, 0.45)',
          '#fde68a',
          p.rot
        );
      } else {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.quadraticCurveTo(p.size, 0, 0, p.size);
        ctx.quadraticCurveTo(-p.size, 0, 0, -p.size);
        ctx.fillStyle = 'rgba(251, 207, 232, 0.65)';
        ctx.fill();
        ctx.restore();
      }
    });

    drawTranslucentHeart(
      ctx,
      this.x,
      this.y - 10,
      this.heartSize,
      this.heartAlpha,
      'rgba(251, 113, 133, 0.44)',
      '#ffffff'
    );
  }
}

// MODE 5: SHOOTING-STAR RIBBON HEART
class RibbonHeartEffect {
  constructor(x, y) {
    this.type = 'ribbon-heart';
    this.x = x;
    this.y = y;
    this.progress = 0;
    this.alpha = 0.95;
    this.scale = window.innerWidth < 640 ? 2.4 : 3.2;
    this.trailPoints = [this.getHeartPoint(0)];
    this.done = false;
  }

  getHeartPoint(t) {
    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return {
      x: this.x + hx * this.scale,
      y: this.y + hy * this.scale
    };
  }

  update() {
    this.y -= 0.45;
    if (this.progress < Math.PI * 2) {
      for (let step = 0; step < 3; step++) {
        this.progress = Math.min(Math.PI * 2, this.progress + 0.14);
        this.trailPoints.push(this.getHeartPoint(this.progress));
      }
    } else {
      this.alpha -= 0.016;
    }

    if (this.alpha <= 0) {
      this.done = true;
    }
  }

  draw(ctx) {
    if (this.trailPoints.length < 2) return;

    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);

    if (this.progress >= Math.PI * 1.8) {
      ctx.beginPath();
      this.trailPoints.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(244, 114, 182, 0.24)';
      ctx.fill();
    }

    ctx.beginPath();
    this.trailPoints.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.strokeStyle = '#fde68a';
    ctx.shadowColor = '#f472b6';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.stroke();

    if (this.progress < Math.PI * 2) {
      const tip = this.trailPoints[this.trailPoints.length - 1];
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function renderPage7Frame() {
  if (!page7Ctx || !page7InteractionCanvas) return;
  page7Ctx.clearRect(0, 0, page7InteractionCanvas.width, page7InteractionCanvas.height);

  for (let i = page7HeartEffects.length - 1; i >= 0; i--) {
    const effect = page7HeartEffects[i];
    effect.update();
    effect.draw(page7Ctx, page7HeartEffects);

    if (effect.done) {
      page7HeartEffects.splice(i, 1);
    }
  }

  if (page7HeartEffects.length > 0) {
    page7AnimLoopId = requestAnimationFrame(renderPage7Frame);
  } else {
    page7AnimLoopId = null;
    page7Ctx.clearRect(0, 0, page7InteractionCanvas.width, page7InteractionCanvas.height);
  }
}

function triggerCyclingHeartEffect(clientX, clientY) {
  if (!page7InteractionCanvas || !page7Ctx) return;

  if (
    page7InteractionCanvas.width !== window.innerWidth ||
    page7InteractionCanvas.height !== window.innerHeight
  ) {
    resizePage7Canvas();
  }

  page7TapCounter++;
  const modeIndex = (page7TapCounter - 1) % 5;

  let newEffect;
  if (modeIndex === 0) {
    newEffect = new HeartMitosisEffect(clientX, clientY);
  } else if (modeIndex === 1) {
    newEffect = new LanternHeartEffect(clientX, clientY);
  } else if (modeIndex === 2) {
    newEffect = new SpiralGalaxyHeartEffect(clientX, clientY);
  } else if (modeIndex === 3) {
    newEffect = new HeartbeatPetalEffect(clientX, clientY);
  } else {
    newEffect = new RibbonHeartEffect(clientX, clientY);
  }

  page7HeartEffects.push(newEffect);

  if (!page7AnimLoopId) {
    renderPage7Frame();
  }
}

if (page7Section) {
  page7Section.addEventListener('pointerdown', (e) => {
    if (currentPage !== 7) return;
    triggerCyclingHeartEffect(e.clientX, e.clientY);
  });
}

function renderPage7Sparkles() {
  if (!page7SparkleStage) return;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isMobile = vw < 640;
  const isTablet = vw >= 640 && vw < 1024;

  // Keep central farewell message completely unobstructed
  const centerTextZone = {
    left: vw * (isMobile ? 0.14 : 0.28),
    right: vw * (isMobile ? 0.86 : 0.72),
    top: vh * 0.34,
    bottom: vh * 0.66
  };

  scatterAmbientSparkles({
    container: page7SparkleStage,
    targetCount: isMobile ? 18 : isTablet ? 26 : 32,
    minDist: isMobile ? 48 : 64,
    exclusionZones: [centerTextZone],
    edgeMarginPct: 5,
    sizeScale: isMobile ? 0.78 : 0.9
  });
}

window.addEventListener('resize', () => {
  if (currentPage === 7) renderPage7Sparkles();
});

function initPage7Farewell() {
  page7TapCounter = 0;
  page7HeartEffects = [];
  resizePage7Canvas();

  setTimeout(() => {
    if (page7HorizonGlow) page7HorizonGlow.classList.remove('opacity-0');
  }, 300);

  setTimeout(() => {
    if (goodbyeText1) goodbyeText1.classList.remove('opacity-0');
  }, 700);

  setTimeout(() => {
    if (goodbyeText2) goodbyeText2.classList.remove('opacity-0');
  }, 1400);

  setTimeout(() => {
    if (goodbyeTapHint) goodbyeTapHint.classList.remove('opacity-0');
  }, 1900);

  renderPage7Sparkles();
}