# User Management Dashboard

A React + Vite app to view, add, edit, and delete users against the
[JSONPlaceholder](https://jsonplaceholder.typicode.com/) `/users` API, with
search, filtering, sorting, and pagination.

## Features

- **View** — table of users (ID, First Name, Last Name, Email, Department)
- **Add / Edit** — modal form with client-side validation (required fields,
  email format)
- **Delete** — with a confirmation dialog
- **Search** — free-text across name, email, and department
- **Filter** — popup with per-field filters (first name, last name, email,
  department)
- **Sort** — click any column header to sort asc/desc
- **Pagination** — 10 / 25 / 50 / 100 rows per page, with page controls
- **Responsive** — table collapses into stacked cards on small screens
- **Error handling** — banner shown if the initial fetch or a create/update/
  delete call fails

## Tech stack

React 19, Vite, plain CSS (no UI framework) — fetch API for HTTP calls.

## Project structure

Kept intentionally small — 3 components, no extra layers:

- `App.jsx` — owns all state: fetching users, search, filters, sorting,
  pagination, and the add/edit/delete API calls
- `UserTable.jsx` — renders the table (headers, sort arrows, rows, the
  Edit/Delete buttons per row)
- `UserModal.jsx` — the overlay dialog, used two ways: the add/edit form,
  and the delete confirmation — same file since they're both just small
  modals with a Cancel button

## Setup & run instructions

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
# App runs at http://localhost:5173

# 3. Build for production
npm run build

# 4. Preview the production build
npm run preview
```

No environment variables or API keys are required — JSONPlaceholder is a
free, public mock API.

## Assumptions & design decisions

- **Real JSONPlaceholder data only** — the app fetches and displays exactly
  the 10 users returned by the `/users` endpoint. No mock/synthetic data is
  generated; pagination, filtering, and sorting operate on this real dataset
  (with fewer total pages than a larger dataset would show, since the source
  API only has 10 records).
- **Every write operation is a genuine API call** — Add sends a real `POST`,
  Edit sends a real `PUT`, Delete sends a real `DELETE` to `/users`.
  JSONPlaceholder doesn't actually persist these (it simulates a successful
  response), so local state is updated on a successful response to reflect
  the change in the UI.
- **Name splitting**: JSONPlaceholder returns a single `name` field; it's
  split on the first space into First Name / Last Name for the dashboard's
  schema.
- **Department**: mapped from the API's `company.name` field, since
  JSONPlaceholder has no department field.
- **Add**: JSONPlaceholder returns a fixed `id: 11` for every `POST`
  regardless of payload; that id (or a fallback) is used to add the new
  user to local state so the UI reflects the addition immediately.
- Client-side validation only (no server-side validation exists on
  JSONPlaceholder).

## Reflection

**Challenges faced:**
- JSONPlaceholder's fake persistence meant the biggest design decision
  wasn't UI — it was figuring out how to make CRUD *feel* real (state
  updates on a successful response) while still genuinely exercising the
  API for every operation, since nothing is actually stored server-side.
- With only 10 users available from the API, pagination and larger page
  sizes (50/100) can't be fully demonstrated beyond a single page — this is
  a limitation of the data source, not the implementation.

**What I'd improve with more time:**
- Add optimistic UI updates with rollback on failure, instead of waiting
  for the request to resolve before updating state.
- Add unit tests (e.g. Vitest + React Testing Library) for the filter/sort/
  pagination logic and form validation.
- Debounce the search input for a smoother experience at scale.
- Persist filter/sort/page state in the URL query string so views are
  shareable/bookmarkable.
- Point the app at a richer mock backend (e.g. a seeded `json-server`
  instance) to properly exercise pagination at larger page sizes.




Hello Mr Chadalavada Varun Pavan Sai


