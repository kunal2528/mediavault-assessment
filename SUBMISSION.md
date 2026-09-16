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

| #   | Defect                                                                                                  | Where                                      | Fixed / left / out of scope           |
| --- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------- |
| 1   | Bulk update sends more than the API limit of 50 ids in one call                                         | `App.tsx`                                  | Knowingly left; Task 3                |
| 2   | Every query change sends a request immediately, including every search keystroke                        | `useAssets.ts`                             | Fixed; 300 ms debounce added          |
| 3   | In-flight requests are not cancelled when the query changes                                             | `useAssets.ts`, `client.ts`                | Fixed; `AbortController` added        |
| 4   | An older response can overwrite results for a newer query                                               | `useAssets.ts`                             | Fixed; obsolete responses are ignored |
| 5   | Identical concurrent requests are not de-duplicated                                                     | `client.ts`                                | Fixed; shared in-flight Promise       |
| 6   | Query state is not stored in the URL, so views cannot be shared or restored                             | `App.tsx`                                  | Fixed; URLSearchParams + replaceState |
| 7   | Cursor pagination and infinite scrolling are not implemented; only the first page is loaded             | `App.tsx`, `useAssets.ts`                  | Knowingly left; Task 2                |
| 8   | All loaded cards are rendered, so DOM and memory grow with the dataset                                  | `AssetGrid.tsx`                            | Knowingly left; Task 2                |
| 9   | Missing thumbnails can show broken images and the image request is not lazy or flag-aware               | `AssetGrid.tsx`                            | Knowingly left; Task 2                |
| 10  | Changing one selection rerenders the entire grid                                                        | `AssetGrid.tsx`                            | Knowingly left; Task 2                |
| 11  | Selection has no range selection or select-all-loaded behavior                                          | `App.tsx`, `AssetGrid.tsx`                 | Knowingly left; Task 3                |
| 12  | Bulk updates are not optimistic and do not apply successful per-item results to the list                | `App.tsx`                                  | Knowingly left; Task 3                |
| 13  | Bulk partial failures are reduced to counts; failed assets are not rolled back, explained, or retryable | `App.tsx`                                  | Knowingly left; Task 3                |
| 14  | Single-asset saves do not update the list and do not handle version conflicts structurally              | `App.tsx`, `AssetDetail.tsx`, `client.ts`  | Knowingly left; Task 3                |
| 15  | No retry, exponential backoff, or `Retry-After` handling exists for transient failures or rate limits   | `client.ts`                                | Knowingly left; Task 4                |
| 16  | API errors are flattened into raw status/message strings instead of preserving structured error codes   | `client.ts`                                | Knowingly left; Task 4                |
| 17  | Offline state, recovery, and an error boundary are missing                                              | `App.tsx`, `main.tsx`                      | Knowingly left; Task 4                |
| 18  | Loading, empty, and error states are not clearly distinguished                                          | `App.tsx`, `useAssets.ts`, `AssetGrid.tsx` | Fixed; initial states now differ      |
| 19  | The grid and detail panel are not keyboard-operable and do not manage focus or announce updates         | `AssetGrid.tsx`, `AssetDetail.tsx`         | Knowingly left; Task 5                |

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

| Metric                                          | Before | After | How measured |
| ----------------------------------------------- | ------ | ----- | ------------ |
| Rendered DOM nodes at 5,000 rows loaded         |        |       |              |
| Cards re-rendered when toggling one selection   |        |       |              |
| Longest task during sustained scroll            |        |       |              |
| Requests fired while typing a 6-character query |        |       |              |
| Production bundle, gzipped                      |        |       |              |

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
