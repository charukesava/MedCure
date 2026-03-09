const express = require("express");
const router = express.Router();
const axios = require("axios");
const rateLimit = require("express-rate-limit");
const db = require("../config/firebaseAdmin");
const { verifyToken } = require("../middleware/auth");

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    reply:
      "Too many requests. Please wait a moment before sending another message.",
  },
});
router.use(aiLimiter);

const DOCTOR_SYSTEM_PROMPT = `You are Dr. HealthAI, a highly experienced and knowledgeable virtual medical professional with expertise spanning General Medicine, Internal Medicine, Cardiology, Neurology, Pulmonology, Gastroenterology, Endocrinology, Infectious Diseases, Dermatology, Pediatrics, and more.

YOUR ROLE:
You are here to guide patients with a thorough, compassionate, and medically accurate consultation experience. You understand diseases deeply — their causes, risk factors, pathophysiology, symptoms patterns, differential diagnoses, evidence-based treatments, and preventive care.

HOW TO RESPOND:
1. Greet the user warmly and address them as a caring doctor would.
2. Carefully assess the described symptoms or health concern.
3. Provide a structured response using this format when discussing a health concern:

   🔍 **Assessment**: Briefly summarize what the patient has described.
   🧬 **Possible Causes**: List the most likely causes of the symptoms. Explain WHY each cause produces those symptoms.
   ⚠️ **Warning Signs**: Mention any red-flag symptoms that require immediate emergency care.
   💊 **Recommended Care & Treatment**: Home remedies, OTC medications, lifestyle adjustments, when to see a specialist.
   🥗 **Diet & Lifestyle Tips**: Specific advice relevant to the condition.
   🩺 **Next Steps**: Clear guidance on what the patient should do next.

CONVERSATION MEMORY:
- You maintain the full conversation context. Refer back to earlier symptoms or information the user shared.
- If the user provides additional symptoms in follow-up messages, refine your assessment accordingly.
- Ask clarifying questions when needed (e.g., duration of symptoms, age, other medical conditions, medications).

IMPORTANT RULES:
- Be thorough, warm, and professional — like a trusted family doctor.
- Use plain language but include medical terms with brief explanations.
- NEVER refuse to discuss symptoms or conditions. Always provide the most helpful guidance possible.
- For emergencies (chest pain, stroke symptoms, severe bleeding, difficulty breathing), immediately instruct the user to call emergency services / go to the ER.
- End every medical response with a gentle reminder: "Remember, this guidance supports but does not replace an in-person consultation with a licensed physician."
- If the user asks a completely non-medical question, kindly redirect them to health topics.
- You can discuss any disease, its causes, symptoms, treatments, medications, and prevention.`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callGemini = async ({
  systemPrompt,
  history = [],
  userMessage,
  timeoutMs = 30000,
  retries = 3,
}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey)
    throw new Error("GEMINI_API_KEY environment variable is not set");

  const contents = [
    ...history.map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const requestBody = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      temperature: 0.4,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  };

  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        requestBody,
        { timeout: timeoutMs },
      );
      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Invalid API response format");
      return text;
    } catch (err) {
      lastError = err;
      const status = err?.response?.status;
      if (status === 429 && attempt < retries) {
        const waitMs = 2000 * Math.pow(2, attempt - 1);
        console.warn(
          `Gemini rate limited (attempt ${attempt}). Retrying in ${waitMs}ms...`,
        );
        await sleep(waitMs);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
};

router.post("/agent", async (req, res) => {
  const { message, conversationHistory = [], userId, sessionId } = req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0)
    return res.status(400).json({ reply: "Message is required." });
  if (message.length > 8000)
    return res
      .status(400)
      .json({ reply: "Message is too long (max 8000 characters)." });
  if (!Array.isArray(conversationHistory))
    return res.status(400).json({ reply: "Invalid conversation history." });

  const VALID_ROLES = new Set(["user", "model"]);
  const cleanHistory = conversationHistory
    .filter(
      (turn) =>
        turn &&
        typeof turn === "object" &&
        VALID_ROLES.has(turn.role) &&
        typeof turn.text === "string" &&
        turn.text.length <= 8000,
    )
    .map((turn) => ({ role: turn.role, text: turn.text }));

  const trimmedHistory = cleanHistory.slice(-20);

  try {
    const reply = await callGemini({
      systemPrompt: DOCTOR_SYSTEM_PROMPT,
      history: trimmedHistory,
      userMessage: message.trim(),
      timeoutMs: 30000,
    });

    const uid = userId || "guest";
    db.collection("doctorAgentChats")
      .add({
        userId: uid,
        sessionId: sessionId || uid + "_" + Date.now(),
        userMessage: message,
        aiReply: reply,
        timestamp: new Date(),
      })
      .catch((err) => console.error("Firestore save error:", err.message));

    res.json({ reply });
  } catch (error) {
    console.error("Doctor Agent Error:", error.message);
    const status = error?.response?.status;
    const msg =
      status === 429
        ? "The AI service is currently busy. Please wait a moment and try again."
        : error.message.includes("timeout") || error.message.includes("Timeout")
          ? "Dr. HealthAI is taking longer than expected. Please try again."
          : error.message.includes("GEMINI_API_KEY")
            ? "AI service is not configured. Please contact support."
            : "I'm having trouble responding right now. Please try again in a moment.";
    res.status(status === 429 ? 429 : 500).json({ reply: msg });
  }
});

/**
 * GET /api/ai/history
 * Returns the authenticated user's full chat history grouped by session.
 * Requires Firebase auth token.
 */
router.get("/history", verifyToken, async (req, res) => {
  try {
    const snapshot = await db
      .collection("doctorAgentChats")
      .where("userId", "==", req.uid)
      .limit(300)
      .get();

    if (snapshot.empty) return res.json([]);

    // Map docs and sort all by timestamp ascending
    const allDocs = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const ta = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
        const tb = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
        return ta - tb;
      });

    // Group by sessionId (fall back to doc id for legacy records)
    const sessionMap = new Map();
    for (const doc of allDocs) {
      const sid = doc.sessionId || doc.id;
      if (!sessionMap.has(sid)) sessionMap.set(sid, []);
      sessionMap.get(sid).push({
        userMessage: doc.userMessage,
        aiReply: doc.aiReply,
        timestamp:
          doc.timestamp?.toDate?.()?.toISOString() ||
          new Date(doc.timestamp || 0).toISOString(),
      });
    }

    // Convert to array sorted by most recent session first
    const sessions = [...sessionMap.entries()]
      .map(([sid, messages]) => ({
        sessionId: sid,
        messages,
        startedAt: messages[0].timestamp,
        lastUpdated: messages[messages.length - 1].timestamp,
        preview: messages[0].userMessage.slice(0, 80),
      }))
      .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));

    res.json(sessions);
  } catch (err) {
    console.error("[History] Firestore error:", err.message);
    // Firestore composite index not yet created — return helpful message
    if (err.code === 9 || err.message?.includes("index")) {
      return res.status(503).json({
        error: "History index is being built. Try again in 1 minute.",
      });
    }
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

module.exports = router;
