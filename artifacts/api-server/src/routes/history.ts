import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, healthHistoryTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { DeleteHealthHistoryItemParams, GetHealthSummaryResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/history/summary", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const items = await db
    .select()
    .from(healthHistoryTable)
    .where(eq(healthHistoryTable.userId, req.user.id))
    .orderBy(desc(healthHistoryTable.createdAt))
    .limit(20);

  const firstName = req.user.firstName || req.user.email?.split("@")[0] || "there";

  if (items.length === 0) {
    const result = GetHealthSummaryResponse.parse({
      summary: `Hi ${firstName}! You haven't searched for any diseases, checked symptoms, or calculated your BMI yet. Start exploring Aegis Health to build your personal health history — I'll generate a personalized health summary for you once you do!`,
      insights: ["No health activity recorded yet."],
      recommendations: [
        "Try searching for a disease or condition you want to learn about.",
        "Use the symptom checker if you're feeling unwell.",
        "Calculate your BMI to get personalized diet and exercise tips.",
      ],
      generatedAt: new Date(),
    });
    res.json(result);
    return;
  }

  const historyText = items.map(item => {
    if (item.type === "disease") return `Searched for disease: "${item.query}" (${item.summary ?? ""})`;
    if (item.type === "symptom") return `Checked symptoms: "${item.query}" → ${item.summary ?? ""}`;
    if (item.type === "bmi") return `Calculated BMI: ${item.summary ?? item.query}`;
    return item.query;
  }).join("\n");

  const prompt = `You are Dr. Reyansh Mahajan, an AI health consultant. Based on this user's recent health activity, write a warm, personalized, concise health summary.

User name: ${firstName}
Recent health activity (last ${items.length} items):
${historyText}

Respond ONLY with this JSON:
{
  "summary": "2-3 sentence warm, personalized health summary addressing the user by first name. Acknowledge their health concerns and give overall guidance.",
  "insights": [
    "Specific insight 1 based on their actual searches",
    "Specific insight 2 based on their actual searches",
    "Specific insight 3 based on their actual searches"
  ],
  "recommendations": [
    "Personalized recommendation 1",
    "Personalized recommendation 2",
    "Personalized recommendation 3"
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 1024,
    messages: [
      { role: "system", content: "You are Dr. Reyansh Mahajan, a caring AI health consultant. Respond only with valid JSON." },
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

  const result = GetHealthSummaryResponse.parse({
    summary: data.summary ?? `Hi ${firstName}! Here's a summary of your recent health activity.`,
    insights: data.insights ?? [],
    recommendations: data.recommendations ?? [],
    generatedAt: new Date(),
  });

  res.json(result);
});

router.get("/history", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const items = await db
    .select()
    .from(healthHistoryTable)
    .where(eq(healthHistoryTable.userId, req.user.id))
    .orderBy(desc(healthHistoryTable.createdAt))
    .limit(100);

  res.json(items);
});

router.delete("/history/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = DeleteHealthHistoryItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(healthHistoryTable)
    .where(
      and(
        eq(healthHistoryTable.id, params.data.id),
        eq(healthHistoryTable.userId, req.user.id),
      ),
    )
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "History item not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
