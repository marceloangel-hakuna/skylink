"use client";

/**
 * Safari iOS PWA viewport fix.
 *
 * Problem: In Safari (browser + standalone PWA), the visible viewport height
 * fluctuates as the browser chrome appears/disappears and when the keyboard
 * opens. This causes position:fixed elements to visually jump.
 *
 * Fix: Use window.visualViewport to track the actual visible area and write
 * it into --app-height on :root. The CSS uses this variable instead of dvh.
 */

import { useEffect } from "react";

export default function ViewportFix() {
  useEffect(() => {
    function update() {
      const h = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${h}px`);
    }

    update();

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", update);
    }
    window.addEventListener("resize", update);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", update);
      }
      window.removeEventListener("resize", update);
    };
  }, []);

  return null;
}
