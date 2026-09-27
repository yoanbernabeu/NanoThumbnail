# Thumbnail craft for Nano Banana

## Writing the brief

The studio wraps your brief in a full prompt (format, image roles, identity lock, style, brand kit). Your job is the scene.

Nano Banana follows **natural-language descriptions**, not keyword lists. Write 2–4 sentences covering:

1. **Subject and action** — who/what, doing what. "The creator, leaning toward the camera, holding a cracked iPhone."
2. **Emotion** — specific and readable: "jaw dropped, eyebrows raised" rather than "surprised".
3. **Composition** — where things sit: "face on the left third, the phone big and sharp on the right".
4. **Background and light** — simple and contrasted: "flat deep-blue background, warm rim light separating the subject".

Phrase constraints positively ("a clean, empty background") rather than as negatives ("no clutter, no people").

Bad: `man, shocked, phone, red, 4k, viral, youtube`
Good: `Close-up of the creator on the left third, eyes wide and mouth open in disbelief, staring at a cracked smartphone held up on the right. Flat saturated red background, strong key light on the face, slight rim light.`

Reference images: say what each one is for in its `label` ("the product — keep its exact shape and logo", "colour palette to imitate").

## Overlay text

- 0–4 words, the video's language, complementary to the title (title "I tried every AI coding tool" → text "ONLY 1 WORKS").
- Numbers, stakes and contrasts work; full sentences don't.
- `textMode: "render"` asks the model to draw it; `"space"` leaves clean room for the user to add it.

## Choosing a style (`list_styles` for the full list)

| Video | Try |
|---|---|
| Review, reaction, entertainment | `reaction` |
| Comparison, A vs B | `versus` |
| Transformation, results, tutorials with an outcome | `before-after` |
| Dev / software tutorial | `tech` |
| Story, key moment, vlog-like narrative | `story`, `vlog` |
| Documentary, history, essays | `cinematic` |
| Opinion, business, finance | `minimal`, `finance` |
| Top lists | `ranking` |
| Podcasts, interviews | `podcast` |
| Gaming | `gaming` |

Presets are a starting grammar, not a rule; `styleId: ""` for none.

## Critique checklist

Look at each preview and answer honestly:

1. **Glance test** — at phone size, is it obvious in under a second what this is about?
2. **One focal point** — does the eye land on one thing?
3. **Emotion or intrigue** — is there a reason to click (stakes, surprise, a question)?
4. **Text** — spelled right, readable, 4 words max, not covering the face?
5. **Contrast** — does it pop against YouTube's white/dark UI?
6. **Bottom-right free** — nothing important under the duration badge?
7. **Identity** — if a persona is used, does the person look like themselves?
8. **Matches the title** — no clickbait the video doesn't deliver.

## Edit instructions

One change per `edit_thumbnail`, stated plainly. The studio already tells the model to keep everything else.

- "Make the background a deep red."
- "Make the text bigger and yellow with a black outline."
- "Make the expression more surprised: mouth open, eyebrows raised."
- "Remove the text." / "Replace the text with 'ONLY 1 WORKS'."
- "Move the phone closer to the camera so it's twice as big."

`region` limits the change to a rectangle, as fractions of the image: the right half is `{x: 0.5, y: 0, width: 0.5, height: 1}`; the bottom-right corner is roughly `{x: 0.75, y: 0.75, width: 0.25, height: 0.25}`. Use it for local fixes (a logo, a hand, a stray object) so the rest stays pixel-identical.

If an edit fails twice the same way, regenerate with a better brief instead of insisting.
