/**
 * Minimal Spectrogram Gimmick
 * Reacts to mouse movement:
 * - Vertical: Amplitude (closer to top = higher)
 * - Horizontal: Speed/Frequency
 */

export function initSpectrogram(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width, height;
  let mouseX = 0.5;
  let mouseY = 0.5;
  let bars = [];
  const numBars = 240; // High density for the "Underone" look

  // Heartbeat pulse state
  let pulses = [];

  function resize() {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;

    bars = Array.from({ length: numBars }, (_, i) => ({
      val: 0,
      target: 0,
      noise: 0.2 + Math.random() * 0.8,
      secondaryNoise: 0.1 + Math.random() * 0.5,
    }));
  }

  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / width;
    mouseY = e.clientY; // Store raw Y for better distance calculation
  }

  function onMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / width;
    pulses.push({
      x: clickX,
      startTime: performance.now(),
      duration: 1500, // ms
      speed: 1.2, // speed of propagation
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Calculate canvas center relative to viewport
    const rect = canvas.getBoundingClientRect();
    const canvasCenterY = rect.top + rect.height / 2;
    const viewportHeight = window.innerHeight;

    // Use a larger normalization factor (full viewportHeight)
    // to ensure it still reacts even at the very top/bottom of the screen.
    const distanceToCenter = Math.abs(mouseY - canvasCenterY);
    const verticalWeight = Math.max(0.1, 1 - distanceToCenter / viewportHeight);

    const barWidth = 1;
    const spread = 0.05;
    const currentTime = performance.now();

    // Clean up old pulses
    pulses = pulses.filter((p) => currentTime - p.startTime < p.duration);

    bars.forEach((bar, i) => {
      const xPos = i / numBars;
      const distance = xPos - mouseX;

      // Calculate basic Gaussian wave
      let wave = Math.exp(-(distance * distance) / (2 * spread * spread));

      // Add heartbeat pulse influence
      let pulseInfluence = 0;
      pulses.forEach((p) => {
        const elapsed = (currentTime - p.startTime) / 1000; // seconds
        const travelDist = elapsed * p.speed;
        const distFromClick = Math.abs(xPos - p.x);

        // Ripple effect: peaks when distFromClick == travelDist
        const ripple = Math.exp(-Math.pow(distFromClick - travelDist, 2) / 0.005);
        const fade = Math.max(0, 1 - (currentTime - p.startTime) / p.duration);
        pulseInfluence += ripple * fade * 0.5;
      });

      wave = Math.pow(wave + pulseInfluence, 2);

      // Layer 1: Subtle background shadow wave (Darker/Lower)

      const secondaryHeight = wave * height * 0.3 * verticalWeight * bar.secondaryNoise;
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.fillRect(i * (width / numBars), (height - secondaryHeight) / 2, barWidth, secondaryHeight);

      // Layer 2: Main foreground wave (Bright/Taller)
      // Multiply by a higher factor to get that 3x sudden spike feel
      bar.target = wave * height * 1.2 * verticalWeight * bar.noise;
      bar.val += (bar.target - bar.val) * 0.15; // Slightly faster transition

      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      const x = i * (width / numBars);

      // Ensure a minimum height (flatline) even when wave is 0
      const finalHeight = Math.max(2, bar.val);
      const y = (height - finalHeight) / 2;

      ctx.fillRect(x, y, barWidth, finalHeight);
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mousedown", onMouseDown);

  resize();
  draw();
}
