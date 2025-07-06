// App.jsx
import React, { useEffect, useRef, useState } from 'react';
import { GameState, arraysEqual } from '../utils/gameEngine.js';
import '../styles/TigerAndGoats.css';

import TigerImg from '../images/Tiger.png';
import GoatImg from '../images/Goat.png';

import ComputerTypeOverlay from './ComputerTypeOverlay';
import HelpOverlay from './HelpOverlay';
import goatBleatSound from '../sounds/goat_blead.mp3';
import GameBGMusic from '../sounds/GameBG 14.mp3';

import promoteSound from '../sounds/promote.mp3';
import tickSound from '../sounds/ticktick.mp3'; 
import BoardBackground from './BoardBackground';



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
import ResultOverlay from './ResultOverlay';

const BOARD_WIDTH = 500;
const BOARD_HEIGHT = 400;
const PIECE_SIZE = 50;
const BOARD_PADDING = 5; // Padding for gap between border and board image
const  GAME_TIME_LIMIT = 300;
const FIXED_POSITIONS = [
  [1, 231], [129, 24], [129, 148], [129, 204], [129, 261], [129, 310], [129, 435],
  [191, 24], [191, 116], [191, 193], [191, 275], [191, 342], [191, 440],
  [248, 24], [248, 85], [248, 183], [248, 289], [248, 376], [248, 435],
  [354, 20], [354, 160], [354, 313], [354, 440]
];

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


function TigersAndGoats({ userID, level, difficulty: propDifficulty }) {
  const [gameState, setGameState] = useState(null);
  const [isInProgress, setIsInProgress] = useState(false);
  const [selectedId, setSelectedId] = useState(-1);
  const [computerPlaysAs, setComputerPlaysAs] = useState(null);
  const [moveHistory, setMoveHistory] = useState({ pointer: 0, states: [] });
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [selectedType, setSelectedType] = useState(0);
  const [difficulty, setDifficulty] = useState(propDifficulty || 'hard'); 
 
  
  // Move quality scoring states
  const [tigerScore, setTigerScore] = useState(0);
  const [goatScore, setGoatScore] = useState(0);
  const [tigerMoveCount, setTigerMoveCount] = useState(0);
  const [goatMoveCount, setGoatMoveCount] = useState(0);
  const [lastMoveScore, setLastMoveScore] = useState(null);
  const [lastMovePlayer, setLastMovePlayer] = useState(null);
  const [lastMoveTo, setLastMoveTo] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(GAME_TIME_LIMIT);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [lastUserProb, setLastUserProb] = useState(0);
  const [showResultOverlay, setShowResultOverlay] = useState(false);

  const agentWorkerRef = useRef(null);
  const bestMoveRef = useRef(null);
  const bestScoreRef = useRef(null);
  const allMovesRef = useRef(null);
  const timeoutRef = useRef(null);
  const outputRef = useRef();
  const boardRef = useRef();
  const isInProgressRef = useRef(false);
  const isComputerThinkingRef = useRef(false);
  const computerPlaysAsRef = useRef(null);
  const timerRef = useRef(null);
  const [showHelpOverlay, setShowHelpOverlay] = useState(false);
  const [wasAudioPlaying, setWasAudioPlaying] = useState(false);
  const goatBleatRef = useRef(null);
  const bgMusicRef = useRef(null);
  const promoteRef = useRef(null);
  const tickAudioRef = useRef(null);

  useEffect(() => { isInProgressRef.current = isInProgress; }, [isInProgress]);
  useEffect(() => { isComputerThinkingRef.current = isComputerThinking; }, [isComputerThinking]);
  useEffect(() => { computerPlaysAsRef.current = computerPlaysAs; }, [computerPlaysAs]);
 
  useEffect(() => {
    const initState = new GameState();
    setGameState(initState);
    setMoveHistory({ pointer: 0, states: [initState] });
  }, []);

  // Timer effect
  useEffect(() => {
    if (isInProgress && !showHelpOverlay) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          if (prev > 0) return prev - 1;
          else return 0;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isInProgress, showHelpOverlay]);

  // End game if timer reaches 0
  useEffect(() => {
    if (isInProgress && elapsedTime === 0) {
      // End the game as draw
      setIsInProgress(false);
      setGameState((prev) => {
        if (prev && prev.Result === -1) {
          return { ...prev, Result: 3 };
        }
        return prev;
      });
    }
  }, [elapsedTime, isInProgress]);

  // Reset timer when game resets
  // useEffect(() => {
  //   if (!isInProgress) setElapsedTime(GAME_TIME_LIMIT);
  // }, [isInProgress]);

  // Format timer mm:ss
  const formatTime = (seconds) => {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

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
    
    // Play goat bleat sound if a goat is captured
    if (
      newGameState.CapturedGoats > currentGameState.CapturedGoats &&
      goatBleatRef.current
    ) {
      goatBleatRef.current.currentTime = 0;
      goatBleatRef.current.play();
    } else if (promoteRef.current) {
      // Play promote sound for all other actions
      promoteRef.current.currentTime = 0;
      promoteRef.current.play();
    }
    
    // Calculate move quality score
    const moveQuality = evaluateDetailedMoveQuality(currentGameState, newGameState, action, currentPlayer);
    console.log(tigerScore, goatScore)
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
      let userSide = (computerPlaysAs === 0) ? 1 : 0;
      let totalScore = Math.abs(tigerScore) + Math.abs(goatScore);
      let userProb = 0;
      if (totalScore > 0) {
        userProb = Math.round((userSide === 0 ? tigerScore : goatScore) / totalScore * 100);
        userProb = Math.max(0, Math.min(100, userProb));
      } 
      console.log("Score", userProb)
      setLastUserProb(userProb);
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
    
    // Store all moves from different depths for medium difficulty
    let allMovesFromDepths = [];
    
    worker.onmessage = (e) => {
        const [score, action, depth] = e.data;
        
        bestScoreRef.current = score;
        bestMoveRef.current = action;
        
        // Store moves from each depth for medium difficulty analysis
        allMovesFromDepths.push({ score, action, depth });
        
        if (outputRef.current) {
          outputRef.current.value += `\nAgent: ${currentGameState.SideToPlay === 0 ? 'Tigers' : 'Goats'} | Depth: ${depth} | Score: ${score}`;
        }
        
        // Apply difficulty-based move selection even with AI
        let finalMove = action; 
     
        if (difficulty === 'medium') {
            // Check if this is every 5th move (assuming moveHistory tracks total moves)
            const totalMoves = (currentGameState.SideToPlay === 0  ) ?tigerMoveCount : goatMoveCount;
            const shouldMakeSuboptimalMove = (totalMoves %5 === 0); // Every 5th move (0-indexed)
            console.log("shouldMakeSuboptimalMove", shouldMakeSuboptimalMove, totalMoves)
            if (shouldMakeSuboptimalMove) {
                // Find alternative moves that are not:
                // 1. The best move from the deepest search
                // 2. Capture moves (action[1] !== -1)
                console.log('suboptimal');
                const bestMoveFromDeepest = action;
                const alternativeMoves = legalActions.filter(move => {
                    // Not the best move from deepest search
                    const notBestMove = !(move[0] === bestMoveFromDeepest[0] && 
                                         move[1] === bestMoveFromDeepest[1] && 
                                         move[2] === bestMoveFromDeepest[2]);
                    
                    // Not a capture move (assuming capture moves have action[1] !== -1)
                    const notCaptureMove = move[1] === -1;
                    
                    return notBestMove && notCaptureMove;
                });
                console.log(alternativeMoves);
                if (alternativeMoves.length > 0) {
                    // Select a random alternative move or use some other heuristic
                    // You could also pick the second-best non-capture move here
                    finalMove = alternativeMoves[Math.floor(Math.random() * alternativeMoves.length)];
                    bestMoveRef.current  = finalMove;
                    console.log(`Medium difficulty: Making suboptimal move on turn ${totalMoves + 1}`); 
                    // executeMove(finalMove, currentGameState);
                    // return;
                } else {
                    // If no valid alternatives, fall back to best move
                    finalMove = bestMoveFromDeepest;
                    bestMoveRef.current  = finalMove;
                    console.log(`Medium difficulty: No valid alternatives found, using best move`);
                }
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

  useEffect(() => {
    if (bgMusicRef.current) {
      bgMusicRef.current.muted = isMusicMuted;
      if (!isMusicMuted && !showHelpOverlay) {
        bgMusicRef.current.play().catch(() => {});
      } else {
        bgMusicRef.current.pause();
      }
    }
  }, [isMusicMuted, showHelpOverlay]);

  // Optionally, auto-play on mount
  useEffect(() => {
    if (bgMusicRef.current) {
      bgMusicRef.current.volume = 0.5;
      bgMusicRef.current.loop = true;
      bgMusicRef.current.play().catch(() => {});
    }
  }, []);

  const handleMusicToggle = () => {
    setIsMusicMuted((prev) => !prev);
  };

  const handleHelpClick = () => {
    // Store current audio state before opening help
    if (bgMusicRef.current) {
      setWasAudioPlaying(!bgMusicRef.current.paused && !isMusicMuted);
    }
    setShowHelpOverlay(true);
  };

  const handleHelpClose = () => {
    setShowHelpOverlay(false);
    // Resume audio if it was playing before help was opened
    if (wasAudioPlaying && bgMusicRef.current && !isMusicMuted) {
      bgMusicRef.current.play().catch(() => {});
    }
  };

  // Play ticking sound in last 10 seconds
  useEffect(() => {
    if (!tickAudioRef.current) return;
    if (isInProgress && !showHelpOverlay && elapsedTime > 0 && elapsedTime <= 10) {
      tickAudioRef.current.loop = true;
      tickAudioRef.current.currentTime = 0;
      tickAudioRef.current.play().catch(() => {});
    } else {
      tickAudioRef.current.pause();
      tickAudioRef.current.currentTime = 0;
    }
  }, [elapsedTime, isInProgress, showHelpOverlay]);

  // Calculate real-time user win chance
  let userWinChance = 0;
  const totalScore = Math.abs(tigerScore) + Math.abs(goatScore);
  const userSide = (computerPlaysAs === 0) ? 1 : 0;
  if (totalScore > 0) {
    userWinChance = Math.round((userSide === 0 ? tigerScore : goatScore) / totalScore * 100);
    userWinChance = Math.max(0, Math.min(100, userWinChance));
  }

  // Show userID, level, mode, and difficulty in bottom left for testing
  const debugInfo = (
    <div style={{
      position: 'fixed',
      bottom: 10,
      left: 10,
      zIndex: 9999,
      background: 'rgba(255,255,255,0.85)',
      borderRadius: 8,
      padding: 8,
      fontSize: 15,
      boxShadow: '0 2px 8px #b8860b44',
      color: '#7c5a1a',
      fontFamily: 'monospace',
    }}>
      <div>UserID: {userID}</div>
      <div>Level: {level}</div>
      <div>Difficulty: {difficulty}</div>
    </div>
  );

  // Send game result to parent window when game ends
  useEffect(() => { 
    console.log("Game over")
    if (!gameState || gameState.Result === -1) return;
    
    // Determine user side (0 = Tiger, 1 = Goat)
    const userSide = (computerPlaysAs === 0) ? 1 : 0;

    // Get probability/advantage for timeout (from lastUserProb)

    let points = 0;
    if (
      (gameState.Result === 0 && userSide === 0) ||
      (gameState.Result === 1 && userSide === 1)
    ) {
      points = 100;
    } else if (gameState.Result === 2) {
      points = 50;
    } else if (gameState.Result === 3) { 

      let userSide = (computerPlaysAs === 0) ? 1 : 0;
      let totalScore = Math.abs(tigerScore) + Math.abs(goatScore);
      let userProb = 0;
      if (totalScore > 0) {
        userProb = Math.round((userSide === 0 ? tigerScore : goatScore) / totalScore * 100);
        userProb = Math.max(0, Math.min(100, userProb));
      } 
      console.log("Score", userProb)
      setLastUserProb(userProb);
      points = Math.round(userProb || 0);
    } else {
      points = 0;
    }

    // Calculate time taken
    const timeTaken = GAME_TIME_LIMIT - elapsedTime;

    const gameResult = {
      type: "levelComplete",
      data: {
        level: level,
        timeTaken: timeTaken,
        points: points,
      },
    };

    window.parent.postMessage(gameResult, "*");
    
  }, [gameState && gameState.Result]);

  // Show result overlay with delay after game ends
  useEffect(() => {
    if (!gameState) return;
    if (gameState.Result !== -1) {
      setShowResultOverlay(false);
      const timeout = setTimeout(() => {
        setShowResultOverlay(true);
      }, 700); // 700ms delay
      return () => clearTimeout(timeout);
    } else {
      setShowResultOverlay(false);
    }
  }, [gameState && gameState.Result]);

  return (
    <div className="tng-root" style={{ position: 'relative', overflow: 'hidden' }}>
      <BoardBackground 
        onMuteClick={handleMusicToggle}
        onHelpClick={handleHelpClick}
        isMuted={isMusicMuted}
        timerValue={formatTime(elapsedTime)}
        winChanceValue={userWinChance}
        timerCritical={elapsedTime <= 10}
        gameState={gameState}
        selectedId={selectedId}
        lastMoveTo={lastMoveTo}
        handleUserClick={handleUserClick}
        PIECE_SIZE={PIECE_SIZE}
        FIXED_POSITIONS={FIXED_POSITIONS}
        isComputerThinking={isComputerThinking}
      />
      {/* Audio for goat bleat */}
      <audio ref={goatBleatRef} src={goatBleatSound} preload="auto" />
      {/* Audio for promote (action) */}
      <audio ref={promoteRef} src={promoteSound} preload="auto" />
      {/* Background music */}
      <audio ref={bgMusicRef} src={GameBGMusic} preload="auto" loop />
      {/* Ticking sound for last 10 seconds */}
      <audio ref={tickAudioRef} src={tickSound} preload="auto" />
      {/* Navbar */}
   
      <div className="tng-main-flex">
        {/* Details on the right removed, now in SVG */}
      </div>
      {/* Overlay remains above everything */}
      {showOverlay && (
        <ComputerTypeOverlay
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          onStart={handleOverlayStart}
        />
      )}
      {/* Result Overlay */}
      {showResultOverlay && gameState && gameState.Result !== -1 && (
        <ResultOverlay
          result={gameState.Result}
          onClose={resetGame}
          TigerImg={TigerImg}
          GoatImg={GoatImg}
          tigerScore={tigerScore}
          goatScore={goatScore}
          computerPlaysAs = {computerPlaysAs}
        />
      )}
      {showHelpOverlay && (
          <HelpOverlay onClose={handleHelpClose} />
        )}
      {/* {debugInfo} */}
    </div>
  );
}

export default TigersAndGoats;