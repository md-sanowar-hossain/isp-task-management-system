import { GoogleGenAI } from "@google/genai";
import { Task } from "../types";

const API_KEY = process.env.API_KEY || (typeof window !== 'undefined' ? (window as any).VITE_API_KEY : undefined);

export const getAIAnalysis = async (tasks: Task[]) => {
  // If no API key is provided, return a safe mock so the UI remains functional in development.
  if (!API_KEY) {
    console.warn('No AI API key provided — returning mock analysis.');
    const total = tasks.length;
    const topIssue = tasks[0]?.taskType || 'No data';
    const worstArea = tasks[0]?.area || 'N/A';
    return `- Top Issue: ${topIssue}\n- Worst Area: ${worstArea}\n- Actions: 1) Investigate top issue; 2) Reallocate resources to ${worstArea} — Total ${total} records.`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const taskSummary = tasks.map(t => ({
      type: t.taskType,
      area: t.area,
      status: t.status,
      date: t.date,
      month: t.month
    }));

    const prompt = `
      As an ISP Analyst for DKLink, analyze these records and RETURN ONLY a JSON object with the following keys: 
      { "top_issue": "short sentence", "worst_area": "short sentence", "actions": ["action 1", "action 2"] }
      Total Tasks: ${tasks.length}
      DATA:
      ${JSON.stringify(taskSummary, null, 2)}
      STRICT: Do not include any explanation outside the JSON. Output must be valid JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }]
    });

    const raw = response.text || "{}";
    // Try parsing JSON first
    try {
      const parsed = JSON.parse(raw);
      return formatStructuredAnalysis(parsed);
    } catch (e) {
      // Fallback: clean raw text and try to extract labeled parts
      const cleaned = cleanAIText(raw);
      // If cleaned already contains labels, return it; else format as plain
      if (/Top Issue:|Worst Area:|Action/i.test(cleaned)) return cleaned;
      return formatStructuredAnalysis({
        top_issue: cleaned.split('\n')[0] || 'No data',
        worst_area: cleaned.split('\n')[1] || 'N/A',
        actions: cleaned.split('\n').slice(2).filter(Boolean).slice(0,2).map(s => s.replace(/^-\s*/, ''))
      });
    }
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "SYSTEM ERROR: Analysis failed.";
  }
};

export const startAIChat = (tasks: Task[]) => {
  if (!API_KEY) {
    console.warn('No AI API key provided — returning mock chat session.');
    return {
      sendMessage: async ({ message }: { message: string }) => ({ text: `Mock reply to: ${message}` })
    } as any;
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const taskContext = tasks.map(t => ({
    id: t.userId,
    type: t.taskType,
    area: t.area,
    status: t.status,
    month: t.month
  }));

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `
        You are the DKLink ISP Strategic AI. 
        CONTEXT DATA: ${JSON.stringify(taskContext)}
        
        STRICT RULES:
        1. BE EXTREMELY BRIEF. Never use more than 3 sentences unless explicitly asked for a long list.
        2. Use bullet points for any lists.
        3. No conversational filler like "I hope this helps" or "Great question".
        4. Focus purely on data-driven answers.
      `,
    },
  });
};

function cleanAIText(text: string) {
  // Remove common markdown bold/italic markers and normalize whitespace
  let s = text || '';
  // Remove bold markers like **Top Issue:** -> Top Issue:
  s = s.replace(/\*\*(.*?)\*\*/g, '$1');
  // Remove any remaining markdown backticks or code fences
  s = s.replace(/```[\s\S]*?```/g, '');
  s = s.replace(/`([^`]*)`/g, '$1');
  // Convert markdown list markers to plain hyphen bullets
  s = s.replace(/^\s*[-*+]\s+/gm, '- ');
  // Collapse multiple newlines to max two
  s = s.replace(/\n{3,}/g, '\n\n');
  // Trim spaces on each line
  s = s.split('\n').map(l => l.trim()).join('\n');
  // Ensure there is a space after colons for readability
  s = s.replace(/:\s*/g, ': ');
  // If the AI returned everything in one line with **labels**, try to split by periods into bullets
  if (!s.includes('\n') && s.includes('. ')) {
    const parts = s.split('. ').map(p => p.trim()).filter(Boolean);
    if (parts.length > 1) s = parts.map(p => '- ' + p.replace(/\.$/, '')).join('\n');
  }
  return s.trim();
}

function formatStructuredAnalysis(obj: any) {
  const top = obj.top_issue || obj.topIssue || obj.top || 'No data';
  const worst = obj.worst_area || obj.worstArea || obj.worst || 'N/A';
  const actions = Array.isArray(obj.actions) ? obj.actions : (typeof obj.actions === 'string' ? obj.actions.split(/\s*[,;]\s*/).slice(0,2) : []);

  const lines: string[] = [];
  lines.push(`Top Issue: ${top}`);
  lines.push(`Worst Area: ${worst}`);
  lines.push(`Actions:`);
  if (actions.length === 0) {
    lines.push('1. No specific actions suggested.');
  } else {
    actions.slice(0,2).forEach((a: string, i: number) => {
      lines.push(`${i+1}. ${a}`);
    });
  }
  return lines.join('\n');
}