# Design

Presentation layer only: header.php renders one shared link definition into desktop navigation and a native mobile details disclosure. Its vertical panel is positioned outside flow, so closed and open header height remain 64/60 px. Existing colors/type/focus styles apply.

Use existing #catalog-title to reach the catalog heading after the curve without changing catalog markup or the hero's #catalogo skip handler. Other anchors are #nosotros and #opciones. Other pages link back to these Home fragments.

An isolated header module enhances same-document anchors with reduced-motion-aware smooth scrolling, history and destination focus. Native links and native details remain functional without JS. Close mobile disclosure on selection, Escape or outside click. CSS offsets supplement existing scroll-padding for sticky header/admin bar clearance. No dependencies.

Without JS the native disclosure remains open after selection. On mobile, additional scroll-padding reserves its three 48 px rows, two 4 px gaps, 28 px padding and border, keeping the destination visible beneath it. With JS it closes before navigation and the normal header offset applies.

Mobile follow-up: a native hamburger summary is the no-JS baseline. A hidden real button is revealed only after listeners are installed; it replaces the summary, controls the same details panel and synchronizes aria-expanded. The button sits after the unchanged contact action at the right edge; the logo moves 4 px toward the left. A 180 ms panel reveal and subtle three-line/X transformation are disabled for reduced motion. No header height change.
