// TEMPORARY. Delete when the Express API is ready.
//
// Two fixed accounts so the web app can be built and tested before the real
// backend exists. Passwords are in plain text here on purpose: this is a
// throwaway fixture, never a real store. The real hashing happens in Express.

export type StubUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles: string[];
};

export const STUB_USERS: StubUser[] = [
  {
    id: 1,
    firstName: "Amara",
    lastName: "Silva",
    email: "amara@example.com",
    password: "password1",
    roles: ["user"],
  },
  {
    id: 2,
    firstName: "Nadia",
    lastName: "Perera",
    email: "admin@example.com",
    password: "password1",
    roles: ["user", "admin"],
  },
];

// Strips the password before anything is sent to the browser.
export function toPublicUser(user: StubUser) {
  const { password, ...publicFields } = user;
  void password;
  return publicFields;
}
