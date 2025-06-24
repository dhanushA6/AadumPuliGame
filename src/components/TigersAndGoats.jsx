// App.jsx
import React, { useEffect, useRef, useState } from 'react';
import { GameState, arraysEqual } from '../utils/gameEngine.js';
import '../App.css';
import BoardImg from '../images/Board.png';
import TigerImg from '../images/Tiger.png';
import GoatImg from '../images/Goat.png';
import EmptyImg from '../images/Empty.png';
import ComputerTypeOverlay from './ComputerTypeOverlay';
import {
  evaluateDetailedMoveQuality,
  isPositionVulnerable,
  countBlockedTigers,
  calculateGoatConnectivity,
  getAdjacentPositions,
  canJumpTo,
  evaluateMoveQuality,
  selectMoveByDifficulty
} from '../utils/gameUtils';

const BOARD_WIDTH = 500;
const BOARD_HEIGHT = 400;
const PIECE_SIZE = 40;

const DIFFICULTY_LEVELS = {
  veryEasy: { 
    useSuboptimalMoves: true,
    suboptimalChance: 0.6,
    evaluationNoise: 50,
    preferDefensive: false,
    avoidBestMoves: true
  },
  easy: { 
    useSuboptimalMoves: true,
    suboptimalChance: 0.35,
    evaluationNoise: 30,
    preferDefensive: true,
    avoidBestMoves: false
  },
  medium: { 
    useSuboptimalMoves: true,
    suboptimalChance: 0.15,
    evaluationNoise: 15,
    preferDefensive: false,
    avoidBestMoves: false
  },
  hard: { 
    useSuboptimalMoves: false,
    suboptimalChance: 0.0,
    evaluationNoise: 5,
    preferDefensive: false,
    avoidBestMoves: false
  },
};

function TigersAndGoats() {
  const [gameState, setGameState] = useState(null);
  const [isInProgress, setIsInProgress] = useState(false);
  const [selectedId, setSelectedId] = useState(-1);
  const [computerPlaysAs, setComputerPlaysAs] = useState(null);
  const [moveHistory, setMoveHistory] = useState({ pointer: 0, states: [] });
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [selectedType, setSelectedType] = useState(0);
  const [difficulty, setDifficulty] = useState('hard');
  
  // Move quality scoring states
  const [tigerScore, setTigerScore] = useState(0);
  const [goatScore, setGoatScore] = useState(0);
  const [tigerMoveCount, setTigerMoveCount] = useState(0);
  const [goatMoveCount, setGoatMoveCount] = useState(0);
  const [lastMoveScore, setLastMoveScore] = useState(null);
  const [lastMovePlayer, setLastMovePlayer] = useState(null);
  const [lastMoveTo, setLastMoveTo] = useState(null);

  const agentWorkerRef = useRef(null);
  const bestMoveRef = useRef(null);
  const bestScoreRef = useRef(null);
  const allMovesRef = useRef(null);
  const timeoutRef = useRef(null);
  const outputRef = useRef();
  const isInProgressRef = useRef(false);
  const isComputerThinkingRef = useRef(false);
  const computerPlaysAsRef = useRef(null);

  useEffect(() => { isInProgressRef.current = isInProgress; }, [isInProgress]);
  useEffect(() => { isComputerThinkingRef.current = isComputerThinking; }, [isComputerThinking]);
  useEffect(() => { computerPlaysAsRef.current = computerPlaysAs; }, [computerPlaysAs]);

  useEffect(() => {
    const initState = new GameState();
    setGameState(initState);
    setMoveHistory({ pointer: 0, states: [initState] });
  }, []);

  const handleUserClick = (id, className) => {
    if (!isInProgress || isComputerThinking || !gameState) return;
    const legalActions = gameState.getLegalActions();
    if (legalActions.length === 0) { setIsInProgress(false); return; }

    const isTiger = gameState.SideToPlay === 0;
    const isGoat = gameState.SideToPlay === 1;
    const isUserTurn = (isTiger && computerPlaysAs === 1) || (isGoat && computerPlaysAs === 0);
    if (!isUserTurn && computerPlaysAs !== null) return;

    if (isGoat) {
      if (gameState.OutsideGoats > 0) {
        const isLegal = legalActions.some(act => arraysEqual(act, [-1, -1, id]));
        if (className === 'Empty' && isLegal) executeMove([-1, -1, id], gameState);
      } else {
        if (className === 'Goat') setSelectedId(id);
        else if (className === 'Empty' && selectedId > -1) {
          const action = legalActions.find(act => arraysEqual(act, [selectedId, -1, id]));
          if (action) executeMove([selectedId, -1, id], gameState);
        }
      }
    } else if (isTiger) {
      if (className === 'Tiger') setSelectedId(id);
      else if (className === 'Empty' && selectedId > -1) {
        const action = legalActions.find(act => act[0] === selectedId && act[2] === id);
        if (action) {
          const middle = action[1] !== -1 ? action[1] : -1;
          executeMove([selectedId, middle, id], gameState);
        }
      }
    }
  };

  const executeMove = (action, currentGameState) => {
    if (!currentGameState || isComputerThinking) return;
    
    const historyForEngine = {
      Pointer: moveHistory.pointer,
      InternalArray: moveHistory.states,
    };
    
    const newGameState = currentGameState.generateSuccessor(action, historyForEngine);
    const currentPlayer = currentGameState.SideToPlay;
    
    // Calculate move quality score
    const moveQuality = evaluateDetailedMoveQuality(currentGameState, newGameState, action, currentPlayer);
    
    // Update scores and move counts
    if (currentPlayer === 0) { // Tiger move
      setTigerScore(prev => prev + moveQuality.score);
      setTigerMoveCount(prev => prev + 1);
    } else { // Goat move
      setGoatScore(prev => prev + moveQuality.score);
      setGoatMoveCount(prev => prev + 1);
    }
    
    // Set last move information for display
    setLastMoveScore(moveQuality.score);
    setLastMovePlayer(currentPlayer === 0 ? 'Tiger' : 'Goat');
    setLastMoveTo(action[2]);
    
    // Log move quality details
    if (outputRef.current) {
      outputRef.current.value += `\n${currentPlayer === 0 ? 'Tiger' : 'Goat'} move score: ${moveQuality.score}`;
      outputRef.current.value += `\nDetails: ${moveQuality.details.join(', ')}`;
    }
    
    const newHistory = {
      pointer: moveHistory.pointer + 1,
      states: [...moveHistory.states.slice(0, moveHistory.pointer + 1), newGameState],
    };
    
    setGameState(newGameState);
    setMoveHistory(newHistory);
    setSelectedId(-1);
    
    if (newGameState.Result !== -1) {
      setIsInProgress(false);
      setIsComputerThinking(false);
      return;
    }
    
    checkAndTriggerComputerPlay(newGameState);
    bestScoreRef.current = null;
  };

  const checkAndTriggerComputerPlay = (currentGameState) => {
    const compSide = computerPlaysAsRef.current;
    const playing = isInProgressRef.current;
    if (compSide === null || !playing) return;
    const turn = currentGameState.SideToPlay;
    const shouldPlay = (turn === 0 && compSide === 0) || (turn === 1 && compSide === 1) || compSide === 2;
    if (shouldPlay) setTimeout(() => { if (isInProgressRef.current && !isComputerThinkingRef.current) computerPlay(currentGameState); }, 100);
  };

  const cleanupWorker = () => {
    if (agentWorkerRef.current) agentWorkerRef.current.terminate();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    agentWorkerRef.current = null;
    timeoutRef.current = null;
    bestMoveRef.current = null;
    bestScoreRef.current = null;
    allMovesRef.current = null;
  };

  const computerPlay = (currentGameState) => {
    const legalActions = currentGameState.getLegalActions();
    const difficultySettings = DIFFICULTY_LEVELS[difficulty] || DIFFICULTY_LEVELS['medium'];
  
    setIsComputerThinking(true);
    
    const depthLimit = 20;
    const timeLimit = 1500;
    
    // For very easy and easy, use immediate heuristic-based selection
    if (difficulty === 'veryEasy' || difficulty === 'easy') {
      const selectedMove = selectMoveByDifficulty(currentGameState, legalActions, difficultySettings);
      setTimeout(() => {
        executeMove(selectedMove, currentGameState);
        setIsComputerThinking(false);
      }, 300 + Math.random() * 700); // Variable thinking time
      return;
    }
  
    // For medium and hard, use AI but with difficulty modifications
    cleanupWorker();
    const worker = new Worker(new URL("../utils/Engine.worker.js", import.meta.url));
    agentWorkerRef.current = worker;
  
    worker.onmessage = (e) => {
      const [score, action, depth, allMoves] = e.data;
      bestScoreRef.current = score;
      bestMoveRef.current = action;
      allMovesRef.current = allMoves;
      
      outputRef.current.value += `\nAgent: ${currentGameState.SideToPlay === 0 ? 'Tigers' : 'Goats'} | Depth: ${depth} | Score: ${score}`;
      
      // Apply difficulty-based move selection even with AI
      let finalMove = action;
      
      if (difficulty === 'medium' && allMoves && allMoves.length > 1) {
        // 20% of the time, don't take the best move (final action)
        if (Math.random() < 0.2) {
          // Pick a suboptimal move (not the best one)
          const moveIndex = Math.min(1 + Math.floor(Math.random() * Math.min(2, allMoves.length - 1)), allMoves.length - 1);
          finalMove = allMoves[moveIndex].action;
          outputRef.current.value += ` | Selected suboptimal move rank: ${moveIndex + 1}`;
        } else {
          outputRef.current.value += ` | Selected best move`;
        }
      }
      
      if (depth >= depthLimit) {
        bestMoveRef.current = finalMove;
        executeBestMove(currentGameState);
      }
    };
  
    worker.onerror = (error) => {
      console.error("Worker error:", error);
      // Fallback to heuristic selection
      const fallbackMove = selectMoveByDifficulty(currentGameState, legalActions, difficultySettings);
      executeMove(fallbackMove, currentGameState);
      setIsComputerThinking(false);
      cleanupWorker();
    };
  
    // Request both best move and alternative moves for difficulty adjustment
    worker.postMessage([currentGameState, "alphabetawithmemory", currentGameState.SideToPlay, moveHistory, true]);
    
    timeoutRef.current = setTimeout(() => {
      console.log("Time limit reached, executing best move");
      executeBestMove(currentGameState);
    }, timeLimit); // true flag for requesting all moves
  };
  
  const executeBestMove = (currentGameState) => {
    const moveToExecute = bestMoveRef.current;
    cleanupWorker();
    setIsComputerThinking(false);
    if (moveToExecute && isInProgressRef.current) executeMove(moveToExecute, currentGameState);
  };

  const startGame = (side) => {
    cleanupWorker();
    setIsComputerThinking(false);
    setIsInProgress(true);
    setComputerPlaysAs(side);
    setTimeout(() => {
      const currentSide = gameState.SideToPlay;
      if ((side === currentSide) || side === 2) computerPlay(gameState);
    }, 100);
  };

  const handleOverlayStart = () => {
    setShowOverlay(false);
    startGame(selectedType);
  };

  const resetGame = () => {
    cleanupWorker();
    setIsComputerThinking(false);
    const initState = new GameState();
    setGameState(initState);
    setMoveHistory({ pointer: 0, states: [initState] });
    setIsInProgress(false);
    setSelectedId(-1);
    setComputerPlaysAs(null);
    setShowOverlay(true);
    
    // Reset scoring
    setTigerScore(0);
    setGoatScore(0);
    setTigerMoveCount(0);
    setGoatMoveCount(0);
    setLastMoveScore(null);
    setLastMovePlayer(null);
    setLastMoveTo(null);
    
    if (outputRef.current) outputRef.current.value = '';
  };

  useEffect(() => () => cleanupWorker(), []);

  return (
    <div className="game-container">
      {showOverlay && (
        <ComputerTypeOverlay
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          onStart={handleOverlayStart}
        />
      )}
      <div className="board" style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}>
        <img src={BoardImg} alt="Board" className="board-img" />
        {gameState && gameState.CurrentPosition.map((piece, i) => {
          const [top, left] = getPositionByIndex(i);
          const className = piece === 'G' ? 'Goat' : piece === 'T' ? 'Tiger' : 'Empty';
          const isSelected = selectedId === i;
          const isLastMove = lastMoveTo === i;
          const pieceImg = className === 'Goat' ? GoatImg : className === 'Tiger' ? TigerImg : EmptyImg;
          return (
            <img
              key={i}
              src={pieceImg}
              className={`piece ${className} ${isSelected ? 'selected' : ''} ${isLastMove ? 'last-move' : ''}`}
              style={{ top, left, width: PIECE_SIZE, height: PIECE_SIZE, border: isSelected ? '2px solid yellow' : 'none' }}
              onClick={() => handleUserClick(i, className)}
            />
          );
        })}
      </div>
      <div className="controls">
        {gameState && (
          <div className="game-info">
            <p>Side to Play: {gameState.SideToPlay === 0 ? 'Tigers' : 'Goats'}</p>
            <p>Goats Left to Place: {gameState.OutsideGoats}</p>
            <p>Goats Captured: {gameState.CapturedGoats}</p>
            <p>Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</p>
            
            {/* Move Quality Scoring Display */}
            <div className="scoring-section" style={{ 
              marginTop: '15px', 
              padding: '10px', 
              border: '2px solid #333', 
              borderRadius: '8px',
              backgroundColor: '#f5f5f5'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Move Quality Scores</h4>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ 
                  padding: '5px 10px', 
                  backgroundColor: '#ff6b35', 
                  color: 'white', 
                  borderRadius: '5px',
                  minWidth: '120px',
                  textAlign: 'center'
                }}>
                  <strong>🐅 Tigers</strong><br/>
                  Score: {tigerScore}<br/>
                  Moves: {tigerMoveCount}<br/>
                  Avg: {tigerMoveCount > 0 ? Math.round(tigerScore / tigerMoveCount) : 0}
                </div>
                
                <div style={{ 
                  padding: '5px 10px', 
                  backgroundColor: '#4CAF50', 
                  color: 'white', 
                  borderRadius: '5px',
                  minWidth: '120px',
                  textAlign: 'center'
                }}>
                  <strong>🐐 Goats</strong><br/>
                  Score: {goatScore}<br/>
                  Moves: {goatMoveCount}<br/>
                  Avg: {goatMoveCount > 0 ? Math.round(goatScore / goatMoveCount) : 0}
                </div>
              </div>
              
              {lastMoveScore !== null && (
                <div style={{ 
                  padding: '8px', 
                  backgroundColor: lastMovePlayer === 'Tiger' ? '#ffe6e6' : '#e6ffe6',
                  borderRadius: '5px',
                  textAlign: 'center',
                  border: '1px solid #ddd'
                }}>
                  <strong>Last Move:</strong> {lastMovePlayer} scored <strong>{lastMoveScore}</strong> points
                </div>
              )}
            </div>
            
            {gameState.Result !== -1 && (
              <div style={{ marginTop: '10px' }}>
                <p style={{ color: 'red', fontWeight: 'bold', fontSize: '18px' }}>
                  Game Over! {gameState.Result === 0 ? 'Tigers Win!' : gameState.Result === 1 ? 'Goats Win!' : 'Draw!'}
                </p>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  Final Performance: Tigers avg {tigerMoveCount > 0 ? Math.round(tigerScore / tigerMoveCount) : 0} | 
                  Goats avg {goatMoveCount > 0 ? Math.round(goatScore / goatMoveCount) : 0}
                </p>
              </div>
            )}
            
            {isComputerThinking && <p style={{ color: 'blue' }}>Computer is thinking...</p>}
          </div>
        )}
        <button onClick={resetGame}>Reset</button>
        <textarea ref={outputRef} readOnly style={{ width: '100%', height: '100px' }}></textarea>
      </div>
    </div>
  );
}

function getPositionByIndex(index) {
  const positions = [
    [0, 231], [129, 24], [129, 148], [129, 204], [129, 261], [129, 310], [129, 435],
    [191, 24], [191, 116], [191, 193], [191, 275], [191, 342], [191, 440],
    [253, 24], [253, 85], [253, 183], [253, 289], [253, 376], [253, 435],
    [370, 20], [370, 160], [370, 313], [370, 440]
  ];
  return positions[index] || [0, 0];
}

export default TigersAndGoats;