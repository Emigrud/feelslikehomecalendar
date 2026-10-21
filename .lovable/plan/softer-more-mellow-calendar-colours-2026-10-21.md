# Softer, more mellow calendar colours

Keep the same meaning (green = check-in, red = check-out, split = changeover, blue = staying, grey = blocked) but use calmer, muted shades that are still easy to tell apart on a phone in daylight.

## New palette
- Check-in: sage green (soft, muted green) with dark green text
- Check-out: terracotta / dusty rose with dark red-brown text
- Changeover split: same sage + terracotta, diagonal as before
- Staying: pale mist blue with slate text
- Blocked: warm light grey with a subtle diagonal stripe
- Empty days: off-white on a warm stone background
- "?" marker and comment box: soft butter yellow instead of bright yellow
- Today: thin charcoal border (unchanged idea, softer weight)

Text on coloured days switches from white to dark, so it reads well against the lighter colours.

## Technical details
- Only colour values in `src/styles.css` change (`--checkin`, `--checkout`, `--staying`, `--blocked`, `--warning`, `--comment*`, background, and their foreground tokens). Lower chroma (~0.06–0.09) and higher lightness (~0.78–0.85).
- No layout or logic changes; existing tests stay valid.
