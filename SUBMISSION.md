# Submission

Keep this tight. Bullet points are fine. We read this before we read your code,
and a clear account of your reasoning carries real weight — including where you
chose not to do something.

## Video walkthrough

Paste your Loom (or equivalent) link here. 5–10 minutes.

**Link:**

---

## How to run it

Anything we need to know beyond `npm install && npm run dev`.

## Time spent

Roughly, and how you split it.

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

**Stale response handling**

**Virtualization approach**

**Optimistic updates and rollback**

**Retry and backoff policy**

**State placement and URL sync**

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

What was the actual bottleneck, and how did you find it?

---

## Accessibility

- Keyboard model you implemented, in one paragraph.
- How you tested it, including any screen reader.
- Known gaps.

---

## Interface decisions

Three or four sentences: what you were optimising for, and the decisions that
follow from it. Then briefly:

- **Visual system.** Your colour, spacing and type decisions, and where they live.
- **Status treatment.** How the four statuses read as a progression, and how they
  stay distinguishable without relying on colour.
- **States.** What you did with loading, empty, error, offline and partial
  failure.
- **Contrast.** What you checked against, and with what.
- **Copy.** Any user-facing message you rewrote and why.

Screenshots in the repo are welcome — link them here.

---

## Trade-offs and cuts

What you deliberately did not do, and what you would do with another day.

## Critique of the API

What you would change about the backend contract, and what it forced you to do in
the client that you would rather not have.

## Anything you would like us to look at

Code you are proud of, or a decision you are unsure about and want to discuss.
