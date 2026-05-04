import { GoogleGenAI } from "@google/genai";
import { Profile, PhDPosition, CareerInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeMatch(profile: Profile, job: PhDPosition) {
  const prompt = `
    Analyze the fit between this PhD applicant and a PhD/RA position.
    
    Applicant Profile:
    - Name: ${profile.name}
    - Education: ${JSON.stringify(profile.education)}
    - Skills: ${profile.skills.join(", ")}
    - Interests: ${profile.interests.join(", ")}
    - Bio: ${profile.bio}
    
    Position Details:
    - Title: ${job.title}
    - University: ${job.university}
    - Description: ${job.description}
    
    Return a JSON object with:
    1. matchScore: 0-100
    2. detailedAnalysis: Short paragraph explaining why it's a good/bad match and what's missing.
    3. suggestion: One action to improve the application.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return { matchScore: 50, detailedAnalysis: "Analysis unavailable.", suggestion: "Directly check the university website." };
  }
}

export async function getMarketTrends(field: string = "Computer Science in Europe") {
  const prompt = `
    Analyze the current job market trends and skill demands for ${field} for PhD/RA level candidates.
    Specifically focus on Europe.
    
    Return a JSON object with:
    1. marketTrend: Current mood (e.g., "High Growth in Human-Centered AI")
    2. inDemandSkills: Array of 5 trending skills or research areas.
    3. guidance: Strategic career advice for someone looking for academia or industry research roles.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}") as CareerInsight;
  } catch (error) {
    console.error("Gemini Trends Error:", error);
    return null;
  }
}
