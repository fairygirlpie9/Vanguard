
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sendMetric, sendEvent } from '../services/datadogService';

// --- SHARED UTILS ---
const MORSE_CODE: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
  '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
  '8': '---..', '9': '----.'
};

// Helper to calculate and send the composite proficiency metric
const updateProficiencyMetric = () => {
    const s = parseInt(localStorage.getItem('vanguard_snake_highscore') || '0');
    const m = parseInt(localStorage.getItem('vanguard_memory_highscore') || '0');
    const c = parseInt(localStorage.getItem('vanguard_morse_highscore') || '0');
    
    // Formula: Snake/50 + Memory/10 + Morse/20 (Normalized)
    const prof = Math.min(100, Math.round( ((s/50) + (m/10) + (c/20)) / 3 * 100 ));
    sendMetric('vanguard.training.proficiency', prof);
};

// --- SNAKE GAME LOGIC ---
const GRID_SIZE = 20;
const CELL_SIZE = 20;

const SnakeGame: React.FC = () => {
  const [snake, setSnake] = useState<{x:number, y:number}[]>([{x: 10, y: 10}]);
  const [food, setFood] = useState<{x:number, y:number}>({x: 15, y: 15});
  const [dir, setDir] = useState<{x:number, y:number}>({x: 1, y: 0});
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameLoop, setGameLoop] = useState<ReturnType<typeof setInterval> | null>(null);

  // Load High Score
  useEffect(() => {
    const stored = localStorage.getItem('vanguard_snake_highscore');
    if (stored) setHighScore(parseInt(stored));
  }, []);

  // --- METRIC SENDING ---
  useEffect(() => {
      sendMetric('vanguard.simulation.snake_score', score);
      // Also update aggregate proficiency (using current high score if better)
      updateProficiencyMetric();
  }, [score]);

  // Handle Game Over High Score Persistence
  useEffect(() => {
    if (gameOver) {
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('vanguard_snake_highscore', score.toString());
            updateProficiencyMetric(); // Update with new high score
            sendEvent('New High Score: Snake', `User achieved new record: ${score}`, 'success');
        }
    }
  }, [gameOver]);

  const generateFood = () => {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
  };

  const resetGame = () => {
    setSnake([{x: 10, y: 10}]);
    setFood(generateFood());
    setDir({x: 1, y: 0});
    setGameOver(false);
    setScore(0);
  };

  const moveSnake = useCallback(() => {
    if (gameOver) return;

    setSnake(prev => {
      const newHead = { x: prev[0].x + dir.x, y: prev[0].y + dir.y };

      // Check collision walls
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setGameOver(true);
        return prev;
      }
      // Check collision self
      if (prev.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        setGameOver(true);
        return prev;
      }

      const newSnake = [newHead, ...prev];
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood());
      } else {
        newSnake.pop();
      }
      return newSnake;
    });
  }, [dir, food, gameOver]);

  useEffect(() => {
    if (gameOver) {
        if (gameLoop) clearInterval(gameLoop);
        return;
    }
    const interval = setInterval(moveSnake, 150);
    setGameLoop(interval);
    return () => clearInterval(interval);
  }, [moveSnake, gameOver]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
        switch(e.key) {
            case 'ArrowUp': if(dir.y === 0) setDir({x:0, y:-1}); break;
            case 'ArrowDown': if(dir.y === 0) setDir({x:0, y:1}); break;
            case 'ArrowLeft': if(dir.x === 0) setDir({x:-1, y:0}); break;
            case 'ArrowRight': if(dir.x === 0) setDir({x:1, y:0}); break;
        }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dir]);

  // Touch controls handlers - Preventing Default to stop scroll interference
  const handleTouchDir = (d: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', e?: React.MouseEvent | React.TouchEvent) => {
      if (e) e.preventDefault();
      if (gameOver) return;
      
      switch(d) {
        case 'UP': if(dir.y === 0) setDir({x:0, y:-1}); break;
        case 'DOWN': if(dir.y === 0) setDir({x:0, y:1}); break;
        case 'LEFT': if(dir.x === 0) setDir({x:-1, y:0}); break;
        case 'RIGHT': if(dir.x === 0) setDir({x:1, y:0}); break;
      }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-black border border-tech-border w-full max-w-md mx-auto">
        <div className="flex justify-between w-full max-w-[400px] mb-4 text-tech-primary font-mono text-sm uppercase">
            <span>Supply Run</span>
            <div className="flex space-x-4">
                <span className="text-gray-500">HI: {highScore}</span>
                <span>Score: {score}</span>
            </div>
        </div>
        
        {/* Game Area */}
        <div className="w-full aspect-square flex items-center justify-center mb-6 overflow-hidden">
            <div 
                className="relative bg-tech-panel border-2 border-tech-border origin-center touch-none"
                style={{ 
                    width: GRID_SIZE * CELL_SIZE, 
                    height: GRID_SIZE * CELL_SIZE,
                    transform: 'scale(min(1, 0.8))', // Basic scaling for smaller screens
                    touchAction: 'none' // CRITICAL FOR IPAD: Prevents browser scrolling when swiping inside
                }}
            >
                {gameOver && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
                        <h3 className="text-tech-alert font-bold text-xl uppercase tracking-widest mb-2">Failure</h3>
                        <button onClick={resetGame} className="px-6 py-3 border border-tech-primary text-tech-primary hover:bg-tech-primary hover:text-black active:bg-tech-primary active:text-black uppercase text-sm font-bold">Retry</button>
                    </div>
                )}
                {/* Snake */}
                {snake.map((seg, i) => (
                    <div 
                        key={i}
                        className="absolute bg-tech-primary"
                        style={{
                            left: seg.x * CELL_SIZE,
                            top: seg.y * CELL_SIZE,
                            width: CELL_SIZE - 2,
                            height: CELL_SIZE - 2,
                            opacity: i === 0 ? 1 : 0.5
                        }}
                    />
                ))}
                {/* Food */}
                <div 
                    className="absolute bg-tech-secondary animate-pulse"
                    style={{
                        left: food.x * CELL_SIZE,
                        top: food.y * CELL_SIZE,
                        width: CELL_SIZE - 2,
                        height: CELL_SIZE - 2
                    }}
                />
            </div>
        </div>
        
        {/* Mobile Controls - Enhanced tap targets */}
        <div className="grid grid-cols-3 gap-3 w-56">
             <div></div>
             <button 
                onMouseDown={(e) => handleTouchDir('UP', e)} 
                onTouchStart={(e) => handleTouchDir('UP', e)}
                className="h-16 bg-tech-panel border border-tech-border text-tech-primary active:bg-tech-primary active:text-black rounded text-2xl font-bold touch-manipulation"
             >
                ▲
             </button>
             <div></div>
             <button 
                onMouseDown={(e) => handleTouchDir('LEFT', e)}
                onTouchStart={(e) => handleTouchDir('LEFT', e)}
                className="h-16 bg-tech-panel border border-tech-border text-tech-primary active:bg-tech-primary active:text-black rounded text-2xl font-bold touch-manipulation"
             >
                ◀
             </button>
             <button 
                onMouseDown={(e) => handleTouchDir('DOWN', e)}
                onTouchStart={(e) => handleTouchDir('DOWN', e)}
                className="h-16 bg-tech-panel border border-tech-border text-tech-primary active:bg-tech-primary active:text-black rounded text-2xl font-bold touch-manipulation"
             >
                ▼
             </button>
             <button 
                onMouseDown={(e) => handleTouchDir('RIGHT', e)}
                onTouchStart={(e) => handleTouchDir('RIGHT', e)}
                className="h-16 bg-tech-panel border border-tech-border text-tech-primary active:bg-tech-primary active:text-black rounded text-2xl font-bold touch-manipulation"
             >
                ▶
             </button>
        </div>
        <div className="mt-4 text-xs text-gray-500 uppercase tracking-widest hidden md:block">
            Keyboard or Pad to Navigate
        </div>
    </div>
  );
};

// --- MEMORY GAME LOGIC ---
const MemoryGame: React.FC = () => {
    const [sequence, setSequence] = useState<number[]>([]);
    const [playerSeq, setPlayerSeq] = useState<number[]>([]);
    const [playing, setPlaying] = useState(false);
    const [flash, setFlash] = useState<number | null>(null);
    const [msg, setMsg] = useState("PRESS START");
    const [round, setRound] = useState(0);
    const [highScore, setHighScore] = useState(0);

    const colors = ['#00ff41', '#ef4444', '#0ea5e9', '#eab308'];

    useEffect(() => {
        const stored = localStorage.getItem('vanguard_memory_highscore');
        if (stored) setHighScore(parseInt(stored));
    }, []);

    // --- METRIC SENDING ---
    useEffect(() => {
        if (round > 0) {
            sendMetric('vanguard.simulation.memory_level', round);
            updateProficiencyMetric();
        }
    }, [round]);

    const playSequence = async (seq: number[]) => {
        setPlaying(true);
        setMsg("OBSERVE PATTERN");
        for (let i = 0; i < seq.length; i++) {
            await new Promise(r => setTimeout(r, 500));
            setFlash(seq[i]);
            await new Promise(r => setTimeout(r, 500));
            setFlash(null);
        }
        setPlaying(false);
        setMsg("REPEAT PATTERN");
    };

    const startGame = () => {
        const startSeq = [Math.floor(Math.random() * 4)];
        setSequence(startSeq);
        setPlayerSeq([]);
        setRound(1);
        playSequence(startSeq);
    };

    const handlePress = (idx: number) => {
        if (playing) return;
        
        // Visual feedback
        setFlash(idx);
        setTimeout(() => setFlash(null), 200);

        const newPlayerSeq = [...playerSeq, idx];
        setPlayerSeq(newPlayerSeq);

        // Check correct
        if (newPlayerSeq[newPlayerSeq.length - 1] !== sequence[newPlayerSeq.length - 1]) {
            setMsg("INCORRECT - SEQ BROKEN");
            
            // Check High Score
            if (round > highScore) {
                setHighScore(round);
                localStorage.setItem('vanguard_memory_highscore', round.toString());
                updateProficiencyMetric(); // Update composite
                sendEvent('New High Score: Memory', `User achieved new level: ${round}`, 'success');
            }
            
            setSequence([]);
            return;
        }

        // Check if round complete
        if (newPlayerSeq.length === sequence.length) {
            setMsg("CORRECT - NEXT LEVEL");
            setTimeout(() => {
                const nextSeq = [...sequence, Math.floor(Math.random() * 4)];
                setSequence(nextSeq);
                setPlayerSeq([]);
                // Level increases here, triggering the useEffect above
                setRound(r => r + 1);
                playSequence(nextSeq);
            }, 1000);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-black border border-tech-border w-full max-w-md mx-auto">
            <div className="flex justify-between w-full max-w-[300px] mb-4 text-tech-secondary font-mono text-sm uppercase">
                <span>Signal Decrypt</span>
                <div className="flex space-x-4">
                    <span className="text-gray-500">MAX: {highScore}</span>
                    <span>Level: {round}</span>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
                {[0, 1, 2, 3].map(i => (
                    <button
                        key={i}
                        onClick={() => handlePress(i)}
                        className={`w-28 h-28 border-2 transition-all duration-100 ${
                            flash === i 
                            ? `bg-[${colors[i]}] border-[${colors[i]}] shadow-[0_0_20px_${colors[i]}] scale-95`
                            : 'bg-black border-gray-700 hover:border-gray-500 active:border-white'
                        }`}
                        style={{
                            backgroundColor: flash === i ? colors[i] : 'transparent',
                            borderColor: flash === i ? colors[i] : '#333'
                        }}
                    />
                ))}
            </div>

            <div className="text-center space-y-4">
                <div className="text-tech-primary font-mono text-xs uppercase tracking-widest h-4">{msg}</div>
                {sequence.length === 0 && (
                    <button onClick={startGame} className="px-6 py-3 bg-tech-secondary text-black font-bold uppercase text-sm hover:bg-white active:bg-white active:scale-95 transition-all">
                        Initialize
                    </button>
                )}
            </div>
        </div>
    );
};

// --- MORSE CODE GAME ---
const MorseGame: React.FC = () => {
    const [target, setTarget] = useState<string>('');
    const [input, setInput] = useState<string>('');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [status, setStatus] = useState<'IDLE' | 'CORRECT' | 'WRONG'>('IDLE');
    const [showCheat, setShowCheat] = useState(false);

    const keys = Object.keys(MORSE_CODE);

    useEffect(() => {
        const stored = localStorage.getItem('vanguard_morse_highscore');
        if (stored) setHighScore(parseInt(stored));
    }, []);

    // --- METRIC SENDING ---
    useEffect(() => {
        sendMetric('vanguard.simulation.morse_score', score);
        updateProficiencyMetric();
    }, [score]);

    const nextRound = () => {
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        setTarget(randomKey);
        setInput('');
        setStatus('IDLE');
    };

    useEffect(() => {
        nextRound();
    }, []);

    const handleInput = (char: '.' | '-') => {
        setInput(prev => prev + char);
    };

    const checkAnswer = () => {
        if (input === MORSE_CODE[target]) {
            setStatus('CORRECT');
            const newScore = score + 1;
            setScore(newScore); // Triggers useEffect to send metric
            
            if (newScore > highScore) {
                setHighScore(newScore);
                localStorage.setItem('vanguard_morse_highscore', newScore.toString());
                updateProficiencyMetric(); // Update composite with new high score
                sendEvent('New High Score: Morse', `User achieved new score: ${newScore}`, 'success');
            }

            setTimeout(nextRound, 1000);
        } else {
            setStatus('WRONG');
            setInput('');
            setScore(0); // Triggers useEffect to send 0
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-black border border-tech-border w-full max-w-md mx-auto">
             <div className="flex justify-between w-full max-w-[300px] mb-4 text-tech-warning font-mono text-sm uppercase">
                <span>Morse Trainer</span>
                <div className="flex space-x-4">
                    <span className="text-gray-500">HI: {highScore}</span>
                    <span>Score: {score}</span>
                </div>
            </div>

            <div className="bg-tech-panel border border-tech-border w-full p-6 mb-6 text-center relative overflow-hidden">
                <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">Target Character</div>
                <div className="text-6xl font-bold text-white mb-2">{target}</div>
                <div className="h-8 font-mono text-xl text-tech-secondary tracking-[0.2em]">{input || '_'}</div>
                
                {status === 'CORRECT' && <div className="absolute inset-0 bg-tech-primary/20 flex items-center justify-center text-tech-primary font-bold tracking-widest uppercase">Match Confirmed</div>}
                {status === 'WRONG' && <div className="absolute inset-0 bg-tech-alert/20 flex items-center justify-center text-tech-alert font-bold tracking-widest uppercase">Signal Mismatch</div>}
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-[300px] mb-6">
                <button onClick={() => handleInput('.')} className="h-24 bg-black border border-tech-primary text-tech-primary text-5xl hover:bg-tech-primary hover:text-black active:bg-tech-primary active:text-black font-bold active:scale-95 transition-all rounded">•</button>
                <button onClick={() => handleInput('-')} className="h-24 bg-black border border-tech-primary text-tech-primary text-5xl hover:bg-tech-primary hover:text-black active:bg-tech-primary active:text-black font-bold active:scale-95 transition-all rounded">—</button>
            </div>

            <div className="flex space-x-4 w-full max-w-[300px]">
                <button onClick={() => setInput('')} className="flex-1 py-4 border border-gray-600 text-gray-500 hover:border-gray-400 active:bg-gray-800 text-xs uppercase tracking-widest">CLR</button>
                <button onClick={checkAnswer} className="flex-[2] py-4 bg-tech-warning text-black font-bold uppercase tracking-widest hover:bg-white active:bg-white active:scale-95">Transmit</button>
            </div>

            <button onClick={() => setShowCheat(!showCheat)} className="mt-6 text-xs text-gray-600 underline decoration-dotted uppercase p-2">
                {showCheat ? 'Hide Cipher' : 'Show Cipher'}
            </button>
            
            {showCheat && (
                <div className="mt-4 grid grid-cols-6 gap-2 text-xs font-mono text-gray-500 w-full">
                    {keys.map(k => (
                        <div key={k} className={k === target ? 'text-tech-primary font-bold' : ''}>{k} {MORSE_CODE[k]}</div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- MAIN SIMULATION WRAPPER ---
const Simulation: React.FC = () => {
  const [mode, setMode] = useState<'snake' | 'memory' | 'morse'>('snake');

  return (
    <div className="h-full flex flex-col font-tech border border-tech-border bg-black relative shadow-[0_0_20px_rgba(0,0,0,0.8)]">
       <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] z-10"></div>
       
       <div className="bg-tech-panel p-4 border-b border-tech-border flex flex-col md:flex-row justify-between items-center z-20 gap-4">
            <div className="flex items-center space-x-2">
                <span className="text-xl">🎮</span>
                <h2 className="text-lg font-bold text-gray-200 uppercase tracking-widest">Training Modules</h2>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
                <button 
                    onClick={() => setMode('snake')} 
                    className={`px-4 py-2 text-xs uppercase font-bold border transition-colors ${mode === 'snake' ? 'bg-tech-primary text-black border-tech-primary' : 'text-gray-500 border-gray-700 hover:border-gray-500'}`}
                >
                    Reflex
                </button>
                <button 
                    onClick={() => setMode('memory')} 
                    className={`px-4 py-2 text-xs uppercase font-bold border transition-colors ${mode === 'memory' ? 'bg-tech-secondary text-black border-tech-secondary' : 'text-gray-500 border-gray-700 hover:border-gray-500'}`}
                >
                    Cognition
                </button>
                <button 
                    onClick={() => setMode('morse')} 
                    className={`px-4 py-2 text-xs uppercase font-bold border transition-colors ${mode === 'morse' ? 'bg-tech-warning text-black border-tech-warning' : 'text-gray-500 border-gray-700 hover:border-gray-500'}`}
                >
                    Signals
                </button>
            </div>
       </div>

       <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 z-20 bg-grid-pattern bg-[length:20px_20px] overflow-y-auto">
           <div className="mb-6 text-center">
               <h3 className="text-tech-primary font-bold text-xl uppercase tracking-[0.2em] crt-glow">
                   {mode === 'snake' ? 'Supply Run' : mode === 'memory' ? 'Signal Decrypt' : 'Morse Intercept'}
               </h3>
               <p className="text-gray-500 text-xs font-mono mt-2 uppercase">
                   {mode === 'snake' && 'Objective: Secure resources. Avoid termination.'}
                   {mode === 'memory' && 'Objective: Memorize and replicate signal patterns.'}
                   {mode === 'morse' && 'Objective: Transcribe alpha-numerics to signal code.'}
               </p>
           </div>
           
           {mode === 'snake' && <SnakeGame />}
           {mode === 'memory' && <MemoryGame />}
           {mode === 'morse' && <MorseGame />}
       </div>
    </div>
  );
};

export default Simulation;
