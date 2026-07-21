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

/*
  DECK PACKS
  Each pack has exactly six categories so the six-segment wheel always lines up.
  Each category is a list of [question, follow-up] pairs.
  Add or edit freely — the wheel labels and cards update automatically.
*/
const PACKS = {
  reconnect: {
    label: "Reconnect",
    emoji: "\uD83D\uDC9C",
    blurb: "Warm, open questions to see each other clearly again.",
    categories: {
      Personality: [
        ["What part of your personality do people often misunderstand?", "What do you wish they understood instead?"],
        ["When do you feel most confident and most like yourself?", "What usually brings that version of you out?"],
        ["What quality in yourself are you most proud of?", "When did you realize you had that quality?"],
        ["What personal habit would you most like to improve?", "What normally gets in the way?"],
        ["Do you usually follow logic, emotion, or instinct?", "Can you think of a recent example?"],
        ["What is something small that can immediately improve your mood?", "Why do you think it works so well?"],
        ["What do you need in a day to feel like yourself?", "How often do you actually get it?"],
        ["Are you more of a planner or someone who improvises?", "Has that always been true of you?"],
        ["What recharges you after a hard day?", "What drains you the fastest?"],
        ["What is a side of you that only the people closest to you get to see?", "What makes it safe to show them?"]
      ],
      Memories: [
        ["What childhood memory can still make you smile instantly?", "What detail stands out most clearly?"],
        ["Who had the biggest positive influence on you while growing up?", "What did that person teach you?"],
        ["What moment in your life made you feel genuinely proud?", "What did that moment reveal about you?"],
        ["What place from your past would you like to visit again?", "What feeling do you associate with it?"],
        ["What was your favorite way to have fun as a child?", "Do you still have a version of that in your life?"],
        ["What memory helped shape the way you see relationships?", "What lesson did you take from it?"],
        ["What is a smell or sound that instantly takes you back somewhere?", "Where does it take you?"],
        ["What family tradition meant the most to you growing up?", "Would you want to keep it going?"],
        ["What is a small kindness someone once showed you that you never forgot?", "Why did it stay with you?"],
        ["What is a moment you wish you could relive exactly as it was?", "What made it so good?"]
      ],
      Dreams: [
        ["What is something you still hope to accomplish in your lifetime?", "What would taking the first step look like?"],
        ["If you could become excellent at one new skill, what would it be?", "Why does that skill appeal to you?"],
        ["What would your ideal ordinary day look like?", "Which part of that day could become real now?"],
        ["If money were not a concern, what kind of work would you do?", "What part of that work would feel meaningful?"],
        ["What place would you most like to experience together?", "What would you want to do there first?"],
        ["What kind of person do you hope to become over the next five years?", "What quality matters most in that vision?"],
        ["What is a dream you had as a kid that you have never fully let go of?", "What keeps it alive?"],
        ["If you could master a fear, which one would you pick?", "How would life change without it?"],
        ["What would you like to have more time for?", "What tends to eat that time now?"],
        ["What is something you would love for us to try that we never have?", "What is stopping us?"]
      ],
      Opinions: [
        ["What is an opinion you have changed your mind about?", "What caused you to reconsider it?"],
        ["Do you believe people are naturally good, selfish, or somewhere between?", "What experiences shaped that view?"],
        ["What matters most to you right now: freedom, stability, success, or peace?", "Why did you choose that one?"],
        ["What does society treat as important that does not matter much to you?", "What do you value instead?"],
        ["Would you rather be respected, admired, understood, or loved?", "What makes that choice meaningful to you?"],
        ["What personal rule do you try to live by?", "Where did that rule come from?"],
        ["What is something most people worry about that you have made peace with?", "How did you get there?"],
        ["What does a good life look like to you, in one sentence?", "Are you living close to it right now?"],
        ["What is a piece of advice you strongly disagree with?", "What would you say instead?"],
        ["What do you think you will care more about in ten years than you do now?", "Why the shift?"]
      ],
      Expression: [
        ["What emotion is hardest for you to express openly?", "What makes that emotion difficult to show?"],
        ["What makes you feel truly heard in a conversation?", "What usually makes you shut down?"],
        ["How do you normally show someone that you care?", "Is that also how you prefer to receive care?"],
        ["What kind of compliment means the most to you?", "Why does that recognition matter?"],
        ["When overwhelmed, do you prefer comfort, space, advice, or distraction?", "How can I tell which one you need?"],
        ["What is something you wish you said more often?", "What makes it difficult to say?"],
        ["How do you like to be comforted when you are down?", "Has anyone ever gotten it just right?"],
        ["What does an apology need to include for it to land with you?", "Why those things?"],
        ["When you go quiet, what is usually happening underneath?", "How would you want me to respond?"],
        ["What is a way you have grown in how you handle your emotions?", "What helped you grow?"]
      ],
      "Wild Card": [
        ["Describe yourself using only three movie titles.", "Explain one of your choices."],
        ["Choose a song that represents your current chapter in life.", "What feeling connects with you?"],
        ["Give your life story a book title.", "What would the next chapter be called?"],
        ["Name three things you would bring to a deserted island, excluding a phone.", "What does each choice reveal about you?"],
        ["Act out your current mood without using words.", "Let me guess before you explain."],
        ["Invent a personal holiday everyone should celebrate.", "What would people do that day?"],
        ["If you had a warning label, what would it say?", "Is it fair?"],
        ["What would the title of your autobiography's angriest chapter be?", "What happened in it?"],
        ["If your week were the weather, what is today's forecast?", "What would improve it?"],
        ["Pick an animal that matches your energy right now.", "Why that one?"]
      ]
    }
  },

  us: {
    label: "Us",
    emoji: "\u2764\uFE0F",
    blurb: "About the two of you — appreciation, understanding, and rebuilding trust.",
    categories: {
      Appreciation: [
        ["What is something I do that you are grateful for but may not say enough?", "When did you last notice it?"],
        ["What first drew you to me?", "Is that thing still there, or has it changed?"],
        ["What is a strength of mine that you rely on?", "How does it help you?"],
        ["When have you felt genuinely proud of me?", "What did I do?"],
        ["What small everyday thing between us do you never want to lose?", "Why does it matter to you?"],
        ["What is one way I have grown since we met?", "What helped me get there?"],
        ["What is something I did early on that made you feel chosen?", "Do you still feel it?"],
        ["When do you feel most taken care of by me?", "What does it look like?"],
        ["What is a quality in me you hope our future holds onto?", "Why that one?"],
        ["What is something you admire about how I handle hard things?", "When did you see it?"]
      ],
      "Our Story": [
        ["What is your favorite memory of us together?", "What made that moment special?"],
        ["When did you first feel like we were a team?", "What were we facing?"],
        ["What is a hard time we got through that made us stronger?", "What did we learn?"],
        ["What tradition or inside joke of ours means the most to you?", "How did it start?"],
        ["What is a photo of us you wish we had taken?", "Where were we?"],
        ["What is something we used to do that you miss?", "Could we bring a version of it back?"],
        ["When did you know I was someone you wanted to stay with?", "What tipped it?"],
        ["What is a small ordinary day with me that you think about?", "What made it stick?"],
        ["What is the bravest thing we have done together?", "Would we do it again?"],
        ["What is a season of our relationship you would love to feel again?", "What was in the air then?"]
      ],
      Understanding: [
        ["What do you wish I understood about how you have been feeling lately?", "What would help me get it?"],
        ["When you are hurt, what do you actually need from me in that moment?", "How can I tell when you need it?"],
        ["What is a fear you carry in this relationship?", "What would ease it a little?"],
        ["What is something you have wanted to say but held back?", "What made it hard to say?"],
        ["What does feeling loved by me look like on an ordinary day?", "What is one small version of that?"],
        ["When do you feel most distant from me?", "What tends to start that feeling?"],
        ["What is a way I misread you that you would like to correct?", "What is the truth of it?"],
        ["What do you carry alone that you wish you could share with me?", "What would make it easier to?"],
        ["What is a need of yours that is easy to overlook?", "How could I watch for it?"],
        ["When you feel unseen by me, what is usually going on?", "What would help you feel seen?"]
      ],
      Trust: [
        ["What helps you feel safe with me?", "What is one thing that would build more of it?"],
        ["What does trust look like to you in practice, not just in words?", "Where would you like to see more of it?"],
        ["When do you feel most secure in us?", "What creates that feeling?"],
        ["What is one promise, big or small, that would mean a lot if I kept it?", "Why that one?"],
        ["What do you need to be able to count on from me?", "What gets in the way of that today?"],
        ["What would rebuilding trust look like, one step at a time?", "What could the first step be this week?"],
        ["What is a small consistency from me that would reassure you?", "How often would it need to happen?"],
        ["When has your trust in me felt strongest?", "What was I doing then?"],
        ["What is something you are afraid to fully believe about us yet?", "What would help you believe it?"],
        ["What does honesty need to feel like between us to be safe?", "How are we doing at that?"]
      ],
      Repair: [
        ["What is something you would like to apologize to me for?", "What would you do differently now?"],
        ["What is something you would like me to understand about a time I hurt you?", "What do you need to hear from me?"],
        ["What does forgiveness mean to you?", "What makes it possible?"],
        ["What is one thing we could both let go of?", "What would change if we did?"],
        ["Where do you think our communication breaks down?", "What could we try instead?"],
        ["What do you need in order to feel we are truly moving forward?", "What is one sign we are on the right track?"],
        ["What old argument do you wish we could finally close?", "What would closing it require?"],
        ["When we fight, what do you wish I would do differently?", "What would you try to do differently too?"],
        ["What is a hurt you are ready to start setting down?", "What is holding the last piece of it?"],
        ["What would grace look like from me this week?", "And from you?"]
      ],
      "Our Future": [
        ["What kind of relationship do you want us to have a year from now?", "What is one habit that would get us there?"],
        ["What is something you want us to build or work toward together?", "What is the first small step?"],
        ["What does a good week for us look like?", "How much of that is realistic right now?"],
        ["What is a shared goal that excites you?", "What part can we start on soon?"],
        ["How do you want us to handle disagreements going forward?", "What is one rule we could agree on?"],
        ["What do you hope we will look back on and be glad we did?", "What could we do to make it happen?"],
        ["What is a trip or adventure you want us to say yes to?", "When could it happen?"],
        ["What kind of partners do you want us to be to each other?", "What is one way we can practice it?"],
        ["What do you want more of, and less of, in our everyday life?", "Where could we start?"],
        ["If we imagine us at our best a year from now, what are we doing?", "What gets us there?"]
      ]
    }
  },

  playful: {
    label: "Playful",
    emoji: "\uD83D\uDE04",
    blurb: "Light, silly, and fun — laughter takes the pressure off.",
    categories: {
      "Would You Rather": [
        ["Would you rather have a lazy day in bed or a spontaneous adventure?", "Talk me into your choice."],
        ["Would you rather relive our first date or our best trip?", "Why that one?"],
        ["Would you rather be able to teleport or read minds?", "What would you do first?"],
        ["Would you rather give up coffee or your phone for a month?", "How badly would it go?"],
        ["Would you rather host a party or have a quiet night in?", "What would the night look like?"],
        ["Would you rather always be 10 minutes early or 10 minutes late?", "Which one are you really?"],
        ["Would you rather win a year of free travel or a year of free food?", "How would you use it?"],
        ["Would you rather be famous or filthy rich but unknown?", "Which fits you better?"],
        ["Would you rather redo our wedding day or plan a brand-new getaway?", "What would you change or add?"],
        ["Would you rather never be cold again or never be too hot again?", "What tipped your decision?"]
      ],
      Silly: [
        ["If our life together were a sitcom, what would it be called?", "What is the recurring gag?"],
        ["What is the most ridiculous argument we have ever had?", "Who was actually right?"],
        ["Do an impression of me. Go.", "Was that fair?"],
        ["What is a weirdly specific thing that annoys you?", "Where did that come from?"],
        ["If you had to eat one food forever, what would it be?", "Would you regret it?"],
        ["What is the most embarrassing song on your playlist?", "Sing one line."],
        ["What is the dumbest thing you have ever cried at?", "No judgment. Explain."],
        ["What is a totally useless talent you have?", "Prove it right now."],
        ["If our pets could talk, what would they say about us?", "Who would they side with?"],
        ["What is the weirdest thing you believed as a kid?", "When did you find out the truth?"]
      ],
      Favorites: [
        ["What is your favorite thing about lazy weekends with me?", "What is the ideal version?"],
        ["What is your comfort movie right now?", "What mood puts you there?"],
        ["What is your favorite meal we make or order together?", "When should we have it next?"],
        ["What is your favorite way to be surprised?", "Give me a hint."],
        ["What is your favorite season and why?", "What do we always do then?"],
        ["What is a small treat that always makes your day better?", "When did you last have it?"],
        ["What is your favorite thing to do that costs nothing?", "When did we last do it?"],
        ["What is your favorite version of me — morning, night, or somewhere between?", "Why?"],
        ["What is a place you always feel happy walking into?", "What is it about it?"],
        ["What is your favorite way we say goodbye or hello?", "Should we do it more?"]
      ],
      Throwback: [
        ["What were you like as a teenager?", "Would that kid like who you are now?"],
        ["What is a trend from your past you are secretly glad is over?", "Any photos to prove it?"],
        ["What was your first big crush?", "What did you think love was back then?"],
        ["What is a childhood dream job you have forgotten about?", "Any part of it still fits you?"],
        ["What is an old hobby you would love to pick back up?", "What stopped you?"],
        ["What song instantly takes you back in time?", "Where does it take you?"],
        ["What is the first concert or show you ever went to?", "Was it everything you hoped?"],
        ["What did you want to be when you grew up at age eight?", "How far off were you?"],
        ["What is a fashion choice from your past you would like to apologize for?", "What were you thinking?"],
        ["What is a friendship from your youth you still think about?", "Where are they now?"]
      ],
      Imagine: [
        ["If we won the lottery tomorrow, what is the first thing we would do?", "And the second?"],
        ["If we could live anywhere for a year, where would it be?", "What would our days look like?"],
        ["If we swapped lives for a day, what would surprise you most about mine?", "What would you change?"],
        ["If we opened a business together, what would it be?", "Who runs which part?"],
        ["If you could plan our perfect day with no limits, what happens?", "How does it end?"],
        ["If we had a free weekend and a full tank of gas, where do we go?", "Who picks the music?"],
        ["If we could have dinner with anyone alive, who would we invite?", "What do we ask them?"],
        ["If we got one superpower to share, what should it be?", "How would we use it as a team?"],
        ["If our life had a theme song playing right now, what is it?", "Why that one?"],
        ["If we could add one room to any home, what would it be for?", "Who uses it most?"]
      ],
      Dares: [
        ["Give me a genuine compliment you have never said out loud.", "Why haven't you said it before?"],
        ["Text me the last thing you searched for. No editing.", "Explain yourself."],
        ["Do your best dance move right now.", "Rate your own performance."],
        ["Say something in your worst accent.", "What was that supposed to be?"],
        ["Recreate the face you made on our first date.", "How accurate was it?"],
        ["Give me a 10-second hype speech about our relationship.", "Encore?"],
        ["Show me the last photo you took. No skipping ahead.", "What is the story behind it?"],
        ["Do your most convincing fake laugh.", "Now a real one — what made you laugh recently?"],
        ["Describe me to a stranger in exactly five words.", "Would I agree?"],
        ["Make up a short jingle about us right now.", "Take a bow."]
      ]
    }
  },

  spicy: {
    label: "Spicy",
    emoji: "\uD83D\uDD25",
    blurb: "Flirty and intimate, for the two of you. Pass anything you're not feeling.",
    categories: {
      Attraction: [
        ["What is the first thing you noticed about me physically?", "Do you still catch yourself noticing it?"],
        ["What do I wear that you love most on me?", "When did you last see it?"],
        ["What is something I do without realizing that you find attractive?", "When do I do it?"],
        ["What makes you feel most attracted to me lately?", "How could there be more of it?"],
        ["When do you think I look my best?", "What is it about that moment?"],
        ["What is your favorite physical feature of mine?", "Why that one?"],
        ["What is a look I give you that gets you every time?", "Should I do it now?"],
        ["When did you last feel a rush of attraction to me?", "What set it off?"],
        ["What is something about the way I move or carry myself that you love?", "When did you first notice it?"],
        ["What draws you to me across a crowded room?", "Has that always been true?"]
      ],
      Flirt: [
        ["What is the best way I could flirt with you right now?", "Should I try it?"],
        ["What is a compliment about you that always lands?", "Want to hear it?"],
        ["What is your idea of a perfect kiss?", "When was the last one like that?"],
        ["What nickname would you secretly love me to call you?", "Try it and see."],
        ["What is the flirtiest text I could send you today?", "Dare me?"],
        ["What is something I could whisper that would make you smile?", "Say the version you'd want to hear."],
        ["What is a small touch from me that you love?", "When do you crave it most?"],
        ["How would you flirt with me if we just met tonight?", "Show me your opening line."],
        ["What is a playful thing I do that you find irresistible?", "Do I do it enough?"],
        ["What would win you over instantly if I did it right now?", "One clue only."]
      ],
      Desire: [
        ["What makes you feel most wanted by me?", "How can I do more of it?"],
        ["What is a mood or setting that makes you feel closest to me?", "How do we recreate it?"],
        ["What is something you would love more of from me?", "What would that look like?"],
        ["What is your favorite way for an evening between us to unfold?", "Where does it start?"],
        ["When do you feel most connected to me physically?", "What builds up to it?"],
        ["What is something that always turns an ordinary night into a special one?", "When could we do it again?"],
        ["What is a slow, unhurried thing you wish we did more of?", "What would make room for it?"],
        ["What makes you feel truly desired, beyond words?", "When did you last feel it from me?"],
        ["What is a signal you give when you want to be close?", "Do I read it well?"],
        ["What kind of anticipation do you enjoy most?", "How could I build it?"]
      ],
      Romance: [
        ["What is the most romantic thing we have ever done together?", "Could we top it?"],
        ["What is your idea of a perfect date night now?", "What is stopping us from planning it?"],
        ["What small romantic gesture means the most to you?", "When did I last do it?"],
        ["What song should be ours?", "What memory does it fit?"],
        ["Describe your dream weekend away with me.", "Which part matters most?"],
        ["What would make you feel swept off your feet this week?", "Give me one clue."],
        ["What does being romanced actually feel like to you?", "How often do you feel it?"],
        ["What is a candlelit-dinner kind of memory you have of us?", "Want to recreate it?"],
        ["What little ritual makes you feel cherished?", "Could it become a regular thing?"],
        ["If I planned a surprise date, what should it absolutely include?", "And absolutely not?"]
      ],
      Confessions: [
        ["What is a moment you found me irresistible and never told me?", "What was happening?"],
        ["What is a secret little thing you love that I do?", "How long have you kept it secret?"],
        ["What is something you have wanted to be bolder about asking for?", "What held you back?"],
        ["What is a memory of us you replay when you miss me?", "What stands out?"],
        ["When did you last feel butterflies around me?", "What set them off?"],
        ["What is one thing you have always wanted to try together?", "What makes it appealing?"],
        ["What is a compliment you have thought about me but never said?", "Say it now?"],
        ["What is something you noticed about me today?", "Did it make you smile?"],
        ["What is a fantasy of an ordinary evening with me that you love?", "What is in it?"],
        ["What do you daydream about when you think of us?", "How close is it to reality?"]
      ],
      Fantasy: [
        ["Describe our perfect getaway with no budget and no schedule.", "Beach, city, cabin, or somewhere else?"],
        ["If we had a whole day just for each other, how would you spend it?", "How does it end?"],
        ["What is a dream date you have imagined but we have never done?", "Should we plan it?"],
        ["Plan a surprise evening for me out loud.", "What is the finishing touch?"],
        ["If we could relive one romantic night, which one?", "What would you keep the same?"],
        ["What is a bold idea for a future anniversary?", "What would make it unforgettable?"],
        ["Describe the perfect morning-after-a-great-night with me.", "Where are we?"],
        ["If we ran away for a weekend with no phones, what would we do?", "Who plans it?"],
        ["What is a setting that has always felt romantic to you?", "Could we get there someday?"],
        ["Invent the ideal lazy Sunday for just us two.", "What is the one rule?"]
      ]
    }
  }
};

// Deeper questions are shared across all packs and unlock after five rounds.
const DEEP_QUESTIONS = {
  Reflection: [
    ["What are you currently learning about yourself?", "What led you to notice it?"],
    ["What fear has influenced more decisions than you would like?", "What might change if that fear became smaller?"],
    ["What part of your past are you still trying to make peace with?", "What would peace look like?"],
    ["What do you need more of in your life right now?", "What is one realistic way to create it?"],
    ["What is something you are ready to forgive yourself for?", "What would that free up?"],
    ["What belief about yourself would you most like to change?", "Where did it come from?"]
  ],
  Vulnerable: [
    ["What do you rarely admit because it makes you feel exposed?", "What would make it safer to share?"],
    ["When do you feel least confident?", "What helps you return to yourself?"],
    ["What kind of rejection affects you most deeply?", "What does that rejection seem to say to you?"],
    ["What emotional need do you sometimes struggle to explain?", "How would you describe it today?"],
    ["What is something you are afraid to want out loud?", "What makes it scary to say?"],
    ["When do you feel most alone, even around people?", "What would reach you in that moment?"]
  ],
  "About Us": [
    ["What part of yourself do you feel safest showing me?", "What helped create that safety?"],
    ["What do you wish I understood more naturally about you?", "What could help me understand it better?"],
    ["When do you feel most connected to me?", "What ingredients create that feeling?"],
    ["What experience would you like us to create together?", "What would make it meaningful?"],
    ["What is something you need from me that is hard to ask for?", "What would make asking easier?"],
    ["What do you hope is still true about us in twenty years?", "What would keep it true?"]
  ]
};

const DEFAULT_PACK = "reconnect";
const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function packCategories(packId) {
  const pack = PACKS[packId] || PACKS[DEFAULT_PACK];
  return Object.keys(pack.categories);
}

function packMeta() {
  return Object.entries(PACKS).map(([id, p]) => ({
    id,
    label: p.label,
    emoji: p.emoji,
    blurb: p.blurb
  }));
}

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

function readyIds(room) {
  return room.players.filter((p) => room.ready.has(p.token)).map((p) => p.id);
}

function serializeRoom(room) {
  const ready = readyIds(room);
  return {
    code: room.code,
    hostName: room.hostName || "",
    players: room.players.map(({ id, name }) => ({ id, name })),
    mode: room.mode,
    pack: room.pack,
    categories: packCategories(room.pack),
    packs: packMeta(),
    round: room.round,
    score: room.score,
    currentPlayerId: room.currentPlayerId,
    currentQuestion: room.currentQuestion,
    usedCards: room.usedCards,
    deeperUnlocked: room.round >= 5,
    readyIds: ready,
    bothReady: room.players.length === 2 && ready.length === 2
  };
}

// Lightweight lookup so the invite landing page can greet the guest by host name.
app.get("/api/room/:code", (req, res) => {
  const code = String(req.params.code || "").trim().toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    res.json({ exists: false });
    return;
  }
  res.json({
    exists: true,
    hostName: room.hostName || "",
    players: room.players.length,
    full: room.players.length >= 2
  });
});

function getRoomForSocket(socket) {
  const code = socket.data.roomCode;
  return code ? rooms.get(code) : null;
}

function canAct(socket, room) {
  return room && room.currentPlayerId === socket.id && room.players.some((p) => p.id === socket.id);
}

function inRoom(socket, room) {
  return room && room.players.some((p) => p.id === socket.id);
}

function playerToken(room, socketId) {
  const player = room.players.find((p) => p.id === socketId);
  return player ? player.token : null;
}

function emitState(room) {
  io.to(room.code).emit("room-state", serializeRoom(room));
}

function sanitizePlayerToken(value) {
  return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
}

function joinRoom(socket, room, name, playerTokenValue) {
  const token = sanitizePlayerToken(playerTokenValue);
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

  if (!room.hostName) room.hostName = room.players[0].name;

  socket.join(room.code);
  socket.data.roomCode = room.code;

  if (!room.currentPlayerId) {
    room.currentPlayerId = socket.id;
  }

  emitState(room);
  return { ok: true, roomCode: room.code, playerId: socket.id, hostName: room.hostName };
}

io.on("connection", (socket) => {
  socket.on("create-room", ({ name, playerToken } = {}, callback = () => {}) => {
    const code = makeRoomCode();
    const room = {
      code,
      hostName: "",
      players: [],
      mode: "wheel",
      pack: DEFAULT_PACK,
      round: 0,
      score: 0,
      currentPlayerId: null,
      currentQuestion: null,
      usedCards: [],
      ready: new Set(),
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

  // Shared "we're both here" moment before the first question.
  socket.on("set-ready", () => {
    const room = getRoomForSocket(socket);
    if (!inRoom(socket, room) || room.round > 0) return;
    const token = playerToken(room, socket.id);
    if (!token || room.ready.has(token)) return;
    room.ready.add(token);
    const both = room.players.length === 2 && readyIds(room).length === 2;
    if (both) io.to(room.code).emit("both-ready");
    emitState(room);
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

  // Either player may switch the deck — it just changes the pool for the next draw.
  socket.on("set-pack", ({ pack } = {}) => {
    const room = getRoomForSocket(socket);
    if (!inRoom(socket, room)) return;
    if (!PACKS[pack] || room.pack === pack) return;
    room.pack = pack;
    room.usedCards = [];
    const who = room.players.find((p) => p.id === socket.id);
    io.to(room.code).emit("pack-changed", {
      pack,
      label: PACKS[pack].label,
      emoji: PACKS[pack].emoji,
      by: who ? who.name : ""
    });
    emitState(room);
  });

  socket.on("spin-wheel", () => {
    const room = getRoomForSocket(socket);
    if (!canAct(socket, room)) return;

    const categories = packCategories(room.pack);
    const categoryIndex = Math.floor(Math.random() * categories.length);
    const category = categories[categoryIndex];
    const [question, followUp] = randomItem(PACKS[room.pack].categories[category]);
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

    const categories = packCategories(room.pack);
    const category = randomItem(categories);
    const [question, followUp] = randomItem(PACKS[room.pack].categories[category]);

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
