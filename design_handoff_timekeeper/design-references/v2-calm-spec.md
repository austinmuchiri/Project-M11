# V2 "Calm" — Light Theme Spec

A low-stimulation, light-mode variant of the M11 kid's task watch. Designed for sensory sensitivity (ADHD/autism-friendly), bright outdoor readability, and a softer everyday feel than the dark mascot-led V1.

## Intent
- Reduce visual load — no mascot, no animated character, fewer moving parts.
- Warm, paper-like surfaces instead of glowing dark UI.
- Same task flow as V1; only the skin and motion differ.

## Palette
| Token       | Value     | Use                                  |
|-------------|-----------|--------------------------------------|
| `bg`        | `#F4EFE6` | Page background (warm off-white)     |
| `bgSoft`    | `#EDE6DB` | Secondary surface                    |
| `surface`   | `#FFFFFF` | Cards, pills, task rows              |
| `ink`       | `#3A3A3F` | Primary text (soft charcoal, not black) |
| `inkDim`    | `#8A8A92` | Secondary text, captions             |
| `brand`     | `#A8C7B8` | Sage — primary action (Start, Done)  |
| `accent`    | `#E9C8A8` | Peach-sand — confirms, OK            |
| `warn`      | `#E8B47A` | Gentle nudge (missed) — never red    |
| `danger`    | `#D68B8B` | Reserved (caregiver SOS only)        |
| `star`      | `#E6B95A` | Reward / streak                      |

All hues are desaturated by ~30% vs. V1. Contrast meets WCAG AA on text; primary buttons rely on shape + size, not color saturation, to read as actionable.

## Typography
- Family: **Nunito** (single weight family, 400 / 700)
- No display/script font — same family for everything
- Titles: 18–22px / 700, line-height 1.1
- Body / row: 13–15px / 700
- Caption: 11px / 700, `inkDim`

## Geometry
- Radius: 20px standard, 28px on large surfaces — softer than V1.
- No hard borders; rely on white surfaces over warm bg for separation.
- Shadows: very low, ~`0 4px 12px rgba(0,0,0,0.04)`.

## Motion
- **Half the energy of V1.** Remove the bell-shake on reminders; replace with a slow 2.4s opacity breathe.
- Confetti reduced from 14 pieces to 6, slower fall (2.4s).
- Pip the mascot is **omitted** entirely — replaced by an abstract soft gradient circle on Home, a plain star on Reward.
- No pulse glow on Reminder background.

## What stays the same as V1
- 240×280 canvas, status bar, layout grid.
- Task colors (per-task hue is preserved — only chrome desaturates).
- Hold-to-confirm gesture (0.9s).
- Encouraging tone, "Let's try again" missed copy, caregiver-silent escalation.
- 7-screen flow: Home → Tasks → Reminder → Active → Confirm → Reward → Missed.

## When to use this variant
- Bright sunlight (outdoor readability beats AMOLED-dark).
- Children sensitive to bright accent colors, fast motion, or character mascots.
- Caregivers who prefer a more "tool" feel over "toy" feel.

## Open questions for next round
- Should sage `brand` also handle "completed" state in the task list, or use a separate muted mint?
- Reward screen: keep the star, or use a quiet checkmark glyph instead?
- Is a white watch body (vs. V1's black) wanted to match the lighter UI?
