# CareConnect — Auth API contract

Agreed shape between the Next.js web app and the Express API.
Until Express is ready, the web app runs stub endpoints that return exactly these shapes,
so switching over is a change of `API_BASE_URL` and nothing else.

All requests and responses are JSON. All field names are **camelCase**, even though the
database columns are snake_case — the API converts.

---

## Error shape

Every failure, on every endpoint, uses this one shape:

```json
{
  "error": {
    "message": "Human readable sentence",
    "fields": { "email": ["Email already registered"] }
  }
}
```

- `message` — always present. Safe to show the user.
- `fields` — optional. Present only for validation errors, so the UI can put each message
  under the right input.

| Status | When |
|---|---|
| 400 | Validation failed. Includes `fields`. |
| 401 | Bad credentials, or missing/expired token. |
| 403 | Logged in, but not allowed (wrong role). |
| 409 | Conflict — email already registered. |
| 500 | Unexpected server error. |

---

## POST /api/auth/register

**Request**
```json
{
  "firstName": "Amara",
  "lastName": "Silva",
  "email": "amara@example.com",
  "password": "correct horse battery"
}
```

**201 Created**
```json
{
  "user": {
    "id": 1,
    "firstName": "Amara",
    "lastName": "Silva",
    "email": "amara@example.com",
    "roles": ["user"]
  }
}
```

**400** — validation failed, with `fields`
**409** — `{ "error": { "message": "Email already registered", "fields": { "email": ["Email already registered"] } } }`

Notes for the API:
- Password is hashed server-side before storage. The web app never hashes.
- New accounts get the `user` role. Admin is assigned manually.
- Only these four fields at registration. Everything else (nic, dob, address, telephone,
  photos) is captured later on the profile screen.

---

## POST /api/auth/login

**Request**
```json
{ "email": "amara@example.com", "password": "correct horse battery" }
```

**200 OK**
```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": 1,
    "firstName": "Amara",
    "lastName": "Silva",
    "email": "amara@example.com",
    "roles": ["user"]
  }
}
```

**401** — `{ "error": { "message": "Invalid email or password" } }`

Notes for the API:
- The 401 message must be identical whether the email is unknown or the password is wrong.
  Saying which one failed lets an attacker discover who has an account.
- `token` is a signed JWT. Claims: `sub` (user id), `email`, `roles`, `iat`, `exp`.

---

## GET /api/auth/me

Requires `Authorization: Bearer <token>`.

**200 OK** — same `user` object as above.
**401** — missing, invalid or expired token.

---

## Roles

`roles` is an **array**, because the `user_roles` table allows a user to hold more than one.

```json
"roles": ["user"]
"roles": ["user", "admin"]
```

Known values: `user`, `admin`. The web app treats anyone without a token as a guest.

---

## Database note

The `user` table also holds `profile_photo`, `nic`, `nic_photo`, `dob`, `address`,
`telephone` and `created_at`. None are required at registration and none are returned by
the auth endpoints — they belong to a later profile endpoint.
