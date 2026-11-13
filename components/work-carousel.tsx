"use client";

/* Work carousel (home page): an endless row of cards round the outside of a curve. The middle card faces you at full
   size; the others shrink and turn in to face it, the side ones tucking partly behind it on wide screens. Only the
   middle card's title and description show. Modelled on the project carousel at pedropeguerojr.com.

   Sideways trackpad swipes, shift + wheel, dragging and flicking move it, springing to the nearest card. Clicking a
   side card brings it to the middle; the arrow keys move one card while it's on screen; tabbing to a card's title brings it to the middle.
   Only the title links to the project: clicking the middle picture does nothing.
   Hovering the middle picture tilts it toward the cursor. The first time it scrolls into view, the cards turn over
   to face you, from the middle out.

   Every card is placed with a transform each frame. A card sliding off one end comes back round the other, so the
   row never ends; short lists are repeated to fill it (repeats are hidden from screen readers). A live demo (an
   iframe) can only be used in the middle: elsewhere it's inert, so clicks land on the card instead. A slideshow
   plays wherever its card is on screen, and its arrows work only in the middle. */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { WorkItem } from "@/content/work";
import { Demo } from "./demo";
import { prefersReducedMotion } from "@/lib/dom";

// Spring snap: pulled toward where it's heading, overshooting a little and settling
const SPRING_STIFF = 0.025; // per 60fps frame
const SPRING_DAMP = 0.8; // speed kept each frame
const WHEEL_SNAP_MS = 120; // quiet time after a swipe before it snaps
const THROW_MS = 250; // a flick carries on as far as it would go in this long
const FLICK = 0.3; // px/ms: a flick this fast always moves at least one card
const DRAG_THRESHOLD = 6; // px before a press counts as a drag
// Cards lean with the speed, the trailing edge swinging back
const LEAN = 0.15; // degrees per px/frame
const LEAN_MAX = 10;
const LEAN_EASE = 0.15;
// Slideshow (media type "slides"): how long each picture holds in the middle card (the fade to the next one, in
// app/site.css, takes 450ms more), and how often that's checked
const SLIDE_HOLD_MS = 1600;
const SLIDE_TICK_MS = 100;
// Hover tilt on the middle picture
const TILT_DEG = 3;
const TILT_PERSPECTIVE = 1600;
const TILT_EASE = 0.12;
// Curve
const SIDE_SCALE = 0.8;
const SIDE_SCALE_PHONE = 0.88;
const NEXT_SCALE = 0.7; // the next ones out, on wide screens
const CURVE_ANGLE = (26 * Math.PI) / 180; // how far round the curve each card sits
const CURVE_ANGLE_PHONE = (22 * Math.PI) / 180;
const CURVE_PERSPECTIVE = 1.6; // viewing distance, in card widths
const CURVE_HIDE = 1.2; // radians: cards further round are hidden
const CURVE_TURN_MAX = (32 * Math.PI) / 180;
const PHONE = 768; // px, as in site.css
const WIDE = 992; // px: two cards on each side from here up
// Wide screens: side cards slide in behind the middle one (in card widths), the next ones out further still.
// They only start once a card is TUCK_FROM away, so cards passing in the middle don't overlap.
const TUCK = 0.4;
const TUCK_NEXT = 0.2;
const TUCK_FROM = 0.45;
const INFO_FULL = 0.15; // title and description fully shown this close to the middle (in cards)…
const INFO_GONE = 0.6; // …and gone by this far out
// First time on screen: every card edge-on, turning over on a spring from the middle out
const FLIP_MS = 1500;
const FLIP_STAGGER = 220;
const FLIP_SPRING = 0.5; // lower = bouncier
const FLIP_FADE = 0.15; // fades in over this much of the turn, so no edge shows
const FLIP_WAIT_MS = 400; // most it waits for pictures still loading
const MIN_CARDS = 8; // enough to cover the screen with cards to spare at each end

const mod = (n: number, m: number) => ((n % m) + m) % m;
const clamp01 = (n: number) => Math.max(0, Math.min(1, Math.round(n * 1000) / 1000));

/** A spring settling from 0 to 1 over p = 0…1: starts still, overshoots, wobbles, nudged to land exactly */
function flipEase(p: number) {
  const stiff = 4.75 / FLIP_SPRING;
  const wobble = stiff * Math.sqrt(1 - FLIP_SPRING * FLIP_SPRING);
  const at = (q: number) => 1 - Math.exp(-FLIP_SPRING * stiff * q) * (Math.cos(wobble * q) + ((FLIP_SPRING * stiff) / wobble) * Math.sin(wobble * q));
  return at(p) + (1 - at(1)) * p * p * p;
}

const isExternal = (href: string) => /^https?:/.test(href);

type SlidesMedia = Extract<WorkItem["media"], { type: "slides" }>;

/** A slideshow (media type "slides"): each picture holds, then the next fades in over it. It plays while its card
    is on screen, middle or side, and holds still under the cursor in the middle, where arrows step back and
    forward. Pictures load one ahead of the one showing.
    With `browser` it plays in a Safari window on a wallpaper (app/site.css sizes it in 1180ths of the card). */
function Slides({ media: { slides, browser }, alt, copy }: { media: SlidesMedia; alt: string; copy: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ at, prev }, setShown] = useState({ at: 0, prev: -1 });
  const [loaded, setLoaded] = useState(0); // pictures up to this one have their src
  const atRef = useRef(0);
  const heldRef = useRef(0); // how long the picture showing has been in the middle card, unhovered
  const n = slides.length;

  function show(i: number) {
    setLoaded((l) => Math.max(l, i));
    setShown({ at: i, prev: atRef.current });
    atRef.current = i;
    heldRef.current = 0;
  }

  useEffect(() => {
    const el = ref.current!;
    const card = el.closest(".q-car-card");
    if (n < 2 || !card || prefersReducedMotion()) return;
    let onScreen = false;
    let hovered = false;
    let last = performance.now();
    const seen = new IntersectionObserver(([entry]) => (onScreen = entry.isIntersecting));
    seen.observe(el);
    const enter = () => (hovered = true);
    const leave = () => (hovered = false);
    const area = el.closest(".q-car-media") ?? el; // the whole card, window and wallpaper
    area.addEventListener("pointerenter", enter);
    area.addEventListener("pointerleave", leave);
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      // Back in the middle, the picture showing gets its full time again
      // Off screen, or a side card turned too far to show (the carousel hides it)
      if (!onScreen || (card as HTMLElement).style.visibility === "hidden") return;
      const next = (atRef.current + 1) % n;
      setLoaded((l) => Math.max(l, next));
      if ((hovered && card.classList.contains("is-active")) || document.hidden) return;
      heldRef.current += dt;
      const img = el.querySelector<HTMLImageElement>(`img[data-i="${next}"]`);
      if (heldRef.current < SLIDE_HOLD_MS || !img?.complete) return;
      show(next);
    }, SLIDE_TICK_MS);
    return () => {
      clearInterval(timer);
      seen.disconnect();
      area.removeEventListener("pointerenter", enter);
      area.removeEventListener("pointerleave", leave);
    };
  }, [n]);

  const arrows = n > 1 && (
    <>
      <button type="button" className="q-car-arrow q-car-arrow--prev" aria-label="Previous screen" tabIndex={copy ? -1 : undefined} onClick={() => show((atRef.current + n - 1) % n)} />
      <button type="button" className="q-car-arrow q-car-arrow--next" aria-label="Next screen" tabIndex={copy ? -1 : undefined} onClick={() => show((atRef.current + 1) % n)} />
    </>
  );
  // Without the browser the arrows sit on the pictures; with it, on the wallpaper either side of the window
  const pictures = (
    <div className="q-car-slides" ref={ref}>
      {slides.map(({ src }, i) =>
        i <= loaded ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            data-i={i}
            src={src}
            alt={i ? "" : alt}
            loading="lazy"
            decoding="async"
            draggable={false}
            className={i === at ? "is-shown" : i === prev ? "was-shown" : undefined}
          />
        ) : null,
      )}
      {!browser && arrows}
    </div>
  );
  if (!browser) return pictures;
  const url = slides[at].url ?? "";
  const slash = url.indexOf("/");
  return (
    <div className="q-car-desk" style={{ background: browser.background }}>
      <div className="q-car-win">
        <div className="q-car-sbar" aria-hidden="true">
          <span className="q-car-lights"><i /><i /><i /></span>
          <i className="q-car-ico q-car-ico--side" />
          <span className="q-car-nav"><i /><i /></span>
          <span className="q-car-url">
            {slash < 0 ? url : url.slice(0, slash)}
            {slash >= 0 && <span>{url.slice(slash)}</span>}
            <i className="q-car-ico q-car-ico--reload" />
          </span>
          <span className="q-car-tools"><i className="q-car-ico q-car-ico--share" /><i className="q-car-ico q-car-ico--plus" /><i className="q-car-ico q-car-ico--tabs" /></span>
        </div>
        {pictures}
      </div>
      {arrows}
    </div>
  );
}

function Media({ item, copy }: { item: WorkItem; copy: boolean }) {
  const { media } = item;
  // Inert until it's in the middle (setActive below switches it)
  if (media.type === "demo") return <Demo demo={media} className="q-car-media" inert tabIndex={copy ? -1 : undefined} />;
  return (
    <div className="q-car-media">
      {media.type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={media.src} alt={media.alt} loading="lazy" decoding="async" draggable={false} />
      ) : media.type === "slides" ? (
        <Slides media={media} alt={media.alt} copy={copy} />
      ) : (
        <video muted loop playsInline preload="none" poster={media.poster} src={media.src} />
      )}
    </div>
  );
}

function Title({ item, copy }: { item: WorkItem; copy: boolean }) {
  const { href, title, year } = item;
  // The year follows the title, outside its link
  const when = <span className="q-car-year"> · {year}</span>;
  if (!href) return <h3 className="q-car-title">{title}{when}</h3>;
  const props = { tabIndex: copy ? -1 : undefined };
  return (
    <h3 className="q-car-title">
      {isExternal(href) ? (
        <a {...props} href={href} target="_blank" rel="noopener">{title}</a>
      ) : (
        <Link {...props} href={href}>{title}</Link>
      )}
      {when}
    </h3>
  );
}

type CardState = { offset: number; hidden?: boolean; opacity?: string; z?: string; text?: number; near?: boolean };

export function WorkCarousel({ items, label }: { items: WorkItem[]; label: string }) {
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);
  const copies = Math.ceil(MIN_CARDS / Math.max(items.length, 1));
  const cards = Array.from({ length: copies }, (_, c) => items.map((item) => ({ item, copy: c > 0 }))).flat();

  useEffect(() => {
    const root = rootRef.current!;
    const track = trackRef.current!;
    const els = Array.from(track.children) as HTMLElement[];
    if (!els.length) return;
    const st: CardState[] = els.map(() => ({ offset: 0 }));
    const info = els.map((el) => el.querySelector<HTMLElement>(".q-car-info"));
    const frames = els.map((el) => el.querySelector<HTMLElement>(".q-demo-frame"));
    const videos = els.map((el) => el.querySelector("video"));
    const reduce = prefersReducedMotion();
    const n = items.length;

    let width = 0; // card width
    let step = 0; // card width + gap
    let total = 0; // the whole loop
    let radius = 0;
    let current = 0; // how far the row has moved (0: the first card in the middle)
    let target = 0;
    let velocity = 0;
    let lean = 0;
    let lastPos = 0;
    let wide = false;
    let sideScale = SIDE_SCALE;
    let busy = false; // turning over on first view: no moving it
    let frame = 0;
    let lastTime = 0;
    let active = -1;
    let announce = false; // only after someone moves it
    let flipping: { start: number; now: number } | null = null;

    const sides = () => (wide ? 2 : 1);
    const indexAt = (pos: number) => Math.round(pos / step);
    const centerOf = (i: number) => i * step;

    // How far a card t cards from the middle has slid in behind (wide screens)
    function tuckAt(t: number) {
      if (t >= 1) return (TUCK + TUCK_NEXT * (t - 1)) * width;
      if (t <= TUCK_FROM) return 0;
      const u = (t - TUCK_FROM) / (1 - TUCK_FROM);
      const k = (TUCK_NEXT / TUCK) * (1 - TUCK_FROM); // matches its speed at the side spot
      return TUCK * width * (u * u * (3 - 2 * u) + k * u * u * (u - 1));
    }

    // Phones and tablets: a side card turned in looks closer to the middle one; push it out so the gap looks even
    function faceGap() {
      if (wide) return 0;
      const angle = (step - ((1 - sideScale) * width) / 2) / radius;
      const turn = Math.min(angle, CURVE_TURN_MAX);
      const half = (width * sideScale) / 2;
      const innerX = radius * Math.sin(angle) - half * Math.cos(turn);
      const innerZ = -radius * (1 - Math.cos(angle)) - half * Math.sin(turn);
      const p = step * CURVE_PERSPECTIVE;
      const edge = width / 2 + (step - width);
      return Math.max(0, (edge * (p - innerZ)) / p - innerX);
    }

    // Where a card t cards right of the middle sits (mirrored for the left)
    function place(t: number) {
      const shrink = ((1 - sideScale) * width) / 2;
      const pull = (t <= 1 ? t : 2 * t - 1) * shrink; // keep the gaps even as cards shrink
      const angle = (t * step - pull) / radius;
      let scale = 1 - (1 - sideScale) * Math.min(t, 1);
      let tuck = 0;
      if (wide) {
        tuck = tuckAt(t);
        scale -= (sideScale - NEXT_SCALE) * Math.min(Math.max(t - 1, 0), 1);
      }
      return {
        x: radius * Math.sin(angle) - tuck + faceGap() * Math.min(t, 1),
        z: -radius * (1 - Math.cos(angle)),
        angle,
        turn: Math.min(angle, CURVE_TURN_MAX),
        scale,
      };
    }

    function flipAt(t: number) {
      const p = Math.max(0, (flipping!.now - flipping!.start - Math.round(t) * FLIP_STAGGER) / FLIP_MS);
      return { at: p >= 1 ? 1 : flipEase(p), fade: Math.min(1, p / FLIP_FADE) };
    }

    function setActive(i: number) {
      if (i === active) return;
      if (active >= 0) {
        els[active].classList.remove("is-active");
        if (frames[active]) frames[active]!.inert = true;
      }
      active = i;
      if (i < 0) return;
      els[i].classList.add("is-active");
      if (frames[i]) frames[i]!.inert = false;
      if (announce && liveRef.current) liveRef.current.textContent = `${items[i % n].title}, ${(i % n) + 1} of ${n}`;
    }

    function measure() {
      if (root.offsetParent === null) return false;
      const was = step ? { now: current / step, to: target / step } : null;
      wide = innerWidth >= WIDE;
      sideScale = innerWidth < PHONE ? SIDE_SCALE_PHONE : SIDE_SCALE;
      width = els[0].offsetWidth;
      step = width + (parseFloat(getComputedStyle(track).columnGap) || 0);
      total = els.length * step;
      radius = step / (innerWidth < PHONE ? CURVE_ANGLE_PHONE : CURVE_ANGLE);
      track.style.perspective = `${step * CURVE_PERSPECTIVE}px`;
      if (was) {
        current = was.now * step;
        target = was.to * step;
      }
      lastPos = current;
      return true;
    }

    function render(syncVideos = false) {
      const shown = sides();
      const back = shown + 1; // the loop starts this many cards left of the middle
      let middle = -1;
      els.forEach((card, i) => {
        const s = st[i];
        const offset = (mod(i * step - current + step * back, total) - step * back) / step;
        s.offset = offset;
        const t = Math.abs(offset);
        const dir = Math.sign(offset);
        if (t < 0.5) middle = i;
        if (tilt && t >= 0.5 && card.contains(tilt.media)) untilt();

        const spot = place(t);
        const rest = -dir * spot.turn;
        const flip = flipping ? flipAt(t) : null;
        const edgeOn = -(dir || 1) * (Math.PI / 2);
        let show = clamp01(shown + 1 - t); // fades out past the outermost spot
        if (flip) show = clamp01(show * flip.fade);
        const hidden = !show || spot.angle > CURVE_HIDE;
        if (!(hidden && s.hidden)) {
          const turn = lean + (flip ? edgeOn + (rest - edgeOn) * flip.at : rest);
          card.style.transform = `translate3d(${dir * spot.x}px, 0, ${spot.z}px) rotateY(${turn}rad) scale(${spot.scale})`;
        }
        if (hidden !== s.hidden) {
          s.hidden = hidden;
          card.style.visibility = hidden ? "hidden" : "";
        }
        const opacity = show < 1 ? String(show) : "";
        if (opacity !== s.opacity) card.style.opacity = s.opacity = opacity;
        // Wide screens: nearer cards in front, so the outer ones tuck behind
        const z = wide || flipping ? String(1000 - Math.round(t * 100)) : "";
        if (z !== s.z) card.style.zIndex = s.z = z;

        const text = clamp01((INFO_GONE - t) / (INFO_GONE - INFO_FULL));
        const el = info[i];
        if (el && text !== s.text) {
          s.text = text;
          el.style.opacity = text < 1 ? String(text) : "";
          el.style.visibility = text ? "" : "hidden";
        }

        const video = videos[i];
        if (!video || (busy && !syncVideos)) return;
        const near = t < shown + 0.5;
        if (near !== s.near || syncVideos) {
          s.near = near;
          if (near && !reduce) video.play().catch(() => {});
          else video.pause();
        }
      });
      setActive(middle);
    }

    const leanFor = (speed: number) => {
      const most = (LEAN_MAX * Math.PI) / 180;
      return Math.max(-most, Math.min(most, (speed * LEAN * Math.PI) / 180));
    };
    function leanFrom(f: number) {
      const speed = (current - lastPos) / f;
      lastPos = current;
      if (reduce) return;
      const goal = leanFor(speed);
      lean += (goal - lean) * (1 - Math.pow(1 - LEAN_EASE, f));
      if (!goal && Math.abs(lean) < 0.0005) lean = 0;
    }

    function tick(now: number) {
      const dt = lastTime ? Math.min(now - lastTime, 64) : 16.7;
      lastTime = now;
      const f = dt / 16.7;
      if (reduce) {
        current = target;
        velocity = 0;
      } else {
        velocity += (target - current) * SPRING_STIFF * f;
        velocity *= Math.pow(SPRING_DAMP, f);
        current += velocity * f;
      }
      if (Math.abs(target - current) < 0.1 && Math.abs(velocity) < 0.05) {
        current = target;
        velocity = 0;
      }
      leanFrom(f);
      render();
      frame = current === target && !lean ? 0 : requestAnimationFrame(tick);
    }
    function run() {
      if (frame) return;
      lastTime = 0;
      frame = requestAnimationFrame(tick);
    }
    function moveBy(px: number) {
      if (busy) return;
      announce = true;
      target += px;
      run();
    }
    function next(direction: number) {
      if (!step || busy || drag) return;
      moveBy(centerOf(indexAt(target) + direction) - target);
    }
    // Bring a card to the middle, measured from where the row is drawn now (mid-move, current and target differ)
    function goTo(i: number) {
      moveBy(centerOf(indexAt(current + st[i].offset * step)) - target);
    }
    function snap() {
      if (busy || drag || !step) return;
      target = centerOf(indexAt(target));
      run();
    }

    // Sideways swipes and shift + wheel; up/down scrolling is left to the page
    let snapTimer = 0;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || !step) return; // pinch-zoom
      const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerWidth : 1;
      let delta = 0;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) delta = e.deltaX;
      else if (e.shiftKey) delta = e.deltaY;
      if (!delta) return;
      e.preventDefault();
      moveBy(delta * scale);
      clearTimeout(snapTimer);
      snapTimer = window.setTimeout(snap, WHEEL_SNAP_MS);
    };

    // Hover tilt: the middle picture tips toward the cursor, easing back flat when it leaves
    let tilt: { media: HTMLElement; x: number; y: number; toX: number; toY: number } | null = null;
    let tiltFrame = 0;
    function tiltTick() {
      tiltFrame = 0;
      if (!tilt) return;
      tilt.x += (tilt.toX - tilt.x) * TILT_EASE;
      tilt.y += (tilt.toY - tilt.y) * TILT_EASE;
      const settled = Math.abs(tilt.toX - tilt.x) < 0.01 && Math.abs(tilt.toY - tilt.y) < 0.01;
      if (settled && !tilt.toX && !tilt.toY) {
        tilt.media.style.transform = "";
        tilt = null;
        return;
      }
      tilt.media.style.transform = `perspective(${TILT_PERSPECTIVE}px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`;
      if (!settled) tiltFrame = requestAnimationFrame(tiltTick);
    }
    function untilt(now = false) {
      if (!tilt) return;
      if (now) {
        tilt.media.style.transform = "";
        tilt = null;
        return;
      }
      tilt.toX = tilt.toY = 0;
      if (!tiltFrame) tiltFrame = requestAnimationFrame(tiltTick);
    }
    const onHover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (reduce || drag || busy) return untilt();
      const media = (e.target as Element).closest<HTMLElement>(".q-car-media:not([data-demo])");
      const card = media?.closest<HTMLElement>(".q-car-card");
      if (!media || !card || Math.abs(st[els.indexOf(card)].offset) >= 0.5) return untilt();
      if (tilt && tilt.media !== media) untilt(true);
      if (!tilt) tilt = { media, x: 0, y: 0, toX: 0, toY: 0 };
      const r = media.getBoundingClientRect();
      tilt.toX = -(((e.clientY - r.top) / r.height) * 2 - 1) * TILT_DEG;
      tilt.toY = (((e.clientX - r.left) / r.width) * 2 - 1) * TILT_DEG;
      if (!tiltFrame) tiltFrame = requestAnimationFrame(tiltTick);
    };
    const onLeave = () => untilt();

    // Drag (mouse) or swipe (touch), only on the pictures so the text stays selectable. On release it springs to
    // the nearest card, or carries on if flicked.
    let drag: { x: number; y: number; last: number; time: number; v: number; axis: "x" | "y" | null; from: number } | null = null;
    let dragged = false;
    const onThumb = (e: Event) => !!(e.target as Element).closest(".q-car-media");
    const onDown = (e: PointerEvent) => {
      if ((e.pointerType === "mouse" && e.button !== 0) || busy || !onThumb(e)) return;
      drag = { x: e.clientX, y: e.clientY, last: e.clientX, time: e.timeStamp, v: 0, axis: null, from: 0 };
      dragged = false;
      addEventListener("pointermove", onMove);
      addEventListener("pointerup", endDrag);
      addEventListener("pointercancel", endDrag);
    };
    function onMove(e: PointerEvent) {
      if (!drag) return;
      if (!drag.axis) {
        const dx = Math.abs(e.clientX - drag.x);
        const dy = Math.abs(e.clientY - drag.y);
        if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) return;
        // A mouse always drags sideways; a finger moving mostly up or down is scrolling the page
        drag.axis = e.pointerType === "mouse" || dx > dy ? "x" : "y";
        if (drag.axis === "x") {
          dragged = true;
          announce = true;
          root.classList.add("is-dragging");
          getSelection()?.removeAllRanges();
          untilt(true);
          // Catch it where it is, even mid-bounce
          cancelAnimationFrame(frame);
          frame = 0;
          clearTimeout(snapTimer);
          target = current;
          velocity = 0;
          drag.from = indexAt(current);
        }
      }
      if (drag.axis !== "x") return;
      const dx = e.clientX - drag.last;
      drag.v = dx / Math.max(e.timeStamp - drag.time, 1);
      drag.last = e.clientX;
      drag.time = e.timeStamp;
      target -= dx;
      current = target;
      run();
    }
    function endDrag(e: PointerEvent) {
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerup", endDrag);
      removeEventListener("pointercancel", endDrag);
      root.classList.remove("is-dragging");
      if (drag?.axis === "x") {
        const thrown = e.timeStamp - drag.time < 80 ? drag.v : 0; // px/ms, or none if it stopped before letting go
        let to = indexAt(current - thrown * THROW_MS);
        if (Math.abs(thrown) > FLICK && to === drag.from) to -= Math.sign(thrown);
        if (e.pointerType === "touch") to = Math.max(drag.from - 1, Math.min(drag.from + 1, to)); // one at a time
        target = centerOf(to);
        velocity = -thrown * 16.7;
        run();
      }
      drag = null;
    }

    // A drag doesn't also open what's under the pointer; a click either side of the middle card moves to that card
    const onClick = (e: MouseEvent) => {
      if (dragged) {
        e.preventDefault();
        e.stopPropagation();
        dragged = false;
        return;
      }
      if (!step || !onThumb(e)) return;
      const card = (e.target as Element).closest<HTMLElement>(".q-car-card")!;
      const i = els.indexOf(card);
      if (Math.abs(st[i].offset) < 0.5) return; // the middle picture: only its own controls (slideshow arrows) act
      e.preventDefault();
      e.stopPropagation();
      if (!busy) goTo(i);
    };
    const onDragStart = (e: DragEvent) => {
      if (onThumb(e)) e.preventDefault();
    };
    // Left and right arrows move it from anywhere on the page while it's on screen, unless typing somewhere
    let onScreen = false;
    const visible = new IntersectionObserver(([entry]) => (onScreen = entry.isIntersecting));
    visible.observe(track);
    const onKey = (e: KeyboardEvent) => {
      const d = ({ ArrowLeft: -1, ArrowRight: 1 } as Record<string, number>)[e.key];
      if (!d || !onScreen || e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable], [role=tablist], [role=radiogroup], [role=slider]")) return;
      e.preventDefault();
      next(d);
    };
    // Tabbing to a card brings it to the middle
    const onFocus = (e: FocusEvent) => {
      const card = (e.target as Element).closest<HTMLElement>(".q-car-card");
      if (!card || !step) return;
      const back = sides() + 1;
      moveBy(mod(els.indexOf(card) * step - target + step * back, total) - step * back);
    };

    // First time it's on screen: the cards turn over to face you, from the middle out
    let seen: IntersectionObserver | undefined;
    let turnFrame = 0;
    let waitTimer = 0;
    function turn() {
      flipping!.start = performance.now();
      const end = flipping!.start + FLIP_MS + (sides() + 1) * FLIP_STAGGER;
      const turning = (now: number) => {
        flipping!.now = now;
        render();
        if (now < end) {
          turnFrame = requestAnimationFrame(turning);
          return;
        }
        flipping = null;
        busy = false;
        render(true);
      };
      turnFrame = requestAnimationFrame(turning);
    }
    function intro() {
      // Pictures on screen are decoded first, so none turns over blank (waiting at most FLIP_WAIT_MS)
      const decoded: Promise<unknown>[] = [];
      for (let k = -sides(); k <= sides(); k++) {
        const img = els[mod(k, els.length)].querySelector("img");
        if (img) {
          img.loading = "eager";
          decoded.push(img.decode().catch(() => {}));
        }
      }
      Promise.race([Promise.all(decoded), new Promise((r) => (waitTimer = window.setTimeout(r, FLIP_WAIT_MS)))]).then(turn);
    }

    const update = () => {
      if (!measure()) return;
      render(!busy);
      root.classList.add("is-laid-out");
    };
    if (!reduce) {
      busy = true;
      flipping = { start: Infinity, now: 0 }; // edge-on and hidden until it's seen
      seen = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          seen!.disconnect();
          intro();
        },
        { threshold: 0.3 },
      );
      seen.observe(track);
    }
    update();
    const ro = new ResizeObserver(update);
    ro.observe(root);

    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("pointermove", onHover);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("click", onClick, true);
    root.addEventListener("dragstart", onDragStart);
    document.addEventListener("keydown", onKey);
    root.addEventListener("focusin", onFocus);
    return () => {
      ro.disconnect();
      seen?.disconnect();
      visible.disconnect();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(tiltFrame);
      cancelAnimationFrame(turnFrame);
      clearTimeout(snapTimer);
      clearTimeout(waitTimer);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerup", endDrag);
      removeEventListener("pointercancel", endDrag);
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("pointermove", onHover);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("click", onClick, true);
      root.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("keydown", onKey);
      root.removeEventListener("focusin", onFocus);
    };
  }, [items]);

  return (
    <section className="q-car" ref={rootRef} aria-roledescription="carousel" aria-label={label}>
      <div className="q-car-track" ref={trackRef}>
        {cards.map(({ item, copy }, i) => (
          <div
            className="q-car-card"
            key={i}
            role={copy ? undefined : "group"}
            aria-roledescription={copy ? undefined : "slide"}
            aria-label={copy ? undefined : `${item.title}, ${i + 1} of ${items.length}`}
            aria-hidden={copy || undefined}
          >
            <Media item={item} copy={copy} />
            <div className="q-car-info">
              <Title item={item} copy={copy} />
              <p className="q-car-desc">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="q-sr" aria-live="polite" ref={liveRef} />
    </section>
  );
}

