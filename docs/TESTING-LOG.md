# CareConnect web app: testing and defect log

What has been tested, what it found, and what was done about it. Newest entries first within
each section.

Every result here was produced by running something, not by reading the code and judging it
safe. Where a defect was found the evidence is quoted, and where one was left open the reason
is given.

---

## Summary

| Area | Method | Status |
|---|---|---|
| W3C HTML validation | W3C Nu validator, all 15 pages | 3 defects found and fixed, 1 open (framework) |
| Accessibility structure | Scripted audit of all 17 pages | 4 defects found and fixed |
| Colour contrast | WCAG AA calculated from the design tokens | 3 failures, accepted as a known exception |
| Authentication and permissions | Manual, against the live API | Passing |
| Cross-user data visibility | Manual, two accounts | Passing |
| Unit and component tests | Vitest | Set up, suite written after the API migration |
| Responsiveness | Not yet run | Pending |
| Usability with real users | Not yet run | Pending |

---

## 1. W3C HTML validation

**Method.** Every page was fetched from the running app and posted to the W3C Nu validator
(`validator.w3.org/nu`) as HTML. The validator could not be pointed at the pages by URL,
because the app runs on localhost, so the markup was sent in the request body instead.

**Pages checked (15).** Home, directory, professional profile, services, FAQs, contact, about,
privacy, terms, login, register, forbidden, dashboard, appointments, booking.

### Results

| | Before | After |
|---|---|---|
| Errors | 6 | 6 (all one framework issue, see DEF-004) |
| Warnings | 3 | 0 |

### DEF-001 to DEF-003: sections without headings

**Severity:** low. Affects how assistive technology announces the page, not whether it works.

**Found on:** About, FAQs, Services.

```
Section lacks heading. Consider using h2-h6 elements to add identifying headings to
all sections, or else use a div element instead for any cases where no heading is needed.
```

**Cause.** A `<section>` is a grouping that a screen reader can list and jump between. Each of
these three had no heading inside it, because the only heading on the page sits in the
`PageHero` component above. A section nobody can announce is worse than a plain container.

**Fix.** Changed each to a `<div>`, which is what the validator itself suggests when no heading
is needed. No visual change.

**Verified.** All three revalidated: 0 errors, 0 warnings.

### DEF-004: empty form action attribute

**Severity:** low, and **open**. Not caused by our code.

**Found on:** login, register, contact, booking, dashboard, appointments. Six pages, every one
with a form.

```
Bad value "" for attribute "action" on element "form": Must be non-empty.
```

**Cause.** React's Server Actions. React renders the form itself:

```html
<form action="" encType="multipart/form-data" method="POST">
<input type="hidden" name="$ACTION_REF_1"/>
<input type="hidden" name="$ACTION_1:0" value="{&quot;id&quot;:&quot;60b76d93…&quot;}"/>
```

The `$ACTION_REF` inputs are React internals that no application code writes, which is what
identifies this as framework output rather than ours. `action=""` means "submit to the current
URL", which every browser handles correctly, but the HTML specification requires the attribute
to be a non-empty URL.

**Why it is left open.** The attribute is not set by anything in this codebase. Removing it
would mean not using Server Actions, which would cost progressive enhancement: these forms
currently work before JavaScript has loaded. That is a worse outcome than a spec warning about
an attribute browsers handle correctly.

**Recorded rather than hidden**, because "we validate except for the pages with forms" is not
a validation result worth having.

---

## 2. Accessibility audit

**Method.** Every page fetched and parsed by script, with React's embedded payload stripped
first so markup inside `<script>` tags could not produce false matches. Counted: `<main>`
landmarks, skip links, `h1` count, heading level jumps, images without `alt`, form fields
without labels, duplicate ids, and clickable elements with no accessible name.

Contrast was calculated by converting each oklch design token to sRGB and applying the WCAG
formula, rather than judging by eye.

### Passed with no changes

Every image has alt text. Every form field has a linked label. Every page has exactly one
`h1`. No duplicate ids. Nothing clickable without a name. Viewport meta present. The only
fixed-width element, the admin table, is inside a horizontal scroll container.

### DEF-005: six pages had no main landmark

**Severity:** medium.

The dashboard, admin and auth layouts wrapped content in a plain `<div>`. Screen reader users
navigate by landmark, so those pages offered nothing to jump to and forced a trip through the
whole header and sidebar.

**Fix.** `<main id="main">` in all three layouts. **Verified:** all 17 pages now report exactly
one main landmark.

### DEF-006: no skip link on any page

**Severity:** medium.

The header carries six navigation links, so a keyboard user pressed Tab six times on every
page before reaching content.

**Fix.** A skip link, visually hidden until focused, as the first thing in the document.

### DEF-007: heading level skipped on the directory

**Severity:** low.

The page ran `h1` then `h3`, because each result card's name is an `h3`. A skipped level reads
as a missing section.

**Fix.** The results count became the `h2` it always was in meaning.

### DEF-008: three dialogs were not dialogs

**Severity:** high for keyboard and screen reader users.

All three modals declared `role="dialog"` and `aria-modal="true"`, which promises assistive
technology that nothing behind them is reachable. None of them honoured it:

| Expected | Was it done |
|---|---|
| Escape closes | No |
| Focus moves inside on open | No |
| Tab stays inside | No |
| Focus returns to the opener | No |

A keyboard user could open the cancel-appointment dialog and be unable to reach its buttons.

**Fix.** One shared `Modal` component implementing all four plus background scroll locking, so
all three were fixed at once and future dialogs inherit it.

### DEF-009 to DEF-011: colour contrast below WCAG AA

**Severity:** medium. **Open, accepted as a known exception.**

| Combination | Measured | Required |
|---|---|---|
| Primary teal text on white | 3.87 | 4.5 |
| White text on a primary button | 3.87 | 4.5 |
| Form field borders | 1.34 | 3.0 |

`#009281` is slightly too light for text at normal size. The minimum that would pass is
`#008675`; the project's own hover shade `#007a6c` already passes at 5.23.

**Why it is open.** The colour is defined in the Figma file and in `DESIGN-TOKENS.md`, both of
which are deliverables. Changing it in code alone would put three artefacts out of step, and
it is a brand decision rather than a defect in the build. Recorded here so it is a considered
choice rather than something nobody noticed.

Everything else passes comfortably: body text 18.43, muted text 6.23, error red 5.34.

---

## 3. Authentication and permissions

**Method.** Manual, with curl, against the live API.

| Check | Result |
|---|---|
| Real API token reaches the dashboard | 200, correct email and role |
| PATIENT visiting `/admin` | 307 to `/forbidden`, not to login |
| Guest visiting `/dashboard` | 307 to `/login?next=%2Fdashboard` |
| Expired token | 307 to login |
| Forged token claiming ADMIN, before the signing secret was shared | reached the admin shell, but every API call 401 |
| Forged token claiming ADMIN, after the secret was shared | 307 to login, refused before render |

The forged-token case is recorded in both states on purpose: it is the evidence that the
interim decision was bounded rather than hopeful.

### DEF-012: a non-admin could see the admin shell

**Severity:** medium at the time. **Fixed.**

While the API's signing secret was unavailable, the session could only decode the token, not
verify it. A forged token claiming `roles: ["ADMIN"]` rendered the admin page shell, though
every request behind it returned 401 and no data was exposed and nothing could be changed.

**Fix.** The API team shared the signing secret. Signatures are verified again and a forged
token is refused before any page renders.

---

## 4. Cross-user data visibility

**Method.** Two accounts, checked against each other.

| Check | Result |
|---|---|
| One user books a slot, the other's availability | Slot marked taken, free count drops |
| The second user's booking page | The slot is no longer clickable |
| The second user types the taken slot into the URL | Refused, returned to slot selection |
| Rescheduling | Old slot freed, new one taken |
| Cancelling | Slot released |
| Another user reading your appointment by reference | 404 |
| Another user cancelling or moving your appointment | 404, record untouched |

### DEF-013: the slot picker ignored real bookings

**Severity:** high. **Fixed.**

Availability was computed only from the clinic's own blocked times and never consulted actual
bookings, which were checked only on submit. Two people were offered the same slot and the
second found out after filling in the whole form.

Nothing was ever double booked, because the server always checked before saving. The interface
was misleading, not the data.

**Fix.** Real bookings are layered onto the generated grid before the page renders.

---

## 5. Still to run

| Area | Note |
|---|---|
| Unit and component tests | Tooling installed; suite deliberately deferred until the API migration is finished, so the tests are written against the shapes being kept |
| End-to-end workflows | Needs a browser-driving tool; async Server Components cannot be unit tested |
| Responsiveness | At real phone and tablet widths |
| Usability with real users | |
| Booking and admin coverage | Blocked: no doctor schedule exists in the API, and no admin account is available |
