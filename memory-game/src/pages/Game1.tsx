import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Battery, Play, Hourglass, Star, Trophy, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';
import BatteryAlertModal from '../components/BatteryAlertModal';

// Mock data for assets
const assets = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈'];

export default function Game1() {
  const navigate = useNavigate();
  const battery = useStore((state) => state.battery);
  const reviveItems = useStore((state) => state.reviveItems);
  const decrementBattery = useStore((state) => state.decrementBattery);
  const useReviveItem = useStore((state) => state.useReviveItem);
  const maxUnlockedLevel = useStore((state) => state.game1Level);
  const updateGame1Progress = useStore((state) => state.updateGame1Progress);
  const defaultRounds = useStore((state) => state.game1Config?.roundsPerLevel || 5);
  const game1Records = useStore((state) => state.game1Records) || [];
  const addGame1Record = useStore((state) => state.addGame1Record);
  const currentUser = useStore((state) => state.user);

  const [gameState, setGameState] = useState<'level-select' | 'ready' | 'flash' | 'select' | 'win' | 'lose'>('level-select');
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [targetCards, setTargetCards] = useState<string[]>([]);
  const [interferenceCards, setInterferenceCards] = useState<string[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [showBatteryAlert, setShowBatteryAlert] = useState(false);
  const [score, setScore] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [infoModal, setInfoModal] = useState<'battery' | 'hourglass' | null>(null);
  // const [timeSpent, setTimeSpent] = useState(0);
  
  const timerRef = useRef<number | null>(null);

  // Read levels array from store (backed by serverConfig or defaults)
  const defaultLevels = [
    { level: 1, flash: 1, time: 3000, inter: 4, rounds: 5, difficulty: '⭐', desc: '1张目标图片，在4个选项中选择' },
    { level: 2, flash: 2, time: 3000, inter: 6, rounds: 5, difficulty: '⭐⭐', desc: '2张目标图片，在6个选项中选择' },
    { level: 3, flash: 3, time: 2000, inter: 8, rounds: 5, difficulty: '⭐⭐⭐', desc: '3张目标图片，在8个选项中选择' },
    { level: 4, flash: 4, time: 2000, inter: 8, rounds: 5, difficulty: '⭐⭐⭐⭐', desc: '4张目标图片，在8个选项中选择' },
    { level: 5, flash: 5, time: 1000, inter: 10, rounds: 5, difficulty: '⭐⭐⭐⭐⭐', desc: '5张目标图片，在10个选项中选择' },
  ];
  const levels = useStore((state) => state.game1Config?.levels && state.game1Config.levels.length > 0 ? state.game1Config.levels : defaultLevels);

  const getLevelConfig = (lvl: number) => {
    const config = levels.find((l: any) => l.level === lvl);
    if (config) return { ...config, rounds: config.rounds || defaultRounds };
    return { flash: Math.min(4 + Math.floor((lvl - 5) / 5), 8), time: 1000, inter: Math.min(10 + Math.floor((lvl - 5) / 2), 16), rounds: defaultRounds, desc: `随机生成的关卡 ${lvl}` };
  };

  // Filter records by selected level
  const currentLevelRecords = game1Records.filter(r => r.level === currentLevel && r.userId === currentUser?.id);
  const highestRecord = [...currentLevelRecords].sort((a, b) => b.score - a.score)[0] || { score: 0, timeSpent: 0 };
  const recentRecords = [...currentLevelRecords].sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m > 0 ? `${m}分` : ''}${s}秒`;
  };

  const handleLevelSelect = (lvl: number) => {
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

  const startRound = (lvl: number) => {
    const config = getLevelConfig(lvl);
    // Shuffle and pick targets
    const shuffled = [...assets].sort(() => 0.5 - Math.random());
    const targets = shuffled.slice(0, config.flash);
    const others = shuffled.slice(config.flash, config.inter);
    const interferences = [...targets, ...others].sort(() => 0.5 - Math.random());

    setTargetCards(targets);
    setInterferenceCards(interferences);
    setSelectedCards([]);
    setGameState('flash');

    setTimeout(() => {
      setGameState('select');
    }, config.time);
  };

  const handleCardClick = (card: string) => {
    if (gameState !== 'select') return;
    
    if (selectedCards.includes(card)) return; // Already selected

    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);

    if (targetCards.includes(card)) {
      // 只要选对了，并且选够了数量，就判断为当前局胜利
      if (newSelected.length === targetCards.length) {
          // Win
          setScore(prev => prev + 10); // 答对加10分
          
          const config = getLevelConfig(currentLevel);
          const totalRounds = config.rounds;
          
          if (currentRound < totalRounds) {
            // 自动进入下一局
            setTimeout(() => {
              setCurrentRound(prev => prev + 1);
              startRound(currentLevel);
            }, 800);
          } else {
            // 这一关全部局数完成，通关
            setTimeout(() => {
              const elapsed = timerRef.current ? Math.floor((Date.now() - timerRef.current) / 1000) : 0;
              // setTimeSpent(elapsed);
              addGame1Record({
                score: score + 10,
                timeSpent: elapsed,
                timestamp: Date.now(),
                level: currentLevel,
              });
              updateGame1Progress(true, currentLevel);
              setGameState('win');
            }, 800);
          }
      }
    } else {
      // 只要点错任何一张，立刻判负（因为一旦点错，就没必要继续选了）
      const elapsed = timerRef.current ? Math.floor((Date.now() - timerRef.current) / 1000) : 0;
      // setTimeSpent(elapsed);
      addGame1Record({
        score: score,
        timeSpent: elapsed,
        timestamp: Date.now(),
        level: currentLevel,
      });
      setGameState('lose');
      updateGame1Progress(false, currentLevel);
    }
  };

  const handleRevive = () => {
    if (useReviveItem()) {
      // 恢复到 flash 状态，重试当前关卡，不扣除电量
      setGameState('flash');
      setSelectedCards([]);
      setTimeout(() => {
        setGameState('select');
      }, getLevelConfig(currentLevel).time);
    }
  };

  return (
    <div className="flex flex-col h-full bg-blue-50">
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
            <span>闪卡记忆训练</span>
          ) : gameState === 'ready' ? (
            <span>第 {currentLevel} 关</span>
          ) : (
            <>
              <span>第 {currentLevel} 关</span>
              <span className="text-sm text-blue-500 mt-0.5">第 {currentRound} 局 / 共 {getLevelConfig(currentLevel).rounds} 局</span>
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">选择关卡</h2>
            {levels.map((lvl: any) => {
              const isLocked = lvl.level > maxUnlockedLevel;
              return (
                <button
                  key={lvl.level}
                  onClick={() => !isLocked && handleLevelSelect(lvl.level)}
                  className={`w-full relative overflow-hidden rounded-2xl p-4 flex items-center justify-between shadow-sm transition transform ${
                    isLocked 
                      ? 'bg-gray-100 opacity-70 cursor-not-allowed' 
                      : 'bg-white hover:shadow-md active:scale-95'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                      isLocked ? 'bg-gray-200 text-gray-400' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {lvl.level}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-gray-800">
                        第 {lvl.level} 关 
                        <span className="ml-2 text-yellow-400 text-sm">{lvl.difficulty}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{lvl.desc}</div>
                    </div>
                  </div>
                  {!isLocked && (
                    <div className="bg-blue-50 p-2 rounded-full">
                      <Play className="w-5 h-5 text-blue-500 ml-1" />
                    </div>
                  )}
                  {isLocked && (
                    <div className="absolute inset-0 bg-gray-50/50 flex items-center justify-end pr-6 backdrop-blur-[1px]">
                      <span className="text-sm font-bold text-gray-400 bg-gray-200 px-3 py-1 rounded-full">
                        需通关上一级
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
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-blue-50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2 relative z-10">第 {currentLevel} 关</h2>
              <p className="text-gray-500 mb-6 relative z-10">{getLevelConfig(currentLevel).desc}</p>
              
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
                    <Clock className="w-5 h-5 text-blue-400" />
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
              className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all transform active:scale-95 flex items-center justify-center space-x-2"
            >
              <Play className="w-6 h-6 fill-current" />
              <span className="text-xl">开始挑战</span>
            </button>
          </div>
        )}

        {gameState === 'flash' && (
          <div className="flex flex-col items-center flex-1 justify-center w-full pb-16">
            <h3 className="text-2xl font-bold text-blue-600 mb-8 animate-pulse">仔细看，记住它们！</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {targetCards.map((card, i) => (
                <div key={i} className="w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-2xl shadow-md flex items-center justify-center text-7xl sm:text-8xl transition-opacity duration-300 animate-in zoom-in duration-300">
                  {card}
                </div>
              ))}
            </div>
          </div>
        )}

        {gameState === 'select' && (
          <div className="w-full flex flex-col items-center flex-1 justify-center pb-8">
            <h3 className="text-center text-xl font-bold text-gray-700 mb-6">找出刚才出现的 {targetCards.length} 张卡片</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 px-2 mb-8 w-full max-w-md">
              {interferenceCards.map((card, i) => {
                const isSelected = selectedCards.includes(card);
                const isTarget = targetCards.includes(card);
                let bgColor = "bg-white";
                if (isSelected) {
                  bgColor = isTarget ? "bg-green-100 border-2 border-green-400" : "bg-red-100 border-2 border-red-400";
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleCardClick(card)}
                    className={`w-full aspect-square rounded-2xl shadow-sm flex items-center justify-center text-4xl sm:text-5xl transition transform active:scale-95 ${bgColor}`}
                  >
                    {card}
                  </button>
                );
              })}
            </div>
            
            <div className="bg-white px-6 py-3 rounded-full shadow-sm text-blue-600 font-bold flex items-center space-x-2 text-xl">
              <Star className="w-6 h-6 fill-blue-500 text-blue-500" />
              <span>当前积分: {score}</span>
            </div>
          </div>
        )}

      </main>

      {/* Win/Lose Modals */}
      {gameState === 'win' && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl transform transition-all animate-in zoom-in-95 duration-200 translate-y-[60px]">
            <div className="text-7xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-800">太棒啦！通关了！</h2>
            <p className="text-gray-500 text-lg">你成功完成了 {getLevelConfig(currentLevel).rounds || 5} 局挑战！</p>
            <div className="pt-4 space-y-3 flex flex-col">
              <button
                onClick={() => setGameState('ready')}
                className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 transition active:scale-95"
              >
                <span className="text-xl">返回</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState === 'lose' && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl transform transition-all animate-in zoom-in-95 duration-200">
            <div className="text-7xl mb-4">🥺</div>
              <h2 className="text-3xl font-bold text-gray-800">哎呀，选错了！</h2>
              
              <div className="space-y-3 bg-orange-50 p-4 rounded-2xl border border-orange-100">
                <p className="text-orange-700 font-bold">你可以使用 1 个【记忆沙漏】道具豁免此次失败，重新看一次卡片！</p>
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
              
              <div className="pt-4 space-y-3 flex flex-col">
                {reviveItems > 0 && (
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
                : '⏳ 在记忆训练中如果选错卡片，可消耗 1 个沙漏获得重新选择的机会。沙漏不足时，可前往【家长专区】免费获取。'}
            </p>
            <button 
              onClick={() => setInfoModal(null)}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 transition active:scale-95 text-lg shadow-md"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
