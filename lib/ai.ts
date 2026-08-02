import { GoogleGenAI } from "@google/genai";

// Reads GEMINI_API_KEY (or GOOGLE_API_KEY) from the environment automatically.
const ai = new GoogleGenAI({});
const MODEL = "gemini-3.6-flash";

export type GeneratedContent = {
  concepts: string[];
  questions: {
    concept: string;
    question: string;
    options: { text: string; correct: boolean }[];
  }[];
  flashcards: {
    concept: string;
    front: string;
    back: string;
  }[];
};

const CONTENT_SCHEMA = {
  type: "object",
  properties: {
    concepts: {
      type: "array",
      items: { type: "string" },
    },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          concept: { type: "string" },
          question: { type: "string" },
          options: {
            type: "array",
            items: {
              type: "object",
              properties: {
                text: { type: "string" },
                correct: { type: "boolean" },
              },
              required: ["text", "correct"],
              additionalProperties: false,
            },
          },
        },
        required: ["concept", "question", "options"],
        additionalProperties: false,
      },
    },
    flashcards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          concept: { type: "string" },
          front: { type: "string" },
          back: { type: "string" },
        },
        required: ["concept", "front", "back"],
        additionalProperties: false,
      },
    },
  },
  required: ["concepts", "questions", "flashcards"],
  additionalProperties: false,
} as const;

// Structured-output JSON schema can't express "exactly one correct option" —
// drop any question the model got wrong instead of persisting a question with
// zero or multiple correct answers (which would break quiz.tsx's
// `options.find(o => o.correct)` and, for zero options, crash the DB insert).
const sanitizeGeneratedContent = (content: GeneratedContent): GeneratedContent => ({
  ...content,
  questions: content.questions.filter(
    (question) => question.options.filter((option) => option.correct).length === 1,
  ),
});

export const generateLearningContent = async (
  sourceText: string,
): Promise<GeneratedContent> => {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `You are helping a teacher turn their lesson material into a quiz. Read the material below, identify 5-8 core concepts it teaches, then generate exactly 10 multiple-choice questions (4 options each, exactly one correct) each tagged to one of those concepts, and one flashcard per concept summarizing it.

Material:
"""
${sourceText}
"""`,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: CONTENT_SCHEMA,
    },
  });

  if (!response.text) {
    throw new Error("AI did not return structured content");
  }

  return sanitizeGeneratedContent(JSON.parse(response.text) as GeneratedContent);
};

export const generateRevisionContent = async (
  weakConcepts: string[],
  sourceText: string,
): Promise<GeneratedContent> => {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `A class is struggling with these specific concepts: ${weakConcepts.join(", ")}.

Using the source material below, generate a focused revision quiz: exactly 2 new multiple-choice questions (4 options each, exactly one correct) per concept listed, plus one flashcard per concept. Do not introduce any concept outside this exact list — the "concepts" field in your response must be exactly this list, unchanged: ${JSON.stringify(weakConcepts)}.

Source material:
"""
${sourceText}
"""`,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: CONTENT_SCHEMA,
    },
  });

  if (!response.text) {
    throw new Error("AI did not return structured content");
  }

  return sanitizeGeneratedContent(JSON.parse(response.text) as GeneratedContent);
};

export type StudentInsightInput = {
  studentName: string;
  points: number;
  currentStreak: number;
  conceptMastery: { title: string; masteryPct: number | null; totalCount: number }[];
  assignmentHistory: { title: string; status: string; score: number | null; totalPoints: number }[];
};

export type StudentInsight = {
  summary: string;
  strengths: string[];
  growthAreas: string[];
  recommendation: string;
};

const STUDENT_INSIGHT_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    growthAreas: { type: "array", items: { type: "string" } },
    recommendation: { type: "string" },
  },
  required: ["summary", "strengths", "growthAreas", "recommendation"],
  additionalProperties: false,
} as const;

export const generateStudentInsight = async (
  input: StudentInsightInput,
): Promise<StudentInsight> => {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `You are a teaching assistant writing a short, plain-language analysis of one student for their teacher. Use only the data given below — don't invent scores or events that aren't there. Be specific (name actual concepts and assignments) and constructive, not generic.

Write:
- summary: 2-3 sentences on how this student is doing overall.
- strengths: 2-3 short bullet points naming specific concepts or habits they're doing well on.
- growthAreas: 2-3 short bullet points naming specific concepts they're struggling with (below 70% mastery counts as struggling) or assignments they're behind on. If nothing stands out, say so honestly.
- recommendation: one concrete, actionable next step the teacher could take with this student.

Student data:
"""
${JSON.stringify(input, null, 2)}
"""`,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: STUDENT_INSIGHT_SCHEMA,
    },
  });

  if (!response.text) {
    throw new Error("AI did not return an analysis");
  }

  return JSON.parse(response.text) as StudentInsight;
};

export type MisconceptionCandidate = {
  conceptId: number;
  question: string;
  wrongOptionText: string;
  correctOptionText: string;
  missedByCount: number;
};

export type MisconceptionExplanation = {
  conceptId: number;
  explanation: string;
};

const MISCONCEPTION_SCHEMA = {
  type: "object",
  properties: {
    explanations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          conceptId: { type: "integer" },
          explanation: { type: "string" },
        },
        required: ["conceptId", "explanation"],
        additionalProperties: false,
      },
    },
  },
  required: ["explanations"],
  additionalProperties: false,
} as const;

export const explainMisconceptions = async (
  candidates: MisconceptionCandidate[],
): Promise<MisconceptionExplanation[]> => {
  if (candidates.length === 0) {
    return [];
  }

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `For each question below, students most often picked a specific wrong answer instead of the correct one. In one short, specific sentence per item, explain the likely misconception behind that wrong pick (e.g. "confuses X with Y"). Return one explanation per conceptId given, preserving the conceptId.

${JSON.stringify(candidates, null, 2)}`,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: MISCONCEPTION_SCHEMA,
    },
  });

  if (!response.text) {
    return [];
  }

  const parsed = JSON.parse(response.text) as { explanations: MisconceptionExplanation[] };
  return parsed.explanations;
};
