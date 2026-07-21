const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: false }
});

const PORT = process.env.PORT || 3000;
const rooms = new Map();

app.disable("x-powered-by");
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_req, res) => {
  res.json({ ok: true, rooms: rooms.size });
});

const QUESTIONS = {
  Personality: [
    ["What part of your personality do people often misunderstand?", "What do you wish they understood instead?"],
    ["When do you feel most confident and most like yourself?", "What usually brings that version of you out?"],
    ["What quality in yourself are you most proud of?", "When did you realize you had that quality?"],
    ["What personal habit would you most like to improve?", "What normally gets in the way?"],
    ["Do you usually follow logic, emotion, or instinct?", "Can you think of a recent example?"],
    ["What is something small that can immediately improve your mood?", "Why do you think it works so well?"]
  ],
  Memories: [
    ["What childhood memory can still make you smile instantly?", "What detail stands out most clearly?"],
    ["Who had the biggest positive influence on you while growing up?", "What did that person teach you?"],
    ["What moment in your life made you feel genuinely proud?", "What did that moment reveal about you?"],
    ["What place from your past would you like to visit again?", "What feeling do you associate with it?"],
    ["What was your favorite way to have fun as a child?", "Do you still have a version of that in your life?"],
    ["What memory helped shape the way you see relationships?", "What lesson did you take from it?"]
  ],
  Dreams: [
    ["What is something you still hope to accomplish in your lifetime?", "What would taking the first step look like?"],
    ["If you could become excellent at one new skill, what would it be?", "Why does that skill appeal to you?"],
    ["What would your ideal ordinary day look like?", "Which part of that day could become real now?"],
    ["If money were not a concern, what kind of work would you do?", "What part of that work would feel meaningful?"],
    ["What place would you most like to experience?", "What would you want to do there first?"],
    ["What kind of person do you hope to become over the next five years?", "What quality matters most in that vision?"]
  ],
  Opinions: [
    ["What is an opinion you have changed your mind about?", "What caused you to reconsider it?"],
    ["Do you believe people are naturally good, selfish, or somewhere between?", "What experiences shaped that view?"],
    ["What matters most to you right now: freedom, stability, success, or peace?", "Why did you choose that one?"],
    ["What does society treat as important that does not matter much to you?", "What do you value instead?"],
    ["Would you rather be respected, admired, understood, or loved?", "What makes that choice meaningful to you?"],
    ["What personal rule do you try to live by?", "Where did that rule come from?"]
  ],
  Expression: [
    ["What emotion is hardest for you to express openly?", "What makes that emotion difficult to show?"],
    ["What makes you feel truly heard in a conversation?", "What usually makes you shut down?"],
    ["How do you normally show someone that you care?", "Is that also how you prefer to receive care?"],
    ["What kind of compliment means the most to you?", "Why does that recognition matter?"],
    ["When overwhelmed, do you prefer comfort, space, advice, or distraction?", "How can someone tell which one you need?"],
    ["What is something you wish you said more often?", "What makes it difficult to say?"]
  ],
  "Wild Card": [
    ["Describe yourself using only three movie titles.", "Explain one of your choices."],
    ["Choose a song that represents your current chapter in life.", "What feeling connects with you?"],
    ["Give your life story a book title.", "What would the next chapter be called?"],
    ["Name three things you would bring to a deserted island, excluding a phone.", "What does each choice reveal about you?"],
    ["Act out your current mood without using words.", "Let the other person guess before explaining."],
    ["Invent a personal holiday everyone should celebrate.", "What would people do that day?"]
  ]
};

const DEEP_QUESTIONS = {
  Reflection: [
    ["What are you currently learning about yourself?", "What led you to notice it?"],
    ["What fear has influenced more decisions than you would like?", "What might change if that fear became smaller?"],
    ["What part of your past are you still trying to make peace with?", "What would peace look like?"],
    ["What do you need more of in your life right now?", "What is one realistic way to create it?"]
  ],
  Vulnerable: [
    ["What do you rarely admit because it makes you feel exposed?", "What would make it safer to share?"],
    ["When do you feel least confident?", "What helps you return to yourself?"],
    ["What kind of rejection affects you most deeply?", "What does that rejection seem to say to you?"],
    ["What emotional need do you sometimes struggle to explain?", "How would you describe it today?"]
  ],
  "About Us": [
    ["What part of yourself do you feel safest showing me?", "What helped create that safety?"],
    ["What do you wish I understood more naturally about you?", "What could help me understand it better?"],
    ["When do you feel most connected to me?", "What ingredients create that feeling?"],
    ["What experience would you like us to create together?", "What would make it meaningful?"]
  ]
};

const CATEGORIES = Object.keys(QUESTIONS);
const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeRoomCode() {
  let code = "";
  do {
    code = Array.from({ length: 6 }, () =>
      ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)]
    ).join("");
  } while (rooms.has(code));
  return code;
}

function sanitizeName(value) {
  const clean = String(value || "").trim().replace(/\s+/g, " ");
  return clean.slice(0, 24) || "Player";
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function serializeRoom(room) {
  return {
    code: room.code,
    players: room.players.map(({ id, name }) => ({ id, name })),
    mode: room.mode,
    round: room.round,
    score: room.score,
    currentPlayerId: room.currentPlayerId,
    currentQuestion: room.currentQuestion,
    usedCards: room.usedCards,
    deeperUnlocked: room.round >= 5
  };
}

function getRoomForSocket(socket) {
  const code = socket.data.roomCode;
  return code ? rooms.get(code) : null;
}

function canAct(socket, room) {
  return room && room.currentPlayerId === socket.id && room.players.some((p) => p.id === socket.id);
}

function emitState(room) {
  io.to(room.code).emit("room-state", serializeRoom(room));
}

function sanitizePlayerToken(value) {
  return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
}

function joinRoom(socket, room, name, playerToken) {
  const token = sanitizePlayerToken(playerToken);
  const cleanName = sanitizeName(name);
  const existingIndex = token
    ? room.players.findIndex((player) => player.token === token)
    : -1;

  if (existingIndex >= 0) {
    const oldId = room.players[existingIndex].id;
    room.players[existingIndex] = { id: socket.id, name: cleanName, token };
    if (room.currentPlayerId === oldId) room.currentPlayerId = socket.id;
  } else {
    if (room.players.length >= 2) {
      return { ok: false, error: "This room already has two players." };
    }
    room.players.push({ id: socket.id, name: cleanName, token });
  }

  socket.join(room.code);
  socket.data.roomCode = room.code;

  if (!room.currentPlayerId) {
    room.currentPlayerId = socket.id;
  }

  emitState(room);
  return { ok: true, roomCode: room.code, playerId: socket.id };
}

io.on("connection", (socket) => {
  socket.on("create-room", ({ name, playerToken } = {}, callback = () => {}) => {
    const code = makeRoomCode();
    const room = {
      code,
      players: [],
      mode: "wheel",
      round: 0,
      score: 0,
      currentPlayerId: null,
      currentQuestion: null,
      usedCards: [],
      cleanupTimer: null
    };
    rooms.set(code, room);
    callback(joinRoom(socket, room, name, playerToken));
  });

  socket.on("join-room", ({ roomCode, name, playerToken } = {}, callback = () => {}) => {
    const code = String(roomCode || "").trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      callback({ ok: false, error: "Room not found. Check the code and try again." });
      return;
    }
    if (room.cleanupTimer) {
      clearTimeout(room.cleanupTimer);
      room.cleanupTimer = null;
    }
    callback(joinRoom(socket, room, name, playerToken));
  });

  socket.on("set-mode", ({ mode } = {}) => {
    const room = getRoomForSocket(socket);
    if (!canAct(socket, room)) return;
    if (!["wheel", "cards", "deep"].includes(mode)) return;
    if (mode === "deep" && room.round < 5) return;
    room.mode = mode;
    io.to(room.code).emit("mode-changed", { mode, by: socket.id });
    emitState(room);
  });

  socket.on("spin-wheel", () => {
    const room = getRoomForSocket(socket);
    if (!canAct(socket, room)) return;

    const categoryIndex = Math.floor(Math.random() * CATEGORIES.length);
    const category = CATEGORIES[categoryIndex];
    const [question, followUp] = randomItem(QUESTIONS[category]);
    const angle = 1440 + Math.floor(Math.random() * 720) + (360 - (categoryIndex * 60 + 30));

    room.mode = "wheel";
    room.round += 1;
    room.currentQuestion = { category, question, followUp };

    io.to(room.code).emit("wheel-spun", {
      categoryIndex,
      angle,
      duration: 3500,
      question: room.currentQuestion,
      round: room.round,
      by: socket.id
    });
    emitState(room);
  });

  socket.on("pick-card", ({ cardIndex } = {}) => {
    const room = getRoomForSocket(socket);
    if (!canAct(socket, room)) return;

    const index = Number(cardIndex);
    if (!Number.isInteger(index) || index < 0 || index > 5 || room.usedCards.includes(index)) return;

    const category = randomItem(CATEGORIES);
    const [question, followUp] = randomItem(QUESTIONS[category]);

    room.mode = "cards";
    room.usedCards.push(index);
    room.round += 1;
    room.currentQuestion = { category, question, followUp };

    io.to(room.code).emit("card-picked", {
      cardIndex: index,
      duration: 700,
      question: room.currentQuestion,
      round: room.round,
      by: socket.id
    });
    emitState(room);
  });

  socket.on("shuffle-cards", () => {
    const room = getRoomForSocket(socket);
    if (!canAct(socket, room)) return;
    room.usedCards = [];
    io.to(room.code).emit("cards-shuffled");
    emitState(room);
  });

  socket.on("pick-deep", ({ level } = {}) => {
    const room = getRoomForSocket(socket);
    if (!canAct(socket, room) || room.round < 5) return;
    if (!DEEP_QUESTIONS[level]) return;

    const [question, followUp] = randomItem(DEEP_QUESTIONS[level]);
    room.mode = "deep";
    room.round += 1;
    room.currentQuestion = { category: level, question, followUp };

    io.to(room.code).emit("deep-picked", {
      duration: 650,
      question: room.currentQuestion,
      round: room.round,
      by: socket.id
    });
    emitState(room);
  });

  socket.on("complete-turn", ({ connected = false } = {}) => {
    const room = getRoomForSocket(socket);
    if (!canAct(socket, room)) return;

    if (connected) room.score += 1;

    const currentIndex = room.players.findIndex((p) => p.id === socket.id);
    const nextPlayer = room.players.length > 1
      ? room.players[(currentIndex + 1) % room.players.length]
      : room.players[0];

    room.currentPlayerId = nextPlayer?.id || socket.id;
    room.currentQuestion = null;

    io.to(room.code).emit("turn-completed", {
      connected: Boolean(connected),
      score: room.score,
      currentPlayerId: room.currentPlayerId
    });
    emitState(room);
  });

  socket.on("pass-turn", () => {
    const room = getRoomForSocket(socket);
    if (!canAct(socket, room)) return;

    const currentIndex = room.players.findIndex((p) => p.id === socket.id);
    const nextPlayer = room.players.length > 1
      ? room.players[(currentIndex + 1) % room.players.length]
      : room.players[0];

    room.currentPlayerId = nextPlayer?.id || socket.id;
    room.currentQuestion = null;

    io.to(room.code).emit("turn-passed", {
      currentPlayerId: room.currentPlayerId
    });
    emitState(room);
  });

  socket.on("disconnect", () => {
    const room = getRoomForSocket(socket);
    if (!room) return;

    room.players = room.players.filter((p) => p.id !== socket.id);

    if (room.currentPlayerId === socket.id) {
      room.currentPlayerId = room.players[0]?.id || null;
      room.currentQuestion = null;
    }

    if (room.players.length === 0) {
      room.cleanupTimer = setTimeout(() => rooms.delete(room.code), 10 * 60 * 1000);
    } else {
      io.to(room.code).emit("player-left", { playerId: socket.id });
      emitState(room);
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Uncover Remote is running on port ${PORT}`);
});
