# Design System Specification: Architectural Precision

 

## 1. Overview & Creative North Star

The Creative North Star for this design system is **"The Sonic Monolith."** 

 

In the context of an audio-focused Chrome extension, visual noise is the enemy of functional clarity. This system rejects the cluttered, "widget-like" aesthetic of traditional browser extensions in favor of a high-end editorial layout. It treats the UI as a piece of precision hardware—utilizing stark high-contrast, intentional asymmetry, and a rigorous adherence to a monochrome palette. By eliminating decorative borders and traditional shadows, we create a "flat-depth" environment where hierarchy is communicated through pure tonal shifts and typographic weight.

 

## 2. Colors

This system operates on a strictly disciplined monochromatic scale, utilizing the interplay between deep blacks and clinical whites to drive focus.

 

### Tonal Strategy

*   **Primary (#000000):** Used for core functional elements and high-impact "Display" typography.

*   **Surface Hierarchy:** We utilize the `surface-container` tiers to organize content.

    *   **Surface (#f9f9f9):** The base canvas.

    *   **Surface-Container-Low (#f3f3f4):** For secondary utility zones.

    *   **Surface-Container-Highest (#e2e2e2):** For active states or emphasized blocks.

 

### The "No-Line" Rule

To maintain a premium, editorial feel, **1px solid borders are strictly prohibited** for sectioning or containment. Boundaries must be defined solely through background color shifts. For example, a playback controls section should sit on `surface-container-low` against the `surface` background. The eye should perceive the edge through the shift in value, not a drawn line.

 

### Surface Hierarchy & Nesting

Treat the extension interface as a series of stacked, precision-cut plates. 

*   **Nesting:** If a list of audio tracks resides within a container, the container should be `surface-container-low`, and the individual track item (on hover) should shift to `surface-container-high`. This creates "nested" depth without the need for dated bevels or drop shadows.

 

## 3. Typography

Typography is the primary vehicle for the 'audio-helper' brand identity. We use **Inter** for its clinical legibility and geometric neutrality.

 

*   **Display & Headline (Bold/Black weight):** Use `display-sm` (2.25rem) for state changes (e.g., "STOPPED," "RECORDING"). Use tight letter-spacing (-0.02em) to give these an authoritative, "stamped" look.

*   **Title & Body:** Use `title-sm` (1rem) for track names and `body-md` (0.875rem) for descriptions. 

*   **Labels:** `label-sm` (0.6875rem) should be used in ALL CAPS with increased letter-spacing (+0.05em) for metadata like timestamps, file formats, or kHz ratings. This conveys technical precision.

 

## 4. Elevation & Depth

In a minimalist, flat system, "elevation" is achieved through **Tonal Layering** rather than traditional lighting models.

 

*   **The Layering Principle:** Depth is communicated by "stacking" the surface-container tiers. Place a `surface-container-lowest` (#ffffff) card on a `surface-container-low` (#f3f3f4) background to create a soft, natural lift.

*   **Ambient Shadows:** If a floating element (like a context menu) is required, use a "Sonic Shadow": extra-diffused, 4% opacity of the `on-surface` color (#1a1c1c), with a blur radius of 16px or higher. It should feel like a subtle atmospheric presence, not a shadow.

*   **The "Ghost Border" Fallback:** If a boundary is required for accessibility in high-density areas, use a **Ghost Border**: the `outline-variant` token (#c6c6c6) at 20% opacity. Never use 100% opaque borders.

 

## 5. Components

 

### Buttons

*   **Primary:** Solid `primary` (#000000) with `on-primary` (#e2e2e2) text. Square corners (`none`) or `sm` (0.125rem) only.

*   **Secondary:** `surface-container-highest` (#e2e2e2) background with `primary` text. No border.

*   **Tertiary:** Text-only, using `label-md` in Bold. Underline only on hover.

 

### Input Fields

*   **Architecture:** Use a `surface-container-low` background. Use a 2px bottom bar of `primary` (#000000) only when focused. Forbid the "four-sided box" look.

*   **States:** Error states use `error` (#ba1a1a) text and a 2px bottom bar, maintaining the minimalist footprint.

 

### Cards & Lists

*   **Rules:** Forbid the use of divider lines. Separate items using 8px or 12px of vertical white space.

*   **Audio Waveforms:** Represent waveforms using high-contrast bars. Active segments in `primary` (#000000), inactive segments in `outline-variant` (#c6c6c6).

 

### Interactive Chips

*   **Selection:** Use `roundedness-full` (9999px). Unselected chips should be `surface-container-low`. Selected chips must be `primary` (#000000) with `on-primary` text.

 

### The "Audio-Helper" Playback Bar

*   A persistent element at the bottom of the extension. Use `surface-container-highest` (#e2e2e2) to distinguish it from the main content area. Use a high-contrast progress bar (Primary on Secondary-Fixed).

 

## 6. Do's and Don'ts

 

### Do:

*   **Embrace Negative Space:** Use more padding than you think you need. Minimalist design breathes.

*   **Align to a Rigid Grid:** Precision is key. Elements should feel like they are locked into an invisible architectural framework.

*   **Use Tonal Shifts for Hover:** Interaction should be subtle—a slight change from `surface-container-low` to `surface-container-highest`.

 

### Don't:

*   **Don't use 1px borders:** It breaks the "premium" editorial feel and makes the extension look like a standard browser utility.

*   **Don't use gradients:** Stay true to the flat, high-contrast aesthetic. Focus on solid blocks of color.

*   **Don't use standard "Grey":** Always use the specific tokens (like `secondary` #5e5e5e) to ensure the "coolness" of the monochromatic scale is maintained.

*   **Don't use icons without labels:** In a functional tool, precision beats aesthetics. Pair icons with `label-sm` text for absolute clarity.