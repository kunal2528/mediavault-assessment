# Submission

Keep this tight. Bullet points are fine. We read this before we read your code,
and a clear account of your reasoning carries real weight — including where you
chose not to do something.

## Video walkthrough

Paste your Loom (or equivalent) link here. 5–10 minutes.

**Link:**
I couldn't make video on loom as it has time limit on free version. So I choose alternative for that explained each task with points on below recordings.

Bugs List: https://docs.google.com/spreadsheets/d/1nmeIwjq9xFZCaRTGmCUahd5Qyco5Ej5Si4R-p23k2ww/edit?gid=0#gid=0
Task 1: https://screenrec.com/share/fgbhoJ6SLj
Task 2: https://screenrec.com/share/vixtRwWd65
Task 5: https://screenrec.com/share/zAKI5drGCw
Task 6: https://screenrec.com/share/eCOHq0McD3

Deployed link: 
---

## How to run it

Anything we need to know beyond `npm install && npm run dev`.

## Time spent

Roughly 12 hours total, split across the tasks over 3 days.

- **Task 1 (Bug audit + defect inventory):** ~1.5 h — reading the codebase, cataloguing all 37 defects, writing up the spreadsheet
- **Task 2 (Concurrency, debounce, de-duplication, URL sync, pagination, virtualisation):** ~4 h — the heaviest engineering task, most time went on the virtualiser layout maths and getting AbortController + generation-counter working correctly together
- **Task 5 (Keyboard + accessibility):** ~3 h — roving tabindex, Shift+Arrow range selection, focus management on panel open/close, ARIA roles and live region
- **Task 6 (Visual polish, states, token system):** ~3 h — CSS token system, skeleton loader, status pills and stepper, empty/error states, bulk bar visibility, filter badge, result count, sticky panel header, responsive layout

---

## Baseline defects found

| #   | Defect                                                                                                  | Where                                      | Fixed / left / out of scope            |
| --- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------- |
| 1   | Bulk update sends more than the API limit of 50 ids in one call                                         | `App.tsx`                                  | Knowingly left; Task 3                 |
| 2   | Every query change sends a request immediately, including every search keystroke                        | `useAssets.ts`                             | Fixed; 300 ms debounce added           |
| 3   | In-flight requests are not cancelled when the query changes                                             | `useAssets.ts`, `client.ts`                | Fixed; `AbortController` added         |
| 4   | An older response can overwrite results for a newer query                                               | `useAssets.ts`                             | Fixed; obsolete responses are ignored  |
| 5   | Identical concurrent requests are not de-duplicated                                                     | `client.ts`                                | Fixed; shared in-flight Promise        |
| 6   | Query state is not stored in the URL, so views cannot be shared or restored                             | `App.tsx`                                  | Fixed; URLSearchParams + replaceState  |
| 7   | Cursor pagination and infinite scrolling are not implemented; only the first page is loaded             | `App.tsx`, `useAssets.ts`                  | Fixed; cursor pages load on scroll     |
| 8   | All loaded cards are rendered, so DOM and memory grow with the dataset                                  | `AssetGrid.tsx`                            | Fixed; virtualized rows                |
| 9   | Missing thumbnails can show broken images and the image request is not lazy or flag-aware               | `AssetGrid.tsx`                            | Fixed; lazy fallback with stable space |
| 10  | Changing one selection rerenders the entire grid                                                        | `AssetGrid.tsx`                            | Fixed; memoized cards                  |
| 11  | Selection has no range selection or select-all-loaded behavior                                          | `App.tsx`, `AssetGrid.tsx`                 | Fixed; Shift+Arrow range selection added (Task 5) |
| 12  | Bulk updates are not optimistic and do not apply successful per-item results to the list                | `App.tsx`                                  | Knowingly left; Task 3                 |
| 13  | Bulk partial failures are reduced to counts; failed assets are not rolled back, explained, or retryable | `App.tsx`                                  | Knowingly left; Task 3                 |
| 14  | Single-asset saves do not update the list and do not handle version conflicts structurally              | `App.tsx`, `AssetDetail.tsx`, `client.ts`  | Knowingly left; Task 3                 |
| 15  | No retry, exponential backoff, or `Retry-After` handling exists for transient failures or rate limits   | `client.ts`                                | Knowingly left; Task 4                 |
| 16  | API errors are flattened into raw status/message strings instead of preserving structured error codes   | `client.ts`                                | Knowingly left; Task 4                 |
| 17  | Offline state, recovery, and an error boundary are missing                                              | `App.tsx`, `main.tsx`                      | Knowingly left; Task 4                 |
| 18  | Loading, empty, and error states are not clearly distinguished                                          | `App.tsx`, `useAssets.ts`, `AssetGrid.tsx` | Fixed; initial states now differ       |
| 19  | The grid has no keyboard navigation; cards have no semantic role, name, or selection state for AT       | `AssetGrid.tsx`                            | Fixed; roving tabindex, Arrow keys, role="grid"/role="gridcell", aria-selected, aria-label (Task 5) |
| 20  | The detail panel does not move focus on open, does not close on Escape, and does not restore focus      | `AssetDetail.tsx`, `App.tsx`               | Fixed; focus to Close button on open, Escape handler, focus returned to triggering card on close (Task 5) |
| 21  | No live region; screen readers are not told about result counts or bulk action outcomes                 | `App.tsx`                                  | Fixed; aria-live="polite" region with debounced announcements (Task 5) |
| 22  | Visual checkbox has no accessible name and is a redundant tab stop                                      | `AssetGrid.tsx`                            | Fixed; aria-hidden="true" and tabIndex=-1 on checkbox; selection state on gridcell (Task 5) |
| 23  | Error messages in the detail panel are not announced to screen readers                                  | `AssetDetail.tsx`                          | Fixed; role="alert" added to error paragraph (Task 5) |
| 24  | Status buttons in the detail panel have no pressed/current state for AT                                 | `AssetDetail.tsx`                          | Fixed; aria-pressed and role="group" with aria-labelledby added (Task 5) |
| 25  | Status states have no visual distinction; all pills look identical                                      | `styles.css`                               | Fixed; distinct symbol, colour, and border style per status (Task 6)     |
| 26  | Error messages are raw API strings shown verbatim to the user                                           | `App.tsx`, `AssetDetail.tsx`               | Fixed; `friendlyError()` utility maps codes/messages to readable copy (Task 6) |
| 27  | No loading feedback while assets are fetched on first load                                              | `App.tsx`, `AssetGrid.tsx`                 | Fixed; 12-card skeleton grid with staggered pulse animation (Task 6)     |
| 28  | Bulk action bar is visible even when nothing is selected                                                | `App.tsx`                                  | Fixed; bar hidden with `display:none` when selection is empty (Task 6)   |
| 29  | No way to select all assets at once from the bulk bar                                                   | `App.tsx`                                  | Fixed; "Select all N" button added to bulk bar (Task 6)                  |
| 30  | Active filters are not surfaced; no way to clear them without editing each control individually         | `App.tsx`                                  | Fixed; active filter badge + "Clear filters" button added (Task 6)       |
| 31  | Result count is buried in the filter bar with no visual weight                                          | `App.tsx`, `styles.css`                    | Fixed; `.result-count` promoted with `margin-left:auto` (Task 6)        |
| 32  | Detail panel header scrolls away with content, losing context                                           | `AssetDetail.tsx`, `styles.css`            | Fixed; sticky panel header with `panel__scroll` wrapper (Task 6)         |
| 33  | Grid has no fallback when virtualized scroll fails or JS is slow                                        | `App.tsx`, `AssetGrid.tsx`                 | Fixed; "Load more" button below grid as fallback (Task 6)                |
| 34  | All spacing, colour, and type values are hardcoded magic numbers throughout the stylesheet              | `styles.css`                               | Fixed; full CSS token system in `:root` — spacing, type, radius, shadow, colour tokens (Task 6) |
| 35  | Card body has no visual hierarchy; name, meta, and status pill have equal weight                        | `styles.css`, `AssetGrid.tsx`              | Fixed; name 600-weight at `--text-md`, meta `--text-xs`/`--ink-soft`, pill pushed to bottom with `margin-top:auto` (Task 6) |
| 36  | Status in detail panel is a flat row of buttons with no indication of progression order                 | `AssetDetail.tsx`, `styles.css`            | Fixed; vertical stepper with step numbers, coloured left border per status, hover states (Task 6) |
| 37  | Empty and error states are blank text with no visual structure or icon                                  | `App.tsx`, `styles.css`                    | Fixed; SVG icon + bold heading + sub-line for both error and no-results states (Task 6) |

---

## Key decisions

For each significant choice: what you did, what you rejected, and why. Three to
six of these is about right.

**Data fetching and caching**

Used a hand-rolled `useAssets` hook rather than React Query or SWR. The hook owns a `generation` counter and an `AbortController` so every new query cancels the previous one at both the fetch layer and the Promise resolution layer. In `client.ts`, a `Map<string, Promise<AssetPage>>` de-duplicates identical concurrent requests — two components asking for the same URL share one in-flight Promise rather than firing two. I didn't reach for a library because the caching needs here are narrow (list + cursor pagination, no normalisation), and adding a library for that felt like more complexity than it removed.

**Virtualization approach**

Built a custom row-based virtualiser rather than using `react-window` or `react-virtual`. The grid measures its own width with a `ResizeObserver`, calculates column count and card dimensions, then only renders the rows within `[scrollTop - overscan, scrollTop + height + overscan]`. Cards are absolutely positioned within a tall canvas div. This approach gave full control over the layout maths (no fixed row height requirement from a library) and kept the bundle small. The tradeoff is that the row height must be computed rather than declared — a single-column fallback or variable-height cards would require more work.

**Optimistic updates and rollback**

Deliberately not implemented — left as Task 3. The `handleSaved` callback in `App.tsx` is a stub. The list does not update when the detail panel saves a status change, which means the grid can show a stale status pill until the user re-fetches. I chose to leave this rather than do it partially and incorrectly.

**Retry and backoff policy**

Also deliberately not implemented — left as Task 4. The client fires once and surfaces the error through `friendlyError()`. This means a 503 or 429 from the API shows a human-readable message but does not auto-retry. With another hour I would add exponential backoff with jitter, honour `Retry-After` headers, and distinguish retryable (503, 429, network failure) from non-retryable (400, 409, 404) errors.

**State placement and URL sync**

All filter and sort state lives in a single `QueryState` object at the top of `App`. Every change calls `setQueryState` with a spread update, which triggers one re-render and one `history.replaceState`. Reading initial state from `URLSearchParams` in the `useState` initialiser means the URL is the source of truth on load — back/forward navigation works via a `popstate` listener that re-reads from the URL. I chose `replaceState` over `pushState` so filter changes don't pollute the browser history stack.

---

## Performance

Fill in real measurements, not estimates. Say which machine and browser.

| Metric                                          | Before                                                                  | After                                                                                 | How measured                                                                                                         |
| ----------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Rendered DOM nodes at 5,000 rows loaded         | Not measured directly; baseline renders every loaded card               | 9–12 mounted `.card` nodes observed while 24–216 assets were loaded                   | Browser DOM count with `document.querySelectorAll('.card').length`; virtualizer keeps rows near the viewport mounted |
| Cards re-rendered when toggling one selection   | Not measured directly; baseline maps every visible card from the parent | Not measured directly; `AssetCard` is memoized and receives primitive selection props | React DevTools Profiler should be used for the final count; code review confirms stable callbacks and `React.memo`   |
| Longest task during sustained scroll            | Not measured                                                            | No `longtask` entries observed in a 20-step browser sample                            | `PerformanceObserver` with `{ type: 'longtask' }` while scrolling the grid                                           |
| Requests fired while typing a 6-character query | 6 observed before debounce                                              | 1 observed for `runner`                                                               | DevTools/Playwright request listener while typing characters 50 ms apart                                             |
| Production bundle, gzipped                      | 48.30 kB                                                                | 50.22 kB                                                                              | `npm run build` output; Vite production JS gzip size                                                                 |

---

What was the actual bottleneck, and how did you find it?

The main bottleneck before the fixes was the DOM size. The baseline rendered every loaded card unconditionally — scrolling through 200+ assets meant 200+ card nodes live in the DOM simultaneously, each with an `<img>` tag firing a thumbnail request. This became visible by running `document.querySelectorAll('.card').length` in the console after a few scroll-triggered page loads and watching it grow linearly. The virtualiser caps this at roughly 9–12 visible cards regardless of how many are loaded.

---

## Accessibility

The grid uses `role="grid"` with `aria-rowcount` and `aria-colcount`; focus is managed with a roving tabindex where Arrow keys move between cards, Shift+Arrow extends selection, Space toggles selection, and Enter opens the detail panel — the visual checkbox is `aria-hidden="true"` so it is not a redundant tab stop, with selection state expressed via `aria-selected` on the `gridcell` instead. When the panel opens focus moves to the Close button, Escape closes it and returns focus to the triggering card; save errors use `role="alert"`, the status stepper uses `role="group"` with `aria-pressed` per button, and a `aria-live="polite"` region announces result counts and bulk outcomes. Tested with keyboard-only navigation and VoiceOver on macOS. Known gaps: filter checkboxes have no `<fieldset>`/`<legend>` group label, the tag input has no accessible hint for comma-separated format, and the "Loading more…" indicator has no `role="status"` announcement.

---

## Interface decisions

The goal was an interface someone could use for hours without friction — not a showcase, but a tool. That meant high information density without visual noise, clear state feedback at every step, and a keyboard path that felt as fast as the mouse. The decisions follow from that.

- **Visual system.** All colour, spacing, type, radius, and shadow values are CSS custom properties in `:root` at the top of `styles.css`. A 4 px base spacing scale (`--sp-1` through `--sp-12`) and a five-step type scale (`--text-xs` through `--text-xl`) keep every value consistent and easy to adjust globally. The palette is neutral-first — `--ink`, `--ink-soft`, `--bg`, `--bg-soft` — with a single blue accent and semantic colour pairs (success, warn, danger) used only for status and error states. System-ui font stack means no web font request.

- **Status treatment.** The four statuses are a workflow progression: Draft → In review → Approved → Archived. They are distinguished by three independent signals so colour-blind users lose nothing: a Unicode symbol prefix (○ ◑ ● ×), distinct pill border and background colours, and different font weight on the active state in the stepper. In the detail panel the statuses render as a vertical stepper with numbered steps and a coloured left border on the active step, making the progression order explicit without relying on the reader knowing the vocabulary.

- **Copy.** The original API errors were raw HTTP status strings like "503: Service Unavailable" shown verbatim. All error copy was replaced via `friendlyError()` in `src/lib/format.ts` — e.g. "503" → "The server is temporarily unavailable. Try again shortly.", "409" → "This asset was updated elsewhere — reload to see the latest version." The goal was to tell the user what to do, not what happened internally.

---

## Trade-offs and cuts

**What I deliberately did not do:**

- **Task 3 (optimistic updates + conflict handling):** Skipped. Doing it right means tracking per-asset optimistic state, rolling back on failure, surfacing 409 conflicts to the user with a way to re-fetch the latest version, and chunking bulk calls to the 50-id limit. Doing it wrong means a half-working rollback that's harder to debug than no rollback. With another day I'd implement it using a `useReducer` that holds a `Map<id, OptimisticPatch>` and applies it as an overlay over the fetched list.

- **Task 4 (retry, backoff, offline, error boundary):** Skipped. The client currently fires once and surfaces the error. Adding retries without the `Retry-After` logic would make rate limiting worse, not better. The correct approach is: distinguish retryable vs non-retryable errors at the client layer, implement exponential backoff with jitter, honour the `Retry-After` header, and add a top-level React error boundary for uncaught exceptions. I noted all of this in the defect inventory but chose not to ship a partial version.

- **Bulk id chunking:** The bulk status call in `App.tsx` sends all selected IDs in a single request even though the API caps at 50. This is defect #1 in the inventory. Fixing it cleanly requires the Task 3 per-item result handling to be in place first, so I left it paired with that task.

- **Tag input UX:** The tag filter is a plain text input expecting comma-separated values. A proper token/chip input would be better, but introducing a UI component for that felt out of scope given the time budget.

**With another day:** Finish Task 3 and 4, add id chunking to the bulk call, wrap the filter checkboxes in a `<fieldset>`, and wire up a deployed link.

## Critique of the API

- **`hasThumbnail` flag is unreliable in practice.** The flag says whether a thumbnail exists, but ~4% of assets still return 404 on the thumbnail endpoint even when `hasThumbnail` is true. The client has to handle `onError` on every `<img>` regardless, which makes the flag's value questionable. Either the flag should be trustworthy or it shouldn't exist — as-is, you need both the flag check and the error handler.

- **No `ETag` or `Last-Modified` on list responses.** Cursor pagination is append-only, which is good, but there is no way for the client to validate whether already-loaded pages are still current after a bulk write. A conditional-GET mechanism would allow cheap revalidation without re-fetching the full page.

## Anything you would like us to look at

**The `listAssets` de-duplication in `src/api/client.ts` (lines 46–95).** The in-flight Map handles the happy case cleanly, but the AbortSignal wrapper around the shared Promise took care to get right — if the signal fires after the shared Promise has already resolved, the `.then()` path runs and the `settled` flag prevents a double-resolution. I'm confident it's correct but would want a second pair of eyes on the edge case where two callers share a Promise, one aborts, and the other does not.

**The decision not to use `react-window` or `react-virtual`.** The custom virtualiser in `AssetGrid.tsx` is roughly 80 lines of layout maths. It works for fixed-height rows and a measured column count, and it kept the bundle small (the 1.92 kB gzip increase vs baseline is almost entirely new product features, not library weight). I'd want to discuss whether rolling your own is a defensible call in a production codebase, or whether taking the dependency is the cleaner choice even when the use case is this narrow.
