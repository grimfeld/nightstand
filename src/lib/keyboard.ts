/**
 * Mirrors the virtual keyboard's overlap into `--keyboard-inset` on :root,
 * measured through the visualViewport API. Anything positioned with the var
 * (dialogs, mainly) can then sit just above the keyboard.
 *
 * Self-correcting across soft-input modes: when the webview itself resizes
 * with the keyboard (adjustResize), innerHeight and the visual viewport shrink
 * together and the inset stays 0 — dvh units already did the work. When it
 * does not (adjustPan), the difference is the keyboard's true height.
 */
export function trackKeyboardInset() {
  const vv = window.visualViewport;
  if (!vv) return;

  const update = () => {
    const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    document.documentElement.style.setProperty("--keyboard-inset", `${Math.round(inset)}px`);
  };

  vv.addEventListener("resize", update);
  vv.addEventListener("scroll", update);
  update();
}
