import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Battery, Play, Trophy, Clock, Circle, Square, Triangle, Star, Heart, Hexagon, Lock, Hourglass } from 'lucide-react';
import { useStore } from '../store/useStore';
import BatteryAlertModal from '../components/BatteryAlertModal';

const SHAPES = [Circle, Square, Triangle, Star, Heart, Hexagon];
const COLORS = [
  { text: 'text-red-500', fill: 'fill-red-500' },
  { text: 'text-blue-500', fill: 'fill-blue-500' },
  { text: 'text-green-500', fill: 'fill-green-500' },
  { text: 'text-yellow-500', fill: 'fill-yellow-500' },
  { text: 'text-purple-500', fill: 'fill-purple-500' },
  { text: 'text-orange-500', fill: 'fill-orange-500' },
];

interface CardData {
  id: string;
  shapeIdx: number;
  colorIdx: number;
}

export default function Game3() {
  const navigate = useNavigate();
  const battery = useStore((state) => state.battery);
  const decrementBattery = useStore((state) => state.decrementBattery);
  const reviveItems = useStore((state) => state.reviveItems);
  const useReviveItem = useStore((state) => state.useReviveItem);
  const maxUnlockedLevel = useStore((state) => state.game3Level);
  const updateGame3Progress = useStore((state) => state.updateGame3Progress);
  const defaultRounds = useStore((state) => state.game3Config?.roundsPerLevel || 5);
  const game3Records = useStore((state) => state.game3Records) || [];
  const addGame3Record = useStore((state) => state.addGame3Record);
  const currentUser = useStore((state) => state.user);

  const [gameState, setGameState] = useState<'level-select' | 'ready' | 'flash' | 'select' | 'win' | 'lose'>('level-select');
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [difficulty, setDifficulty] = useState<'normal' | 'hard'>('normal');
  const [targetCards, setTargetCards] = useState<CardData[]>([]);
  const [options, setOptions] = useState<CardData[]>([]);
  const [selectedCards, setSelectedCards] = useState<CardData[]>([]);
  const [showBatteryAlert, setShowBatteryAlert] = useState(false);
  const [infoModal, setInfoModal] = useState<'battery' | 'hourglass' | null>(null);
  const [score, setScore] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeSpent, setTimeSpent] = useState(0);
  
  const timerRef = useRef<number | null>(null);

  const defaultLevels = [
    { level: 1, displayTime: 3000, optionsCount: 4, difficulty: '⭐', desc: '显示3秒，从4个选项中找出原图' },
    { level: 2, displayTime: 2000, optionsCount: 4, difficulty: '⭐⭐', desc: '显示2秒，从4个选项中找出原图' },
    { level: 3, displayTime: 2000, optionsCount: 6, difficulty: '⭐⭐⭐', desc: '显示2秒，从6个选项中找出原图' },
    { level: 4, displayTime: 1000, optionsCount: 6, difficulty: '⭐⭐⭐⭐', desc: '显示1秒，从6个选项中找出原图' },
    { level: 5, displayTime: 1000, optionsCount: 8, difficulty: '⭐⭐⭐⭐⭐', desc: '显示1秒，从8个选项中找出原图' },
  ];
  const levels = useStore((state) => state.game3Config?.levels && state.game3Config.levels.length > 0 ? state.game3Config.levels : defaultLevels);

  const getLevelConfig = (lvl: number) => {
    const config = levels.find((l: any) => l.level === lvl);
    if (config) return { ...config, rounds: (config as any).rounds || defaultRounds };
    return { targetCount: 1, displayTime: 1000, optionsCount: 8, rounds: defaultRounds, desc: `随机生成的关卡 ${lvl}` };
  };

  const currentLevelRecords = game3Records.filter(r => 
    r.userId === currentUser?.id && 
    r.level === currentLevel && 
    (r.difficulty === difficulty || (!r.difficulty && difficulty === 'normal'))
  );
  const highestRecord = [...currentLevelRecords].sort((a, b) => b.score - a.score)[0] || { score: 0, timeSpent: 0 };
  const recentRecords = [...currentLevelRecords].sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m > 0 ? `${m}分` : ''}${s}秒`;
  };

  const handleLevelSelect = (lvl: number) => {
    if (lvl > maxUnlockedLevel) return;
    setCurrentLevel(lvl);
    setGameState('ready');
  };

  const startGame = () => {
    if (battery <= 0) {
      setShowBatteryAlert(true);
      return;
    }
    
    if (!decrementBattery()) return;

    setScore(0);
    setCurrentRound(1);
    timerRef.current = Date.now();
    startRound(currentLevel);
  };

  const generateRandomCard = (): CardData => ({
    id: Math.random().toString(36).substr(2, 9),
    shapeIdx: Math.floor(Math.random() * SHAPES.length),
    colorIdx: Math.floor(Math.random() * COLORS.length)
  });

  const startRound = (lvl: number) => {
    const config = getLevelConfig(lvl);
    const targetCount = config.targetCount || 1;
    
    const targets: CardData[] = [];
    while (targets.length < targetCount) {
      const card = generateRandomCard();
      const isDuplicate = targets.some(opt => opt.shapeIdx === card.shapeIdx && opt.colorIdx === card.colorIdx);
      if (!isDuplicate) targets.push(card);
    }
    setTargetCards(targets);

    // Generate distractors
    const newOptions: CardData[] = [...targets];
    while (newOptions.length < config.optionsCount) {
      const distractor = generateRandomCard();
      const isDuplicate = newOptions.some(opt => opt.shapeIdx === distractor.shapeIdx && opt.colorIdx === distractor.colorIdx);
      if (!isDuplicate) {
        newOptions.push(distractor);
      }
    }
    
    setOptions(newOptions.sort(() => 0.5 - Math.random()));
    setSelectedCards([]);
    setGameState('flash');

    setTimeout(() => {
      setGameState('select');
    }, config.displayTime);
  };

  const handleCardClick = (card: CardData) => {
    if (gameState !== 'select' || targetCards.length === 0) return;
    
    // Check if already selected
    if (selectedCards.some(c => c.id === card.id)) return;

    let isCorrect = false;

    if (difficulty === 'hard') {
      // In hard mode, must match the exact sequence
      const expectedTarget = targetCards[selectedCards.length];
      isCorrect = expectedTarget && expectedTarget.shapeIdx === card.shapeIdx && expectedTarget.colorIdx === card.colorIdx;
    } else {
      // In normal mode, can match any target that hasn't been selected yet
      isCorrect = targetCards.some(t => t.shapeIdx === card.shapeIdx && t.colorIdx === card.colorIdx);
    }

    if (isCorrect) {
      const newSelected = [...selectedCards, card];
      setSelectedCards(newSelected);
      
      // If found all targets
      if (newSelected.length === targetCards.length) {
        setGameState('animating' as any);
        setScore(prev => prev + 10);
        const config = getLevelConfig(currentLevel);
        
        if (currentRound < config.rounds) {
          setTimeout(() => {
            setCurrentRound(prev => prev + 1);
            startRound(currentLevel);
          }, 800);
        } else {
          setTimeout(() => {
            const elapsed = timerRef.current ? Math.floor((Date.now() - timerRef.current) / 1000) : 0;
            setTimeSpent(elapsed);
            addGame3Record({
              score: score + 10,
              timeSpent: elapsed,
              timestamp: Date.now(),
              level: currentLevel,
              difficulty
            });
            updateGame3Progress(true, currentLevel);
            setGameState('win');
          }, 800);
        }
      }
    } else {
      // Incorrect!
      setGameState('animating' as any);
      setSelectedCards([...selectedCards, card]); // visually show the wrong click
      
      setTimeout(() => {
        const elapsed = timerRef.current ? Math.floor((Date.now() - timerRef.current) / 1000) : 0;
        setTimeSpent(elapsed);
        addGame3Record({
          score: score,
          timeSpent: elapsed,
          timestamp: Date.now(),
          level: currentLevel,
          difficulty
        });
        setGameState('lose');
        updateGame3Progress(false, currentLevel);
      }, 800);
    }
  };

  const handleRevive = () => {
    if (useReviveItem()) {
      // 恢复到 flash 状态，重试当前局，不扣除电量
      setGameState('flash');
      setSelectedCards([]);
      setTimeout(() => {
        setGameState('select');
      }, getLevelConfig(currentLevel).displayTime);
    }
  };

  const renderCard = (card: CardData, sizeClass = 'w-16 h-16 sm:w-20 sm:h-20') => {
    const ShapeIcon = SHAPES[card.shapeIdx];
    const color = COLORS[card.colorIdx];
    return <ShapeIcon className={`${sizeClass} ${color.text} ${color.fill}`} />;
  };

  return (
    <div className="flex flex-col h-full bg-teal-50">
      {/* Header */}
      <header className="relative flex items-center justify-between p-4 bg-white shadow-sm shrink-0">
        <div className="flex-1 flex justify-start">
          <button onClick={() => {
            if (gameState === 'level-select') navigate(-1);
            else if (gameState === 'ready') setGameState('level-select');
            else setGameState('level-select');
          }} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        
        <div className="flex-[2] text-xl font-bold text-gray-800 flex flex-col items-center text-center">
          {gameState === 'level-select' ? (
            <span>视觉注意力训练</span>
          ) : gameState === 'ready' ? (
            <span>第 {currentLevel} 关</span>
          ) : (
            <>
              <span>第 {currentLevel} 关</span>
              <span className="text-sm text-teal-500 mt-0.5">第 {currentRound} 局 / 共 {getLevelConfig(currentLevel).rounds} 局</span>
            </>
          )}
        </div>

        <div className="flex-1" />
      </header>

      {/* Game Area */}
      <main className="flex-1 flex flex-col items-center justify-start p-4 relative overflow-y-auto">
        {gameState === 'level-select' && (
          <div className="w-full max-w-md space-y-4">
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
            {levels.map((lvl: any) => {
              const isLocked = lvl.level > maxUnlockedLevel;
              return (
                <button
                  key={lvl.level}
                  onClick={() => !isLocked && handleLevelSelect(lvl.level)}
                  className={`w-full relative overflow-hidden rounded-2xl p-4 flex items-center justify-between shadow-sm transition transform ${
                    isLocked 
                      ? 'bg-gray-100 opacity-70 cursor-not-allowed' 
                      : 'bg-white hover:bg-teal-50 active:scale-95 cursor-pointer'
                  }`}
                >
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-lg text-gray-800">第 {lvl.level} 关</span>
                    <span className="text-sm text-gray-500 mt-1">{lvl.desc}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-teal-500">{lvl.difficulty}</div>
                    {!isLocked && <Play className="w-5 h-5 text-teal-400" />}
                  </div>
                  {isLocked && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-2xl flex items-center justify-end pr-4">
                      <span className="text-sm font-bold text-gray-400 bg-gray-200 px-3 py-1 rounded-full flex items-center space-x-1">
                        <Lock className="w-4 h-4" />
                        <span>需通关上一级</span>
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {gameState === 'ready' && (
          <div className="w-full max-w-md space-y-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-teal-50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full -mr-16 -mt-16 opacity-50" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2 relative z-10">第 {currentLevel} 关</h2>
              <p className="text-gray-500 mb-6 relative z-10">{getLevelConfig(currentLevel).desc}</p>
              
              <div className="flex bg-gray-100 p-1 rounded-xl relative z-10 mb-6">
                <button
                  onClick={() => setDifficulty('normal')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${
                    difficulty === 'normal' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  普通模式
                </button>
                <button
                  onClick={() => setDifficulty('hard')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${
                    difficulty === 'hard' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  困难模式
                </button>
              </div>
              
              <div className="space-y-4 relative z-10">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4 border border-yellow-100">
                  <div className="flex items-center space-x-2 mb-3">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="font-bold text-gray-800">本关最高记录</span>
                  </div>
                  {highestRecord.score > 0 ? (
                    <div className="flex justify-between items-end">
                      <div className="text-3xl font-black text-yellow-600">{highestRecord.score} <span className="text-sm font-normal text-yellow-600/70">分</span></div>
                      <div className="text-sm text-yellow-600/70 font-medium">用时 {formatTime(highestRecord.timeSpent)}</div>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm italic">暂无记录，快来挑战吧！</div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center space-x-2 mb-3">
                    <Clock className="w-5 h-5 text-teal-400" />
                    <span className="font-bold text-gray-800">最近3次记录</span>
                  </div>
                  {recentRecords.length > 0 ? (
                    <div className="space-y-2">
                      {recentRecords.map((record, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm text-sm">
                          <span className="font-bold text-gray-700">{record.score} 分</span>
                          <span className="text-gray-500">{formatTime(record.timeSpent)}</span>
                          <span className="text-gray-400 text-xs">{new Date(record.timestamp).toLocaleDateString()} {new Date(record.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm italic">暂无记录</div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-teal-500/30 transition-all transform active:scale-95 flex items-center justify-center space-x-2"
            >
              <Play className="w-6 h-6 fill-current" />
              <span className="text-xl">开始挑战</span>
            </button>
          </div>
        )}

        {gameState === 'flash' && targetCards.length > 0 && (
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-300">
            <h3 className="text-2xl font-bold text-gray-700">请记住这些图形！</h3>
            <div className="flex flex-wrap justify-center gap-4 bg-white p-8 rounded-3xl shadow-lg border-4 border-teal-100 animate-pulse">
              {targetCards.map((card, i) => (
                <div key={i}>{renderCard(card, 'w-24 h-24')}</div>
              ))}
            </div>
          </div>
        )}

        {/* Type assertion to fix comparison error since we added animating state */}
        {(gameState === 'select' || (gameState as any) === 'animating') && (
          <div className="flex-1 flex flex-col items-center justify-start w-full max-w-md pt-8 animate-in slide-in-from-bottom-8 duration-300">
            <h3 className="text-2xl font-bold text-gray-700 mb-8">找出刚才出现的 {targetCards.length} 个图形</h3>
            <div className={`grid gap-4 w-full ${options.length > 4 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {options.map((card, i) => {
                const isSelected = selectedCards.some(c => c.id === card.id);
                const isTarget = targetCards.some(t => t.shapeIdx === card.shapeIdx && t.colorIdx === card.colorIdx);
                let bgColor = "bg-white";
                if (isSelected) {
                  bgColor = isTarget ? "bg-green-100 border-2 border-green-400" : "bg-red-100 border-2 border-red-400";
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleCardClick(card)}
                    className={`${bgColor} aspect-square rounded-3xl shadow-sm hover:bg-teal-50 hover:shadow-md active:scale-95 transition-all flex items-center justify-center border-2 ${isSelected ? '' : 'border-transparent hover:border-teal-200'} group`}
                  >
                    <div className="transform transition-transform group-hover:scale-110">
                      {renderCard(card)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Win/Lose Modals */}
      {(gameState === 'win' || gameState === 'lose') && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl transform transition-all animate-in zoom-in-95 duration-300">
            {gameState === 'win' ? (
              <>
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                  <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-20" />
                  <Trophy className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-3xl font-black text-gray-800">挑战成功！</h2>
                <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center">
                  <div className="text-left">
                    <p className="text-gray-500 text-sm">得分</p>
                    <p className="text-2xl font-bold text-green-500">{score} 分</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-sm">用时</p>
                    <p className="text-2xl font-bold text-blue-500">{formatTime(timeSpent)}</p>
                  </div>
                </div>
                <p className="text-green-600 font-medium bg-green-50 py-2 rounded-lg">
                  {currentLevel === maxUnlockedLevel - 1 ? '太棒了！已解锁下一关！' : '完美通关！'}
                </p>
              </>
            ) : (
              <>
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-5xl">😅</span>
                </div>
                <h2 className="text-3xl font-black text-gray-800">很遗憾</h2>
                <p className="text-gray-500 text-lg">选错了哦，请再试一次吧！</p>
                
                <div className="space-y-3 bg-orange-50 p-4 rounded-2xl border border-orange-100 mt-4">
                  <p className="text-orange-700 font-bold">你可以使用 1 个【记忆沙漏】道具豁免此次失败，重新看一次图形！</p>
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
              </>
            )}

            <div className="space-y-3 pt-4">
              {gameState === 'win' && currentLevel < levels.length && (
                <button
                  onClick={() => {
                    setCurrentLevel(prev => prev + 1);
                    setGameState('ready');
                  }}
                  className="w-full bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-teal-500/30 transition-all transform active:scale-95 flex items-center justify-center space-x-2"
                >
                  <span className="text-xl">下一关</span>
                </button>
              )}
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
                : '⏳ 在视觉注意力训练中如果选错图形，可消耗 1 个沙漏获得重新记忆的机会。沙漏不足时，可前往【家长专区】免费获取。'}
            </p>
            <button 
              onClick={() => setInfoModal(null)}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-teal-500 hover:bg-teal-600 transition active:scale-95 text-lg shadow-md"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
