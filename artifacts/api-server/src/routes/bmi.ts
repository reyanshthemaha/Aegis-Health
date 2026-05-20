import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db, healthHistoryTable } from "@workspace/db";
import { CalculateBmiBody, CalculateBmiResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function getBmiCategory(bmi: number): { category: string; riskLevel: string } {
  if (bmi < 18.5) return { category: "Underweight", riskLevel: "Moderate risk of nutritional deficiencies" };
  if (bmi < 25) return { category: "Normal weight", riskLevel: "Low risk — healthy range" };
  if (bmi < 30) return { category: "Overweight", riskLevel: "Moderate risk of chronic diseases" };
  if (bmi < 35) return { category: "Obese (Class I)", riskLevel: "High risk of metabolic disorders" };
  if (bmi < 40) return { category: "Obese (Class II)", riskLevel: "Very high risk — medical attention recommended" };
  return { category: "Obese (Class III)", riskLevel: "Extremely high risk — immediate medical attention recommended" };
}

router.post("/bmi/calculate", async (req, res): Promise<void> => {
  const parsed = CalculateBmiBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { weight, height, age, gender } = parsed.data;

  const heightM = height / 100;
  const bmi = Math.round((weight / (heightM * heightM)) * 10) / 10;
  const { category, riskLevel } = getBmiCategory(bmi);

  const prompt = `A person with BMI ${bmi} (${category}) is ${age ? `${age} years old` : "of unspecified age"}${gender ? `, ${gender}` : ""}. Weight: ${weight}kg, Height: ${height}cm.

Provide personalized health advice in JSON:
{
  "advice": "2-3 sentence personalized health assessment and motivation",
  "dietTips": ["specific diet tip 1", "specific diet tip 2", "specific diet tip 3", "specific diet tip 4"],
  "exerciseTips": ["specific exercise tip 1", "specific exercise tip 2", "specific exercise tip 3", "specific exercise tip 4"]
}
Respond with ONLY the JSON, no markdown.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 2048,
    messages: [
      {
        role: "system",
        content: "You are a health and wellness advisor. Provide encouraging, practical, and personalized health advice based on BMI data.",
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

  const result = CalculateBmiResponse.parse({
    bmi,
    category,
    riskLevel,
    advice: data.advice ?? `Your BMI is ${bmi}, classified as ${category}.`,
    dietTips: data.dietTips ?? [],
    exerciseTips: data.exerciseTips ?? [],
  });

  if (req.isAuthenticated()) {
    db.insert(healthHistoryTable).values({
      userId: req.user.id,
      type: "bmi",
      query: `${weight}kg / ${height}cm`,
      summary: `BMI ${bmi} · ${category} · ${weight}kg ${height}cm`,
      resultJson: result as unknown as Record<string, unknown>,
    }).catch(() => {});
  }

  res.json(result);
});

export default router;
