# Implementation boundary

Manual Spec workflow already established in this repository. SVG 32×32 sources produce raster PNG and Windows-compatible 32-bit DIB CUR offline with the bundled image runtime. CSS tries CUR then PNG then auto/pointer. Hotspots: arrow (1,1), hand index (6,2). Existing #b51f2b red, #111414 black, thin pale contrast edge. No JS.

main.scss → native-cursors.css → Vite external asset URLs (no-inline) → classic theme existing enqueue. Only fine mouse/hover media query applies URLs. Text inputs and disabled controls retain native semantics. Shared CSS selects links/buttons including complete cards and gallery controls without changing them. Hero media/script remain untouched. Current working-tree changes predating this task are preserved.

Chrome/Edge browser screenshots exclude OS cursors. Capture real page backgrounds and compose the actual cursor PNG at its tested hotspot for clearly labelled visual evidence; do not claim these composites capture the OS pointer itself. Check runtime CSS/resource requests and fallback behavior separately.

Size correction: preserve 32×32 transparent canvas; scale SVG artwork to 12×19 arrow and 18×24 hand visible pixels, equal to native Windows measurements (LoadCursor + GetIconInfo/GetDIBits, read-only). Regenerated CUR/PNG and adjusted CSS hotspots. No other interaction changes.
