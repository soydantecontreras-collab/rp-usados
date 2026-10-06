# Design

Local Node sandbox serves the immutable approved static snapshot. It injects
exploration-only styles and measurements into a separate hero route. Production
files and existing servers are unchanged. One iframe switches A/B without replacing
the video or changing its progress. Height controls change the actual child viewport.

Simulation captures the requested small and maximum heights before paint, because
desktop iframe SVH/LVH both track its viewport. Native routes capture actual CSS LVH
per width; production bootstrap still captures actual SVH. No fixed Android deduction.

B only enlarges the media plane to LVH minus header, object-fit cover, center/top.
The small overlay stage retains title, copy and CTA. Envelope overflow clips the
fixed image; wrapper alone follows DVH. Width changes establish a new composition.
The existing caption gradient's terminal shade continues into the extra area,
without moving its start or controls. B cover is portrait-only: landscape retains
the approved contained portrait video rather than cropping 75.6% of source height.
Metrics distinguish media box, intrinsic rendered image, visible intersection,
letterbox/extra black, source crop and overlaid text. No continuous RAF polling,
timers or gesture handlers; reports coalesce on resize/scroll/presentation.
