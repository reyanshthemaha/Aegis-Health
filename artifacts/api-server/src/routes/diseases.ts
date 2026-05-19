import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db, healthHistoryTable } from "@workspace/db";
import {
  AnalyzeDiseaseBody,
  AnalyzeDiseaseResponse,
  GetPopularDiseasesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const POPULAR_DISEASES = [
  { name: "Diabetes", category: "Metabolic", description: "A chronic condition affecting blood sugar regulation" },
  { name: "Hypertension", category: "Cardiovascular", description: "High blood pressure affecting heart and arteries" },
  { name: "Asthma", category: "Respiratory", description: "Chronic inflammation of the airways" },
  { name: "Arthritis", category: "Musculoskeletal", description: "Joint inflammation causing pain and stiffness" },
  { name: "Migraine", category: "Neurological", description: "Severe recurring headaches with sensory disturbances" },
  { name: "Anemia", category: "Blood", description: "Deficiency in red blood cells or hemoglobin" },
  { name: "Thyroid", category: "Endocrine", description: "Thyroid gland dysfunction affecting metabolism" },
  { name: "GERD", category: "Digestive", description: "Chronic acid reflux affecting the esophagus" },
  { name: "Eczema", category: "Skin", description: "Inflammatory skin condition causing itching and rashes" },
  { name: "Depression", category: "Mental Health", description: "Mood disorder causing persistent sadness and loss of interest" },
  { name: "Psoriasis", category: "Skin", description: "Autoimmune condition causing rapid skin cell buildup" },
  { name: "PCOS", category: "Endocrine", description: "Hormonal disorder affecting women of reproductive age" },
];

router.get("/diseases/popular", async (_req, res): Promise<void> => {
  res.json(GetPopularDiseasesResponse.parse(POPULAR_DISEASES));
});

router.post("/diseases/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeDiseaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { query, imageBase64, imagesBase64 } = parsed.data;

  const allImages: string[] = [];
  if (imagesBase64 && imagesBase64.length > 0) {
    allImages.push(...imagesBase64);
  } else if (imageBase64) {
    allImages.push(imageBase64);
  }

  const hasImages = allImages.length > 0;

  type MessageContent = string | Array<{ type: string; text?: string; image_url?: { url: string } }>;

  const imageDescLabel = hasImages
    ? `${allImages.length} medical image${allImages.length > 1 ? "s" : ""} (could include prescriptions, lab results, skin conditions, or other medical photos)`
    : null;

  const userContent: MessageContent = hasImages
    ? [
        {
          type: "text",
          text: `Analyze ${imageDescLabel} and the following condition/query: "${query}". 
If the images are prescriptions or lab reports, extract and consider all relevant medical details from them.
Provide a comprehensive health guide in JSON format matching this exact structure:
{
  "name": "full condition name",
  "overview": "clear 2-3 sentence overview",
  "causes": ["cause1", "cause2", "cause3", "cause4", "cause5"],
  "symptoms": ["symptom1", "symptom2", "symptom3", "symptom4", "symptom5"],
  "foodsToEat": ["food1", "food2", "food3", "food4", "food5"],
  "foodsToAvoid": ["food1", "food2", "food3", "food4"],
  "medicines": [
    {"name": "medicine name", "dosage": "e.g., 500mg tablet twice daily OR 5ml syrup three times daily — always include amount in mg/ml/mcg and frequency", "purpose": "what it treats", "type": "OTC", "warnings": "key warnings"},
    {"name": "another medicine", "dosage": "e.g., 10mg capsule once daily OR 2.5ml suspension twice daily", "purpose": "what it treats", "type": "prescription", "warnings": "key warnings"}
  ],
  "treatments": [
    {"name": "treatment name", "type": "medical", "description": "brief description"},
    {"name": "lifestyle change", "type": "lifestyle", "description": "brief description"},
    {"name": "dietary approach", "type": "diet", "description": "brief description"},
    {"name": "natural remedy", "type": "natural", "description": "brief description"}
  ],
  "earlyDetection": ["warning sign 1", "warning sign 2", "warning sign 3", "risk factor 1"],
  "urgencyLevel": "low/medium/high",
  "disclaimer": "Always consult a qualified healthcare professional for diagnosis and treatment."
}
Respond with ONLY the JSON object, no markdown or extra text.`,
        },
        ...allImages.map((img) => ({
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${img}` },
        })),
      ]
    : `Analyze the following medical condition: "${query}". Provide a comprehensive health guide in JSON format matching this exact structure:
{
  "name": "full condition name",
  "overview": "clear 2-3 sentence overview",
  "causes": ["cause1", "cause2", "cause3", "cause4", "cause5"],
  "symptoms": ["symptom1", "symptom2", "symptom3", "symptom4", "symptom5"],
  "foodsToEat": ["food1", "food2", "food3", "food4", "food5"],
  "foodsToAvoid": ["food1", "food2", "food3", "food4"],
  "medicines": [
    {"name": "medicine name", "dosage": "e.g., 500mg tablet twice daily OR 5ml syrup three times daily — always include amount in mg/ml/mcg and frequency", "purpose": "what it treats", "type": "OTC", "warnings": "key warnings"},
    {"name": "another medicine", "dosage": "e.g., 10mg capsule once daily OR 2.5ml suspension twice daily", "purpose": "what it treats", "type": "prescription", "warnings": "key warnings"}
  ],
  "treatments": [
    {"name": "treatment name", "type": "medical", "description": "brief description"},
    {"name": "lifestyle change", "type": "lifestyle", "description": "brief description"},
    {"name": "dietary approach", "type": "diet", "description": "brief description"},
    {"name": "natural remedy", "type": "natural", "description": "brief description"}
  ],
  "earlyDetection": ["warning sign 1", "warning sign 2", "warning sign 3", "risk factor 1"],
  "urgencyLevel": "low/medium/high",
  "disclaimer": "Always consult a qualified healthcare professional for diagnosis and treatment."
}
Respond with ONLY the JSON object, no markdown or extra text.`;

  const messages: Array<{ role: "system" | "user"; content: MessageContent }> = [
    {
      role: "system",
      content: `You are a medical information assistant. Provide comprehensive, accurate information about diseases and conditions in a structured JSON format. Always include a disclaimer to consult healthcare professionals. Be thorough but use plain language accessible to the general public. When analyzing medical images, extract all relevant information visible in them.`,
    },
    {
      role: "user",
      content: userContent,
    },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 8192,
    // @ts-expect-error messages type mismatch with image content
    messages,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  let parsed2;
  try {
    parsed2 = JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    parsed2 = match ? JSON.parse(match[0]) : {};
  }

  const result = AnalyzeDiseaseResponse.parse({
    name: parsed2.name ?? query,
    overview: parsed2.overview ?? "",
    causes: parsed2.causes ?? [],
    symptoms: parsed2.symptoms ?? [],
    foodsToEat: parsed2.foodsToEat ?? [],
    foodsToAvoid: parsed2.foodsToAvoid ?? [],
    medicines: parsed2.medicines ?? [],
    treatments: parsed2.treatments ?? [],
    earlyDetection: parsed2.earlyDetection ?? [],
    urgencyLevel: parsed2.urgencyLevel ?? "medium",
    disclaimer: parsed2.disclaimer ?? "Always consult a qualified healthcare professional.",
  });

  if (req.isAuthenticated()) {
    db.insert(healthHistoryTable).values({
      userId: req.user.id,
      type: "disease",
      query,
      summary: `${result.name} · ${result.urgencyLevel} urgency · ${result.symptoms.slice(0, 2).join(", ")}`,
      resultJson: result as unknown as Record<string, unknown>,
    }).catch(() => {});
  }

  res.json(result);
});

export default router;
