# Cursor task — CABLETRIS MVP

## Role
Act as Senior Frontend Game Developer + Senior Game Designer. Build a stable browser MVP of the educational mini-game **«КабельТрис»** inside the EXISTING training-platform repository.

## First: inspect, do not code yet
1. Read the project README and all relevant `.md` architecture files.
2. Inspect package.json, routing, UI library/design tokens, state/data layer, existing product entities and analytics.
3. Reuse existing architecture/components/styles. Do not create a parallel app or duplicate entities.
4. Before editing, output a short implementation plan listing files you will add/change. Then implement.

## Source assets supplied
Package folder: `CABLETRIS_MVP/`
- `data_products.json` — MVP product data.
- `game_config.json` — tunable game settings.
- `assets/products/*` — official product images supplied for the prototype.

Treat product IDs as stable external IDs. Do not rename them.

## Game concept
Not a literal Tetris clone. Mechanics = **falling product cards + match-3 + merge**.

A product card falls from the top of a 6×10 grid. Player moves it horizontally and accelerates downward. After landing, gravity applies. When 3+ orthogonally connected cards with the same `product_id` form a group, remove 3 and create one category tile in a deterministic cell. Category tile displays the corresponding `display_category`.

When 3 category tiles of the same `category_id` connect orthogonally, merge them and award category bonus. Chain reactions create COMBO x2/x3/... . Diagonals do not match.

## MVP products
Load products only from `data_products.json`. Do not hardcode product names or image paths in components.

## Required flow
`Start → countdown 3/2/1 → falling products → move/drop → landing → match check → merge → score/combo → next piece → order progress → game over → results → restart`

## MVP UI
Game header:
- Score
- Combo
- Current order/progress
- Pause
- Sound toggle placeholder (no audio implementation required if project has none)

Game field:
- responsive 6×10 grid;
- cards show real image + brand name;
- category tile is visually distinct and shows category name;
- next product preview.

End screen:
- score;
- number of brand merges;
- category merges;
- best combo;
- order result;
- button `Играть ещё`.

## Order
Use `mvpOrder` from `game_config.json`.
Default prototype order: collect 9 units of product `02-014` (КВВГ).
Progress must be data-driven, not hardcoded in UI.

## Controls
Desktop:
- ArrowLeft / ArrowRight — move;
- ArrowDown — soft drop.

Mobile:
- swipe left/right;
- swipe down — soft drop.

Prevent page scrolling while the gesture starts inside the game board.
No hover-dependent interactions.

## Game rules / engine requirements
- Separate pure game logic from React/UI components.
- Deterministic grid state; no direct DOM mutation for game rules.
- One active falling piece at a time.
- Never spawn an impossible overlapping piece.
- After merge, apply gravity and repeatedly resolve chain reactions until board is stable.
- Use orthogonal adjacency only.
- Match threshold comes from config (`matchCount`).
- Scores/timers/grid dimensions come from config where applicable.
- Random product generation uses only active products.
- Avoid immediate unfair spawn patterns; each piece must have a valid initial cell.
- Game over when a new piece cannot spawn.

## Architecture
Prefer project stack. Do NOT add a game engine dependency for this MVP unless the repository already uses one.

Suggested separation (adapt names/paths to repository conventions):
- game engine / grid rules
- game state hook/store
- data adapter
- board component
- product card
- category tile
- HUD
- result screen

Do not force these exact paths if project conventions differ.

## Data adapter
Create a thin adapter so mock JSON can later be replaced by platform/API/admin data without changing game mechanics.
Expected normalized product shape:
`product_id, brand, category_id, category, display_category, image, difficulty, rarity, is_active`

## Styling
Use ONLY existing platform design tokens/components wherever possible.
Do not invent a new brand palette.
Images: `object-fit: contain`; never stretch/crop product geometry.
Animation should be light: fall, landing, merge, floating score, combo. Respect `prefers-reduced-motion`.

## Responsive behavior
Mobile-first. The board must fit viewport width without horizontal page scroll. Keep controls usable on small phones and desktop.

## Persistence / integration
For MVP, local state is enough. If project already has a safe existing analytics/event interface, emit non-breaking events for:
- game_started
- brand_merged
- category_merged
- order_completed
- game_finished

Do not create a new backend/schema in this task.

## Acceptance criteria
1. Existing platform still builds and existing routes work.
2. Game is accessible through a new route/menu entry consistent with current routing, unless project architecture indicates a better integration point.
3. All three supplied products load from JSON and show their supplied images.
4. Same products can be merged 3-at-a-time.
5. A brand merge creates the correct category tile.
6. Three same category tiles can merge.
7. Chain reactions update COMBO correctly.
8. Order progress for КВВГ 9 works.
9. Desktop keyboard and mobile swipe work.
10. Game over and restart work without page reload.
11. No product/category names are hardcoded inside game components.
12. No TypeScript/build/lint errors introduced by this change.

## Scope guard
DO NOT implement yet:
- defects/OTK mode;
- quizzes;
- full collection/encyclopedia;
- achievements;
- adaptive learning;
- multiplayer;
- backend migrations;
- 3D;
- all catalog products.

Build the smallest polished stable MVP first.

## Final response after coding
Return only:
1. what was implemented;
2. files changed/created;
3. how to launch/test;
4. any blockers/TODOs;
5. confirmation that build/tests/lint were run and their result.
