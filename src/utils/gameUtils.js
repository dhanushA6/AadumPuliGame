import { MoveActions, CaptureActions } from './gameEngine';

// Returns all adjacent positions for a given board index
export function getAdjacentPositions(position) {
  return MoveActions[position] || [];
}

// Returns the destination index if a tiger at 'from' can jump over 'over', else -1
export function canJumpTo(from, over) {
  for (const cap of CaptureActions) {
    if (cap[0] === from && cap[1] === over) {
      return cap[2];
    }
  }
  return -1;
}

// Checks if a goat at a given position can be captured by any tiger
export function isPositionVulnerable(gameState, position) {
  for (let tigerPos = 0; tigerPos < gameState.CurrentPosition.length; tigerPos++) {
    if (gameState.CurrentPosition[tigerPos] === 'T') {
      const jumpPos = canJumpTo(tigerPos, position);
      if (jumpPos !== -1 && gameState.CurrentPosition[jumpPos] === 'E') {
        return true;
      }
    }
  }
  return false;
}

// Counts the number of tigers that have no legal moves
export function countBlockedTigers(gameState) {
  let blockedCount = 0;
  for (let i = 0; i < gameState.CurrentPosition.length; i++) {
    if (gameState.CurrentPosition[i] === 'T') {
      const moves = gameState.getLegalActions().filter(act => act[0] === i);
      if (moves.length === 0) blockedCount++;
    }
  }
  return blockedCount;
}

// Calculates how many goats are adjacent to a given position
export function calculateGoatConnectivity(gameState, position) {
  const adjacent = getAdjacentPositions(position);
  return adjacent.filter(pos => gameState.CurrentPosition[pos] === 'G').length;
}

// Evaluates move quality quickly, for sorting and basic AI behavior
export function evaluateMoveQuality(gameState, action) {
  const tempGameState = gameState.generateSuccessor(action, { Pointer: 0, InternalArray: [] });
  let score = 0;
  const fromPos = action[0];
  const toPos = action[2];

  if (gameState.CurrentPlayer === 0) {
    if (action[1] !== -1) score += 100;
    const centerPositions = [8, 9, 10, 14, 15, 16];
    if (centerPositions.includes(toPos)) score += 20;
    const edgePositions = [0, 1, 6, 7, 12, 13, 19, 22];
    if (edgePositions.includes(toPos)) score += 10;
  } else {
    if (gameState.OutsideGoats > 0) {
      if (isPositionVulnerable(tempGameState, toPos)) {
        score -= 100;
      } else {
        score += 20;
      }
    } else {
      if (isPositionVulnerable(gameState, fromPos) && !isPositionVulnerable(tempGameState, toPos)) {
        score += 40;
      }
    }
    const connectivity = calculateGoatConnectivity(tempGameState, toPos);
    score += connectivity * 5;

    const centerPositions = [8, 9, 10, 14, 15, 16];
    if (centerPositions.includes(toPos)) score += 10;
  }

  return score;
}

// Selects a move based on difficulty settings
export function selectMoveByDifficulty(gameState, legalActions, difficultySettings) {
  // Defensive logic: avoid vulnerable goat placements during placement
  if (gameState.CurrentPlayer === 1 && gameState.OutsideGoats > 0) {
    const safeMoves = legalActions.filter(action => {
      const toPos = action[2];
      const tempState = gameState.generateSuccessor(action, { Pointer: 0, InternalArray: [] });
      return !isPositionVulnerable(tempState, toPos);
    });

    if (safeMoves.length > 0) {
      legalActions = safeMoves;
    }
  }

  const moveEvaluations = legalActions.map(action => ({
    action,
    score: evaluateMoveQuality(gameState, action)
  }));

  moveEvaluations.sort((a, b) => b.score - a.score);

  if (difficultySettings.avoidBestMoves && moveEvaluations.length > 2) {
    const worseHalf = moveEvaluations.slice(Math.floor(moveEvaluations.length / 2));
    return worseHalf[Math.floor(Math.random() * worseHalf.length)].action;
  }

  if (difficultySettings.useSuboptimalMoves) {
    const shouldUseSuboptimal = Math.random() < difficultySettings.suboptimalChance;
    if (shouldUseSuboptimal && moveEvaluations.length > 1) {
      const suboptimalMoves = moveEvaluations.slice(1);
      const selectedMove = suboptimalMoves[Math.floor(Math.random() * suboptimalMoves.length)];
      return selectedMove.action;
    }
  }

  if (difficultySettings.evaluationNoise > 0) {
    moveEvaluations.forEach(moveEval => {
      const noise = (Math.random() - 0.5) * difficultySettings.evaluationNoise;
      moveEval.score += noise;
    });
    moveEvaluations.sort((a, b) => b.score - a.score);
  }

  if (difficultySettings.preferDefensive) {
    const defensiveMoves = moveEvaluations.filter(moveEval => moveEval.action[1] === -1);
    if (defensiveMoves.length > 0 && Math.random() < 0.4) {
      return defensiveMoves[0].action;
    }
  }

  return moveEvaluations[0].action;
}

// Evaluates a move with full explanation and scoring breakdown
export function evaluateDetailedMoveQuality(beforeState, afterState, action, player) {
  let score = 0;
  let scoreDetails = [];
  score += 10;
  scoreDetails.push("Base move: +10");

  if (player === 0) { // Tiger
    if (action[1] !== -1) {
      if (afterState.CapturedGoats >=5) score += 10000;
      else score += 100;
      scoreDetails.push("Capture: +100");
    }
    const toPos = action[2];
    const centerPositions = [8, 9, 10, 14, 15, 16];
    const strategicPositions = [1, 2, 3, 4, 5, 7, 11, 12, 13, 17, 18, 19, 20, 21, 22];
    if (centerPositions.includes(toPos)) {
      score += 25;
      scoreDetails.push("Center control: +25");
    } else if (strategicPositions.includes(toPos)) {
      score += 15;
      scoreDetails.push("Strategic position: +15");
    }
    const tigerMobility = afterState.getLegalActions().filter(act => afterState.CurrentPosition[act[0]] === 'T').length;
    if (tigerMobility > 3) {
      score += 20;
      scoreDetails.push("High mobility: +20");
    } else if (tigerMobility < 2) {
      score -= 10;
      scoreDetails.push("Low mobility: -10");
    }
    const threats = afterState.getLegalActions().filter(act => act[1] !== -1 && afterState.CurrentPosition[act[0]] === 'T').length;
    if (threats > 0) {
      score += threats * 15;
      scoreDetails.push(`Threats created: +${threats * 15}`);
    }
    if (afterState.CapturedGoats >= 3) {
      score += 30;
      scoreDetails.push("Endgame advantage: +30");
    }
  } else { // Goat
    if (beforeState.OutsideGoats > 0) {
      const toPos = action[2];
      const centerPositions = [8, 9, 10, 14, 15, 16];
      const blockingPositions = [1, 2, 3, 4, 5, 7, 11, 12, 13, 17, 18, 19, 20, 21, 22];
      if (centerPositions.includes(toPos)) {
        score += 20;
        scoreDetails.push("Center placement: +20");
      } else if (blockingPositions.includes(toPos)) {
        score += 15;
        scoreDetails.push("Blocking position: +15");
      }
      const isVulnerable = isPositionVulnerable(afterState, toPos);
      if (isVulnerable) {
        score -= 30;
        scoreDetails.push("Vulnerable placement: -30");
      }
    } else {
      const fromPos = action[0];
      const toPos = action[2];
      if (isPositionVulnerable(beforeState, fromPos) && !isPositionVulnerable(afterState, toPos)) {
        score += 40;
        scoreDetails.push("Escape from danger: +40");
      }
      const blockedTigers = countBlockedTigers(afterState);
      const previousBlocked = countBlockedTigers(beforeState);
      if (blockedTigers > previousBlocked) {
        score += 25;
        scoreDetails.push("Tiger blocking: +25");
      }
      const connectivity = calculateGoatConnectivity(afterState, toPos);
      if (connectivity >= 3) {
        score += 20;
        scoreDetails.push("Good formation: +20");
      }
    }

    const tigerThreats = beforeState.getLegalActions().filter(act => act[1] !== -1 && beforeState.CurrentPosition[act[0]] === 'T').length;
    const afterThreats = afterState.getLegalActions().filter(act => act[1] !== -1 && afterState.CurrentPosition[act[0]] === 'T').length;
    if (afterThreats < tigerThreats) {
      score += 30;
      scoreDetails.push("Threat reduction: +30");
    }
    if (afterState.CapturedGoats >= 2) {
      score += 35;
      scoreDetails.push("Survival bonus: +35");
    }
  }

  if (afterState.Result !== -1 && afterState.Result !== player) {
    score -= 200;
    scoreDetails.push("Losing move: -200");
  }
  if (afterState.Result === player) {
    score += 200;
    scoreDetails.push("Winning move: +200");
  }

  return { score: Math.max(0, score), details: scoreDetails };
}
