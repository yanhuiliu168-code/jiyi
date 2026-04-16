import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BatteryCharging, Trash2, Settings2, Hourglass, Battery, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function ParentArea() {
  const navigate = useNavigate();
  const store = useStore();
  const [isVerified, setIsVerified] = useState(false);
  const [mathProblem, setMathProblem] = useState({ a: 0, b: 0, ans: 0 });
  const [inputValue, setInputValue] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [alertModal, setAlertModal] = useState<{show: boolean, type: 'success' | 'loading' | 'error', message: string}>({show: false, type: 'success', message: ''});

  useEffect(() => {
    // 每次进入家长专区都强制要求进行验证
    generateProblem();
  }, []);

  useEffect(() => {
    // Calculate remaining cooldown time
    const checkCooldown = () => {
      const now = Date.now();
      const lastWatch = store.settings.lastVideoWatchTime || 0;
      const cooldownMs = (store.parentConfig?.videoCooldown || 3600) * 1000;
      const elapsed = now - lastWatch;
      
      if (elapsed < cooldownMs) {
        setCooldownRemaining(Math.ceil((cooldownMs - elapsed) / 1000));
      } else {
        setCooldownRemaining(0);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [store.settings.lastVideoWatchTime, store.parentConfig?.videoCooldown]);

  const formatCooldown = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}时${m}分`;
    if (m > 0) return `${m}分${s}秒`;
    return `${s}秒`;
  };

  const generateProblem = () => {
    const a = Math.floor(Math.random() * 5) + 1;
    const b = Math.floor(Math.random() * 5) + 1;
    setMathProblem({ a, b, ans: a + b });
    setInputValue('');
  };

  const handleVerify = () => {
    if (parseInt(inputValue) === mathProblem.ans) {
      store.verifyParent();
      setIsVerified(true);
    } else {
      setAlertModal({ show: true, type: 'error', message: '计算错误，请重试' });
      setTimeout(() => setAlertModal({ show: false, type: 'success', message: '' }), 2000);
      generateProblem();
    }
  };

  const handleAddBattery = () => {
    if (cooldownRemaining > 0) {
      setAlertModal({ show: true, type: 'error', message: `视频冷却中，请 ${formatCooldown(cooldownRemaining)} 后再试` });
      setTimeout(() => setAlertModal({ show: false, type: 'success', message: '' }), 2000);
      return;
    }
    setAlertModal({ show: true, type: 'loading', message: '正在播放视频/广告...' });
    setTimeout(() => {
      store.addBattery(5);
      store.updateSettings({ lastVideoWatchTime: Date.now() });
      setAlertModal({ show: true, type: 'success', message: '恭喜！电量已补充 +5局' });
      setTimeout(() => setAlertModal({ show: false, type: 'success', message: '' }), 2000);
    }, 1500);
  };

  const handleAddReviveItem = () => {
    if (cooldownRemaining > 0) {
      setAlertModal({ show: true, type: 'error', message: `视频冷却中，请 ${formatCooldown(cooldownRemaining)} 后再试` });
      setTimeout(() => setAlertModal({ show: false, type: 'success', message: '' }), 2000);
      return;
    }
    setAlertModal({ show: true, type: 'loading', message: '正在播放视频/广告...' });
    setTimeout(() => {
      store.addReviveItem(1);
      store.updateSettings({ lastVideoWatchTime: Date.now() });
      setAlertModal({ show: true, type: 'success', message: '恭喜！已获得 1 个【记忆沙漏】' });
      setTimeout(() => setAlertModal({ show: false, type: 'success', message: '' }), 2000);
    }, 1500);
  };

  const handleClearCache = () => {
    if (confirm('确定要清除所有进度和设置吗？')) {
      store.resetProgress();
      setAlertModal({ show: true, type: 'success', message: '缓存已清除' });
      setTimeout(() => setAlertModal({ show: false, type: 'success', message: '' }), 2000);
    }
  };

  const renderAlertModal = () => {
    if (!alertModal.show) return null;
    return (
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex justify-center">
            {alertModal.type === 'success' && (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            )}
            {alertModal.type === 'error' && (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            )}
            {alertModal.type === 'loading' && (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            )}
          </div>
          <p className="text-lg font-bold text-gray-800">{alertModal.message}</p>
        </div>
      </div>
    );
  };

  if (!isVerified) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-6 space-y-6">
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 rounded-full bg-white shadow">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm text-center space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">家长身份验证</h2>
          <p className="text-gray-500">请计算以下算式以解锁家长专区</p>
          <div className="text-4xl font-bold text-blue-500">
            {mathProblem.a} + {mathProblem.b} = ?
          </div>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full text-center text-2xl p-4 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="输入答案"
          />
          <button
            onClick={handleVerify}
            className="w-full bg-blue-500 text-white text-xl font-bold py-3 rounded-xl hover:bg-blue-600 transition"
          >
            确认解锁
          </button>
        </div>
        {renderAlertModal()}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="flex items-center justify-between p-4 bg-white shadow-sm shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-gray-100">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="text-xl font-bold text-gray-800">家长专区</div>
        <div className="w-10"></div> {/* Spacer */}
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-12">
        <div className="flex justify-start space-x-2">
          <div className="flex items-center space-x-1.5 text-gray-500 font-medium px-3 py-1.5 rounded-full text-xs bg-black/5">
            <Battery className="w-4 h-4 text-green-500 shrink-0" />
            <span>{store.battery} 局</span>
          </div>
          <div className="flex items-center space-x-1.5 text-gray-500 font-medium px-3 py-1.5 rounded-full text-xs bg-black/5">
            <Hourglass className="w-4 h-4 text-orange-400 shrink-0" />
            <span>{store.reviveItems} 个</span>
          </div>
        </div>

        {/* Stats */}
        <section className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center space-x-2">
            <span className="text-2xl">📊</span>
            <span>训练数据</span>
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-2xl">
              <p className="text-xs sm:text-sm text-blue-600 mb-1">闪卡记忆</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-800">Lv.{store.game1Level}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-2xl">
              <p className="text-xs sm:text-sm text-purple-600 mb-1">连续记忆</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-800">Lv.{store.game2Level}</p>
            </div>
            <div className="bg-teal-50 p-4 rounded-2xl">
              <p className="text-xs sm:text-sm text-teal-600 mb-1">视觉注意力</p>
              <p className="text-xl sm:text-2xl font-bold text-teal-800">Lv.{store.game3Level}</p>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl flex justify-between items-center">
            <span className="text-gray-600">当前剩余电量</span>
            <span className="font-bold text-lg text-green-600">{store.battery} 局</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl flex justify-between items-center">
            <span className="text-gray-600">复活道具【记忆沙漏】</span>
            <span className="font-bold text-lg text-orange-600">{store.reviveItems} 个</span>
          </div>
        </section>

        {/* Actions */}
        <section className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center space-x-2">
            <span className="text-2xl">🛠️</span>
            <span>功能管理</span>
          </h3>

          <button
            onClick={handleAddBattery}
            disabled={cooldownRemaining > 0}
            className={`w-full flex items-center justify-between p-3 rounded-2xl transition ${
              cooldownRemaining > 0 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-green-50 hover:bg-green-100 text-green-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <BatteryCharging className="w-6 h-6" />
              <span className="font-bold text-lg">补充电量</span>
            </div>
            <span className={`text-sm px-3 py-1 rounded-full ${
              cooldownRemaining > 0 ? 'bg-gray-200 text-gray-500' : 'bg-green-200 text-green-800'
            }`}>
              {cooldownRemaining > 0 ? `冷却中 ${formatCooldown(cooldownRemaining)}` : '看广告 +5局'}
            </span>
          </button>

          <button
            onClick={handleAddReviveItem}
            disabled={cooldownRemaining > 0}
            className={`w-full flex items-center justify-between p-3 rounded-2xl transition ${
              cooldownRemaining > 0 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-orange-50 hover:bg-orange-100 text-orange-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Hourglass className="w-6 h-6" />
              <span className="font-bold text-lg">储备沙漏</span>
            </div>
            <span className={`text-sm px-3 py-1 rounded-full ${
              cooldownRemaining > 0 ? 'bg-gray-200 text-gray-500' : 'bg-orange-200 text-orange-800'
            }`}>
              {cooldownRemaining > 0 ? `冷却中 ${formatCooldown(cooldownRemaining)}` : '看广告 +1个'}
            </span>
          </button>

          <button
            onClick={handleClearCache}
            className="w-full flex items-center justify-between bg-red-50 hover:bg-red-100 text-red-700 p-3 rounded-2xl transition"
          >
            <div className="flex items-center space-x-3">
              <Trash2 className="w-6 h-6" />
              <span className="font-bold text-lg">清除缓存</span>
            </div>
            <span className="text-sm">重置所有数据</span>
          </button>
        </section>

        {/* Settings */}
        <section className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center space-x-2">
            <span className="text-2xl">⚙️</span>
            <span>基础设置</span>
          </h3>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center space-x-3">
              <Settings2 className="w-6 h-6 text-gray-500" />
              <span className="font-bold text-gray-700">音效开关</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={store.settings.soundEnabled}
                onChange={(e) => store.updateSettings({ soundEnabled: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </section>
      </main>

      {/* Custom Alert Modal */}
      {renderAlertModal()}
    </div>
  );
}
