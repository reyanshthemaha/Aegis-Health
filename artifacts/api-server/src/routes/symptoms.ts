import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db, healthHistoryTable } from "@workspace/db";
import { CheckSymptomsBody, CheckSymptomsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/symptoms/check", async (req, res): Promise<void> => {
  const parsed = CheckSymptomsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { symptoms, additionalInfo } = parsed.data;

  const prompt = `A patient is experiencing the following symptoms: ${symptoms.join(", ")}.${additionalInfo ? ` Additional context: ${additionalInfo}` : ""}

Analyze these symptoms and provide possible conditions in JSON format:
{
  "possibleConditions": [
    {
      "name": "condition name",
      "probability": "low/moderate/high",
      "description": "brief description of condition",
      "nextSteps": ["step 1", "step 2", "step 3"]
    }
  ],
  "urgencyLevel": "low/medium/high/emergency",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "disclaimer": "This is not a medical diagnosis. Please consult a healthcare professional."
}
Provide 2-4 possible conditions ordered by probability. Respond with ONLY the JSON, no markdown.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content: "You are a medical triage assistant. Analyze symptoms and suggest possible conditions with appropriate urgency levels. Always emphasize consulting a doctor.",
      },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  let data;
  try {
    data = JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    data = match ? JSON.parse(match[0]) : {};
  }

  const result = CheckSymptomsResponse.parse({
    possibleConditions: data.possibleConditions ?? [],
    urgencyLevel: data.urgencyLevel ?? "medium",
    recommendations: data.recommendations ?? [],
    disclaimer: data.disclaimer ?? "This is not a medical diagnosis. Please consult a healthcare professional.",
  });

  if (req.isAuthenticated()) {
    const topConditions = result.possibleConditions.slice(0, 2).map(c => c.name).join(", ");
    db.insert(healthHistoryTable).values({
      userId: req.user.id,
      type: "symptom",
      query: symptoms.join(", "),
      summary: `Possible: ${topConditions} · ${result.urgencyLevel} urgency`,
      resultJson: result as unknown as Record<string, unknown>,
    }).catch(() => {});
  }

  res.json(result);
});

export default router;
