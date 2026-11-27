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
// PAGE 1: WELCOME SCREEN (HEY UNCLE!)
// ============================================================================
const sparkleField = document.getElementById('sparkle-field');
const heroCard = document.getElementById('page-1');
const btnPage1Next = document.getElementById('btn-page1-next');

function spawnDiamondSparkles() {
  if (!sparkleField) return;
  sparkleField.innerHTML = '';

  const sparkleCount = 28;
  const colors = ['text-pink-200', 'text-rose-300', 'text-amber-200', 'text-pink-300/80'];

  for (let i = 0; i < sparkleCount; i++) {
    const wrapper = document.createElement('div');
    const size = Math.floor(Math.random() * 7) + 8;
    const top = Math.random() * 94 + 3;
    const left = Math.random() * 94 + 3;
    const duration = (Math.random() * 2.5 + 2.8).toFixed(2);
    const delay = (Math.random() * 3.5).toFixed(2);
    const colorClass = colors[Math.floor(Math.random() * colors.length)];

    wrapper.className = `diamond-sparkle ${colorClass}`;
    wrapper.style.width = `${size}px`;
    wrapper.style.height = `${size}px`;
    wrapper.style.top = `${top}%`;
    wrapper.style.left = `${left}%`;
    wrapper.style.setProperty('--duration', `${duration}s`);
    wrapper.style.setProperty('--delay', `${delay}s`);

    wrapper.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" class="w-full h-full">
        <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
      </svg>
    `;

    sparkleField.appendChild(wrapper);
  }
}

spawnDiamondSparkles();

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

    navigateToPage(1, 2, () => {
      initMemoryGame();
    });
  });
}

// ============================================================================
// PAGE 2: MEMORY MATCHING GAME
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
    cardContainer.className = 'card-container relative w-22 h-32 sm:w-28 sm:h-40 cursor-pointer select-none mx-auto';

    cardContainer.innerHTML = `
      <div class="card-inner" id="card-inner-${index}">
        <div class="card-back bg-gradient-to-br from-[#3d0d26] via-[#260717] to-[#14030c] border border-pink-400/40 rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.5)] flex items-center justify-center p-2 sm:p-2.5">
          <div class="w-full h-full rounded-xl border border-amber-200/25 flex items-center justify-center bg-[#1f0613]/60">
            <span class="font-['Bangers'] text-lg sm:text-2xl tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white via-pink-200 to-amber-200 select-none">
              UNCLE
            </span>
          </div>
        </div>

        <div class="card-front bg-gradient-to-br from-[#4a102f] via-[#2b081b] to-[#14030c] border-2 border-amber-200/60 rounded-2xl shadow-[0_0_20px_rgba(244,114,182,0.3)] flex items-center justify-center text-4xl sm:text-5xl">
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
// PAGE 4: INTERACTIVE BIRTHDAY CAKE & DECORATED BACKGROUND
// ============================================================================
const page4Section = document.getElementById('page-4');
const page4ContinueWrapper = document.getElementById('page4-continue-wrapper');
const btnPage4Next = document.getElementById('btn-page4-next');
const page4DecorStage = document.getElementById('page4-decor-stage');

const candleStates = { candle1: false, candle2: false, candle3: false };
let finalCakeStormFinished = false;

function initPage4Decorations() {
  if (!page4DecorStage) return;
  page4DecorStage.innerHTML = '';

  const decorCount = 32;
  for (let i = 0; i < decorCount; i++) {
    const el = document.createElement('div');
    const isSparkle = i % 3 === 0;
    const top = Math.random() * 92 + 4;
    const left = Math.random() * 92 + 4;
    const size = Math.floor(Math.random() * 5) + 4;
    const dur = (Math.random() * 3 + 2.5).toFixed(2);
    const del = (Math.random() * 3).toFixed(2);

    el.className = 'absolute pointer-events-none cinematic-particle-float';
    el.style.top = `${top}%`;
    el.style.left = `${left}%`;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.animationDuration = `${dur}s`;
    el.style.animationDelay = `${del}s`;

    if (isSparkle) {
      el.className += ' text-pink-200/75';
      el.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" class="w-full h-full">
          <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
        </svg>
      `;
    } else {
      el.style.borderRadius = '50%';
      el.style.backgroundColor = i % 2 === 0 ? '#fbcfe8' : '#fde68a';
      el.style.boxShadow = i % 2 === 0 ? '0 0 8px rgba(244,114,182,0.65)' : '0 0 8px rgba(251,191,36,0.6)';
      el.style.opacity = '0.65';
    }

    page4DecorStage.appendChild(el);
  }
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
// PAGE 6: SHOOTING STAR – MAKE A WISH (CINEMATIC METEOR & GALAXY ENGINE)
// ============================================================================
const SHOOTING_STAR_WISHES = [
  {
    text: 'May happiness find you in the simplest moments.',
    start: { x: 0.08, y: 0.16 },
    ctrl: { x: 0.45, y: 0.32 },
    end: { x: 0.78, y: 0.56 },
    wishPos: { x: 0.64, y: 0.52 },
    duration: 1650,
    scale: 1.0
  },
  {
    text: 'May your dreams take you further than you imagined.',
    start: { x: 0.92, y: 0.18 },
    ctrl: { x: 0.56, y: 0.34 },
    end: { x: 0.22, y: 0.54 },
    wishPos: { x: 0.36, y: 0.48 },
    duration: 1700,
    scale: 1.05
  },
  {
    text: 'May success follow every step you take.',
    start: { x: 0.12, y: 0.64 },
    ctrl: { x: 0.48, y: 0.44 },
    end: { x: 0.82, y: 0.28 },
    wishPos: { x: 0.66, y: 0.36 },
    duration: 1750,
    scale: 1.08
  },
  {
    text: 'May life surprise you with beautiful moments.',
    start: { x: 0.86, y: 0.12 },
    ctrl: { x: 0.58, y: 0.42 },
    end: { x: 0.36, y: 0.72 },
    wishPos: { x: 0.50, y: 0.62 },
    duration: 1900,
    scale: 1.25
  }
];

const shootingStarCanvas = document.getElementById('shooting-star-canvas');
const shootingStarCtx = shootingStarCanvas ? shootingStarCanvas.getContext('2d') : null;
const shootingStarOpening = document.getElementById('shooting-star-opening');
const skyWishAnchor = document.getElementById('sky-wish-anchor');
const skyWishText = document.getElementById('sky-wish-text');
const shootingStarFinale = document.getElementById('shooting-star-finale');
const page6ContinueContainer = document.getElementById('page6-continue-container');
const btnPage6Next = document.getElementById('btn-page6-next');

let ssAnimId = null;
let ssTimers = [];
let ssStarfield = [];
let ssNebulaClouds = [];
let ssActiveMeteors = [];
let ssSparks = [];
let ssAmbientGlow = 0;
let ssCameraTime = 0;
let isPage6Running = false;

function resizeShootingStarCanvas() {
  if (!shootingStarCanvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  shootingStarCanvas.width = window.innerWidth * dpr;
  shootingStarCanvas.height = window.innerHeight * dpr;
  if (shootingStarCtx) {
    shootingStarCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

window.addEventListener('resize', () => {
  if (isPage6Running) {
    resizeShootingStarCanvas();
  }
});

function buildGalaxySceneLayers() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  ssStarfield = [];
  ssNebulaClouds = [];

  const layerConfigs = [
    { count: 90, speed: 0.03, minR: 0.6, maxR: 1.2, maxAlpha: 0.65 },
    { count: 50, speed: 0.07, minR: 1.0, maxR: 1.8, maxAlpha: 0.88 },
    { count: 22, speed: 0.13, minR: 1.5, maxR: 2.5, maxAlpha: 1.0 }
  ];

  const starTints = ['#ffffff', '#fef3c7', '#fbcfe8', '#ddd6fe', '#bae6fd'];

  layerConfigs.forEach((cfg) => {
    for (let i = 0; i < cfg.count; i++) {
      ssStarfield.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: cfg.minR + Math.random() * (cfg.maxR - cfg.minR),
        baseAlpha: 0.3 + Math.random() * (cfg.maxAlpha - 0.3),
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.015 + Math.random() * 0.03,
        driftSpeed: cfg.speed,
        color: starTints[Math.floor(Math.random() * starTints.length)]
      });
    }
  });

  const nebulaSpecs = [
    { rx: 0.28, ry: 0.32, radius: Math.max(w, h) * 0.38, color: 'rgba(147, 51, 234, 0.14)', vx: 0.06, vy: -0.03 },
    { rx: 0.72, ry: 0.58, radius: Math.max(w, h) * 0.40, color: 'rgba(219, 39, 119, 0.12)', vx: -0.05, vy: 0.04 },
    { rx: 0.50, ry: 0.25, radius: Math.max(w, h) * 0.34, color: 'rgba(59, 130, 246, 0.10)', vx: 0.04, vy: 0.02 },
    { rx: 0.35, ry: 0.72, radius: Math.max(w, h) * 0.36, color: 'rgba(244, 114, 182, 0.11)', vx: -0.04, vy: -0.03 }
  ];

  nebulaSpecs.forEach((n) => {
    ssNebulaClouds.push({
      x: w * n.rx,
      y: h * n.ry,
      radius: n.radius,
      color: n.color,
      vx: n.vx,
      vy: n.vy
    });
  });
}

class RealisticMeteor {
  constructor({ start, ctrl, end, duration = 1700, scale = 1.0, onDisappear = null }) {
    this.start = start;
    this.ctrl = ctrl;
    this.end = end;
    this.duration = duration;
    this.scale = scale;
    this.onDisappear = onDisappear;

    this.startTime = performance.now();
    this.history = [];
    this.maxHistory = Math.round(30 * Math.max(0.75, scale));
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
    return t < 0.5
      ? 2 * t * t
      : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  update(now) {
    const rawT = (now - this.startTime) / this.duration;
    const clampedT = Math.min(1, Math.max(0, rawT));
    const easedT = this.easeTrajectory(clampedT);

    let brightness = 1;
    if (clampedT < 0.14) {
      brightness = clampedT / 0.14;
    } else if (clampedT > 0.72) {
      brightness = Math.max(0, 1 - (clampedT - 0.72) / 0.28);
    }
    brightness *= 0.92 + Math.sin(now * 0.045) * 0.08;

    if (clampedT <= 1) {
      const pos = this.getQuadraticPoint(easedT);
      this.history.unshift({ x: pos.x, y: pos.y, brightness });
      if (this.history.length > this.maxHistory) {
        this.history.pop();
      }

      if (brightness > 0.15 && this.history.length > 2) {
        const prev = this.history[1];
        const vx = (pos.x - prev.x) * 0.18;
        const vy = (pos.y - prev.y) * 0.18;
        const sparkCount = this.scale >= 1 ? 2 : 1;

        for (let i = 0; i < sparkCount; i++) {
          ssSparks.push({
            x: pos.x + (Math.random() - 0.5) * 5 * this.scale,
            y: pos.y + (Math.random() - 0.5) * 5 * this.scale,
            vx: vx + (Math.random() - 0.5) * 1.15,
            vy: vy + (Math.random() - 0.5) * 1.15 + 0.15,
            size: (Math.random() * 1.6 + 0.8) * Math.min(1.2, this.scale),
            alpha: brightness * (0.65 + Math.random() * 0.35),
            decay: 0.016 + Math.random() * 0.018,
            isGold: Math.random() > 0.38
          });
        }
      }
    }

    if (clampedT >= 0.86 && !this.hasTriggeredCallback) {
      this.hasTriggeredCallback = true;
      if (typeof this.onDisappear === 'function') {
        this.onDisappear();
      }
    }

    if (clampedT >= 1) {
      this.history.pop();
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
      const alpha = Math.pow(ratio, 1.65) * curr.brightness;
      if (alpha <= 0.01) continue;

      let r, g, b;
      if (ratio > 0.75) {
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
      ctx.lineWidth = Math.max(0.8, ratio * 10.0 * this.scale);
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(curr.x, curr.y);
      ctx.lineTo(next.x, next.y);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.92})`;
      ctx.lineWidth = Math.max(0.5, ratio * 3.4 * this.scale);
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    const head = this.history[0];
    if (head && head.brightness > 0.03) {
      const glowRadius = 24 * this.scale;
      const radGrad = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, glowRadius);
      radGrad.addColorStop(0, `rgba(255, 255, 255, ${head.brightness})`);
      radGrad.addColorStop(0.22, `rgba(254, 243, 199, ${head.brightness * 0.85})`);
      radGrad.addColorStop(0.55, `rgba(244, 114, 182, ${head.brightness * 0.35})`);
      radGrad.addColorStop(1, 'rgba(244, 114, 182, 0)');

      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(head.x, head.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 255, 255, ${head.brightness})`;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 2.8 * this.scale, 0, Math.PI * 2);
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

  const w = window.innerWidth;
  const h = window.innerHeight;
  ssCameraTime += 0.008;

  shootingStarCtx.clearRect(0, 0, w, h);

  // 1. Drifting Nebula Clouds
  ssNebulaClouds.forEach((cloud) => {
    cloud.x += cloud.vx;
    cloud.y += cloud.vy;
    if (cloud.x < -cloud.radius * 0.4) cloud.x = w + cloud.radius * 0.3;
    if (cloud.x > w + cloud.radius * 0.4) cloud.x = -cloud.radius * 0.3;
    if (cloud.y < -cloud.radius * 0.4) cloud.y = h + cloud.radius * 0.3;
    if (cloud.y > h + cloud.radius * 0.4) cloud.y = -cloud.radius * 0.3;

    const grad = shootingStarCtx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.radius);
    grad.addColorStop(0, cloud.color);
    grad.addColorStop(1, 'rgba(6, 2, 13, 0)');
    shootingStarCtx.fillStyle = grad;
    shootingStarCtx.beginPath();
    shootingStarCtx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
    shootingStarCtx.fill();
  });

  // Brief warm golden-pink cosmic illumination during meteor shower
  if (ssAmbientGlow > 0.002) {
    const finaleGrad = shootingStarCtx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, Math.max(w, h) * 0.65);
    finaleGrad.addColorStop(0, `rgba(253, 230, 138, ${ssAmbientGlow * 0.16})`);
    finaleGrad.addColorStop(0.5, `rgba(244, 114, 182, ${ssAmbientGlow * 0.12})`);
    finaleGrad.addColorStop(1, 'rgba(6, 2, 13, 0)');
    shootingStarCtx.fillStyle = finaleGrad;
    shootingStarCtx.fillRect(0, 0, w, h);
    ssAmbientGlow *= 0.992;
  }

  // 2. Parallax Distant Stars
  const camOffsetX = Math.sin(ssCameraTime) * 6;
  const camOffsetY = Math.cos(ssCameraTime * 0.7) * 4;

  ssStarfield.forEach((star) => {
    star.twinklePhase += star.twinkleSpeed;
    star.x -= star.driftSpeed;
    if (star.x < 0) star.x += w;

    const alpha = star.baseAlpha * (0.65 + 0.35 * Math.sin(star.twinklePhase));
    const drawX = star.x + camOffsetX * (star.driftSpeed * 8);
    const drawY = star.y + camOffsetY * (star.driftSpeed * 8);

    shootingStarCtx.save();
    shootingStarCtx.globalAlpha = Math.max(0.1, Math.min(1, alpha));
    shootingStarCtx.fillStyle = star.color;
    shootingStarCtx.beginPath();
    shootingStarCtx.arc(drawX, drawY, star.r, 0, Math.PI * 2);
    shootingStarCtx.fill();
    shootingStarCtx.restore();
  });

  // 3. Detaching Glowing Ember Sparks
  shootingStarCtx.save();
  shootingStarCtx.globalCompositeOperation = 'lighter';
  for (let i = ssSparks.length - 1; i >= 0; i--) {
    const sp = ssSparks[i];
    sp.x += sp.vx;
    sp.y += sp.vy;
    sp.vx *= 0.97;
    sp.vy *= 0.97;
    sp.alpha -= sp.decay;
    sp.size *= 0.992;

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

  // 4. Active Shooting Stars
  for (let i = ssActiveMeteors.length - 1; i >= 0; i--) {
    const meteor = ssActiveMeteors[i];
    meteor.update(now);
    meteor.draw(shootingStarCtx);
    if (meteor.finished) {
      ssActiveMeteors.splice(i, 1);
    }
  }

  ssAnimId = requestAnimationFrame(renderShootingStarLoop);
}

function showSkyWishAt(text, normX, normY) {
  if (!skyWishAnchor || !skyWishText) return;

  const isMobile = window.innerWidth < 640;
  const safeX = Math.max(isMobile ? 0.48 : 0.28, Math.min(isMobile ? 0.52 : 0.72, normX));
  const safeY = Math.max(0.34, Math.min(0.76, normY));

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

  if (wishIndex >= SHOOTING_STAR_WISHES.length) {
    triggerGrandMeteorShower();
    return;
  }

  const spec = SHOOTING_STAR_WISHES[wishIndex];

  ssActiveMeteors.push(
    new RealisticMeteor({
      start: spec.start,
      ctrl: spec.ctrl,
      end: spec.end,
      duration: spec.duration,
      scale: spec.scale,
      onDisappear: () => {
        showSkyWishAt(spec.text, spec.wishPos.x, spec.wishPos.y);

        const dissolveTimer = setTimeout(() => {
          dissolveSkyWish();

          const nextTimer = setTimeout(() => {
            launchSingleWishSequence(wishIndex + 1);
          }, 1100);
          ssTimers.push(nextTimer);
        }, 2500);
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

  const showerCount = 22;
  for (let i = 0; i < showerCount; i++) {
    const delay = i * 165 + Math.random() * 110;
    const tId = setTimeout(() => {
      if (!isPage6Running) return;
      const fromRight = i % 3 === 0;
      const startX = fromRight ? 0.65 + Math.random() * 0.32 : 0.04 + Math.random() * 0.55;
      const startY = 0.04 + Math.random() * 0.28;
      const spanX = (0.28 + Math.random() * 0.25) * (fromRight ? -1 : 1);
      const spanY = 0.32 + Math.random() * 0.28;

      ssActiveMeteors.push(
        new RealisticMeteor({
          start: { x: startX, y: startY },
          ctrl: { x: startX + spanX * 0.5, y: startY + spanY * 0.42 },
          end: { x: startX + spanX, y: startY + spanY },
          duration: 1100 + Math.random() * 550,
          scale: 0.55 + Math.random() * 0.38
        })
      );
    }, delay);
    ssTimers.push(tId);
  }

  const finaleRevealTimer = setTimeout(() => {
    if (!isPage6Running) return;
    if (shootingStarFinale) {
      shootingStarFinale.classList.remove('opacity-0');
    }
    const btnTimer = setTimeout(() => {
      if (page6ContinueContainer) {
        page6ContinueContainer.classList.remove('opacity-0', 'translate-y-3');
      }
    }, 900);
    ssTimers.push(btnTimer);
  }, 4400);
  ssTimers.push(finaleRevealTimer);
}

function initPage6ShootingStars() {
  clearShootingStarTimers();
  if (ssAnimId) {
    cancelAnimationFrame(ssAnimId);
    ssAnimId = null;
  }

  isPage6Running = true;
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
  }, 300);
  ssTimers.push(openFadeTimer);

  const firstMeteorTimer = setTimeout(() => {
    launchSingleWishSequence(0);
  }, 2400);
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
// PAGE 7: GOODBYE PAGE (5-MODE LOOPING TRANSLUCENT HEART GESTURES)
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

  if (page7SparkleStage) {
    page7SparkleStage.innerHTML = '';
    for (let i = 0; i < 38; i++) {
      const sp = document.createElement('div');
      const size = Math.floor(Math.random() * 6) + 5;
      const isDiamond = i % 2 === 0;

      sp.className = 'absolute pointer-events-none cinematic-particle-float text-pink-200/80';
      sp.style.width = `${size}px`;
      sp.style.height = `${size}px`;
      sp.style.top = `${Math.random() * 92 + 4}%`;
      sp.style.left = `${Math.random() * 92 + 4}%`;
      sp.style.animationDuration = `${(Math.random() * 3 + 2.5).toFixed(2)}s`;
      sp.style.animationDelay = `${(Math.random() * 3).toFixed(2)}s`;

      if (isDiamond) {
        sp.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-full h-full">
            <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
          </svg>
        `;
      } else {
        sp.style.borderRadius = '50%';
        sp.style.backgroundColor = i % 3 === 0 ? '#fbcfe8' : '#fde68a';
        sp.style.boxShadow = '0 0 8px rgba(244,114,182,0.65)';
      }

      page7SparkleStage.appendChild(sp);
    }
  }
}