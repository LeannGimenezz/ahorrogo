# Design System Strategy: Behavioral Wealth & Tonal Depth

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Stoic Neon."** 

Traditional financial apps rely on clinical whites and "trust-based" blues to appear safe. We are rejecting that template. Instead, we lean into a high-contrast, dark-editorial aesthetic that mirrors the intensity of discipline. This system combines the uncompromising rigidity of charcoal surfaces with the electric energy of neon accents. 

By utilizing intentional asymmetry—such as oversized typography overlapping container edges and dual-axis progress tracking—we create an experience that feels less like a spreadsheet and more like a high-performance cockpit. The presence of "The Penguin" character serves as the "Friendly Sentinel," softening the brutalist edges of the dark theme with personality and gamified feedback.

---

## 2. Colors: High-Voltage Contrast
Our palette is rooted in an ultra-dark foundation (`#0e0e0e`), allowing our neon accents to serve as functional beacons for user action and progress.

*   **Foundation:** The `background` and `surface` are locked at `#0e0e0e`. This deep black provides the infinite canvas required for a premium, OLED-optimized feel.
*   **The Neons:** 
    *   **Primary (`#9cff93`):** Used for growth, savings, and "Unlocked" states. It represents the "Go" in the user's financial journey.
    *   **Secondary (`#c97cff`):** Used for "Vaults," behavioral locks, and gamified milestones. It represents the "Logic" and "Security" of the system.
*   **The "No-Line" Rule:** Standard 1px borders are strictly prohibited. Sectioning must be achieved through background shifts. For example, a card uses `surface-container-high` (`#201f1f`) to separate itself from the `surface` background.
*   **The "Glass & Gradient" Rule:** To elevate main CTAs, use a linear gradient from `primary` (`#9cff93`) to `primary-container` (`#00fc40`). For floating vault overlays, apply a `surface-variant` (`#262626`) with a 60% opacity and a 20px backdrop-blur to create depth without visual clutter.

---

## 3. Typography: Editorial Authority
We use two distinct families to balance technical precision with modern friendliness.

*   **Display & Headlines (Plus Jakarta Sans):** A bold, high-x-height sans-serif that demands attention. 
    *   *Role:* Large numerical balances and vault titles. Use `display-lg` (3.5rem) for total savings to create a "Hero" moment.
*   **Body & Labels (Manrope):** A geometric sans-serif that remains legible at small scales.
    *   *Role:* Transaction details, micro-copy, and character dialogue from The Penguin.
*   **Intentional Weight:** Headlines should almost always be Bold or Extra-Bold. The contrast between a massive `headline-lg` and a tiny, muted `label-sm` creates the "Editorial" feel found in high-end finance journals.

---

## 4. Elevation & Depth: Tonal Layering
In this design system, shadows are secondary to color-stacking.

*   **The Layering Principle:** 
    *   Level 0: `surface` (`#0e0e0e`) - The base floor.
    *   Level 1: `surface-container-low` (`#131313`) - Secondary groupings (e.g., transaction history lists).
    *   Level 2: `surface-container-high` (`#201f1f`) - Primary interactive cards (e.g., Active Vaults).
*   **Ambient Shadows:** For high-importance floating elements, use a shadow with a 40px blur, 0% spread, and an opacity of 8% using the `on-surface` color. This creates a soft "glow" rather than a harsh drop shadow.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke, use `outline-variant` (`#494847`) at 15% opacity. It should be felt, not seen.
*   **Glassmorphism:** Use for persistent navigation or "Locked" overlays. A combination of `surface-container-highest` at 40% alpha with a `backdrop-filter: blur(12px)` mimics premium hardware materials.

---

## 5. Components

### High-Contrast 'Vault' Cards
*   **Background:** Use `surface-container-highest` (`#262626`).
*   **Corner Radius:** `xl` (1.5rem) for a friendly, modern feel.
*   **Interaction:** No borders. On hover or press, shift background to `surface-bright` (`#2c2c2c`).
*   **The "Lock" Indicator:** A prominent icon using `secondary` (`#c97cff`) positioned in the top-right, utilizing a subtle outer glow (bloom effect).

### Dual-Dimension Progress Bars
*   **Track:** `surface-variant` (`#262626`) with `full` roundedness.
*   **Primary Fill (Money):** `primary` (`#9cff93`) solid fill.
*   **Secondary Indicator (Time):** A thin 2px line or ghost-fill using `secondary` (`#c97cff`) that runs parallel to the money track, indicating if the user is "ahead" or "behind" schedule.

### Buttons
*   **Primary:** Background `primary`, text `on-primary` (`#006413`). Use `md` (0.75rem) roundedness.
*   **Lock Action:** Background `secondary`, text `on-secondary` (`#350056`).
*   **Ghost:** Transparent background with `primary` text. No border.

### Inputs & Fields
*   **Base:** `surface-container-low` with a bottom-only `outline` of 2px.
*   **Focus State:** The bottom line transitions to `primary` with a subtle neon glow effect.

### The Penguin (Character Integration)
*   **Placement:** Often partially cropped off-screen or peeking from the top of cards to break the rigid grid.
*   **Feedback:** The Penguin changes posture based on "Lock" status—standing guard (Locked) or celebrating (Goal Reached).

---

## 6. Do's and Don'ts

### Do
*   **Do use asymmetric padding.** Give headlines more room at the top (`spacing-12`) than the bottom (`spacing-4`) to create a "weighted" editorial look.
*   **Do use "The Penguin" as a functional guide.** He should point towards CTAs or hover near "Vault" progress.
*   **Do prioritize OLED blacks.** Ensure the background is `#0e0e0e` to allow the neon green to "pop" with maximum luminance.

### Don't
*   **Don't use dividers.** Use `spacing-8` or `spacing-10` to separate list items. If separation is critical, use a `surface-container` shift.
*   **Don't use standard grey shadows.** Shadows must be tinted or extremely low-opacity to avoid looking "muddy" on the dark theme.
*   **Don't use high-opacity outlines.** They break the "Stoic Neon" immersion and make the app look like a wireframe.