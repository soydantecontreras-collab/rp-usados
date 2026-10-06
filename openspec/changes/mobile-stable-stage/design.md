# Design and boundary

Presentation owns a pre-paint bootstrap in the home head. It measures CSS 100svh
(100vh fallback) using a hidden, fixed probe, saves its pixel height and the small
viewport height for existing travel, then removes the probe. Width changes
re-establish dimensions; toolbar-only height changes do not. No polling or timeout.

An eligible scroll-layout attribute exists before body paint. CSS reserves travel
and positions the dynamic outer envelope sticky before the deferred media module
loads. Reduced motion, Save-Data, no JS and explicit static fallback remain normal
document flow. Inner hero-scene groups existing poster, video, caption and cue.

The black envelope retains 100dvh with 100svh fallback. A black band absorbs any
toolbar growth. Initial visible-toolbar composition and desktop are unchanged.
The stage does not exceed the native small viewport on a hidden-toolbar reload.
Mobile height-only events update scroll progress without application-requested
ScrollTrigger.refresh. Existing width/orientation pose restoration is unchanged;
no new scroll compensation is introduced.
