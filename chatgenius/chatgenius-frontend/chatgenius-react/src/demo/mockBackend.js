// In-browser mock of the ChatGenius Flask API, used by the static "demo mode".
// Everything is stored in localStorage under one key, so accounts and chats
// persist in the visitor's own browser only. No data ever leaves the browser.
// Pure logic (no DOM / config imports) so it can be unit-tested in Node.

const DB_KEY = "chatgenius_demo_db";

function emptyDb() {
  return { users: [], groups: {}, messages: {}, nextUserId: 1, nextId: 1000 };
}

function load(storage) {
  try {
    const raw = storage.getItem(DB_KEY);
    if (raw) return { ...emptyDb(), ...JSON.parse(raw) };
  } catch {
    /* fall through to a fresh DB */
  }
  return emptyDb();
}

function save(storage, db) {
  storage.setItem(DB_KEY, JSON.stringify(db));
}

async function hashPassword(pw) {
  try {
    if (globalThis.crypto?.subtle) {
      const buf = await globalThis.crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode("chatgenius-demo:" + pw)
      );
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch {
    /* use fallback below */
  }
  return "plain:" + pw;
}

function userFromToken(db, headers) {
  const auth = headers?.Authorization || headers?.authorization || "";
  const m = /^Bearer demo-token-(\d+)$/.exec(auth);
  if (!m) return null;
  return db.users.find((u) => u.id === Number(m[1])) || null;
}

export function demoReply(text) {
  const t = (text || "").toLowerCase().replace(/@ai/g, "").trim();
  const now = new Date();
  if (/\b(date|today|day)\b/.test(t)) {
    return `Today is ${now.toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    })}.`;
  }
  if (/\btime\b/.test(t)) {
    return `The current time is ${now.toLocaleTimeString()}.`;
  }
  if (/^(hi+|hello+|hey+|hii+)\b/.test(t)) {
    return "Hi there! 👋 Welcome to the ChatGenius demo. Ask me for today's date or the time, or just say what's on your mind.";
  }
  if (/\b(who are you|your name|what are you)\b/.test(t)) {
    return "I'm ChatGenius, a chat assistant. In this online demo my answers are scripted; the full app uses Google Gemini.";
  }
  if (/\b(help|what can you do|features)\b/.test(t)) {
    return "In this demo you can create an account, log in, start chats and group chats, react to messages with emojis and rename chats. In the full version I'm powered by Gemini for real answers.";
  }
  if (/\b(thanks|thank you)\b/.test(t)) {
    return "You're welcome! 😊";
  }
  return `This is a demo, so I can't give real AI answers here. (You said: "${(text || "")
    .replace(/@ai/gi, "")
    .trim()
    .slice(0, 120)}") The full app answers with Google Gemini.`;
}

function userMessageOut(db, m) {
  return {
    id: m.id,
    text: m.content,
    user_id: m.sender_id,
    username: m.username,
    conversation_id: m.conversation_id,
    created_at: m.created_at,
    role: "user",
  };
}

function messageOut(m) {
  return {
    id: m.id,
    user_id: m.sender_id,
    username: m.username,
    conversation_id: m.conversation_id,
    text: m.content,
    type: m.message_type,
    created_at: m.created_at,
    role: m.message_type === "ai_text" ? "ai" : "user",
    reactions: Object.values(m.reactions || {}),
    attachments: m.attachments || [],
  };
}

/**
 * handleRequest({ method, path, headers, body, files }, storage, hooks)
 *  - path: e.g. "/api/auth/login" (API base already stripped)
 *  - body: parsed JSON object or form fields object
 *  - files: array of file names (attachments)
 *  - hooks.emit(event, data, delayMs): push a "server" event to the UI
 * returns { status, json }
 */
export async function handleRequest(req, storage, hooks = {}) {
  const { method = "GET", path, headers = {}, body = {}, files = [] } = req;
  const db = load(storage);
  const ok = (json, status = 200) => ({ status, json });
  const err = (error, status) => ({ status, json: { error } });
  let m;

  // ---------- AUTH ----------
  if (method === "POST" && path === "/api/auth/register") {
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !body.password) return err("Email and password are required", 400);
    if (db.users.some((u) => u.email === email)) return err("User already exists", 400);
    const id = db.nextUserId++;
    db.users.push({
      id,
      email,
      username: body.username || email.split("@")[0],
      full_name: body.full_name || "",
      hash: await hashPassword(body.password),
      theme_preference: "dark",
      registration_year: new Date().getFullYear(),
    });
    save(storage, db);
    return ok({ message: "User registered successfully" });
  }

  if (method === "POST" && path === "/api/auth/login") {
    const email = String(body.email || "").trim().toLowerCase();
    const user = db.users.find((u) => u.email === email);
    if (!user) return err("User not found", 404);
    if (user.hash !== (await hashPassword(body.password || ""))) {
      return err("Invalid credentials", 401);
    }
    return ok({
      message: "Login successful",
      access_token: `demo-token-${user.id}`,
      user_id: user.id,
      username: user.username,
    });
  }

  // ---------- AI (works without login, like the real API) ----------
  if (method === "POST" && path === "/ai/clear_history") return ok({ success: true });

  if (method === "POST" && path === "/ai/chat") {
    const reply = demoReply(body.message);
    const user = userFromToken(db, headers);
    const convId = body.conversation_id;
    if (user && convId) {
      const key = String(convId);
      (db.messages[key] = db.messages[key] || []).push({
        id: db.nextId++,
        conversation_id: Number(convId) || convId,
        sender_id: user.id,
        username: "ChatGenius",
        content: reply,
        message_type: "ai_text",
        created_at: new Date().toISOString(),
        reactions: {},
        attachments: [],
      });
      save(storage, db);
    }
    return ok({ reply });
  }

  if (method === "POST" && path === "/ai/image") {
    return err("Image generation is not available in the demo.", 501);
  }

  // ---------- everything below needs a logged-in demo user ----------
  const user = userFromToken(db, headers);
  if (!user) return err("Missing or invalid token", 401);

  // ---------- PROFILE ----------
  if (path === "/api/users/profile") {
    if (method === "GET") {
      return ok({
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        theme_preference: user.theme_preference,
        registration_year: user.registration_year,
        is_online: true,
      });
    }
    if (method === "PUT") {
      if ("full_name" in body) user.full_name = body.full_name;
      if ("theme_preference" in body) user.theme_preference = body.theme_preference;
      save(storage, db);
      return ok({ message: "Profile updated" });
    }
  }
  if (method === "GET" && path === "/api/users/search") return ok([]);

  // ---------- CONVERSATIONS / GROUPS ----------
  if (method === "POST" && path === "/api/conversations/join") {
    return ok({ message: "Joined" });
  }

  if (method === "POST" && path === "/api/groups") {
    const id = db.nextId++;
    db.groups[id] = {
      id,
      title: body.title || "Group Chat",
      description: body.description || "",
      creator_id: user.id,
      created_at: new Date().toISOString(),
    };
    save(storage, db);
    return ok({ id, success: true }, 201);
  }

  if ((m = /^\/api\/groups\/(\d+)$/.exec(path))) {
    const group = db.groups[m[1]];
    if (!group) return err("Group not found", 404);
    if (method === "GET") return ok(group);
    if (method === "PUT") {
      group.title = body.title || group.title;
      save(storage, db);
      return ok({ id: group.id, title: group.title });
    }
  }

  // ---------- MESSAGES ----------
  if (method === "POST" && path === "/api/messages") {
    const convId = body.conversation_id;
    const content = body.content;
    if (!convId || !content) return err("Missing conversation_id or content", 400);
    const key = String(convId);
    const msg = {
      id: db.nextId++,
      conversation_id: Number(convId) || convId,
      sender_id: user.id,
      username: user.username,
      content,
      message_type: body.type || "text",
      created_at: new Date().toISOString(),
      reactions: {},
      attachments: (files || []).map((name) => ({ name, url: "" })),
    };
    (db.messages[key] = db.messages[key] || []).push(msg);

    // In group chats the AI answers messages that start with @ai (like the real backend)
    const isGroup = !!db.groups[key];
    if (isGroup && content.trim().toLowerCase().startsWith("@ai")) {
      const aiMsg = {
        id: db.nextId++,
        conversation_id: msg.conversation_id,
        sender_id: user.id,
        username: "ChatGenius",
        content: demoReply(content),
        message_type: "ai_text",
        created_at: new Date(Date.now() + 1).toISOString(),
        reactions: {},
        attachments: [],
      };
      db.messages[key].push(aiMsg);
      hooks.emit?.("ai_typing", { conversation_id: key, is_typing: true }, 0);
      hooks.emit?.("ai_typing", { conversation_id: key, is_typing: false }, 900);
      hooks.emit?.(
        "new_message",
        { ...messageOut(aiMsg), role: "ai", message_type: "ai_text" },
        900
      );
    }
    save(storage, db);
    return ok(userMessageOut(db, msg), 201);
  }

  if (method === "GET" && (m = /^\/api\/messages\/conversation\/(.+)$/.exec(path))) {
    const list = db.messages[m[1]] || [];
    return ok(list.map(messageOut));
  }

  if (method === "POST" && (m = /^\/api\/messages\/([^/]+)\/react$/.exec(path))) {
    if (!body.emoji) return err("Emoji is required", 400);
    for (const list of Object.values(db.messages)) {
      const msg = list.find((x) => String(x.id) === m[1]);
      if (msg) {
        msg.reactions = msg.reactions || {};
        msg.reactions[user.id] = body.emoji;
        save(storage, db);
        return ok({ msg: "Reaction added" });
      }
    }
    return ok({ msg: "Reaction ignored" }); // optimistic/local-only message
  }

  return err(`Not found in demo: ${method} ${path}`, 404);
}
