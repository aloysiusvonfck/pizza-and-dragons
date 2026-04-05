# Dynamic Campaign Length Scaling Plan

**Project:** Pizza & Dragons  
**Date:** 2026-04-04  
**Status:** Draft for approval

## Goal

Make the campaign length adjustable so the game can support:

- a **fast epic** that finishes in about **1 hour on average**
- a **standard session** of roughly **2–3 hours on average**
- a **multi-session campaign** that stretches across **as many hours as the players want**

These are average targets, not fixed limits. The actual runtime may be shorter or longer depending on player speed, choices, and party size.

The game should scale by pacing, not by hardcoded scene count.

---

## What the user needs

- A clear way to choose campaign length before the game starts
- A story engine that can compress or expand content based on that choice
- A way to save and resume long campaigns across sessions
- A final game flow that still feels cinematic and finite
- Always-available communication between players in lobby, character creation, and gameplay
- No build regressions

---

## What I need to preserve

- The current UI style and flow
- The shadow-puppet / pizza-oven scene transition aesthetic
- The existing lobby, story, and summary experience
- Multiplayer support
- The current AI-driven feel

---

## Current code reality

Observed from `file 'components/GameContext.tsx'`, `file 'components/Lobby.tsx'`, `file 'services/geminiService.ts'`, and `file 'types.ts'`:

- Campaign generation is currently close to **fixed-length**
- `generateFullCampaign()` produces a small look-ahead tree rather than a true pacing system
- `generateNextScene()` only handles a few scene indexes explicitly
- There is no real campaign length model yet
- There is no explicit save/resume loop for multi-session play
- There is no always-on lobby or character-creation chat yet
- There is already some persistence-related code in progress, but it is not yet a full pacing system

---

## User decisions locked in

- **Preset naming:** thematic labels, with the average runtime shown beside each one
- **Runtime copy:** clearly state that each preset is an average and the actual session may vary by player speed
- **Save approach:** local-only for now
- **Host resilience:** every client should keep a local copy of the game data so the session can survive a host disconnect better
- **Length selection owner:** host only
- **Communication:** players must be able to communicate at all times, including lobby and character creation

---

## MVP implementation strategy

### 1) Add a campaign pacing model
Introduce a compact pacing configuration with values like:

- thematic name
- displayed average runtime
- minimum scene count
- maximum scene count
- desired amount of branching
- optional side-quest budget
- finale readiness threshold

### 2) Track progression dynamically
Instead of advancing by fixed scene count, track:

- scenes completed
- turns completed
- player momentum
- optional side content used
- pacing target remaining

This lets the engine decide whether to:

- accelerate toward the finale
- insert a side beat
- extend a branch
- hold the current arc open for another session

### 3) Make scene generation demand-driven
Replace the assumption that all scenes are prebuilt.

The engine should generate:

- the opening scene
- the next branch only when needed
- extra scenes only if the pacing budget says there is room

This is the main lever that lets the campaign stretch into multiple sessions.

### 4) Add local save/resume support
For long campaigns, persist:

- campaign id
- pacing mode
- current scene id
- generated scenes
- player roster
- current turn state
- pizza inventory / progress

For host resilience, each connected client should keep a local snapshot of the same game state so a disconnect does not immediately destroy the campaign state.

### 5) Add lobby control for length selection
Add a host-only lobby choice before game start:

- themed preset name
- average runtime label
- short explanatory text

This is the user-facing entry point for pacing.

### 6) Add always-on room communication
Add a shared chat or party message area that is available in:

- lobby
- character creation
- gameplay

This should be lightweight and multiplayer-safe so players can coordinate before the game begins and during the game itself.

### 7) Add finale gating
The finale should only unlock when the pacing system says the story arc is ready.

That means the game can end early for short runs or keep expanding for long-form play.

---

## Bare-bones MVP scope

### Must ship

- host-only campaign length selector in lobby
- pacing model in game state
- dynamic scene extension based on pacing
- local save/resume
- mirrored local snapshots for host-disconnect resilience
- always-on player chat in lobby and character creation
- build passing after changes

### Can wait

- analytics
- advanced recommendation system
- adaptive AI difficulty curves
- campaign export/share
- backend sync across devices

---

## Superior upgrades to consider later

- player-chosen campaign length at the room level
- save slots
- session summaries and recap generation
- branching recap cards between sessions
- custom pacing sliders for intensity vs length
- deterministic pacing from campaign seed
- host migration for long-running sessions

---

## Risks and roadblocks

- The current story generation code is already a bit tangled, so pacing should be added in small steps
- Existing AI calls should not be rewritten all at once
- Save/resume needs a clean serialization boundary
- Multiplayer sync must be kept stable while adding pacing state
- A lobby/creation chat feature needs to be lightweight so it does not make the UI noisy
- Build safety matters more than feature completeness in the first pass

---

## Proposed implementation order

1. Add pacing types and state fields
2. Add host-only lobby selector for campaign length
3. Add always-on room chat for lobby and character creation
4. Update story generation to respect pacing targets
5. Add local persistence for campaign state
6. Add mirrored local snapshots for disconnect resilience
7. Add scene budgeting / expansion rules
8. Verify build
9. Iterate on UI polish if needed

---

## Questions to approve before implementation

1. Do you want the themed presets to be named something like **Quick Bite / Table Talk / Feast**, with the average runtime shown beside each one?
2. Should the always-on communication be a **simple shared text chat** or a more styled **party parchment/chat panel**?
3. For the local snapshots, do you want me to keep them **automatic and hidden**, or show a **connection/save status indicator** in the UI?

---

## Recommendation

Start with the **MVP scope only**:

- host-only thematic length selector
- pacing state model
- dynamic scene budgeting
- local save/resume
- mirrored local snapshots
- always-on lobby/creation chat
- build verification

That gets us the real feature quickly without risking the current game loop.
