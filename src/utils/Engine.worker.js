// src/utils/Engine.js

import { GameState, HistoryStack, AlphaBetaWithTTAgent } from './gameEngine';

self.onmessage = (e) => {
  const [serializedGameState, agentName, agentIndex, historySnapshot] = e.data;
  let agent;

  switch (agentName.toLowerCase()) {
    case "alphabetawithmemory":
      agent = new AlphaBetaWithTTAgent();
      break;
    default:
      self.postMessage([0, [-1, -1, -1], 0, 0, 0]);
      return;
  }

  agent.Index = agentIndex;
  agent.History = new HistoryStack(500);
  for (let i = 0; i < historySnapshot.Pointer; i++) {
    agent.History.push(recreateGameState(historySnapshot.InternalArray[i]));
  }

  const result = agent.getAction(recreateGameState(serializedGameState));
  self.postMessage(result);
};

function recreateGameState(json) {
  const state = new GameState();
  state.SideToPlay = json.SideToPlay;
  state.CurrentPosition = [...json.CurrentPosition];
  state.OutsideGoats = json.OutsideGoats;
  state.CapturedGoats = json.CapturedGoats ?? 0; // ✅ Include this line
  state.Result = json.Result;
  state.Hash = json.Hash || 0;
  return state;
}
