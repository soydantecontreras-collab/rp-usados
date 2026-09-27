/** One outstanding seek, one latest target. Presentation, not assignment, opens the poster gate. */
export function createSeekController(video, poster, diagnostics, onError, canReveal) {
  let desired = 0, sent = NaN, busy = false, decoded = false, suspended = false, disposed = false;
  let callback = 0, requestStarted = 0;
  const fps = 48, frameTolerance = .5 / fps + .002;
  const started = performance.now();
  const timeFor = p => Math.round(Math.max(0, Math.min(1, p)) * 143) / fps;
  const supported = typeof video.requestVideoFrameCallback === 'function';
  diagnostics.presentationAPI = supported ? 'requestVideoFrameCallback' : 'seeked + animation frame';
  function reveal() {
    if (!disposed && canReveal() && Math.abs((diagnostics.presentedTime ?? -10) - desired) <= frameTolerance && !suspended && !video.seeking) {
      poster.setAttribute('data-presented', '');
      diagnostics.firstPresentedMs ??= performance.now() - started;
      diagnostics.state = 'ready';
    }
  }
  function record(time, metadata = {}) {
    if (disposed) return;
    diagnostics.presentedTime = time;
    diagnostics.presentations.push({ at: performance.now(), time, target: desired, latency: requestStarted ? performance.now() - requestStarted : 0, ...metadata });
    if (diagnostics.presentations.length > 1200) diagnostics.presentations.shift();
    reveal();
    if (busy && decoded && Math.abs(time - sent) <= frameTolerance) { busy = false; pump(); }
  }
  function observeFrame() {
    if (!supported || disposed || suspended || callback) return;
    callback = video.requestVideoFrameCallback((now, meta) => {
      callback = 0;
      record(meta.mediaTime, { presentedFrames: meta.presentedFrames, processingMs: meta.processingDuration * 1000 });
      observeFrame();
    });
  }
  function pump() {
    if (disposed || suspended || busy || video.readyState < 2 || !Number.isFinite(video.duration)) return;
    if (Math.abs(sent - desired) < .0005 || Math.abs(video.currentTime - desired) < .0005) return;
    sent = desired;
    busy = true; decoded = false; requestStarted = performance.now();
    diagnostics.seeks++;
    // Seek inside the frame interval to avoid floating-point rounding selecting the previous frame.
    try { video.currentTime = sent === 0 ? 0 : sent + .001; } catch (error) { busy = false; onError(error.message); }
  }
  function completed() {
    decoded = true;
    diagnostics.seekLatencies.push(performance.now() - requestStarted);
    if (diagnostics.seekLatencies.length > 1200) diagnostics.seekLatencies.shift();
    // A seeked event alone is not proof of presentation. Older engines use a paint opportunity.
    if (Math.abs(video.currentTime - sent) > frameTolerance) { busy = false; onError('El navegador no pudo buscar el frame solicitado.'); return; }
    if (!supported) requestAnimationFrame(() => { if (!video.seeking && video.readyState >= 2) record(video.currentTime); });
    else if (Math.abs((diagnostics.presentedTime ?? -10) - sent) <= frameTolerance) { busy = false; pump(); }
    reveal();
  }
  function loaded() {
    diagnostics.loadedDataMs ??= performance.now() - started;
    observeFrame(); pump();
    if (!supported && desired === 0) requestAnimationFrame(() => record(video.currentTime));
  }
  function failed() { onError(video.error?.message || `Media error ${video.error?.code || ''}`); }
  video.addEventListener('loadeddata', loaded);
  video.addEventListener('canplay', loaded);
  video.addEventListener('seeked', completed);
  video.addEventListener('error', failed);
  observeFrame();
  video.preload = 'auto';
  video.src = video.dataset.src;
  video.load();
  return {
    reveal,
    setProgress(progress) {
      desired = timeFor(progress);
      diagnostics.targetTime = desired;
      pump();
    },
    suspend(value) {
      suspended = value;
      // Keep the one outstanding presentation callback: a paused/offscreen seek may
      // finish only when visible again. Cancelling it would strand the in-flight lock.
      if (!value) { observeFrame(); pump(); }
    },
    dispose() {
      disposed = true;
      if (callback) video.cancelVideoFrameCallback?.(callback);
      video.removeEventListener('loadeddata', loaded); video.removeEventListener('canplay', loaded);
      video.removeEventListener('seeked', completed); video.removeEventListener('error', failed);
      video.pause(); video.removeAttribute('src'); video.load(); poster.removeAttribute('data-presented');
    },
  };
}
