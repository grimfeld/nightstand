/**
 * Mirrors the virtual keyboard's overlap into `--keyboard-inset` on :root,
 * measured through the visualViewport API. Anything positioned with the var
 * (dialogs, mainly) can then sit just above the keyboard.
 *
 * Self-correcting across soft-input modes: when the webview itself resizes
 * with the keyboard (adjustResize), innerHeight and the visual viewport shrink
 * together and the inset stays 0. When it does not, the difference is the
 * keyboard's true height.
 */
export function trackKeyboardInset() {
  const vv = window.visualViewport;
  if (!vv) return;

  let raf = 0;

  const apply = () => {
    raf = 0;
    const overlap = window.innerHeight - vv.height - vv.offsetTop;
    // Anything toolbar-sized is browser chrome noise, not a keyboard; snapping
    // the dialog around for it is what makes the UI feel jumpy.
    const inset = overlap > 48 ? Math.round(overlap) : 0;
    document.documentElement.style.setProperty("--keyboard-inset", `${inset}px`);
  };

  // Coalesce the event bursts a keyboard animation fires into one write per
  // frame; the CSS transition on the dialog smooths over the rest.
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(apply);
  };

  vv.addEventListener("resize", schedule);
  vv.addEventListener("scroll", schedule);
  apply();
}
