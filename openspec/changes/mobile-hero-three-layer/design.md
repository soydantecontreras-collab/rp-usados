## Context

Continue the full-document test; no iframe, nested scroll or selector inside hero.
OpenSpec CLI is unavailable; use existing manual specification workflow.

## Goals / Non-Goals

Goals: stable facade and CTA as DVH expands; reveal media rather than empty black;
measure initial and expanded source crop. Non-goals: production adoption, deploy,
new animation, changes to videos, backend or visual design.

## Decisions

Use approved static snapshot as immutable asset/HTML source. On B only, media is
top anchored at captured CSS LVH minus header; its sibling overlay uses captured
SVH minus header. Dynamic sticky wrapper clips overflow. No gradient extension
below the overlay, no moving CTA. Landscape retains the approved full vertical
video behavior. Width changes recapture actual CSS viewport units; height-only
changes never recapture them. Before-paint layout bootstrap remains approved.

## Architecture / Flow

Document -> approved header -> native hero track -> dynamic sticky wrapper
-> dynamic scene -> stable media + stable overlay -> black bridge -> subtle curve
-> minimal next section. Server generates two independent pages with shared
assets. Test-only simulation query captures SVH/LVH at entry; viewport itself is
resized externally to 760/776/832 for +0/+16/+72. It is never an iframe/panel.

| File | Task | Layer | Purpose |
| --- | --- | --- | --- |
| serve.mjs | 1 | integration | Independent full-document local routes, read-only assets |
| viewport.css | 2 | interface | Three explicitly separate layout planes |
| init.js | 2 | interface | Stable viewport capture before paint |
| Browser DOM inspection | 3 | computation | Read-only geometry/crop evidence; no instrumentation in pages |
| summarize.mjs | 3 | computation | Validate saved browser observations and compose screenshots |
| README.md | 3 | documentation | Results, command, limitations and screenshot paths |

## Data or API Changes

None.

## Risks / Trade-offs

Cover changes crop; measure source percentages and feature positions. Desktop
viewport emulation cannot validate Chrome's actual Android toolbar animation or
OS gesture strip. Black pixels baked into the video are not a CSS coverage gap.

## Alternatives Considered

No scroll compensation, touch interception, timers or phone-specific deductions.
No continued frame/iframe simulation. Native route uses actual CSS LVH/SVH.

