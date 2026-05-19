import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { AnalyzeDietBody, AnalyzeDietResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/diet/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeDietBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { query } = parsed.data;

  const prompt = `You are a clinical nutritionist. Create a comprehensive food and diet guide for someone with: "${query}".

Respond ONLY with this exact JSON structure, no markdown:
{
  "condition": "full condition name",
  "overview": "2-3 sentence explanation of how diet affects this condition and the key nutritional strategy",
  "foodsToEat": [
    {
      "name": "Food group or item",
      "reason": "Why it helps — specific benefit",
      "examples": ["specific food 1", "specific food 2", "specific food 3"],
      "emoji": "single relevant emoji",
      "impact": "high"
    }
  ],
  "foodsToAvoid": [
    {
      "name": "Food group or item",
      "reason": "Why it's harmful — specific concern",
      "examples": ["specific food 1", "specific food 2", "specific food 3"],
      "emoji": "single relevant emoji",
      "severity": "high"
    }
  ],
  "mealPlan": {
    "breakfast": ["Option A: specific meal description", "Option B: specific meal description", "Option C: specific meal description"],
    "lunch": ["Option A: specific meal description", "Option B: specific meal description", "Option C: specific meal description"],
    "dinner": ["Option A: specific meal description", "Option B: specific meal description", "Option C: specific meal description"],
    "snacks": ["Snack 1 with amount", "Snack 2 with amount", "Snack 3 with amount", "Snack 4 with amount"]
  },
  "keyNutrients": [
    {
      "name": "Nutrient name",
      "benefit": "Specific benefit for this condition",
      "sources": ["food source 1", "food source 2", "food source 3"],
      "dailyAmount": "Recommended daily amount"
    }
  ],
  "tips": [
    "Practical eating tip 1",
    "Practical eating tip 2",
    "Practical eating tip 3",
    "Practical eating tip 4",
    "Practical eating tip 5"
  ],
  "disclaimer": "This dietary advice is for informational purposes only. Always consult a registered dietitian or healthcare professional."
}

Requirements:
- foodsToEat: provide 6-8 items with impact "high", "medium", or "low"
- foodsToAvoid: provide 5-6 items with severity "high", "medium", or "low"
- keyNutrients: provide 4-6 nutrients
- Use single emojis that represent the food visually
- Be specific with examples (actual foods, not vague categories)`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 4096,
    messages: [
      { role: "system", content: "You are a clinical nutritionist providing evidence-based dietary guidance. Always respond with valid JSON only." },
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

  const result = AnalyzeDietResponse.parse({
    condition: data.condition ?? query,
    overview: data.overview ?? "",
    foodsToEat: data.foodsToEat ?? [],
    foodsToAvoid: data.foodsToAvoid ?? [],
    mealPlan: data.mealPlan ?? { breakfast: [], lunch: [], dinner: [], snacks: [] },
    keyNutrients: data.keyNutrients ?? [],
    tips: data.tips ?? [],
    disclaimer: data.disclaimer ?? "Always consult a registered dietitian or healthcare professional.",
  });

  res.json(result);
});

export default router;
