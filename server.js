const db = require("./database");
const http = require("http");

const PORT = 3000;
const categories = ["Creative", "Tech", "Lifestyle"];

// ---------- Seed starter data (only if the table is empty) ----------
const count = db.prepare("SELECT COUNT(*) AS c FROM skills").get().c;
if (count === 0) {
  const insert = db.prepare(
    "INSERT INTO skills (name, teaches, wantsToLearn, category, online) VALUES (?, ?, ?, ?, ?)"
  );
  insert.run("Maya", "Watercolor painting", "Guitar", "Creative", 1);
  insert.run("Jordan", "JavaScript", "Photography", "Tech", 1);
}

// ---------- Helpers ----------
const toApi = (row) => ({ ...row, online: Boolean(row.online) });

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(data, null, 2));
}

function sendError(response, status, message) {
  sendJson(response, status, { success: false, message: message });
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let text = "";
    request.on("data", (chunk) => {
      text += chunk;
    });
    request.on("end", () => {
      try {
        resolve(text ? JSON.parse(text) : {});
      } catch (err) {
        reject(new Error("Invalid JSON"));
      }
    });
    request.on("error", reject);
  });
}

// Returns an error message, or null if the data is valid
function validateSkill(body) {
  const { name, teaches, wantsToLearn, category, online } = body;
  if (typeof name !== "string" || !name.trim()) return "name is required";
  if (name.length > 40) return "name must be 40 characters or less";
  if (typeof teaches !== "string" || !teaches.trim()) return "teaches is required";
  if (teaches.length > 80) return "teaches must be 80 characters or less";
  if (typeof wantsToLearn !== "string" || !wantsToLearn.trim()) return "wantsToLearn is required";
  if (wantsToLearn.length > 80) return "wantsToLearn must be 80 characters or less";
  if (!categories.includes(category)) return "category must be one of: " + categories.join(", ");
  if (online !== undefined && typeof online !== "boolean") return "online must be true or false";
  return null;
}

// ---------- Server ----------
const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, "http://" + request.headers.host);
  const parts = url.pathname.split("/").filter(Boolean); // ["api","skills","1"]
  const method = request.method;

     if (method === "GET" && url.pathname === "/api/health") {
     return sendJson(response, 200, { success: true, message: "API is running" });
   }

  if (parts[0] !== "api" || parts[1] !== "skills" || parts.length > 3) {
    return sendError(response, 404, "Route not found");
  }

  const hasId = parts.length === 3;
  const id = hasId ? Number(parts[2]) : null;
  if (hasId && !Number.isInteger(id)) {
    return sendError(response, 400, "Skill id must be a number");
  }

  try {
    // READ all (optional ?category=Tech)
    if (method === "GET" && !hasId) {
      const category = url.searchParams.get("category");
      const rows = category
        ? db.prepare("SELECT * FROM skills WHERE category = ?").all(category)
        : db.prepare("SELECT * FROM skills").all();
      return sendJson(response, 200, { success: true, data: rows.map(toApi) });
    }

    // READ one
    if (method === "GET" && hasId) {
      const row = db.prepare("SELECT * FROM skills WHERE id = ?").get(id);
      if (!row) return sendError(response, 404, "Skill not found");
      return sendJson(response, 200, { success: true, data: toApi(row) });
    }

    // CREATE
    if (method === "POST" && !hasId) {
      const body = await readJson(request);
      const problem = validateSkill(body);
      if (problem) return sendError(response, 400, problem);

      const result = db
        .prepare(
          "INSERT INTO skills (name, teaches, wantsToLearn, category, online) VALUES (?, ?, ?, ?, ?)"
        )
        .run(body.name.trim(), body.teaches.trim(), body.wantsToLearn.trim(), body.category, body.online ? 1 : 0);

      const created = db.prepare("SELECT * FROM skills WHERE id = ?").get(result.lastInsertRowid);
      return sendJson(response, 201, { success: true, data: toApi(created) });
    }

    // UPDATE
    if (method === "PUT" && hasId) {
      const body = await readJson(request);
      const problem = validateSkill(body);
      if (problem) return sendError(response, 400, problem);

      const result = db
        .prepare(
          "UPDATE skills SET name = ?, teaches = ?, wantsToLearn = ?, category = ?, online = ? WHERE id = ?"
        )
        .run(body.name.trim(), body.teaches.trim(), body.wantsToLearn.trim(), body.category, body.online ? 1 : 0, id);

      if (result.changes === 0) return sendError(response, 404, "Skill not found");
      const updated = db.prepare("SELECT * FROM skills WHERE id = ?").get(id);
      return sendJson(response, 200, { success: true, data: toApi(updated) });
    }

    // DELETE
    if (method === "DELETE" && hasId) {
      const result = db.prepare("DELETE FROM skills WHERE id = ?").run(id);
      if (result.changes === 0) return sendError(response, 404, "Skill not found");
      return sendJson(response, 200, { success: true, message: "Skill deleted" });
    }

    return sendError(response, 405, "Method not allowed");
  } catch (err) {
    if (err.message === "Invalid JSON") return sendError(response, 400, "Invalid JSON");
    console.error(err);
    return sendError(response, 500, "Server error");
  }
});

server.listen(PORT, () => {
  console.log("Server running at http://localhost:" + PORT);
});