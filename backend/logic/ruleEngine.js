const RULES = [
  {
    match: (t) => t.includes("chest pain") || t.includes("heart attack"),
    result: {
      condition: "Possible cardiac event",
      severity: "emergency",
      firstAid:
        "Chew an aspirin (if not allergic), loosen tight clothing, do not drive yourself",
      consult: "Call emergency services (112 / 108) immediately",
    },
  },
  {
    match: (t) =>
      t.includes("stroke") ||
      t.includes("face drooping") ||
      t.includes("arm weakness") ||
      t.includes("speech difficulty"),
    result: {
      condition: "Possible stroke (FAST symptoms)",
      severity: "emergency",
      firstAid: "Note the time symptoms started, do not give food or water",
      consult:
        "Call emergency services immediately — clot-busting treatment is time-critical",
    },
  },
  {
    match: (t) =>
      t.includes("difficulty breathing") ||
      t.includes("shortness of breath") ||
      t.includes("can't breathe"),
    result: {
      condition: "Respiratory distress",
      severity: "urgent",
      firstAid: "Sit upright, stay calm, use inhaler if prescribed",
      consult: "Go to emergency room immediately",
    },
  },
  {
    match: (t) =>
      t.includes("high fever") || (t.includes("fever") && t.includes("rash")),
    result: {
      condition: "Possible dengue, typhoid, or viral illness",
      severity: "moderate",
      firstAid: "Paracetamol for fever, cold sponging, oral rehydration salts",
      consult: "See a doctor within 24 hours for blood tests",
    },
  },
  {
    match: (t) => t.includes("fever") && t.includes("cough"),
    result: {
      condition: "Viral respiratory infection (flu/COVID-19 possible)",
      severity: "moderate",
      firstAid:
        "Rest, warm fluids, steam inhalation, isolate if COVID suspected",
      consult:
        "Consult doctor if fever persists more than 2 days or breathing worsens",
    },
  },
  {
    match: (t) => t.includes("fever"),
    result: {
      condition: "Fever — likely viral or bacterial infection",
      severity: "mild",
      firstAid: "Paracetamol (500 mg), stay hydrated, rest",
      consult:
        "Consult doctor if fever exceeds 103°F or lasts more than 3 days",
    },
  },
  {
    match: (t) =>
      t.includes("headache") &&
      (t.includes("stiff neck") || t.includes("sensitivity to light")),
    result: {
      condition: "Possible meningitis",
      severity: "emergency",
      firstAid: "Do not delay — this can be life-threatening",
      consult: "Go to emergency room immediately",
    },
  },
  {
    match: (t) => t.includes("headache"),
    result: {
      condition: "Headache — tension, migraine, or dehydration",
      severity: "mild",
      firstAid:
        "Rest in a dark quiet room, paracetamol or ibuprofen, drink water",
      consult: "See doctor if severe, sudden (thunderclap), or recurring",
    },
  },
  {
    match: (t) => t.includes("vomiting") || t.includes("nausea"),
    result: {
      condition:
        "Nausea / vomiting — gastroenteritis, food poisoning, or other cause",
      severity: "mild",
      firstAid: "Sip clear fluids (ORS), avoid solid food for 2–3 hours, rest",
      consult: "See doctor if vomiting blood or persists more than 24 hours",
    },
  },
  {
    match: (t) => t.includes("diarrhea") || t.includes("loose motion"),
    result: {
      condition: "Diarrhea — likely gastroenteritis or food poisoning",
      severity: "mild",
      firstAid:
        "Oral rehydration salts (ORS), avoid dairy and fatty foods, zinc supplements",
      consult: "See doctor if blood in stool, high fever, or dehydration signs",
    },
  },
  {
    match: (t) => t.includes("abdominal pain") || t.includes("stomach pain"),
    result: {
      condition:
        "Abdominal pain — wide range of causes (gastritis, appendicitis, etc.)",
      severity: "moderate",
      firstAid: "Avoid solid food, apply warm compress for cramps",
      consult:
        "Seek emergency care if pain is severe, sudden, or in lower right abdomen",
    },
  },
  {
    match: (t) => t.includes("seizure") || t.includes("convulsion"),
    result: {
      condition: "Seizure / convulsion",
      severity: "emergency",
      firstAid:
        "Lay person on their side, protect head, do NOT restrain; time the seizure",
      consult:
        "Call 108 immediately; first-time seizure always requires ER evaluation",
    },
  },
  {
    match: (t) =>
      t.includes("diabetic") ||
      t.includes("blood sugar") ||
      t.includes("hypoglycemia"),
    result: {
      condition: "Blood sugar imbalance (hypo/hyperglycemia)",
      severity: "moderate",
      firstAid:
        "If conscious and hypoglycemic: give sugar drink or glucose tablets",
      consult: "Monitor blood sugar; see endocrinologist for persistent issues",
    },
  },
  {
    match: (t) => t.includes("burn"),
    result: {
      condition: "Burn injury",
      severity: "moderate",
      firstAid:
        "Cool with running water for 20 min; do NOT use ice, butter, or toothpaste",
      consult:
        "See doctor for burns larger than palm-size or on face/hands/genitals",
    },
  },
  {
    match: (t) =>
      t.includes("cut") || t.includes("bleeding") || t.includes("wound"),
    result: {
      condition: "External wound / bleeding",
      severity: "moderate",
      firstAid:
        "Apply firm pressure with clean cloth; elevate the limb if possible",
      consult:
        "Go to ER if bleeding does not stop in 10 minutes or wound is deep",
    },
  },
  {
    match: (t) =>
      t.includes("allergic") || t.includes("allergy") || t.includes("hives"),
    result: {
      condition: "Allergic reaction",
      severity: "moderate",
      firstAid:
        "Antihistamine (cetirizine); for anaphylaxis use epinephrine auto-injector",
      consult:
        "Emergency care if throat swelling, difficulty breathing, or dizziness",
    },
  },
];

module.exports = function analyze(text) {
  text = (text || "").toLowerCase();
  for (const rule of RULES) {
    if (rule.match(text)) return rule.result;
  }
  return {
    condition: "General health concern",
    severity: "mild",
    firstAid: "Rest, stay hydrated, and monitor symptoms",
    consult: "Consult a doctor if symptoms persist more than 48 hours",
  };
};
