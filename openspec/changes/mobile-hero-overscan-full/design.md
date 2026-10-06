# Design

Dynamic DVH wrapper clips a captured CSS LVH media canvas. Capture once per width,
never on toolbar height changes. Media covers portrait canvas at object-position
50% 0; landscape retains full vertical video with side letterbox. Sibling overlay
retains captured SVH. No extended caption shade, black mask or lower fade.

Build a separate Vite output from existing theme sources. Remove orientation
scrollTo compensation and JS skip interception only in the experimental bundle;
the existing anchor uses document scroll. No new timeline, dependency or RAF.
Measure media coverage, source crop and CTA movement at +16/+72 simulated height.
Actual overscan is LVH minus SVH on the device, not a phone-specific constant.
