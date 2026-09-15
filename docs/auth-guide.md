# CareConnect — how authentication works

Everything we built for registration, login and permissions, written so you can explain it
to someone else (or to a marker) without reading the code.

---

## The short version

1. Someone fills in the login form.
2. The form submits to a function that runs on **our Next.js server**, not in their browser.
3. That function asks the **API** whether the email and password are correct.
4. If yes, the API returns a **token** — a signed string saying who this person is.
5. Our server puts that token in a **cookie the browser cannot read**.
6. Every later page reads the cookie, checks the signature, and knows who is visiting.

The important part is step 5. The token never touches JavaScript, so a malicious script
injected into the page cannot steal it.

---

## The three layers

```
   Browser                    Next.js server              API
   ────────                   ──────────────              ───
   login form        →        loginAction         →       checks the password
                              sets the cookie             returns a token
                              redirects
```

| Layer | What runs there | File |
|---|---|---|
| **Browser** | The form, showing errors | `src/components/LoginForm.tsx` |
| **Next server** | Validation, calling the API, setting the cookie | `src/app/(auth)/login/actions.ts` |
| **API** | Finding the user, checking the password | `src/app/api/auth/login/route.ts` *(temporary)* |

That third layer is currently **inside this project** because the Express API does not exist
yet. When it does, we delete our version and point at his. Layers one and two do not change.

---

## Why the middle layer exists at all

It would be simpler for the browser to call the API directly. We do not, for two reasons:

**Cookies belong to a domain.** Only our own server can set a cookie on our own domain.
If the browser called Express directly, Express could not give us an httpOnly cookie.

**No CORS to configure.** Because the request goes server-to-server, the browser never makes
a cross-origin request. Nothing to whitelist, no preflight requests, no `credentials: include`.

---

## Every file and what it does

### Validation — `src/lib/schemas.ts`

One set of rules for what valid data looks like. Used in **two** places:

- in the browser, so users get instant feedback
- on the server, because **anyone can skip the browser** and send a request directly

If the rules lived in two files they would eventually disagree. They live in one.

```ts
password: z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number")
```

Three rules, three separate messages, so the user is told exactly what is wrong.

One subtlety: the **login** schema has no password rules beyond "not empty". Saying
"too short" at login would leak how long the real password is.

### Sessions — `src/lib/session.ts`

The only file in the project that touches the cookie. Three functions:

| Function | Called from | Does |
|---|---|---|
| `createSession(token)` | the login action | Stores the token in a cookie |
| `getSession()` | any page or layout | Returns the current user, or `null` |
| `destroySession()` | the logout action | Deletes the cookie |

The cookie settings are the security, and each one defends against something specific:

```ts
httpOnly: true                                  // JavaScript cannot read it
secure: process.env.NODE_ENV === "production"   // HTTPS only, in production
sameSite: "lax"                                 // not sent on cross-site POSTs
maxAge: 60 * 60 * 24 * 7                        // seconds — expires in 7 days
```

- **`httpOnly`** is why we use a cookie instead of `localStorage`. Any script on the page can
  read `localStorage`; nothing can read an httpOnly cookie.
- **`secure`** is conditional on purpose. Hardcode `true` and login silently breaks on
  `http://localhost`, because browsers refuse to store a Secure cookie without HTTPS.
- **`sameSite: "lax"`** stops another website POSTing to ours using your cookie.
- **`maxAge` is in seconds.** A very common bug is using milliseconds, giving a cookie that
  lasts 19,000 years.

`getSession()` never throws. If someone edits their cookie to add `"admin"` to their roles,
the signature stops matching, verification fails, and we return `null` — they are simply
logged out. No crash, no hole.

The file starts with `import "server-only"`. If anyone ever imports it into browser code by
mistake, **the build fails** rather than shipping our secret handling to users.

### The forms

- `src/components/RegisterForm.tsx`
- `src/components/LoginForm.tsx`

Both are Client Components, because they need to show errors and a "saving…" state.

They use `useActionState`, which gives three things:

```tsx
const [state, formAction, isPending] = useActionState(loginAction, EMPTY);
```

| | |
|---|---|
| `state` | Whatever the server function returned — the errors |
| `formAction` | Attached to `<form action={...}>` |
| `isPending` | `true` while submitting, so the button can say "Logging in…" |

Because it is a **real HTML form**, it still submits if JavaScript has not loaded yet.

### The server functions

- `src/app/(auth)/register/actions.ts`
- `src/app/(auth)/login/actions.ts`

Marked `"use server"` — the mirror of `"use client"`. These run on the server but can be
called from the browser; React handles the network call.

**Important to understand:** a `"use server"` function is a real public endpoint. Someone can
send a request straight to it. That is why every one of them re-validates its input, even
though the browser already did.

Each one follows the same five steps:

1. Read the submitted fields out of `FormData`
2. Validate with the shared schema — return field errors if invalid
3. `fetch` the API
4. If the API refused, return its message for the form to display
5. On success, set the session and redirect

### Permissions — `src/proxy.ts`

Runs **before** every matching request. In Next 16 this file is called `proxy.ts`; older
tutorials call it `middleware.ts`, which is now deprecated.

| Rule | Behaviour |
|---|---|
| Guest visits `/dashboard` or `/admin` | Redirect to `/login?next=/dashboard` |
| Logged-in user visits `/login` or `/register` | Redirect to `/dashboard` |
| Non-admin visits `/admin` | Redirect to `/forbidden` |

Note the last one is **not** a redirect to login. They are already signed in — sending them
to log in again implies it would help, and it would not. That is a 403, not a 401.

The matcher matters:

```ts
matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"]
```

Without it, this code would run on every image and font request, adding latency to every
single asset on the page.

**This is not the security boundary.** It is an optimistic check that stops a guest ever
seeing a protected page flash on screen. Real enforcement happens in the layouts.

### Real enforcement — the protected layouts

```
src/app/(protected)/layout.tsx         requires a session
src/app/(protected)/admin/layout.tsx   requires the admin role
```

These call `getSession()` at render time on the server. A misconfigured matcher, or a route
added later outside the pattern, cannot bypass them.

The folder names are in brackets, which makes them **route groups** — they organise files
without appearing in the URL. So the page is `/dashboard`, not `/protected/dashboard`.

**Two layers on purpose.** Proxy for speed and a clean redirect; the layout for actual
security. Hiding a link is never access control — if `/admin` is not checked on the server,
typing the URL works.

---

## Roles

`roles` is an **array**, not a single value, because the `user_roles` database table allows a
user to hold more than one:

```json
"roles": ["user"]
"roles": ["user", "admin"]
```

So a doctor could also be a patient. Checking is one word longer than a single value:

```ts
user.roles.includes("admin")   // not  user.role === "admin"
```

There is a helper for it: `hasRole(user, "admin")` in `session.ts`.

**New registrations always get `["user"]`.** Nobody can make themselves an admin by signing
up — if registration could set roles, anyone could POST `roles: ["admin"]` and take over.
Admin is assigned manually in the database.

---

## What is real and what is temporary

| Real — stays forever | Temporary — delete when Express arrives |
|---|---|
| `src/lib/schemas.ts` | `src/app/api/auth/login/route.ts` |
| `src/lib/session.ts` | `src/app/api/auth/register/route.ts` |
| `src/proxy.ts` | `src/lib/stub-users.ts` |
| Both forms and both actions | |
| The protected layouts | |

The temporary files exist so the forms have something to talk to. They are honest about it —
`stub-users.ts` stores passwords in plain text **with a comment saying why**, because it is a
week-long fixture, not a store. Real hashing happens in Express, next to the database.

### Test accounts

| Email | Password | Roles |
|---|---|---|
| `amara@example.com` | `password1` | `user` |
| `admin@example.com` | `password1` | `user`, `admin` |

---

## Switching to the Express API

1. Change one line in `.env.local`:
   ```
   API_BASE_URL=http://localhost:4000/api
   ```
2. Delete `src/app/api/auth/` and `src/lib/stub-users.ts`.
3. Confirm Express returns the shapes in `docs/api-contract.md`. If it differs, adapt the two
   `actions.ts` files — nothing else.

**No component, page, form or permission file changes.** That is the test of whether the
seam was built correctly.

---

## Two security decisions worth being able to defend

**1. Login failures are deliberately vague.**

```ts
const INVALID = { error: { message: "Invalid email or password" } };
```

The same message whether the email is unknown or the password is wrong. If they differed,
anyone could type emails at the login page and learn which ones have accounts. For a
healthcare app, "does this person use CareConnect" is itself private.

**2. The browser never hashes passwords.**

Hashing happens on the server, next to the database. If the browser hashed it, the hash
would *become* the password — steal it and you can log in without knowing the original.

---

## One trade-off we made knowingly

The header reads the session so it can show "Log out" instead of "Log in". Reading a cookie
means Next cannot pre-build the page, so **every route is now rendered per request** rather
than served as a prebuilt file.

You can see it in the build output: routes that used to show `○ (Static)` now show
`ƒ (Dynamic)`.

The alternative — a header that shows "Log in" to someone already signed in — is worse. But
it is a real cost, and on a bigger site you would isolate the session read into a small
component instead of the whole layout.

---

## Verified behaviour

Tested against the running app:

| Check | Result |
|---|---|
| Guest requests `/dashboard` | `307` redirect to `/login` |
| Login with wrong password | `401` "Invalid email or password" |
| Login with correct password | `200` with a signed token |
| Register an existing email | `409`, message attached to the `email` field |
| Register invalid data | `400` with per-field messages |
| Password in the login response | Not present |
