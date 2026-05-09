import { GoogleGenerativeAI } from '@google/generative-ai'

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite'

const SYSTEM_PROMPT = `You are an elite frontend developer and product designer.
Given a business requirement, produce two things:

1. A concise 3-5 bullet plan/spec describing what you will build.
2. A complete, polished, single-file HTML prototype.

HTML rules:
- Fully self-contained: inline CSS + JS, no external files.
- You MAY load libraries via CDN: Tailwind CSS, Alpine.js, Chart.js, Lucide icons,
  or any other lightweight library that needs no build step.
- Design must be modern, clean, and professional — think Linear, Notion, or Vercel
  design quality. Use good typography, whitespace, and a consistent colour palette.
- Fill every component with realistic, domain-appropriate dummy data so the
  prototype feels like a real product, not a skeleton.
- All interactions — filters, modals, tabs, dropdowns, charts — must work
  fully client-side with no backend.
- Must be responsive and look great on both desktop and mobile.

Return your response in EXACTLY this format, with no text outside the tags:

<plan>
• bullet 1
• bullet 2
• bullet 3
</plan>
<prototype>
<!DOCTYPE html>
...complete HTML file...
</prototype>`

export async function generatePrototype(
  title: string,
  description: string,
  updateRequest?: string
): Promise<{ plan: string; html: string }> {
  const model = genai.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_PROMPT,
  })

  const prompt = updateRequest
    ? `Original requirement title: ${title}\n\nOriginal details:\n${description || '(none)'}\n\nUpdate request:\n${updateRequest}\n\nGenerate an updated plan and fully updated prototype.`
    : `Requirement title: ${title}\n\nRequirement details:\n${description || '(No details provided.)'}\n\nGenerate the plan and prototype now.`

  const result = await model.generateContent(prompt)
  const text = result.response.text()

  const planMatch = text.match(/<plan>([\s\S]*?)<\/plan>/)
  const protoMatch = text.match(/<prototype>([\s\S]*?)<\/prototype>/)

  const plan = planMatch?.[1].trim() ?? '_Plan not generated._'
  const html = protoMatch?.[1].trim() ??
    '<!DOCTYPE html><html><body><h1>Error: prototype not generated.</h1></body></html>'

  return { plan, html }
}

export async function patchPrototype(
  currentHtml: string,
  userRequest: string
): Promise<{ html: string; summary: string }> {
  const model = genai.getGenerativeModel({
    model: MODEL,
    systemInstruction: `You are editing an existing single-file HTML prototype.
Apply the user's requested change precisely and return the complete updated HTML file.
Rules:
- Return ONLY the raw HTML — no markdown, no code fences, no explanation.
- The file must start with <!DOCTYPE html> and be fully self-contained.
- Only change what was asked. Do not redesign or restructure unrelated parts.
- After the HTML, add exactly one line starting with SUMMARY: describing what you changed in plain English (max 12 words).`,
  })

  const prompt = `Current HTML:\n${currentHtml}\n\nRequested change: ${userRequest}`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()

  // Split off the SUMMARY line
  const summaryMatch = text.match(/SUMMARY:\s*(.+)$/m)
  const summary = summaryMatch?.[1].trim() ?? 'Change applied.'
  const html = text.replace(/\nSUMMARY:.*$/m, '').trim()
    .replace(/^```html\n?/, '').replace(/\n?```$/, '').trim()

  return { html, summary }
}
