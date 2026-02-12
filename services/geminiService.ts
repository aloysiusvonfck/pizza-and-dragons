import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Campaign, Player } from "../types";

const SYSTEM_INSTRUCTION = `
You are the DIRECTOR of "Pizza & Dragons: The Movie". 
This is NOT a slow-paced text adventure. This is a HIGH-OCTANE MONTAGE of a D&D campaign.

Your Goal: Guide the party through 3 Action Scenes and 1 Finale at a Pizza Place.

Format Rules:
1. **Scene Setup**: Start with "SCENE [N]: [LOCATION NAME]". Describe a high-stakes situation.
2. **Resolution**: When players act, describe the outcome in SLOW MOTION/CINEMATIC detail.
3. **Loot**: If they succeed, award "Pizza Loot" (Toppings/Sides) using "INVENTORY_UPDATE: [Item]".
4. **Transition**: End resolutions with "CUT TO BLACK." to signal the scene is over.
5. **Finale (Scene 4)**: The party arrives at a REAL WORLD Pizza Tavern. You MUST use 'googleMaps' to find a real pizza place.

Tone: Action Movie Trailer meets D&D. Epic, loud, slightly ridiculous.
`;

export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private chatSession: any = null;

  initialize(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  // New: Pre-generate the entire branching story
  async generateFullCampaign(theme: string): Promise<Campaign> {
    if (!this.ai) throw new Error("AI not initialized");

    const prompt = `
    Create a funny, high-stakes D&D campaign outline about a quest for the "Ultimate Pizza Ingredient".
    
    THEME: ${theme} (Strictly adhere to this genre/style).
    
    Structure the response as a valid JSON object with the following schema:
    {
      "title": "Campaign Title",
      "intro": "A cinematic movie-trailer style introduction text.",
      "startSceneId": "scene_1",
      "scenes": [
        {
          "id": "scene_1",
          "title": "Scene Title",
          "description": "Description of the conflict.",
          "encounterType": "COMBAT" | "PUZZLE" | "SOCIAL" | "FINALE",
          "reward": "Pepperoni" (Optional loot),
          "options": [
             { "text": "Choice A", "nextSceneId": "scene_2a" },
             { "text": "Choice B", "nextSceneId": "scene_2b" }
          ]
        },
        ... (Create at least 4 scenes with branching paths. Scene 4 MUST be the FINALE)
      ]
    }
    
    Ensure the story has at least 2 branches that converge at the Finale.
    `;

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const jsonText = response.text || "{}";
      const rawData = JSON.parse(jsonText);
      
      // Transform array to record map for easier lookup
      const sceneMap: Record<string, any> = {};
      if (rawData.scenes && Array.isArray(rawData.scenes)) {
        rawData.scenes.forEach((s: any) => {
          sceneMap[s.id] = s;
        });
      }

      return {
        title: rawData.title || "The Mystery Quest",
        intro: rawData.intro || "The adventure begins...",
        startSceneId: rawData.startSceneId || "scene_1",
        scenes: sceneMap
      };

    } catch (error) {
      console.error("Campaign Gen Error", error);
      // Fallback campaign
      return {
        title: "Quest for the Lost Slice",
        intro: "In a world without yeast...",
        startSceneId: "1",
        scenes: {
          "1": {
            id: "1", title: "The Dough Cave", description: "It's sticky.", encounterType: "COMBAT",
            options: [{ text: "Fight", nextSceneId: "finale" }]
          },
          "finale": {
            id: "finale", title: "Pizza Hut", description: "You made it.", encounterType: "FINALE",
            options: []
          }
        }
      };
    }
  }

  async startMovie(players: Player[], location?: { lat: number; lng: number }): Promise<string> {
    if (!this.ai) throw new Error("AI not initialized");

    const castList = players.map(p => 
      `${p.name} (Lvl 1 ${p.race} ${p.class}, Age ${p.age}). 
       Stats: [STR:${p.stats.str} DEX:${p.stats.dex} CON:${p.stats.con} INT:${p.stats.int} WIS:${p.stats.wis} CHA:${p.stats.cha}]. 
       Vibe: ${p.description}`
    ).join("\n");

    const prompt = `
    ACT 1. INTRO.
    The Cast:
    ${castList}
    
    ${location ? `Filming Location: Lat ${location.lat}, Lng ${location.lng}` : "Filming on a Soundstage."}
    
    Give us an epic movie trailer voice intro establishing the quest.
    `;

    try {
      this.chatSession = this.ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleMaps: {} }],
        },
        history: [],
      });

      const response: GenerateContentResponse = await this.chatSession.sendMessage({
        message: prompt
      });

      return response.text || "The Director is silent...";
    } catch (error) {
      console.error("Director Error:", error);
      return "Production Error. Please check API Key.";
    }
  }

  async resolveActionAndCut(actionText: string, partyLevel: number, location?: { lat: number; lng: number }): Promise<{ text: string; groundingMetadata?: any }> {
    if (!this.chatSession) throw new Error("Production not started");

    const prompt = `
    ACTION!
    The party (Current Level: ${partyLevel}) does this: "${actionText}".
    
    1. Resolve this action cinematically. Did they succeed? (Assume yes if it's cool, they are the heroes).
    2. Reward a pizza topping if appropriate.
    3. End with "CUT TO BLACK."
    `;

    const finalPrompt = location ? `(Location Context: ${location.lat}, ${location.lng}) ${prompt}` : prompt;

    try {
      const response: GenerateContentResponse = await this.chatSession.sendMessage({
        message: finalPrompt
      });
      return {
        text: response.text || "Cut!",
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
      };
    } catch (error) {
      return { text: "Scene failed to render." };
    }
  }

  async generateNextScene(sceneIndex: number, location?: { lat: number; lng: number }): Promise<string> {
    if (!this.chatSession) throw new Error("Production not started");

    let prompt = "";
    if (sceneIndex === 2) {
      prompt = "SCENE 2: THE MIDPOINT. High stakes! Set the scene!";
    } else if (sceneIndex === 3) {
      prompt = "SCENE 3: THE CLIMAX. Boss fight! Set the scene!";
    } else if (sceneIndex >= 4) {
      prompt = `
      SCENE 4: THE TAVERN (FINALE).
      The party has found the legendary pizza place.
      Use the googleMaps tool to find the best real-world pizza place near the provided location.
      Describe them entering this real place to bake their loot.
      `;
    }

    if (location) {
      prompt = `(Location: ${location.lat}, ${location.lng}) ${prompt}`;
    }

    try {
      const response: GenerateContentResponse = await this.chatSession.sendMessage({
        message: prompt
      });
      return response.text || "Scene missing...";
    } catch (error) {
      return "Script missing.";
    }
  }

  // --- MONTAGE LOGIC ---

  async getMontageSituation(playerName: string, characterClass: string): Promise<{ text: string, options: string[] }> {
    if (!this.chatSession) throw new Error("Production not started");

    const prompt = `
    MONTAGE SEQUENCE. 
    Focus on ${playerName} (Class: ${characterClass}).
    They encounter a brief, weird situation while traveling.
    
    Output strictly in this format:
    SITUATION: [A 1-2 sentence description]
    OPTION_A: [Action 1]
    OPTION_B: [Action 2]
    OPTION_C: [Action 3]
    `;

    try {
      const response: GenerateContentResponse = await this.chatSession.sendMessage({
        message: prompt
      });
      const text = response.text || "";
      
      // Parse output
      const situationMatch = text.match(/SITUATION:\s*(.+)/);
      const options = [];
      const optionRegex = /OPTION_[A-C]:\s*(.+)/g;
      let match;
      while ((match = optionRegex.exec(text)) !== null) {
        options.push(match[1]);
      }

      return {
        text: situationMatch ? situationMatch[1] : "A strange fog rolls in...",
        options: options.length > 0 ? options : ["Press On", "Investigate", "Rest"]
      };
    } catch (error) {
      return { text: "The film reel jams...", options: ["Hit it", "Kick it"] };
    }
  }

  async resolveMontageChoice(playerName: string, choice: string): Promise<string> {
    if (!this.chatSession) throw new Error("Production not started");

    const prompt = `
    ${playerName} chose: "${choice}".
    Briefly describe the outcome (funny or cool) in 1 sentence.
    Reward an item if it fits.
    `;

    try {
      const response: GenerateContentResponse = await this.chatSession.sendMessage({
        message: prompt
      });
      return response.text || "Action resolved.";
    } catch (error) {
      return "Something happened.";
    }
  }
}

export const geminiService = new GeminiService();