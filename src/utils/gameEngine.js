// src/utils/gameEngine.js

const MoveActions = [
  [2, 3, 4, 5], [2, 7], [0, 1, 3, 8], [2, 0, 4, 9], [3, 0, 5, 10],
  [0, 4, 11, 6], [5, 12], [1, 8, 13], [2, 7, 14, 9], [3, 8, 10, 15],
  [9, 4, 11, 16], [5, 12, 10, 17], [6, 11, 18], [7, 14], [13, 8, 15, 19],
  [9, 14, 16, 20], [10, 15, 17, 21], [16, 11, 18, 22], [12, 17],
  [14, 20], [15, 19, 21], [16, 20, 22], [17, 21]
];

const CaptureActions = [
  [0, 2, 8], [0, 3, 9], [0, 4, 10], [0, 5, 11], [1, 2, 3], [1, 7, 13],
  [2, 8, 14], [2, 3, 4], [3, 9, 15], [3, 4, 5], [3, 2, 1], [4, 3, 2],
  [4, 5, 6], [4, 10, 16], [5, 4, 3], [5, 11, 17], [6, 5, 4], [6, 12, 18],
  [7, 8, 9], [8, 9, 10], [8, 2, 0], [8, 14, 19], [9, 8, 7], [9, 10, 11],
  [9, 3, 0], [9, 15, 20], [10, 4, 0], [10, 9, 8], [10, 11, 12],
  [10, 16, 21], [11, 10, 9], [11, 5, 0], [11, 17, 22], [12, 11, 10],
  [13, 7, 1], [13, 14, 15], [14, 8, 2], [14, 15, 16], [15, 14, 13],
  [15, 16, 17], [15, 9, 3], [16, 15, 14], [16, 10, 4], [16, 17, 18],
  [17, 16, 15], [17, 11, 5], [18, 12, 6], [18, 17, 16], [19, 14, 8],
  [19, 20, 21], [20, 15, 9], [20, 21, 22], [21, 20, 19], [21, 16, 10],
  [22, 21, 20], [22, 17, 11]
];

class GameState {
  constructor() {
    this.SideToPlay = 1;
    this.OutsideGoats = 15;
    this.CapturedGoats = 0;
    this.CurrentPosition = ['T', 'E', 'E', 'T', 'T', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E'];
    this.Hash = 0;
    this.Result = -1;
  }

  getLegalActions() {
    const actions = [];
    if (this.SideToPlay === 1) {
      if (this.OutsideGoats > 0) {
        this.CurrentPosition.forEach((p, i) => {
          if (p === "E") actions.push([-1, -1, i]);
        });
      } else {
        this.CurrentPosition.forEach((p, i) => {
          if (p === "G") {
            for (const move of MoveActions[i]) {
              if (this.CurrentPosition[move] === "E") actions.push([i, -1, move]);
            }
          }
        });
      }
    } else {
      this.CurrentPosition.forEach((p, i) => {
        if (p === "T") {
          for (const cap of CaptureActions) {
            if (cap[0] === i && this.CurrentPosition[cap[1]] === "G" && this.CurrentPosition[cap[2]] === "E")
              actions.push(cap);
          }
          for (const move of MoveActions[i]) {
            if (this.CurrentPosition[move] === "E") actions.push([i, -1, move]);
          }
        }
      });
    }
    return actions;
  }

  generateSuccessor(action, history) {
    const state = new GameState();
    state.OutsideGoats = this.OutsideGoats;
    state.Result = this.Result;
    state.SideToPlay = (this.SideToPlay + 1) % 2;
    state.CurrentPosition = this.CurrentPosition.slice(0);
    state.CapturedGoats = this.CapturedGoats;

    if (arraysEqual(action, [0, 0, 0])) {
      state.Result = state.SideToPlay;
    } else {
      if (action[0] === -1) {
        state.OutsideGoats--;
        state.CurrentPosition[action[2]] = "G";
      } else {
        const temp = state.CurrentPosition[action[0]];
        state.CurrentPosition[action[0]] = "E";
        state.CurrentPosition[action[2]] = temp;
        if (action[1] !== -1) {
          state.CurrentPosition[action[1]] = "E";
          state.CapturedGoats++;
        }
      }
    }

    let num = state.OutsideGoats;
    state.CurrentPosition.forEach((p) => {
      if (p === "G") num++;
    });
    if (num === 0) state.Result = 0;
    else if (state.getLegalActions().length === 0) state.Result = this.SideToPlay;

    // Compute hash - matching the original logic exactly
    state.Hash = 0;
    for (let i = 0; i < state.CurrentPosition.length; i++) {
      if (state.CurrentPosition[i] === 'T')
        state.Hash += 2;
      else if (state.CurrentPosition[i] === 'G')
        state.Hash += 1;
      state.Hash *= 4;
    }
    state.Hash *= 4;
    state.Hash += state.OutsideGoats;
    state.Hash *= 2;
    state.Hash += state.SideToPlay;

    let numEquals = 0;
    for (let i = history.Pointer - 1; i >= 0; i--) {
      if (history.InternalArray[i].Hash === state.Hash) numEquals++;
      if (numEquals > 1) {
        state.Result = 2; 
        console.log("draw")
        break;
      }
    }
    // console.log(state.Result)
    return state;
  }
}

class HistoryStack {
  constructor(length = 500) {
    this.InternalArray = new Array(length); 
    this.Pointer = 0;
  }
  push(obj) {
    this.InternalArray[this.Pointer] = obj;
    this.Pointer += 1;
  }
  pop() {
    this.Pointer -= 1;
  }
}

class HashTree {
  constructor() {
    this.Nodes = new Array(256);
    this.Data = null;
  }
  find(key) {
    function treeSearch(depth, key, node) {
      const nextKey = key & 0xff;
      if (depth === 1 && node.Nodes[key] != null) {
        return node.Nodes[key].Data;
      }
      else if (node.Nodes[nextKey] != null) {
        key = key - (key & 0xff);
        return treeSearch(depth - 1, key / 256, node.Nodes[nextKey]);
      }
      return null;
    }
    return treeSearch(7, key, this);
  }
  insert(key, data) {
    function treeInsert(depth, key, data, node) {
      if (depth === 1) {
        node.Nodes[key] = new HashTree();
        node.Nodes[key].Data = data;
      }
      else {
        const nextKey = key & 0xff;
        if (node.Nodes[nextKey] == null) {
          node.Nodes[nextKey] = new HashTree();
        }
        key = key - (key & 0xff);
        treeInsert(depth - 1, key / 256, data, node.Nodes[nextKey]);
      }
    }
    treeInsert(7, key, data, this);
  }
}

class AlphaBetaWithTTAgent {
  constructor() {
    this.Index = 0;
    this.History = new HistoryStack();
  }

  evaluate(state, actions, index) {
    function Score(score) {
      if (index === 0)
        return score;
      else return -score;
    }
    
    if (state.Result === 0) return Score(10000);
    if (state.Result === 1) return Score(-10000);
    if (state.Result === 2) return -5000;

    let score = 0;
    let nGoats = state.OutsideGoats;
    state.CurrentPosition.forEach((p) => {
      if (p === 'G') nGoats++;
    });
    
    let numActions = 0;
    let numCaptures = 0;
    actions.forEach((action) => {
      if (action[1] > -1) numCaptures++;
      else numActions++;
    });
    
    score -= 4 * nGoats;
    
    if (state.SideToPlay === 0) { // tigers to move
      score += numActions;
      score += 2 * numCaptures;
    } else { // goats to move - suppose tigers to move and assign score anyway
      state.CurrentPosition.forEach((p, i) => {
        if (p === 'T') {
          MoveActions[i].forEach((move) => {
            if (state.CurrentPosition[move] === 'E') score += 1;
          });
          CaptureActions.forEach((cap) => {
            if (cap[0] === i && state.CurrentPosition[cap[1]] === 'G' && state.CurrentPosition[cap[2]] === 'E') 
              score += 2;
          });
        }
      });
    }
    
    return Score(score);
  }

  getAction(gameState) {
    let nodesExpanded = 0;
    let leavesReached = 0;
    const index = this.Index;
    const history = this.History;
    const transpositionTable = new HashTree();
    
    const alphaBeta = (state, depth, agentIndex, a, b) => {
      history.push(state);
      const actions = state.getLegalActions();
      let action = [0, 0, 0];
      let score;
      
      if (depth < 1 || actions.length === 0 || state.Result !== -1) {
        history.pop();
        leavesReached++;
        return [this.evaluate(state, actions, index), [0, 0, 0]];
      }
      
      const TTresult = transpositionTable.find(state.Hash);
      if (TTresult != null) {
        if (TTresult[1] >= depth) {
          if (TTresult[2] === TTresult[3]) {
            history.pop();
            return [TTresult[2], TTresult[0]];
          }
          if (TTresult[2] > b) {
            history.pop();
            return [TTresult[2], TTresult[0]];
          }
          if (TTresult[3] < a) {
            history.pop();
            return [TTresult[3], TTresult[0]];
          }
          a = Math.max(a, TTresult[2]);
          b = Math.min(b, TTresult[3]);
        }
        for (let i = 0; i < actions.length; i++) {
          if (arraysEqual(actions[i], TTresult[0])) {
            actions.splice(i, 1);
            actions.splice(0, 0, TTresult[0]);
            break;
          }
        }
      }
      
      if (agentIndex === index) {
        score = Number.NEGATIVE_INFINITY;
        for (let i = 0; i < actions.length; i++) {
          const result = alphaBeta(state.generateSuccessor(actions[i], history), depth - 1, (agentIndex + 1) % 2, a, b)[0];
          nodesExpanded++;
          if (score < result) {
            score = result;
            action = actions[i];
          }
          if (score >= b) break;
          if (score > a) a = score;
        }
      } else {
        score = Number.POSITIVE_INFINITY;
        for (let i = 0; i < actions.length; i++) {
          const result = alphaBeta(state.generateSuccessor(actions[i], history), depth - 1, (agentIndex + 1) % 2, a, b)[0];
          nodesExpanded++;
          if (score > result) {
            action = actions[i];
            score = result;
          }
          if (score <= a) break;
          if (b > score) b = score;
        }
      }
      
      history.pop();
      if (score <= a)
        transpositionTable.insert(state.Hash, [action, depth, Number.NEGATIVE_INFINITY, score]);
      else if (score >= b)
        transpositionTable.insert(state.Hash, [action, depth, score, Number.POSITIVE_INFINITY]);
      else 
        transpositionTable.insert(state.Hash, [action, depth, score, score]);
      
      return [score, action];
    };

    let result;
    let depth = 1;
    while (true) {
      leavesReached = 0;
      result = alphaBeta(gameState, depth, this.Index, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
      if (typeof self !== "undefined" && self.postMessage)
        self.postMessage([result[0], result[1], depth, nodesExpanded, leavesReached]);
      else if (typeof postMessage === "function")
        postMessage([result[0], result[1], depth, nodesExpanded, leavesReached]);
      depth++;
    }
  }
}

function arraysEqual(a, b) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  
  for (let i = 0; i < a.length; i++) {
    if (a[i] instanceof Array && b[i] instanceof Array) {
      if (!arraysEqual(a[i], b[i])) return false;
    }
    else if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

export {
  GameState,
  HistoryStack,
  AlphaBetaWithTTAgent,
  MoveActions,
  CaptureActions,
  arraysEqual,
  HashTree
};