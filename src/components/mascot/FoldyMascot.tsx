"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import type { FoldyMood } from "@/lib/foldy-coach";

export type FoldySize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<FoldySize, number> = {
  xs: 24,
  sm: 36,
  md: 60,
  lg: 96,
  xl: 148,
};

interface MoodShapeConfig {
  eyeL: "oval" | "happy" | "star";
  eyeR: "oval" | "happy" | "star";
  mouth: "smile" | "grin" | "o" | "w";
  typing: boolean;
  restEyeScaleY: number;
  restMouthScale: number;
  restBrowY: number;
  restBrowRot: number;
  restFlapRot: number;
  restBodyRot: number;
}

const MOOD_SHAPES: Record<FoldyMood, MoodShapeConfig> = {
  idle: {
    eyeL: "oval",
    eyeR: "oval",
    mouth: "smile",
    typing: false,
    restEyeScaleY: 1,
    restMouthScale: 1,
    restBrowY: 0,
    restBrowRot: 0,
    restFlapRot: 0,
    restBodyRot: 0,
  },
  cursor: {
    eyeL: "oval",
    eyeR: "oval",
    mouth: "smile",
    typing: false,
    restEyeScaleY: 1,
    restMouthScale: 1,
    restBrowY: -2,
    restBrowRot: 0,
    restFlapRot: 0,
    restBodyRot: 0,
  },
  happy: {
    eyeL: "happy",
    eyeR: "happy",
    mouth: "grin",
    typing: false,
    restEyeScaleY: 1,
    restMouthScale: 1.04,
    restBrowY: -7,
    restBrowRot: -5,
    restFlapRot: -10,
    restBodyRot: -2,
  },
  ai: {
    eyeL: "star",
    eyeR: "oval",
    mouth: "o",
    typing: true,
    restEyeScaleY: 1,
    restMouthScale: 0.78,
    restBrowY: -6,
    restBrowRot: -4,
    restFlapRot: -8,
    restBodyRot: 0,
  },
  wink: {
    eyeL: "oval",
    eyeR: "happy",
    mouth: "grin",
    typing: false,
    restEyeScaleY: 1,
    restMouthScale: 1,
    restBrowY: -8,
    restBrowRot: -9,
    restFlapRot: -10,
    restBodyRot: -4,
  },
  eureka: {
    eyeL: "oval",
    eyeR: "oval",
    mouth: "o",
    typing: false,
    restEyeScaleY: 1.15,
    restMouthScale: 1.08,
    restBrowY: -11,
    restBrowRot: -12,
    restFlapRot: -14,
    restBodyRot: -2,
  },
  crafty: {
    eyeL: "happy",
    eyeR: "oval",
    mouth: "w",
    typing: false,
    restEyeScaleY: 1,
    restMouthScale: 1,
    restBrowY: -6,
    restBrowRot: 8,
    restFlapRot: -5,
    restBodyRot: 3,
  },
  sleepy: {
    eyeL: "oval",
    eyeR: "oval",
    mouth: "o",
    typing: false,
    restEyeScaleY: 0.24,
    restMouthScale: 0.72,
    restBrowY: 6,
    restBrowRot: 7,
    restFlapRot: 6,
    restBodyRot: 0,
  },
};

export interface FoldyMascotProps {
  mood?: FoldyMood;
  size?: FoldySize;
  engine?: "ambient" | "interactive";
  interactiveClick?: boolean;
  showShadow?: boolean;
  burstKey?: number | string;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}

const AMBIENT_BURST_MS = 1350;

export function FoldyMascot({
  mood = "idle",
  size = "md",
  engine = "ambient",
  interactiveClick = false,
  showShadow = false,
  burstKey,
  onClick,
  className = "",
  ariaLabel = "Maskot Foldy Craftfolio",
}: FoldyMascotProps) {
  const reactId = useId();
  const maskId = `foldy-mask-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const px = SIZE_PX[size];
  const shape = MOOD_SHAPES[mood];

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  const faceRef = useRef<SVGGElement>(null);
  const browRef = useRef<SVGRectElement>(null);
  const eyeLWrapRef = useRef<SVGGElement>(null);
  const eyeRWrapRef = useRef<SVGGElement>(null);
  const mouthWrapRef = useRef<SVGGElement>(null);
  const flapRef = useRef<SVGPathElement>(null);
  const line1Ref = useRef<SVGRectElement>(null);
  const line2Ref = useRef<SVGRectElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);

  const moodRef = useRef<FoldyMood>(mood);
  const isMountedRef = useRef(false);
  const isVisibleRef = useRef(true);
  const reducedMotionRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const burstUntilRef = useRef<number>(0);

  // Spring physics state (mutated in-place inside rAF, zero React re-renders)
  const physRef = useRef({
    mouseX: 0,
    mouseY: 0,
    curX: 0,
    curY: 0,
    jumpVel: 0,
    jumpY: 0,
    squashX: 1,
    squashY: 1,
    bodyTilt: 0,
    lastBlink: 0,
    isBlinking: false,
  });

  const applyRestingPose = useCallback((targetMood: FoldyMood) => {
    const s = MOOD_SHAPES[targetMood];
    bodyRef.current?.setAttribute(
      "transform",
      `translate(128,228) rotate(${s.restBodyRot}) translate(-128,-228)`
    );
    faceRef.current?.setAttribute("transform", "translate(0,0)");
    browRef.current?.setAttribute(
      "transform",
      `translate(89,59) translate(0,${s.restBrowY}) rotate(${s.restBrowRot}) translate(-89,-59)`
    );
    eyeLWrapRef.current?.setAttribute(
      "transform",
      `translate(94,136) scale(1,${s.restEyeScaleY}) translate(-94,-136)`
    );
    eyeRWrapRef.current?.setAttribute(
      "transform",
      `translate(162,136) scale(1,${s.restEyeScaleY}) translate(-162,-136)`
    );
    mouthWrapRef.current?.setAttribute(
      "transform",
      `translate(128,175) scale(${s.restMouthScale},${s.restMouthScale}) translate(-128,-175)`
    );
    flapRef.current?.setAttribute(
      "transform",
      `translate(156,84) rotate(${s.restFlapRot}) translate(-156,-84)`
    );
    if (line1Ref.current) line1Ref.current.setAttribute("width", targetMood === "ai" ? "44" : "0");
    if (line2Ref.current) line2Ref.current.setAttribute("width", targetMood === "ai" ? "32" : "0");
    if (shadowRef.current) {
      shadowRef.current.style.transform = "translateX(0px) scale(1)";
    }
  }, []);

  const stopLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const startLoopRef = useRef<() => void>(() => {});

  useEffect(() => {
    const tick = (t: number) => {
      if (
        reducedMotionRef.current ||
        !isVisibleRef.current ||
        (typeof document !== "undefined" && document.visibilityState !== "visible")
      ) {
        rafIdRef.current = null;
        applyRestingPose(moodRef.current);
        return;
      }

      const activeMood = moodRef.current;
      const shouldKeepRunning =
        engine === "interactive" ||
        activeMood === "ai" ||
        t < burstUntilRef.current;

      if (!shouldKeepRunning) {
        rafIdRef.current = null;
        applyRestingPose(activeMood);
        return;
      }

      const p = physRef.current;
      const sec = t / 1000;

      // Smooth cursor interpolation (only meaningful in interactive engine)
      if (engine === "interactive") {
        p.curX += (p.mouseX - p.curX) * 0.14;
        p.curY += (p.mouseY - p.curY) * 0.14;
      } else {
        p.curX *= 0.85;
        p.curY *= 0.85;
      }

      // Vertical jump & squash-stretch spring
      p.jumpY += p.jumpVel;
      if (p.jumpY < 0) {
        p.jumpVel += 1.15;
      } else if (p.jumpY > 0) {
        p.jumpY = 0;
        if (Math.abs(p.jumpVel) > 2) {
          p.squashX = 1.09;
          p.squashY = 0.91;
        }
        p.jumpVel = 0;
      }
      p.squashX += (1 - p.squashX) * 0.18;
      p.squashY += (1 - p.squashY) * 0.18;
      p.bodyTilt += (0 - p.bodyTilt) * 0.12;

      // Spontaneous periodic blink in interactive mode
      if (engine === "interactive" && t - p.lastBlink > 3000) {
        p.lastBlink = t;
        p.isBlinking = true;
      }
      if (p.isBlinking && t - p.lastBlink > 130) {
        p.isBlinking = false;
      }

      let bx = 0;
      let by = p.jumpY;
      let bRot = p.bodyTilt;
      let sx = p.squashX;
      let sy = p.squashY;
      let fx = p.curX * 14;
      let fy = p.curY * 10;
      let browX = p.curX * 8;
      let browY = p.curY * 5;
      let browRot = p.curX * 10;
      let browScaleX = 1;
      let flapRot = p.curX * 8;
      let eyeLScaleX = 1;
      let eyeLScaleY = p.isBlinking ? 0.08 : 1;
      let eyeRScaleX = 1;
      let eyeRScaleY = p.isBlinking ? 0.08 : 1;
      let mouthScaleX = 1;
      let mouthScaleY = 1;
      let mouthX = 0;
      const mouthY = 0;

      if (activeMood === "cursor" || activeMood === "idle") {
        bRot += p.curX * 6;
        bx = p.curX * 6;
        by += Math.sin(sec * 2.8) * 2.5;
        eyeLScaleX = 1 - p.curX * 0.12;
        eyeRScaleX = 1 + p.curX * 0.12;
        browY -= 2;
        flapRot += Math.sin(sec * 3.8) * 4;
      } else if (activeMood === "happy") {
        const bounce = Math.abs(Math.sin(sec * 7)) * -8;
        by += bounce;
        bRot += Math.sin(sec * 7) * 4;
        sx *= 1 - bounce * 0.004;
        sy *= 1 + bounce * 0.004;
        fy = -4 + Math.sin(sec * 14) * 2;
        browY = -8 + Math.sin(sec * 7) * 2.5;
        browRot = -6;
        browScaleX = 1.12;
        flapRot = -12 + Math.sin(sec * 16) * 9;
        mouthScaleX = 1.06 + Math.sin(sec * 14) * 0.05;
        mouthScaleY = 1.06 - Math.sin(sec * 14) * 0.05;
      } else if (activeMood === "ai") {
        const scan = Math.sin(sec * 5.2);
        fx = scan * 10;
        fy = -7;
        bRot += scan * 2.5;
        by += Math.sin(sec * 5.5) * 2;
        browY = -6;
        browRot = -4;
        browScaleX = 0.72 + (Math.sin(sec * 7.5) + 1) * 0.22;
        const w1 = 22 + ((Math.sin(sec * 4) + 1) / 2) * 50;
        const w2 = 16 + ((Math.cos(sec * 4) + 1) / 2) * 42;
        line1Ref.current?.setAttribute("width", w1.toFixed(1));
        line2Ref.current?.setAttribute("width", w2.toFixed(1));
        eyeLScaleX = 0.94 + Math.sin(sec * 9.5) * 0.16;
        eyeLScaleY = 0.94 + Math.sin(sec * 9.5) * 0.16;
        mouthX = scan * 4;
        mouthScaleX = 0.76 + Math.sin(sec * 7.5) * 0.12;
        mouthScaleY = 0.76 - Math.sin(sec * 7.5) * 0.12;
        flapRot = -8 + Math.sin(sec * 9.5) * 6;
      } else if (activeMood === "wink") {
        bRot += -4.5 + Math.sin(sec * 4) * 2;
        fx = 5 + p.curX * 5;
        fy = -3 + p.curY * 3;
        browX = 5;
        browY = -9;
        browRot = -10;
        browScaleX = 1.1;
        flapRot = -11 + Math.sin(sec * 13) * 9;
        mouthX = 3;
      } else if (activeMood === "eureka") {
        by += Math.sin(sec * 7.5) * 2.5;
        eyeLScaleX = 1.18;
        eyeLScaleY = p.isBlinking ? 0.1 : 1.2;
        eyeRScaleX = 1.18;
        eyeRScaleY = p.isBlinking ? 0.1 : 1.2;
        browY = -12;
        browRot = -13;
        browScaleX = 1.18;
        mouthScaleX = 1.1 + Math.sin(sec * 9.5) * 0.1;
        mouthScaleY = 1.18 - Math.sin(sec * 9.5) * 0.1;
        flapRot = -15 + Math.sin(sec * 11) * 5;
      } else if (activeMood === "crafty") {
        bRot += 3.5 + Math.sin(sec * 3.5) * 2.5;
        fx = 6 + p.curX * 5;
        fy = -2;
        browX = 6;
        browY = -6;
        browRot = 8;
        flapRot = -5 + Math.sin(sec * 6.5) * 5;
      } else if (activeMood === "sleepy") {
        const breath = Math.sin(sec * 1.8);
        by += breath * 2.5;
        sx *= 1 - breath * 0.02;
        sy *= 1 + breath * 0.02;
        fy = 5 + breath * 2.5;
        eyeLScaleY = 0.24;
        eyeRScaleY = 0.24;
        browY = 6 + breath * 1.5;
        browRot = 7;
        mouthScaleX = 0.65 + (breath + 1) * 0.22;
        mouthScaleY = 0.55 + (breath + 1) * 0.35;
        flapRot = 6 + breath * 3.5;
      }

      bodyRef.current?.setAttribute(
        "transform",
        `translate(128,228) translate(${bx.toFixed(1)},${by.toFixed(1)}) rotate(${bRot.toFixed(2)}) scale(${sx.toFixed(3)},${sy.toFixed(3)}) translate(-128,-228)`
      );
      faceRef.current?.setAttribute(
        "transform",
        `translate(${fx.toFixed(1)},${fy.toFixed(1)})`
      );
      browRef.current?.setAttribute(
        "transform",
        `translate(89,59) translate(${browX.toFixed(1)},${browY.toFixed(1)}) rotate(${browRot.toFixed(1)}) scale(${browScaleX.toFixed(2)},1) translate(-89,-59)`
      );
      eyeLWrapRef.current?.setAttribute(
        "transform",
        `translate(94,136) scale(${eyeLScaleX.toFixed(2)},${eyeLScaleY.toFixed(2)}) translate(-94,-136)`
      );
      eyeRWrapRef.current?.setAttribute(
        "transform",
        `translate(162,136) scale(${eyeRScaleX.toFixed(2)},${eyeRScaleY.toFixed(2)}) translate(-162,-136)`
      );
      mouthWrapRef.current?.setAttribute(
        "transform",
        `translate(128,175) translate(${mouthX.toFixed(1)},${mouthY.toFixed(1)}) scale(${mouthScaleX.toFixed(2)},${mouthScaleY.toFixed(2)}) translate(-128,-175)`
      );
      flapRef.current?.setAttribute(
        "transform",
        `translate(156,84) rotate(${flapRot.toFixed(1)}) translate(-156,-84)`
      );

      if (shadowRef.current) {
        const shadowScale = Math.max(0.68, 1 + by * 0.015);
        shadowRef.current.style.transform = `translateX(${(bx * 0.6).toFixed(1)}px) scale(${shadowScale.toFixed(2)})`;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (rafIdRef.current !== null || reducedMotionRef.current || !isVisibleRef.current) {
        return;
      }
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      rafIdRef.current = requestAnimationFrame(tick);
    };

    startLoopRef.current = startLoop;

    const mq =
      typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    reducedMotionRef.current = Boolean(mq?.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
      if (e.matches) {
        stopLoop();
        applyRestingPose(moodRef.current);
      } else if (engine === "interactive" || moodRef.current === "ai") {
        startLoop();
      }
    };
    mq?.addEventListener("change", handleMotionChange);

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined" && containerRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          isVisibleRef.current = Boolean(entry?.isIntersecting);
          if (!isVisibleRef.current) {
            stopLoop();
          } else if (
            engine === "interactive" ||
            moodRef.current === "ai" ||
            performance.now() < burstUntilRef.current
          ) {
            startLoop();
          }
        },
        { threshold: 0.05 }
      );
      observer.observe(containerRef.current);
    }

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") {
        stopLoop();
      } else if (
        engine === "interactive" ||
        moodRef.current === "ai" ||
        performance.now() < burstUntilRef.current
      ) {
        startLoop();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const handleMouseMove = (e: MouseEvent) => {
      if (engine !== "interactive" || !svgRef.current || !isVisibleRef.current) {
        return;
      }
      const rect = svgRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      physRef.current.mouseX = Math.max(-1, Math.min(1, (e.clientX - cx) / 260));
      physRef.current.mouseY = Math.max(-1, Math.min(1, (e.clientY - cy) / 260));
    };

    if (engine === "interactive") {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      startLoop();
    } else if (moodRef.current === "ai") {
      startLoop();
    } else {
      applyRestingPose(moodRef.current);
    }

    return () => {
      stopLoop();
      observer?.disconnect();
      mq?.removeEventListener("change", handleMotionChange);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (engine === "interactive") {
        window.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, [engine, applyRestingPose, stopLoop]);

  const triggerSpringBurst = useCallback(
    (power = -13, tilt = -4) => {
      if (reducedMotionRef.current) {
        applyRestingPose(moodRef.current);
        return;
      }
      physRef.current.jumpVel = power;
      physRef.current.squashX = 0.92;
      physRef.current.squashY = 1.1;
      physRef.current.bodyTilt = tilt;
      burstUntilRef.current = performance.now() + AMBIENT_BURST_MS;
      startLoopRef.current();
    },
    [applyRestingPose]
  );

  // React to mood or explicit burstKey changes
  useEffect(() => {
    const prevMood = moodRef.current;
    moodRef.current = mood;

    if (!isMountedRef.current) {
      isMountedRef.current = true;
      applyRestingPose(mood);
      if (mood === "ai" && !reducedMotionRef.current) {
        startLoopRef.current();
      }
      return;
    }

    if (mood === "ai") {
      startLoopRef.current();
      return;
    }

    if (prevMood !== mood || burstKey !== undefined) {
      if (engine === "ambient" && (mood === "happy" || mood === "eureka" || mood === "wink")) {
        triggerSpringBurst(-12, mood === "wink" ? 5 : -4);
      } else if (engine === "interactive") {
        triggerSpringBurst(-14, -4);
      } else {
        applyRestingPose(mood);
      }
    }
  }, [mood, burstKey, engine, applyRestingPose, triggerSpringBurst]);

  const handleClick = () => {
    if (interactiveClick || onClick) {
      triggerSpringBurst(-15, -5);
      onClick?.();
    }
  };

  const isClickable = interactiveClick || Boolean(onClick);

  return (
    <div
      ref={containerRef}
      onClick={isClickable ? handleClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
      aria-label={isClickable ? ariaLabel : undefined}
      className={`inline-flex flex-col items-center justify-center select-none shrink-0 ${
        isClickable ? "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus rounded-lg" : ""
      } ${className}`}
    >
      <svg
        ref={svgRef}
        width={px}
        height={px}
        viewBox="0 0 256 256"
        role={isClickable ? undefined : "img"}
        aria-label={isClickable ? undefined : ariaLabel}
        aria-hidden={isClickable ? true : undefined}
        className="overflow-visible block"
      >
        <defs>
          <mask id={maskId}>
            <rect width="256" height="256" fill="white" />

            {/* Expressive CV Header Line / Eyebrow */}
            <g>
              <rect
                ref={browRef}
                x="60"
                y="52"
                width="58"
                height="14"
                rx="7"
                fill="black"
              />
            </g>

            {/* Extra CV Typing Lines for AI Mood */}
            <g fill="black" opacity={shape.typing ? 1 : 0}>
              <rect ref={line1Ref} x="60" y="76" width={shape.typing ? 44 : 0} height="10" rx="5" />
              <rect ref={line2Ref} x="60" y="94" width={shape.typing ? 32 : 0} height="10" rx="5" />
            </g>

            {/* Main Face Cutouts */}
            <g ref={faceRef} fill="black">
              {/* Left Eye */}
              <g ref={eyeLWrapRef}>
                <rect
                  x="81"
                  y="118"
                  width="25"
                  height="36"
                  rx="12.5"
                  opacity={shape.eyeL === "oval" ? 1 : 0}
                />
                <path
                  opacity={shape.eyeL === "happy" ? 1 : 0}
                  d="M 76 142 A 19 19 0 0 1 112 142 A 5.5 5.5 0 0 1 101.5 145 A 8.5 8.5 0 0 0 86.5 145 A 5.5 5.5 0 0 1 76 142 Z"
                />
                <path
                  opacity={shape.eyeL === "star" ? 1 : 0}
                  d="M 94 112 Q 94 136 118 136 Q 94 136 94 160 Q 94 136 70 136 Q 94 136 94 112 Z"
                />
              </g>

              {/* Right Eye */}
              <g ref={eyeRWrapRef}>
                <rect
                  x="150"
                  y="118"
                  width="25"
                  height="36"
                  rx="12.5"
                  opacity={shape.eyeR === "oval" ? 1 : 0}
                />
                <path
                  opacity={shape.eyeR === "happy" ? 1 : 0}
                  d="M 144 142 A 19 19 0 0 1 180 142 A 5.5 5.5 0 0 1 169.5 145 A 8.5 8.5 0 0 0 154.5 145 A 5.5 5.5 0 0 1 144 142 Z"
                />
                <path
                  opacity={shape.eyeR === "star" ? 1 : 0}
                  d="M 162 112 Q 162 136 186 136 Q 162 136 162 160 Q 162 136 138 136 Q 162 136 162 112 Z"
                />
              </g>

              {/* Mouth */}
              <g ref={mouthWrapRef}>
                <path
                  opacity={shape.mouth === "smile" ? 1 : 0}
                  d="M 98.6 177 A 34 34 0 0 0 157.4 177 A 6 6 0 0 0 147 171 A 22 22 0 0 1 109 171 A 6 6 0 0 0 98.6 177 Z"
                />
                <path
                  opacity={shape.mouth === "grin" ? 1 : 0}
                  d="M 98 166 H 158 A 6 6 0 0 1 164 172 A 36 32 0 0 1 92 172 A 6 6 0 0 1 98 166 Z"
                />
                <circle
                  cx="128"
                  cy="178"
                  r="14"
                  opacity={shape.mouth === "o" ? 1 : 0}
                />
                <path
                  opacity={shape.mouth === "w" ? 1 : 0}
                  d="M 100 175 A 16 15 0 0 0 128 177 A 16 15 0 0 0 156 175 A 5 5 0 0 0 147 170 A 8 8 0 0 1 132 170 A 4 4 0 0 0 124 170 A 8 8 0 0 1 109 170 A 5 5 0 0 0 100 175 Z"
                />
              </g>
            </g>
          </mask>
        </defs>

        <g ref={bodyRef}>
          <path
            mask={`url(#${maskId})`}
            style={{ fill: "var(--foldy-body)", transition: "fill 200ms ease" }}
            d="M 64 20 H 142 V 68 A 30 30 0 0 0 172 98 H 220 V 208 A 28 28 0 0 1 192 236 H 64 A 28 28 0 0 1 36 208 V 48 A 28 28 0 0 1 64 20 Z"
          />
          <path
            ref={flapRef}
            style={{ fill: "var(--foldy-flap)", transition: "fill 200ms ease" }}
            d="M 156 20 L 220 84 H 172 A 16 16 0 0 1 156 68 Z"
          />
        </g>
      </svg>

      {showShadow && (
        <div
          ref={shadowRef}
          aria-hidden="true"
          style={{
            width: Math.round(px * 0.56),
            height: Math.max(6, Math.round(px * 0.08)),
            background: "var(--foldy-shadow)",
          }}
          className="rounded-full mt-1 transition-transform duration-100 ease-out"
        />
      )}
    </div>
  );
}
