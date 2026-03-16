# Pizza & Dragons - User Stories & Gap Analysis

**Project:** Pizza & Dragons (Multiplayer AI Dungeon Master RPG)  
**Last Audit:** 2026-03-15  
**Status:** Local ↔ GitHub ✅ Synced

---

## Executive Summary

Pizza & Dragons is a **browser-based multiplayer RPG** where an AI Dungeon Master (Gemini) guides players through a high-octane "movie montage" campaign. The quest culminates in ordering a real pizza, with toppings earned as in-game loot. Real-world geolocation is used to find the final tavern (pizza place).

**Core Features Implemented:**
- ✅ Character creation (race, class, stats, description)
- ✅ Multiplayer networking (PeerJS P2P)
- ✅ AI Dungeon Master (Gemini 2.5 Flash)
- ✅ Cinematic story mode (scene-by-scene progression)
- ✅ Montage mode (mini-game + decision-making)
- ✅ Inventory system (pizza toppings as loot)
- ✅ Real-world geolocation integration
- ✅ Order summary with contribution-based billing
- ✅ Gothic/D&D-themed UI with animations

**Critical Gaps Identified:**
1. ❌ **No persistent storage** (game state lost on refresh)
2. ❌ **No authentication** (anyone can join with a room ID)
3. ❌ **No mobile optimization** (geolocation permissions not handled gracefully)
4. ❌ **No error recovery** (API failures crash the flow)
5. ❌ **No campaign saving/sharing** (cannot resume or replay campaigns)
6. ❌ **No host migration** (if host leaves, game dies)
7. ❌ **No rate limiting** (API abuse possible)
8. ❌ **No accessibility** (keyboard navigation, screen readers)

---

## User Stories by Epic

### Epic 1: Character Creation & Onboarding

| ID | User Story | Priority | Status | Notes |
|----|------------|----------|--------|-------|
| US-1.1 | As a player, I want to create a character with a name, race, class, age, stats, and description so I can customize my hero. | P0 | ✅ Done | Full implementation in `Lobby.tsx` |
| US-1.2 | As a player, I want to roll stats (4d6 drop lowest) with a visual animation so I feel the excitement of character creation. | P0 | ✅ Done | Animated rolling + final 4d6 logic |
| US-1.3 | As a player, I want to preview my character card before joining so I can verify my choices. | P0 | ✅ Done | `CharacterCard` component in Lobby |
| US-1.4 | As a player, I want to edit my character after creation but before joining so I can fix mistakes. | P0 | ✅ Done | "Edit Hero" button in Connection step |
| US-1.5 | As a player, I want to see a list of available classes with descriptions and stat requirements so I can choose wisely. | P0 | ✅ Done | `ClassSelector` with 5 classes |
| US-1.6 | As a player, I want to see a list of available races with stat bonuses so I can optimize my build. | P0 | ✅ Done | 8 races with bonuses displayed |
| US-1.7 | As a player, I want to generate a random character quickly so I can jump into the game. | P1 | ❌ Missing | No "Randomize" button for full character |
| US-1.8 | As a player, I want to save my character profile so I can reuse it in future games. | P2 | ❌ Missing | No localStorage or backend storage |

### Epic 2: Multiplayer & Networking

| ID | User Story | Priority | Status | Notes |
|----|------------|----------|--------|-------|
| US-2.1 | As a host, I want to create a game room and get a unique room ID so I can invite friends. | P0 | ✅ Done | PeerJS host + room ID display |
| US-2.2 | As a player, I want to join a game room using a room ID so I can play with friends. | P0 | ✅ Done | `joinGame` function + input field |
| US-2.3 | As a player, I want to see who else is in the party before starting so I know my teammates. | P0 | ✅ Done | Party list in host wait screen |
| US-2.4 | As a player, I want to see my connection status so I know if I'm online. | P1 | ⚠️ Partial | `connected` state exists but no UI indicator |
| US-2.5 | As a player, I want to be notified when someone joins or leaves so I know the party status. | P1 | ❌ Missing | No join/leave system messages |
| US-2.6 | As a host, I want to kick a player who is disrupting the game so I can maintain order. | P2 | ❌ Missing | No player management UI |
| US-2.7 | As a player, I want to leave the game gracefully so I can exit without breaking the session. | P1 | ❌ Missing | No "Leave Game" button |
| US-2.8 | As a host, I want to migrate to a new host if the current host leaves so the game can continue. | P2 | ❌ Missing | No host migration logic |
| US-2.9 | As a player, I want to reconnect if my connection drops so I don't lose progress. | P2 | ❌ Missing | No reconnection logic |

### Epic 3: Campaign Generation & Story Engine

| ID | User Story | Priority | Status | Notes |
|----|------------|----------|--------|-------|
| US-3.1 | As a host, I want to select a campaign theme (e.g., Cyberpunk, Eldritch Horror) so the story matches my preference. | P0 | ✅ Done | Theme dropdown in Lobby |
| US-3.2 | As a host, I want the AI to generate a full campaign outline before starting so I know the story arc. | P0 | ✅ Done | `generateFullCampaign` + pre-gen |
| US-3.3 | As a player, I want to see the campaign title and intro so I understand the premise. | P0 | ✅ Done | Shown in host wait screen |
| US-3.4 | As a player, I want the AI to narrate scenes cinematically (movie trailer style) so it feels epic. | P0 | ✅ Done | System instruction enforces tone |
| US-3.5 | As a player, I want to make choices that affect the story so my actions matter. | P0 | ✅ Done | Branching scenes + montage decisions |
| US-3.6 | As a player, I want the AI to use my character's class/race in responses so I feel immersed. | P1 | ✅ Done | Character data passed to AI |
| US-3.7 | As a player, I want to see dice roll results (d20) so I know if I succeeded. | P0 | ✅ Done | Dice rolls shown in chat |
| US-3.8 | As a player, I want critical successes (20) and failures (1) to be visually highlighted so they stand out. | P1 | ✅ Done | Gold/red coloring for 20/1 |
| US-3.9 | As a host, I want to manually override the AI's story decisions so I can fix errors. | P2 | ❌ Missing | No DM controls |
| US-3.10 | As a player, I want the story to adapt to my character's stats (e.g., high STR = combat bonus) so builds matter. | P1 | ⚠️ Partial | Level boosts rolls, but stats not used in story logic |

### Epic 4: Gameplay Modes (Cinematic & Montage)

| ID | User Story | Priority | Status | Notes |
|----|------------|----------|--------|-------|
| US-4.1 | As a player, I want to alternate between Cinematic mode (story) and Montage mode (mini-games) so the pacing varies. | P0 | ✅ Done | Mode switching in `GameContext` |
| US-4.2 | As a player, I want to type actions in Cinematic mode so I can interact with the story. | P0 | ✅ Done | Chat input + `sendPlayerAction` |
| US-4.3 | As a player, I want to play a timing-based mini-game in Montage mode so I can earn levels. | P0 | ✅ Done | `MontageMinigame` (rune casting) |
| US-4.4 | As a player, I want to make choices for my character in Montage mode so I influence the outcome. | P0 | ✅ Done | `MontageDecision` overlay |
| US-4.5 | As a player, I want to see whose turn it is in Montage mode so I know when to act. | P0 | ✅ Done | Active player highlighted |
| US-4.6 | As a player, I want to level up after successful mini-games so I feel progression. | P0 | ✅ Done | Level +1 on minigame success |
| US-4.7 | As a player, I want to see a loading indicator while the AI is thinking so I know the game isn't frozen. | P0 | ✅ Done | "The Fates are Weaving..." spinner |
| US-4.8 | As a player, I want to skip my turn in Montage mode so I can pass if I don't have a good idea. | P2 | ❌ Missing | No "Pass" option |
| US-4.9 | As a player, I want to replay the mini-game if I fail so I can try again. | P2 | ❌ Missing | Minigame ends after 3 attempts |

### Epic 5: Inventory & Pizza System

| ID | User Story | Priority | Status | Notes |
|----|------------|----------|--------|-------|
| US-5.1 | As a player, I want to earn pizza toppings as loot when I succeed in actions so I can build my pizza. | P0 | ✅ Done | `INVENTORY_UPDATE` parsing |
| US-5.2 | As a player, I want to see my current pizza order (toppings, size, crust) so I know what I've earned. | P0 | ✅ Done | Sidebar "Loot Stash" |
| US-5.3 | As a player, I want the AI to reward appropriate toppings based on my actions so it feels thematic. | P0 | ✅ Done | AI instructed to reward toppings |
| US-5.4 | As a player, I want to see the gold cost of my pizza so I know the bill. | P0 | ✅ Done | `OrderSummary` calculates total |
| US-5.5 | As a player, I want to see a breakdown of who contributed what so I know my share of the bill. | P0 | ✅ Done | Pie chart + contribution split |
| US-5.6 | As a player, I want to customize pizza size and crust so I can tailor the order. | P1 | ⚠️ Partial | Hardcoded to "Large / Hand Tossed" |
| US-5.7 | As a player, I want to earn sides (drinks, garlic knots) as loot so the order is complete. | P1 | ⚠️ Partial | `sides` array exists but not used |
| US-5.8 | As a player, I want to see real-world pricing so the bill feels authentic. | P1 | ✅ Done | `formatCurrency` with USD |
| US-5.9 | As a player, I want to export my pizza order so I can actually order it. | P2 | ❌ Missing | No export to delivery app |

### Epic 6: Geolocation & Real-World Integration

| ID | User Story | Priority | Status | Notes |
|----|------------|----------|--------|-------|
| US-6.1 | As a host, I want to use my real-world location to find the final pizza tavern so it's accessible. | P0 | ✅ Done | `getGeoLocation` + Google Maps tool |
| US-6.2 | As a player, I want the AI to search for real pizza places near me so I can visit after the game. | P0 | ✅ Done | `googleMaps` tool in Gemini |
| US-6.3 | As a player, I want to see the pizza place's name, address, and link so I can find it. | P0 | ✅ Done | Grounding metadata shown in chat |
| US-6.4 | As a player, I want to deny location permissions gracefully so the game still works (fallback). | P1 | ⚠️ Partial | Returns `undefined`, but no user-friendly fallback message |
| US-6.5 | As a player, I want to manually enter a location if I don't want to share GPS so I have privacy control. | P2 | ❌ Missing | No manual location input |
| US-6.6 | As a player, I want to see the pizza place's reviews/rating so I know it's good. | P2 | ⚠️ Partial | `reviewSnippets` in metadata but not displayed |

### Epic 7: End Game & Summary

| ID | User Story | Priority | Status | Notes |
|----|------------|----------|--------|-------|
| US-7.1 | As a host, I want to end the game when the party reaches the finale so we can see the summary. | P0 | ✅ Done | "End Session" button (host only) |
| US-7.2 | As a player, I want to see a final receipt showing the pizza order and total cost so I know what to pay. | P0 | ✅ Done | `OrderSummary` scroll receipt |
| US-7.3 | As a player, I want to see a contribution chart (pie chart) so I know who did the most. | P0 | ✅ Done | Recharts pie chart |
| US-7.4 | As a player, I want to see how much each player owes so we can split the bill fairly. | P0 | ✅ Done | Individual share calculation |
| US-7.5 | As a player, I want to start a new game from the summary screen so we can replay. | P0 | ✅ Done | "Return to Tavern" button |
| US-7.6 | As a player, I want to save a screenshot of the final bill so I can remember it. | P2 | ❌ Missing | No screenshot/download feature |
| US-7.7 | As a player, I want to share the campaign summary with friends who didn't play so they can see what happened. | P2 | ❌ Missing | No share/export feature |

### Epic 8: UI/UX & Polish

| ID | User Story | Priority | Status | Notes |
|----|------------|----------|--------|-------|
| US-8.1 | As a player, I want a dark, gothic D&D-themed UI so it feels immersive. | P0 | ✅ Done | GothicCard, embers, Cinzel font |
| US-8.2 | As a player, I want smooth animations (fade-ins, transitions) so the UI feels polished. | P0 | ✅ Done | CSS animations throughout |
| US-8.3 | As a player, I want the chat log to auto-scroll to the latest message so I don't miss anything. | P0 | ✅ Done | `useEffect` scroll to bottom |
| US-8.4 | As a mobile player, I want a responsive layout so I can play on my phone. | P1 | ⚠️ Partial | Mobile menu drawer exists, but geolocation UX is weak |
| US-8.5 | As a player, I want keyboard navigation support so I can play without a mouse. | P2 | ❌ Missing | No keyboard shortcuts |
| US-8.6 | As a player, I want tooltips on UI elements so I understand what they do. | P2 | ❌ Missing | No tooltips |
| US-8.7 | As a player, I want sound effects for dice rolls and actions so it feels dynamic. | P2 | ❌ Missing | No audio |
| US-8.8 | As a player, I want the ability to toggle animations off so I can reduce distractions. | P3 | ❌ Missing | No settings panel |

### Epic 9: Technical & Infrastructure

| ID | User Story | Priority | Status | Notes |
|----|------------|----------|--------|-------|
| US-9.1 | As a developer, I want the game to handle API errors gracefully so it doesn't crash. | P1 | ⚠️ Partial | Try/catch exists, but fallbacks are generic |
| US-9.2 | As a developer, I want to log errors to a file so I can debug issues. | P2 | ❌ Missing | Console logs only |
| US-9.3 | As a developer, I want to persist game state so players can resume after refresh. | P1 | ❌ Missing | No localStorage or backend |
| US-9.4 | As a developer, I want to rate-limit API calls so the game isn't abused. | P2 | ❌ Missing | No rate limiting |
| US-9.5 | As a developer, I want to validate player input so malicious text doesn't break the AI. | P1 | ❌ Missing | No input sanitization |
| US-9.6 | As a developer, I want to test the game with multiple players locally so I can QA networking. | P2 | ❌ Missing | No test mode / mock AI |
| US-9.7 | As a developer, I want environment variables for API keys so I don't hardcode secrets. | P0 | ✅ Done | `process.env.API_KEY` |
| US-9.8 | As a developer, I want the app to work offline (PWA) so I can play without internet. | P3 | ❌ Missing | No service worker |

---

## Priority Backlog

### P0 (Critical - Must Have for MVP Launch)
- [ ] **US-9.3**: Persist game state (localStorage)
- [ ] **US-9.1**: Better error handling with user-friendly messages
- [ ] **US-2.4**: Add connection status indicator in UI
- [ ] **US-6.4**: Graceful location permission denial with fallback

### P1 (High - Should Have for v1.0)
- [ ] **US-1.7**: Random character generator
- [ ] **US-2.7**: "Leave Game" button
- [ ] **US-5.6**: Allow pizza size/crust customization
- [ ] **US-5.7**: Implement sides in loot system
- [ ] **US-8.4**: Improve mobile geolocation UX
- [ ] **US-3.9**: DM override controls (simple admin panel)

### P2 (Medium - Nice to Have for v1.1)
- [ ] **US-2.6**: Kick player functionality
- [ ] **US-2.8**: Host migration
- [ ] **US-2.9**: Reconnection logic
- [ ] **US-4.8**: "Pass" turn option
- [ ] **US-6.5**: Manual location input
- [ ] **US-7.6**: Screenshot/download bill
- [ ] **US-9.5**: Input sanitization
- [ ] **US-8.5**: Keyboard navigation

### P3 (Low - Future Enhancements)
- [ ] **US-1.8**: Save character profiles
- [ ] **US-7.7**: Share campaign summary
- [ ] **US-8.7**: Sound effects
- [ ] **US-9.8**: PWA offline support
- [ ] **US-8.8**: Animation toggle

---

## Technical Debt & Risks

| ID | Issue | Impact | Recommendation |
|----|-------|--------|----------------|
| TD-1 | No input sanitization on player text | High (AI injection risk) | Sanitize before sending to Gemini |
| TD-2 | PeerJS relies on public cloud server | Medium (downtime risk) | Consider self-hosted PeerJS server |
| TD-3 | Hardcoded pizza pricing | Low (inflation) | Make pricing configurable |
| TD-4 | No API key rotation strategy | Medium (security) | Use backend proxy for API calls |
| TD-5 | No analytics or usage tracking | Low (blind spots) | Add basic event logging |
| TD-6 | Gemini 2.5 Flash may have rate limits | Medium (game breaks) | Implement request queue + retry |

---

## Next Steps

1. **Immediate (This Week)**:
   - Implement `US-9.3` (localStorage persistence)
   - Improve error handling (`US-9.1`)
   - Add connection status UI (`US-2.4`)

2. **Short-Term (Next Sprint)**:
   - Random character generator (`US-1.7`)
   - Pizza customization (`US-5.6`, `US-5.7`)
   - Leave game functionality (`US-2.7`)

3. **Medium-Term (v1.1)**:
   - Host migration (`US-2.8`)
   - DM override controls (`US-3.9`)
   - Mobile UX improvements (`US-8.4`)

---

**Generated by:** AI Cognitive Partner  
**Date:** 2026-03-15  
**Repository:** `https://github.com/aloysiusvonfck/pizza-and-dragons`
