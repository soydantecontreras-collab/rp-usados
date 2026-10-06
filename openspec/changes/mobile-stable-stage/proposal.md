# Stable mobile hero composition

Local-only approved correction: separate the dynamic black envelope from the
stable visual scene (media and overlays), and establish sticky geometry before
first paint. No media, design, backend, deployment or new dependencies.

Capture CSS 100svh before paint per viewport width to preserve the
approved initial framing with visible browser chrome; hidden chrome adds black below. Height-only
changes are absorbed by black; width/orientation changes establish a new height.
Keep existing SVH travel distance stable. Without JS, reduced motion, Save-Data
and media failure retain the static poster fallback.
