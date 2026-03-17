import { Player, ChatMessage } from '../types';
import { geminiService } from './geminiService';

/**
 * AI Agent Service
 * Plays characters when their human player is offline.
 */
export class AgentService {
 private ai = geminiService;

 /**
  * Analyze chat history to infer character personality and play style.
  */
 async generateAgentPrompt(player: Player, recentMessages: ChatMessage[]): Promise<string> {
  const playerMessages = recentMessages
   .filter(m => m.playerName === player.name || m.sender === 'player' && m.playerName === player.name)
   .slice(-10) // Last 10 actions
   .map(m => m.text);

  const prompt = `
 You are playing as **${player.name}**, a ${player.race} ${player.class}.
 
 Character Profile:
 - Stats: STR ${player.stats.str}, DEX ${player.stats.dex}, CON ${player.stats.con}, INT ${player.stats.int}, WIS ${player.stats.wis}, CHA ${player.stats.cha}
 - Vibe: ${player.description}
 
 Recent Actions (to infer style):
 ${playerMessages.join('\n')}
 
 Instructions:
 1. Stay in character. If the character is a "grumpy dwarf", act grumpy.
 2. Keep actions concise (1-2 sentences).
 3. Use the character's strengths (e.g., if high STR, prefer physical actions).
 4. If the party is in danger, act heroically (or cowardly, depending on vibe).
 
 Output ONLY the action text.
 `;

  return prompt;
 }

 /**
  * Generate an action for an offline player.
  */
 async generateAction(player: Player, recentMessages: ChatMessage[], currentScene: string): Promise<string> {
  if (!this.ai) throw new Error("AI not initialized");

  const systemPrompt = await this.generateAgentPrompt(player, recentMessages);

  const userPrompt = `
 Current Scene: ${currentScene}
 What does ${player.name} do?
 ${systemPrompt}
 `;

  try {
   const response = await this.ai.generateContent({
    model: 'gemini-2.5-flash',
    contents: userPrompt,
    config: {
     systemInstruction: "You are an AI playing a D&D character. Output ONLY the action text."
    }
   });

   return response.text?.trim() || "I cautiously move forward.";
  } catch (error) {
   console.error("Agent Action Failed", error);
   return "I hesitate, unsure of what to do.";
  }
 }
}

export const agentService = new AgentService();