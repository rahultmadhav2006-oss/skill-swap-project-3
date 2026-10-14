# Skill Swap: Database Integration (Project 3)

A REST API for a skill-swapping platform, now backed by a persistent SQLite database instead of in-memory data.

## Tech
- Node.js (built-in `http` module)
- SQLite via `better-sqlite3` (native driver, raw SQL)

## Database schema

Table `skills`:

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| name | TEXT | NOT NULL, max 40 characters |
| teaches | TEXT | NOT NULL, max 80 characters |
| wantsToLearn | TEXT | NOT NULL, max 80 characters |
| category | TEXT | NOT NULL, one of Creative, Tech, Lifestyle |
| online | INTEGER | NOT NULL, 0 or 1 (default 0) |

## Endpoints

| Method | Route | Action |
|---|---|---|
| GET | /api/health | Check the API is running |
| GET | /api/skills | List skills (optional `?category=Tech`) |
| GET | /api/skills/:id | Get one skill |
| POST | /api/skills | Create a skill |
| PUT | /api/skills/:id | Update a skill |
| DELETE | /api/skills/:id | Delete a skill |

## Run it

```
npm install
node server.js
```

The server runs at http://localhost:3000. Test with `requests.http` (VS Code REST Client).

## Design decisions
- **SQL over NoSQL:** skill listings are structured and consistent, and SQL lets the schema enforce rules (NOT NULL, CHECK).
- **Native driver over ORM:** `better-sqlite3` keeps the SQL visible and has no overhead, which is good for learning how queries work.
- **Security:** all queries use parameterized placeholders (`?`), so input like `' OR 1=1 --` is treated as plain data and cannot cause SQL injection.
- **Integrity at two levels:** the server validates input (400 errors), and the database constraints act as a final safety net.
- **Persistence:** data survives server restarts because it is stored in `skills.db`.