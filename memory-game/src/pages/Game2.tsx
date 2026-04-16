import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Battery, Play, Trophy, Clock, Hourglass } from 'lucide-react';
import { useStore } from '../store/useStore';
import BatteryAlertModal from '../components/BatteryAlertModal';

const assets = [
  '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', 
  '🚚', '🚜', '🏍️', '🛵', '🚲', '🛴', '🚀', '🛸', '🚁', '🛶',
  '✈️', '⛵', '🚤', '⛴️', '🛳️', '🚢', '⚓', '⛽', '🚧', '🚦',
  '🚥', '🚇', '🚈', '🚉', '🚊', '🚆', '🚄', '🚅', '🚂', '🚃'
];

export default function Game2() {
  const navigate = useNavigate();
  const battery = useStore((state) => state.battery);
  const reviveItems = useStore((state) => state.reviveItems);
  const decrementBattery = useStore((state) => state.decrementBattery);
  const useReviveItem = useStore((state) => state.useReviveItem);
  const game2Records = useStore((state) => state.game2Records) || [];
  const addGame2Record = useStore((state) => state.addGame2Record);
  const memorizeTime = useStore((state) => state.game2Config?.memorizeTime || 3);
  // Read levels array from store (backed by serverConfig or defaults)
  const defaultLevels = [
    { level: 1, cardsPerTurn: 1, difficulty: '⭐', desc: '每次出现1张新图片' },
    { level: 2, cardsPerTurn: 2, difficulty: '⭐⭐', desc: '每次出现2张新图片' },
    { level: 3, cardsPerTurn: 3, difficulty: '⭐⭐⭐', desc: '每次出现3张新图片' },
    { level: 4, cardsPerTurn: 4, difficulty: '⭐⭐⭐⭐', desc: '每次出现4张新图片' },
    { level: 5, cardsPerTurn: 5, difficulty: '⭐⭐⭐⭐⭐', desc: '每次出现5张新图片' },
  ];
  const levelsConfig = useStore((state) => state.game2Config?.levels && state.game2Config.levels.length > 0 ? state.game2Config.levels : defaultLevels);
  const unlockedLevel = useStore((state) => state.game2Level);
  const currentUser = useStore((state) => state.user);

  const [gameState, setGameState] = useState<'level-select' | 'ready' | 'memorize' | 'select' | 'lose' | 'win'>('level-select');
  const [difficulty, setDifficulty] = useState<'normal' | 'hard'>('normal');
  const [selectedLevel, setSelectedLevel] = useState(unlockedLevel || 1);
  const [history, setHistory] = useState<string[]>([]); // All cards seen so far
  const [currentNewCards, setCurrentNewCards] = useState<string[]>([]); // The N new cards shown in memorize phase
  const [pendingNewCards, setPendingNewCards] = useState<string[]>([]); // The cards user still needs to click this turn
  const [shuffledCards, setShuffledCards] = useState<string[]>([]);
  const [hardModeSlots, setHardModeSlots] = useState<(string | null)[]>(Array(assets.length).fill(null));
  const [score, setScore] = useState(0);
  const [showBatteryAlert, setShowBatteryAlert] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [infoModal, setInfoModal] = useState<'battery' | 'hourglass' | null>(null);
  
  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Filter records by selected level and mode
  const currentLevelRecords = game2Records.filter(r => 
    r.userId === currentUser?.id &&
    (r.level === selectedLevel || (!r.level && selectedLevel === 1)) && 
    (r.difficulty === difficulty || (!r.difficulty && difficulty === 'normal'))
  );
  
  // Get highest record for this level and mode
  const highestRecord = [...currentLevelRecords].sort((a, b) => b.score - a.score)[0] || { score: 0, timeSpent: 0 };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m > 0 ? `${m}分` : ''}${s}秒`;
  };

  const startGame = () => {
    if (battery <= 0) {
      setShowBatteryAlert(true);
      return;
    }
    if (!decrementBattery()) return;
    
    startRound();
  };

  const startRound = () => {
    const config = levelsConfig.find(l => l.level === selectedLevel) || levelsConfig[0];
    const N = config.cardsPerTurn;
    
    setHistory([]);
    setCurrentNewCards([]);
    setPendingNewCards([]);
    
    if (difficulty === 'normal') {
      setHardModeSlots(Array(assets.length).fill(null));
    } else {
      setShuffledCards([]);
    }
    
    setScore(0);
    setCountdown(memorizeTime);
    setGameState('memorize');
    
    timerRef.current = Date.now();
    startMemorizeTimer(N);
  };

  const startMemorizeTimer = (N: number) => {
    setCountdown(memorizeTime);
    let count = memorizeTime;
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setCountdown(0);
        
        // Phase 2: Show the FIRST N cards
        const shuffledAssets = [...assets].sort(() => 0.5 - Math.random());
        const initialCards = shuffledAssets.slice(0, N);
        
        setHistory([]);
        setCurrentNewCards(initialCards);
        setPendingNewCards(initialCards);
        
        if (difficulty === 'normal') {
          setHardModeSlots(() => {
            const newSlots = Array(assets.length).fill(null);
            const emptyIndices = Array.from({length: assets.length}, (_, i) => i).sort(() => 0.5 - Math.random());
            for (let i = 0; i < N; i++) {
              newSlots[emptyIndices[i]] = initialCards[i];
            }
            return newSlots;
          });
        } else {
          setShuffledCards([...initialCards]);
        }
        
        setGameState('select');
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  const handleRevive = () => {
    if (useReviveItem()) {
      setGameState('memorize');
      setCountdown(memorizeTime || 3);
    }
  };
  const endGame = (finalScore: number, isWin: boolean = false) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const elapsed = timerRef.current ? Math.floor((Date.now() - timerRef.current) / 1000) : 0;
    setTimeSpent(elapsed);
    addGame2Record({
      score: finalScore,
      timeSpent: elapsed,
      timestamp: Date.now(),
      level: selectedLevel,
      difficulty: difficulty
    });
    setGameState(isWin ? 'win' : 'lose');
  };

  const handleCardClick = (card: string) => {
    if (gameState !== 'select') return;
    
    if (pendingNewCards.includes(card)) {
      const newScore = score + 1;
      setScore(newScore);
      
      const newPending = pendingNewCards.filter(c => c !== card);
      setPendingNewCards(newPending);
      
      if (newPending.length === 0) {
        // Turn complete
        const newHistory = [...history, ...currentNewCards];
        setHistory(newHistory);
        
        const availableAssets = assets.filter(a => !newHistory.includes(a));
        const config = levelsConfig.find(l => l.level === selectedLevel) || levelsConfig[0];
        const N = config.cardsPerTurn;
        
        if (availableAssets.length < N) {
          // Not enough cards for another full turn -> Win!
          endGame(newScore, true);
          
          // Also update level unlock progress
          const updateCombo = useStore.getState().updateGame2Combo;
          updateCombo(true, selectedLevel);
          return;
        }
        
        const nextCards = [...availableAssets].sort(() => 0.5 - Math.random()).slice(0, N);
        setCurrentNewCards(nextCards);
        setPendingNewCards(nextCards);
        
        if (difficulty === 'normal') {
          setHardModeSlots(prevSlots => {
            const newSlots = [...prevSlots];
            const emptyIndices = newSlots.map((val, index) => val === null ? index : -1).filter(i => i !== -1);
            const selectedIndices = emptyIndices.sort(() => 0.5 - Math.random()).slice(0, N);
            selectedIndices.forEach((idx, i) => {
              if (nextCards[i]) {
                newSlots[idx] = nextCards[i];
              }
            });
            return newSlots;
          });
        } else {
          setShuffledCards([...newHistory, ...nextCards].sort(() => 0.5 - Math.random()));
        }
      }
    } else {
      // Picked a card not in pendingNewCards (either old history, or already clicked this turn)
      endGame(score);
    }
  };

  const currentLevelConfig = levelsConfig.find(l => l.level === selectedLevel) || levelsConfig[0];
  const currentN = currentLevelConfig.cardsPerTurn;
  const targetScore = Math.floor(assets.length / currentN) * currentN;

  return (
    <div className="flex flex-col h-full bg-purple-50">
      <header className="relative flex items-center justify-between p-4 bg-white shadow-sm shrink-0">
        <div className="flex-1 flex justify-start">
          <button onClick={() => {
            if (gameState === 'level-select') navigate(-1);
            else if (gameState === 'ready') setGameState('level-select');
            else setGameState('ready');
          }} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        
        <div className="flex-[2] text-xl font-bold text-gray-800 flex flex-col items-center text-center">
          {gameState === 'level-select' ? (
            <span>连续记忆训练</span>
          ) : gameState === 'ready' ? (
            <>
              <span>第 {selectedLevel} 关</span>
              <span className="text-sm text-purple-500 mt-0.5">
                {difficulty === 'normal' ? '普通模式' : '困难模式'}
              </span>
            </>
          ) : (
            <>
              <span>第 {selectedLevel} 关</span>
              <span className="text-sm text-purple-500 mt-0.5">
                已坚持 {score} 张 / 目标 {targetScore} 张
              </span>
            </>
          )}
        </div>
        
        <div className="flex-1" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-start p-4 relative overflow-y-auto">
        {gameState === 'level-select' && (
          <div className="w-full max-w-md space-y-4 pb-10">
            {/* Mode Selection */}
            <div className="flex justify-start space-x-2 mb-2">
              <button 
                onClick={() => setInfoModal('battery')}
                className="flex items-center space-x-1.5 text-gray-500 font-medium px-3 py-1.5 rounded-full text-xs transition active:scale-95 hover:bg-black/5"
              >
                <Battery className="w-4 h-4 text-green-500 shrink-0" />
                <span>{battery} 局</span>
              </button>
              <button 
                onClick={() => setInfoModal('hourglass')}
                className="flex items-center space-x-1.5 text-gray-500 font-medium px-3 py-1.5 rounded-full text-xs transition active:scale-95 hover:bg-black/5"
              >
                <Hourglass className="w-4 h-4 text-orange-400 shrink-0" />
                <span>{reviveItems} 个</span>
              </button>
            </div>
            
            <div className="bg-white rounded-3xl p-2 shadow-sm mb-6 flex space-x-2">
              <button
                onClick={() => setDifficulty('normal')}
                className={`flex-1 py-3 rounded-2xl font-bold transition-all ${
                  difficulty === 'normal' 
                    ? 'bg-purple-500 text-white shadow-md' 
                    : 'bg-transparent text-gray-500 hover:bg-gray-50'
                }`}
              >
                <div className="text-base">普通模式</div>
                <div className="text-xs font-normal opacity-80 mt-0.5">位置固定不变</div>
              </button>
              <button
                onClick={() => setDifficulty('hard')}
                className={`flex-1 py-3 rounded-2xl font-bold transition-all ${
                  difficulty === 'hard' 
                    ? 'bg-red-500 text-white shadow-md' 
                    : 'bg-transparent text-gray-500 hover:bg-gray-50'
                }`}
              >
                <div className="text-base">困难模式</div>
                <div className="text-xs font-normal opacity-80 mt-0.5">卡片位置随机</div>
              </button>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">选择关卡</h2>
            {levelsConfig.map((l) => {
              const isLocked = l.level > unlockedLevel;
              return (
                <button
                  key={l.level}
                  onClick={() => {
                    if (!isLocked) {
                      setSelectedLevel(l.level);
                      setGameState('ready');
                    }
                  }}
                  className={`w-full relative overflow-hidden rounded-2xl p-4 flex items-center justify-between shadow-sm transition transform ${
                    isLocked 
                      ? 'bg-gray-100 opacity-70 cursor-not-allowed' 
                      : 'bg-white hover:shadow-md active:scale-95'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                      isLocked ? 'bg-gray-200 text-gray-400' : 'bg-purple-100 text-purple-600'
                    }`}>
                      {l.level}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-gray-800">
                        第 {l.level} 关 
                        <span className="ml-2 text-yellow-400 text-sm">{(l as any).difficulty || '⭐'}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        每次出现 <span className="font-bold text-purple-500">{l.cardsPerTurn}</span> 张新图片
                      </div>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                    <Play className={`w-5 h-5 ${isLocked ? 'text-gray-300' : 'text-purple-500 ml-1'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {gameState === 'ready' && (
          <div className="w-full max-w-md space-y-6 pb-10 mt-4">
            {/* Highest Record */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
                <Trophy className="w-32 h-32" />
              </div>
              <h2 className="text-lg font-medium opacity-90 mb-1">历史最高记录</h2>
              <div className="flex items-end space-x-2">
                <span className="text-5xl font-bold">{highestRecord.score}</span>
                <span className="text-xl mb-1 opacity-90">张</span>
              </div>
              {highestRecord.timeSpent > 0 && (
                <div className="mt-2 text-sm opacity-80 flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>用时: {formatTime(highestRecord.timeSpent)}</span>
                </div>
              )}
            </div>

            {/* Start Button */}
            <button
              onClick={startGame}
              className={`w-full text-white font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 shadow-lg transition active:scale-95 ${
                difficulty === 'hard' ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-500 hover:bg-purple-600'
              }`}
            >
              <Play className="w-6 h-6" />
              <span className="text-xl">开始训练</span>
            </button>

            {/* History Records List */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <span>本关卡历史记录</span>
              </h3>
              
              <div className="space-y-3">
                {currentLevelRecords.length === 0 ? (
                  <p className="text-center text-gray-400 py-4">暂无训练记录</p>
                ) : (
                  currentLevelRecords.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800 text-lg">{record.score} 张</span>
                        <span className="text-xs text-gray-400">
                          {new Date(record.timestamp).toLocaleDateString()} {new Date(record.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-purple-600 font-medium bg-purple-100 px-3 py-1 rounded-full text-sm">
                        {formatTime(record.timeSpent)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {(gameState === 'memorize' || gameState === 'select') && (
          <div className="w-full h-full flex flex-col items-center pb-8 pt-4">
            <div className="mb-6 h-24 flex flex-col justify-center">
              {gameState === 'memorize' ? (
                <>
                  <h3 className="text-xl font-bold text-purple-600 text-center animate-pulse">
                    准备开始...
                  </h3>
                  <div className="text-4xl font-bold text-purple-500 text-center mt-2">
                    {countdown}
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <h3 className="text-xl font-bold text-purple-600">
                    请找出<span className="text-2xl text-red-500 mx-2 animate-pulse">新出现</span>的 {currentNewCards.length} 张卡片
                  </h3>
                  {pendingNewCards.length < currentNewCards.length && (
                    <div className="text-sm font-bold text-green-600 mt-2">
                      还差 {pendingNewCards.length} 张
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {difficulty === 'normal' ? (
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2 w-full max-w-md">
                {hardModeSlots.map((card, i) => {
                  const isFound = gameState === 'select' && currentNewCards.includes(card || '') && !pendingNewCards.includes(card || '');
                  return (
                    <button
                      key={`slot-${i}`}
                      disabled={!card || gameState === 'memorize' || isFound}
                      onClick={() => card && handleCardClick(card)}
                      className={`w-full aspect-square rounded-2xl flex items-center justify-center text-3xl sm:text-4xl transition-all ${
                        !card ? 'bg-transparent cursor-default' :
                        isFound ? 'bg-green-100 shadow-inner scale-95 opacity-50' :
                        'bg-white shadow-sm hover:bg-purple-50 active:scale-95 transform cursor-pointer animate-in zoom-in'
                      }`}
                    >
                      {card || ''}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-wrap content-start justify-center gap-1.5 sm:gap-2 w-full max-w-md">
                {shuffledCards.map((card, i) => {
                  const isFound = gameState === 'select' && currentNewCards.includes(card) && !pendingNewCards.includes(card);
                  return (
                    <button
                      key={i}
                      disabled={gameState === 'memorize' || isFound}
                      onClick={() => handleCardClick(card)}
                      className={`w-[calc(20%-6px)] sm:w-[calc(20%-8px)] aspect-square rounded-2xl flex items-center justify-center text-3xl sm:text-4xl transition-all ${
                        isFound ? 'bg-green-100 shadow-inner scale-95 opacity-50' :
                        'bg-white shadow-sm hover:bg-purple-50 active:scale-95 transform cursor-pointer animate-in zoom-in'
                      }`}
                    >
                      {card}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Win/Lose Modal */}
      {(gameState === 'lose' || gameState === 'win') && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl transform transition-all animate-in zoom-in-95 duration-200 translate-y-[60px]">
            <div className="text-7xl mb-4">
              {gameState === 'win' ? '🎉' : '🥺'}
            </div>
            <h2 className="text-3xl font-bold text-gray-800">
              {gameState === 'win' ? '太神了！你通关了！' : '哎呀，点到旧卡片了！'}
            </h2>
            
            <div className="space-y-3 bg-purple-50 p-4 rounded-2xl border border-purple-100">
              <div className="flex justify-between items-center px-2">
                <span className="text-gray-500">记忆数量</span>
                <span className="text-2xl font-bold text-purple-600">{score} 张</span>
              </div>
              <div className="flex justify-between items-center px-2 border-t border-purple-200/50 pt-2">
                <span className="text-gray-500">坚持时间</span>
                <span className="text-lg font-bold text-gray-700">{formatTime(timeSpent)}</span>
              </div>
            </div>

            {gameState === 'lose' && (
              <div className="space-y-3 bg-orange-50 p-4 rounded-2xl border border-orange-100">
                <p className="text-orange-700 font-bold">你可以使用 1 个【记忆沙漏】道具豁免此次失败，重新记忆当前卡片！</p>
                <div className="flex items-center justify-center space-x-2 text-sm text-orange-600">
                  <span>当前拥有: {reviveItems} 个</span>
                  <Hourglass className="w-4 h-4" />
                </div>
                {reviveItems === 0 && (
                  <p className="text-xs text-gray-500 mt-2 border-t border-orange-200 pt-2">
                    道具不足了哦，请让家长去「家长专区」看视频提前储备道具。
                  </p>
                )}
              </div>
            )}
            
            <div className="pt-4 space-y-3 flex flex-col">
              {gameState === 'lose' && reviveItems > 0 && (
                <button
                  onClick={handleRevive}
                  className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 hover:bg-orange-600 transition active:scale-95"
                >
                  <Hourglass className="w-5 h-5" />
                  <span className="text-xl">使用沙漏复活</span>
                </button>
              )}
              <button
                onClick={() => setGameState('ready')}
                className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center space-x-2 transition active:scale-95"
              >
                <span className="text-xl">返回</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* End Modals */}

      <BatteryAlertModal 
        isOpen={showBatteryAlert} 
        onClose={() => setShowBatteryAlert(false)} 
      />

      {/* Info Modal */}
      {infoModal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl transform transition-all animate-in zoom-in-95 duration-200">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${infoModal === 'battery' ? 'bg-green-100 text-green-500' : 'bg-orange-100 text-orange-500'}`}>
              {infoModal === 'battery' ? <Battery className="w-8 h-8" /> : <Hourglass className="w-8 h-8" />}
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              {infoModal === 'battery' ? '电量说明' : '复活沙漏'}
            </h3>
            <p className="text-gray-600 mb-8 leading-relaxed text-left bg-gray-50 p-4 rounded-xl">
              {infoModal === 'battery' 
                ? '⚡ 每次开始训练将消耗 1 局电量。当电量不足时，您可以前往【家长专区】通过观看视频免费补充电量。' 
                : '⏳ 在连续记忆训练中如果选错卡片，可消耗 1 个沙漏获得重新选择的机会。沙漏不足时，可前往【家长专区】免费获取。'}
            </p>
            <button 
              onClick={() => setInfoModal(null)}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-purple-500 hover:bg-purple-600 transition active:scale-95 text-lg shadow-md"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
