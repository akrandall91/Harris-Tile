const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');

menuBtn?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('menu-open', open);
});

document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuBtn?.setAttribute('aria-expanded','false');
    document.body.classList.remove('menu-open');
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxTitle = document.getElementById('lightboxTitle');

document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => {
    lightboxImg.src = item.dataset.img;
    lightboxImg.alt = item.dataset.title || 'Project image';
    lightboxTitle.textContent = item.dataset.title || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  });
});

function closeLightbox(){
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}
document.querySelector('.lightbox-close')?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', e => { if(e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeLightbox(); });

document.getElementById('estimateForm')?.addEventListener('submit', e => {
  e.preventDefault();
  document.getElementById('formSuccess').style.display='block';
});

document.getElementById('year').textContent = new Date().getFullYear();


// Scroll-driven 3D tile wall + cinematic morph into finished project
(() => {
  const section = document.getElementById('tile-build');
  const wall = document.getElementById('tileWall');
  const wallShell = document.getElementById('tileWallShell');
  const tiles = [...document.querySelectorAll('.build-tile')];
  const reveal = document.getElementById('projectReveal');
  const revealImg = reveal?.querySelector('img');
  const revealCopy = reveal?.querySelector('.project-reveal-copy');
  const caption = document.getElementById('transitionCaption');
  const copy = section?.querySelector('.tile-build-copy');
  const bar = document.getElementById('tileProgressBar');
  const label = document.getElementById('tileProgressLabel');
  if (!section || !wall || !wallShell || !tiles.length || !reveal) return;

  const seeded = (n) => {
    const x = Math.sin(n * 999.91) * 43758.5453;
    return x - Math.floor(x);
  };
  const clamp = (v, a=0, b=1) => Math.max(a, Math.min(b, v));
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  const easeInOut = t => t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2,2)/2;
  const lerp = (a,b,t) => a + (b-a)*t;

  const meta = tiles.map((tile, i) => {
    const col = i % 6;
    const row = Math.floor(i / 6);
    const tx = (seeded(i + 2) * 2 - 1) * 230 + (col < 3 ? -90 : 90);
    const ty = 120 + seeded(i + 7) * 260 + row * 18;
    const tz = -380 - seeded(i + 11) * 520;
    const rx = 40 + seeded(i + 15) * 85;
    const ry = (seeded(i + 19) * 2 - 1) * 90;
    const rz = (seeded(i + 23) * 2 - 1) * 35;
    return { tx, ty, tz, rx, ry, rz };
  });

  let lastSettled = -1;

  const update = () => {
    const rect = section.getBoundingClientRect();
    const scrollable = section.offsetHeight - window.innerHeight;
    const progress = clamp((-rect.top) / Math.max(1, scrollable));

    if (bar) bar.style.width = `${Math.round(progress * 100)}%`;
    if (label) label.textContent = `${Math.round(progress * 100)}%`;

    // Phase 1: build the wall (0 - .68)
    const buildP = clamp(progress / .68);
    const total = tiles.length;

    tiles.forEach((tile, i) => {
      const start = (i / total) * .54;
      const local = clamp((buildP - start) / .19);
      const e = easeOutCubic(local);
      const m = meta[i];

      const tx = m.tx * (1 - e);
      const ty = m.ty * (1 - e);
      const tz = m.tz * (1 - e);
      const rx = m.rx * (1 - e);
      const ry = m.ry * (1 - e);
      const rz = m.rz * (1 - e);
      const scale = .72 + .28 * e;

      tile.style.transform =
        `translate3d(${tx}px,${ty}px,${tz}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`;
      tile.style.opacity = String(.08 + .92 * e);
      tile.style.filter = `blur(${1.4 * (1 - e)}px)`;

      const settledIndex = Math.floor(buildP * total);
      if (i <= settledIndex && i > lastSettled) tile.classList.add('settled');
    });
    lastSettled = Math.max(lastSettled, Math.floor(buildP * total));

    // Camera straightens as the wall finishes
    const wallTiltY = lerp(-12, 0, buildP);
    const wallTiltX = lerp(10, 0, buildP);
    const wallScale = lerp(.92, 1, buildP);
    wall.style.transform = `rotateX(${wallTiltX}deg) rotateY(${wallTiltY}deg) scale(${wallScale})`;

    // Phase 2: flatten, compress grout, reveal finished project (.62 - 1)
    const morphP = clamp((progress - .62) / .38);
    const morphE = easeInOut(morphP);

    // Wall grows slightly and visually flattens into the exact frame of the photo
    wallShell.style.transform = `scale(${lerp(1,1.055,morphE)}) translateY(${lerp(0,-6,morphE)}px)`;
    wallShell.style.filter = `contrast(${lerp(1,1.05,morphE)}) brightness(${lerp(1,.92,morphE)})`;
    wallShell.style.opacity = String(1 - clamp((morphP - .48) / .42));

    const gap = lerp(9, 1.5, morphE);
    wall.style.gap = `${gap}px`;

    // Tiles subtly lose depth before disappearing
    tiles.forEach((tile, i) => {
      if (morphP > 0) {
        const flatten = easeInOut(clamp((morphP - .05) / .6));
        tile.style.borderRadius = `${lerp(10,2,flatten)}px`;
        tile.style.boxShadow =
          `inset 0 1px 0 rgba(255,255,255,${lerp(.45,.12,flatten)}),
           inset 0 -10px 18px rgba(0,0,0,${lerp(.08,.02,flatten)}),
           0 ${lerp(18,2,flatten)}px ${lerp(35,5,flatten)}px rgba(0,0,0,${lerp(.18,.06,flatten)})`;
      }
    });

    // Photo appears from the middle of the tile wall outward
    const revealP = clamp((progress - .69) / .31);
    const revealE = easeInOut(revealP);
    reveal.style.opacity = String(revealP);
    reveal.style.transform = `translate(-50%,-50%) scale(${lerp(.94,1,revealE)})`;
    const inset = lerp(44,0,revealE);
    reveal.style.clipPath = `inset(${inset}% ${inset}% ${inset}% ${inset}% round ${lerp(22,26,revealE)}px)`;

    if (revealImg) {
      revealImg.style.transform = `scale(${lerp(1.08,1,revealE)})`;
      revealImg.style.filter = `saturate(${lerp(.85,1.05,revealE)}) brightness(${lerp(.78,1,revealE)})`;
    }

    if (revealCopy) {
      const cp = clamp((revealP - .58) / .42);
      revealCopy.style.opacity = String(cp);
      revealCopy.style.transform = `translateY(${lerp(20,0,easeOutCubic(cp))}px)`;
    }

    if (caption) {
      const capP = clamp((revealP - .45) / .35);
      caption.style.opacity = String(1 - clamp((revealP - .85) / .15));
      caption.style.transform = `translateX(-50%) translateY(${lerp(12,0,easeOutCubic(capP))}px)`;
    }

    // Copy fades late so the finished project can own the screen
    if (copy) {
      const copyFade = clamp((progress - .76) / .18);
      copy.style.opacity = String(1 - copyFade);
      copy.style.transform = `translateY(${lerp(0,-18,copyFade)}px)`;
    }
  };

  let ticking = false;
  const requestUpdate = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
      ticking = true;
    }
  };

  update();
  addEventListener('scroll', requestUpdate, { passive:true });
  addEventListener('resize', requestUpdate);
})();
