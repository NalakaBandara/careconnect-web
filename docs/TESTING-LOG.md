# CareConnect web app: testing and defect log

What has been tested, what it found, and what was done about it. Newest entries first within
each section.

Every result here was produced by running something, not by reading the code and judging it
safe. Where a defect was found the evidence is quoted, and where one was left open the reason
is given.

---

## Summary

**23 defects found, 20 fixed, 3 open.** The three open ones are recorded with the reason
rather than dropped: one is emitted by React itself and one is a brand decision that also
lives in the Figma file.


| Area | Method | Status |
|---|---|---|
| W3C HTML validation | W3C Nu validator, all 15 pages | 3 defects found and fixed, 1 open (framework) |
| Accessibility structure | Scripted audit of all 17 pages | 4 defects found and fixed |
| Colour contrast | WCAG AA calculated from the design tokens | 3 failures, accepted as a known exception |
| Authentication and permissions | Manual, then automated in Playwright | Passing, 24 tests |
| Cross-user data visibility | Manual, two accounts | Passing |
| Unit and component tests | Vitest, 79 tests | 2 defects found and fixed |
| Responsiveness | Playwright at phone, tablet and desktop widths | Passing, 41 tests |
| End-to-end journeys | Playwright against the live API | 3 defects found and fixed |
| Security review | Read of all 8,271 lines of src/, plus probes against the live API | 5 defects found and fixed |
| Performance review | API request volume measured per page via the ratelimit header | 1 waterfall fixed, 1 ceiling found and reported |
| Code quality review | Type safety, duplication, dead code, deprecated APIs | No `any` anywhere; 1 duplication and 3 unused exports removed |
| Usability with real users | Not yet run | Pending |

Automated totals: **79 unit and component tests** (`npm test`) and **74 end-to-end tests**
(`npm run test:e2e`), of which **73 pass** and one is skipped on desktop by design, because it
measures touch target sizes and only means anything on a touch screen. That one passes in the
tablet and mobile projects. Every test therefore runs and passes wherever it is meant to.

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

## 5. Automated tests

**Method.** Vitest with React Testing Library, run by `npm test`. 85 tests across 12 files,
about 13 seconds.

Components are queried the way a person finds them, by their label or their role, rather than
by CSS class. A test that looks for "the button named Log in" fails when that button stops
being reachable; one that looks for `.btn-primary` passes even when nobody can use it.

**What is covered.**

| Area | Examples |
|---|---|
| Validation rules | Every field, empty values, malformed emails, password rules, the consent checkbox, length limits |
| Roles | That `CLINIC_ADMIN` and `STAFF` do **not** count as site admin |
| Date handling | That a date never shifts by a day whatever the machine's timezone |
| Display helpers | What a page shows when the API returns nothing, which it frequently does |
| Modal | Escape, focus moving in, Tab wrapping both ways, focus returning, scroll lock |
| Forms | Errors reaching a live region, field errors tied to their own box, values returned, the password never returned |
| Filters | That a choice is written to the URL rather than held in state |

### DEF-014: a trailing space in an email broke registration

**Severity:** high. **Fixed.** Found by the first test written against the validation rules.

The rule was written as `z.email(...).trim().toLowerCase()`, which validates **first** and
trims **afterwards**. So an address that looked perfectly correct was rejected:

```
"amara@example.com"       accepted
" amara@example.com"      REJECTED: Enter a valid email address
"amara@example.com "      REJECTED: Enter a valid email address
"  Amara@Example.COM  "   REJECTED: Enter a valid email address
```

**Why it mattered.** Phone keyboards and copy-paste add trailing spaces constantly. Somebody
could have been unable to register, staring at a correct email and an error saying it was
invalid, with nothing visibly wrong. It affected registration, login and the contact form.

**Fix.** Trim and lowercase first, then pipe into the email check. All four inputs above now
normalise to `amara@example.com`.

**Why the tests found it and manual testing had not.** Every manual check had typed a clean
address. The test asked the question directly, which is the argument for testing the rules
themselves rather than only through a form.

### DEF-015: a doctor's speciality was printed twice on each card

**Severity:** low, cosmetic. **Fixed.**

Introduced during the API migration. The card showed the first speciality under the name and
then listed all of them again below, so a doctor with one speciality had it printed twice.

**How it was caught.** `getByText` throws when it matches more than once, so a test simply
asking for the speciality failed with "multiple elements found". A test written to check
content found a layout bug as a side effect.

**Fix.** The header now carries every speciality, comma separated, and the area below shows
experience and the licence verification instead.

### Not a defect, but worth recording

A filter test tried to import a helper from `@/lib/directory` and failed to run:

```
Error: This module cannot be imported from a Client Component module.
```

That is the `server-only` marker working as designed, refusing to let server code into a
browser context. The test was changed to define its own value rather than reshaping working
code to suit it.

---

## 6. API integration, end to end

**Method.** Manual, against the live CareConnect API, driving the real pages.

| Check | Result |
|---|---|
| Booking page shows real availability | Yes, "5 free" and "6 free" from the doctor's actual schedules |
| Slot links carry date, time and clinic | Yes |
| Choosing a free slot reaches step 2 | Yes, with the real clinic, service and duration |
| A made-up time in the URL | Falls back to step 1, cannot reach the form |
| Booking created through the API | 201 with a real booking reference |
| Our appointments list | Shows it: reference, doctor, reason, "Awaiting clinic" |
| Our dashboard | "You have 1 upcoming appointment", next appointment shown |
| Detail page, owner | 200 |
| Detail page, a different signed-in user | **404** |
| Detail page, a made-up reference | 404 |
| Detail page, guest | Redirected to login with a return path |

The cross-user case is the one that matters: appointments are addressed in our
URLs by booking reference, which is short enough to guess, so it is looked up
inside the caller's own list. Someone else's reference is not found rather
than refused, which also avoids confirming that it exists.

---

## 7. End-to-end journeys

**Method.** Playwright, driving Chromium against the running app and the live API.
74 tests: 24 permission checks, 7 journeys, 5 registration checks and 41 layout checks
at three widths.

### How the suite is arranged, and why

**One sign-in per run, not one per test.** The API rate limits authentication to 5
registrations an hour and 10 logins per 15 minutes, per IP. The first version registered a
fresh patient inside every test, spent the whole hour's budget in a single run, and then
failed with 429s that read exactly like application bugs. A setup project now signs in once
as a patient and once as an admin, saves each session, and every other test declares which
saved session it wants. The guest tests declare an empty session, so they are a genuine first
visit rather than whatever the previous test left behind.

**Three workers, not eight.** A booking page load costs about ten API requests, because
availability is one request per working day. Eight workers loading pages at once spent the
30-a-minute read budget in seconds.

**The booking tests cancel what they book.** They run against the shared database, so a run
that left its appointments behind would slowly fill the teammate's data with test bookings and
take slots out of use.

**What a full run does leave behind: one patient account.** The registration journey has to
create a real account to be worth anything, and the API has no route for deleting a user, as an
admin or as the owner. So that one account stays. While iterating on other tests, exclude it:

```
npx playwright test --grep-invert "registration"
```

That also keeps the run inside the API's 5-registrations-an-hour budget.

**The journeys covered.** A guest searching, filtering and reading a profile. A patient
booking the first free slot, seeing the reference on the confirmation page, finding it in
their appointments, and cancelling it. A patient rescheduling, with a check that the booking
reference does not change, because the patient and the clinic have already quoted it to each
other.

### DEF-016: a failed availability request was shown as a full diary

**Severity:** high. **Fixed.**

`fetchAvailability` asked the API for one day at a time and fell back to an empty slot list
whenever a request did not come back. The picker renders an empty day as "Full", so a request
that failed looked identical to a clinic with nothing free, and the page could tell a patient
"there are no free appointments at this clinic in the next two weeks" when the truth was that
the server never answered.

**How it was caught.** A journey test suddenly reported every day as full. The API had
returned 429, because the page makes one request per working day against a 30-a-minute limit.

**Fix.** A day whose request failed is marked unknown and labelled "Not loaded", it is never
auto-selected, and the page says how many days could not be loaded and that reloading usually
fixes it. "We do not know" and "there is nothing free" are different claims, and only one of
them is ours to make.

### DEF-017: the same mistake inside the booking and reschedule actions

**Severity:** high. **Fixed.**

Both actions re-check the slot before writing, which is right: a form can sit open for a long
while. But they treated every negative answer as "somebody has taken it", so a re-check that
could not reach the API told the patient their slot was gone and sent them off to pick another
one that would fail in exactly the same way.

**Fix.** `checkSlot` now returns free, taken or unknown, and unknown says "we could not
confirm that time just now, please try again in a moment".

**What this shows.** DEF-016 and DEF-017 are one mistake in two places: treating "no answer"
as "no". Fixing the display did not fix the write path, because they read the data separately.

### DEF-018: verifying one slot cost seven API requests

**Severity:** medium, efficiency. **Fixed.**

The re-check above called `fetchAvailability`, which fetches the whole fortnight, one request
per working day, in order to answer a question about one time on one date. Against a
30-a-minute limit that is expensive enough to defeat itself: a patient who booked and then
rescheduled ran out of budget and was told the time was unavailable.

**Fix.** `fetchDayAvailability` fetches the single day in question. The reschedule journey went
from failing every run to passing.

---

## 8. Security, performance and code quality review

**Method.** A read of the whole of `src/` (8,271 lines), plus probes against the live API to
check what it actually enforces, plus measurement of API request volume per page using the
API's own `ratelimit` response header.

### Security

| Finding | Severity | Status |
|---|---|---|
| DEF-019: no security headers were set at all | high | Fixed |
| DEF-020: cancelling and rescheduling had no state check | high | Fixed |
| DEF-021: `?next=` was set but never read, so login always went to the dashboard | medium | Fixed |
| DEF-022: admin pages relied on the layout to gate them | medium | Fixed |
| DEF-023: `requireAdmin` was copied into four action files | medium | Fixed |
| Session token in an httpOnly, SameSite=Lax cookie, Secure in production | — | Correct |
| Login does not say whether the email or the password was wrong | — | Correct |
| Appointments are looked up inside the caller's own list, so another user's reference 404s | — | Correct |
| No `dangerouslySetInnerHTML`, `innerHTML`, `eval` or `new Function` anywhere | — | Correct |
| No secret behind `NEXT_PUBLIC_`; the only env vars are server-side | — | Correct |
| Every Server Action checks permission itself, all 16 of them | — | Correct |
| The doctor's licence number the API sends is never rendered to a patient | — | Correct |
| Ids that a form submits are bound with `bind()`, not hidden inputs | — | Correct |

### DEF-019: no security headers

Nothing was set. Added: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
`Permissions-Policy`, a nonce-based `Content-Security-Policy`, and
`Strict-Transport-Security` in production only.

`Referrer-Policy` matters more here than it looks. Without it, a link out of the site carries
the current path in the `Referer` header, and paths here look like
`/dashboard/appointments/CC-4821-MEH`. That hands a booking reference to a third party.

HSTS is production-only on purpose. Sent from `http://localhost` it pins the browser to HTTPS
for localhost, which breaks every other project on port 3000 until the setting is cleared by
hand.

The CSP keeps `'unsafe-inline'` for styles. Two components set a style attribute whose value
changes at runtime, the parallax transform and the filter's pending opacity, and a nonce cannot
apply to an attribute. It is a much weaker vector than inline script, and with no `innerHTML`
in the codebase there is no way to inject one.

### DEF-020: cancelling and rescheduling had no state check

Both actions confirmed the appointment belonged to the caller and then went ahead. The UI hides
the buttons once an appointment is in the past or already cancelled, but hiding a button is not
a rule, and a Server Action is a public endpoint reachable without the page.

**Probed against the live API**, and it does not enforce it either:

```
DELETE /appointments/5   (already CANCELLED)           -> 200
DELETE /appointments/4   (CONFIRMED, date in the past) -> 200
```

So a patient could cancel an appointment they had already attended. Now checked with
`canCancel` in both actions, with a message saying which case it was.

### DEF-021: ?next= was recorded and then ignored

`proxy.ts` put the path a guest was refused into `?next=`, and `loginAction` always redirected
to `/dashboard`. Nothing read the value. Being turned away from `/dashboard/appointments` and
signing in left you on the dashboard.

Implementing it meant handling the open redirect it would otherwise become. A link to
`/login?next=https://evil.example/login` is a genuine CareConnect URL, with the right domain
and padlock, that hands the user to a copy of the login page the moment they submit their
password. `safeNext` in `lib/redirects.ts` allows only a path on this site, and rejects:

- an absolute URL
- `//evil.example`, which passes a naive "does it start with /" check and which the browser
  reads as protocol-relative
- the same trick written with a backslash, which some browsers treat as a slash
- `/login` and `/register`, which would bounce the user straight back out and look like a
  failed sign-in

It is validated on the server, passed to the action with `bind()` rather than a hidden input,
and validated again inside the action. 6 unit tests and 3 end-to-end tests, including both
redirect attempts.

### Performance

**Measured, not assumed.** Two things I expected to be problems were not.

| Expectation | Measurement |
|---|---|
| The appointments page fetches the doctor once per card, so 23 cards means 23 requests | **3 requests for 23 cards.** Next memoises identical `fetch` calls within one render, so the duplicates cost nothing |
| The profile page fetches the doctor twice, once in `generateMetadata` and once in the page | **2 requests.** Same memoisation |
| `/professionals` fetches `/clinics` twice | **3 requests, not 4.** Same again |

The lesson is worth more than the finding: a pattern that looks like an N+1 in the source was
not one at runtime, and the only way to know was to measure.

**What is a real constraint.** The teammate has raised the general read limit from 30 requests
a minute to 300. Availability still has its own limit of 30:

```
GET /clinics                   ratelimit-policy: 300;w=60
GET /doctors/1/available-slots  ratelimit-policy: 30;w=60
```

Measured: **one `/book/1` page load spends 6 of those 30**, because availability is one request
per working day. That is a hard ceiling of about **4 booking page views a minute across all
users of the site**. It is the single most important thing left for the API to fix, and the
date-range parameter is what fixes it.

**Fixed here:** the confirmation page awaited three independent things one after another, so it
waited for the sum of three round trips rather than the slowest.

**A deliberate trade-off, not a defect.** Every route is dynamic, including `/about` and
`/faqs`, because the header shows the signed-in user's email and so reads cookies. That is
already recorded in a comment in `SiteHeader.tsx`. Without Partial Prerendering, which needs
`cacheComponents`, a static shell around a dynamic header is not available, so the trade-off
stands and it was judged correctly.

### Code quality

| Check | Result |
|---|---|
| `any`, `as any`, `@ts-ignore`, `@ts-expect-error` | **None.** |
| Non-null assertions | Two, both on a security check. Removed: the guards return the user |
| `console.log` in application code | One, in the contact stub, and it deliberately logs the subject but not the message body |
| Duplicated logic | `requireAdmin` in four files, now one. `COOKIE_NAME` in two, left as is and noted below |
| Unused exports | Three removed, one made private |
| Raw `<img>` | None, everything goes through `next/image` |
| Deprecated APIs | One, `<Image priority>`, now `preload` |

### Left deliberately

| Item | Why |
|---|---|
| `COOKIE_NAME` is declared in both `session.ts` and `proxy.ts` | The proxy cannot import from a `server-only` module. Extracting the constant alone is possible but adds a file for one string; the risk is low and both are commented |
| `'unsafe-inline'` in `style-src` | Two runtime style attributes need it, and a nonce cannot apply to an attribute |
| The contact form still posts to a local stub | The API has no contact endpoint |

### Functional gaps found while reviewing

Not defects in what exists, but admin screens the API already supports and the app does not:

| Gap | Evidence |
|---|---|
| No way for an admin to grant or remove a role, so a second admin cannot be made through the UI | `fetchRoles` and `grantRole` exist in `lib/admin.ts` with no callers |
| No way to add a speciality, so the doctor edit screen can only link ones that already exist | `createSpeciality` exists with no callers |

---

## 9. Open, and waiting on the API

| Item | Detail | Last checked |
|---|---|---|
| Availability needs a date range | One request per day means a booking page costs about ten requests against a 30-a-minute limit. `GET /doctors/:id/available-slots?clinicId=1&from=…&to=…` would make it one. This is the root cause of DEF-016 and DEF-018 | 23 Sep 2026, still open |
| A doctor with no clinics disappears | `GET /doctors` omits them and `GET /doctors/:id` returns 404, so an admin cannot put them back. Looks like an inner join that should be a left join. The admin screens guard against reaching that state | 23 Sep 2026, cannot verify from outside |
| No way to remove a doctor profile | `DELETE /doctors/:id` is not defined at all: the response is Express's default HTML "Cannot DELETE" page rather than the JSON 404 a missing record gives. So a doctor created by mistake is permanent | 23 Sep 2026, new |
| No way to delete a user account | Neither `DELETE /users/:id` as an admin nor `DELETE /auth/me` as the owner exists, both give Express's default HTML 404. This is a GDPR problem, not only an untidiness one: the right to erasure has no route to satisfy it, by deletion or by anonymisation | 23 Sep 2026, new |
| Licence number in the appointment response | `GET /appointments/me` returns the doctor's licence number to the patient, which they have no use for | |

### Evidence for the date range, 23 September 2026

```
GET /doctors/1/available-slots?clinicId=1&from=2026-09-23&to=2026-10-06
  400 {"error":{"code":"INVALID_REQUEST","message":"clinicId and date are required"}}

startDate/endDate and dateFrom/dateTo: the same 400.
date=2026-09-23&to=2026-10-06: 200, but the body still covers that one date,
so the extra parameter is ignored rather than honoured.
```

### Why the no-clinic defect cannot be verified from here

The broken state does not currently exist to look at. There is one doctor and it has a clinic,
and of 20 users only one holds the DOCTOR role, so there is no hidden doctor profile to find by
comparing the two lists.

Producing the state means either removing that doctor's only clinic, which risks losing the
system's only doctor with no way back, or promoting a spare account to doctor, which cannot be
undone because there is no delete. Neither is a reasonable thing to do to a shared database to
confirm somebody else's fix, so it has been passed back to be tested on the API side.

## 10. Still to run

| Area | Note |
|---|---|
| Usability with real users | Needs people, not a script |
| Security and performance review | |
| Deployment over HTTPS | |
