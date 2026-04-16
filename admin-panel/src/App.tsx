import { useState, useEffect } from 'react';
import { Save, RefreshCw, ServerCrash, CheckCircle2, LogOut, Plus, Trash2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const API_URL = `${API_BASE_URL}/api/config`;
const LOGIN_URL = `${API_BASE_URL}/api/auth/login`;

function App() {
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Config state
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      if (data.user.role !== 'admin') {
        throw new Error('Only administrators can access this panel');
      }

      setToken(data.token);
      localStorage.setItem('adminToken', data.token);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('adminToken');
    setConfig(null);
  };

  const fetchConfig = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Failed to fetch config');
      const data = await res.json();
      setConfig(data);
    } catch (err: any) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchConfig();
    }
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config),
      });
      
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        throw new Error('Session expired or unauthorized');
      }
      
      if (!res.ok) throw new Error('Failed to save config');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert('保存失败: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLevelChange = (index: number, field: string, value: any) => {
    const newLevels = [...config.game1.levels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setConfig({ ...config, game1: { ...config.game1, levels: newLevels } });
  };

  const handleGame2LevelChange = (index: number, field: string, value: any) => {
    const newLevels = [...config.game2.levels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setConfig({ ...config, game2: { ...config.game2, levels: newLevels } });
  };

  const handleGame3LevelChange = (index: number, field: string, value: any) => {
    const newLevels = [...(config.game3?.levels || [])];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setConfig({ ...config, game3: { ...config.game3, levels: newLevels } });
  };

  const handleAddGame1Level = () => {
    const newLevels = [...config.game1.levels];
    const nextLevel = newLevels.length > 0 ? newLevels[newLevels.length - 1].level + 1 : 1;
    newLevels.push({
      level: nextLevel,
      flash: 1,
      inter: 4,
      time: 3000,
      rounds: 5,
      difficulty: '⭐',
      desc: '新关卡描述'
    });
    setConfig({ ...config, game1: { ...config.game1, levels: newLevels } });
  };

  const handleRemoveGame1Level = (index: number) => {
    const newLevels = [...config.game1.levels];
    newLevels.splice(index, 1);
    // Re-index remaining levels
    newLevels.forEach((l, i) => l.level = i + 1);
    setConfig({ ...config, game1: { ...config.game1, levels: newLevels } });
  };

  const handleAddGame2Level = () => {
    const newLevels = [...config.game2.levels];
    const nextLevel = newLevels.length > 0 ? newLevels[newLevels.length - 1].level + 1 : 1;
    newLevels.push({
      level: nextLevel,
      cardsPerTurn: 1,
      difficulty: '⭐',
      desc: '新关卡描述'
    });
    setConfig({ ...config, game2: { ...config.game2, levels: newLevels } });
  };

  const handleRemoveGame2Level = (index: number) => {
    const newLevels = [...config.game2.levels];
    newLevels.splice(index, 1);
    // Re-index remaining levels
    newLevels.forEach((l, i) => l.level = i + 1);
    setConfig({ ...config, game2: { ...config.game2, levels: newLevels } });
  };

  const handleAddGame3Level = () => {
    const newLevels = [...(config.game3?.levels || [])];
    const nextLevel = newLevels.length > 0 ? newLevels[newLevels.length - 1].level + 1 : 1;
    newLevels.push({
      level: nextLevel,
      targetCount: 1,
      displayTime: 1000,
      optionsCount: 4,
      difficulty: '⭐',
      desc: '新关卡描述'
    });
    setConfig({ ...config, game3: { ...config.game3, levels: newLevels } });
  };

  const handleRemoveGame3Level = (index: number) => {
    const newLevels = [...(config.game3?.levels || [])];
    newLevels.splice(index, 1);
    newLevels.forEach((l, i) => l.level = i + 1);
    setConfig({ ...config, game3: { ...config.game3, levels: newLevels } });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600">后台管理登录</h1>
            <p className="text-gray-500 mt-2">宝宝记忆卡 - 仅限管理员访问</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="输入管理员账号"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="输入密码"
              />
            </div>
            
            {loginError && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                {loginError}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loggingIn ? '登录中...' : '登 录'}
            </button>
            <div className="text-xs text-center text-gray-400 mt-4">
              默认管理员账号: admin / admin123
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (loading || !config) return <div className="flex h-screen items-center justify-center text-xl text-gray-500">加载中...</div>;
  
  if (error) return (
    <div className="flex flex-col h-screen items-center justify-center text-red-500 space-y-4">
      <ServerCrash className="w-16 h-16" />
      <h2 className="text-2xl font-bold">无法连接到服务器</h2>
      <p>{error}</p>
      <button onClick={fetchConfig} className="bg-blue-500 text-white px-6 py-2 rounded-lg flex items-center space-x-2">
        <RefreshCw className="w-4 h-4" /> <span>重试</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center space-x-3">
              <span>宝宝记忆卡 - 后台管理系统</span>
            </h1>
            <p className="text-blue-200 mt-1">实时修改游戏配置，前端刷新即生效</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-2 px-6 rounded-lg flex items-center space-x-2 transition disabled:opacity-50"
            >
              {saveSuccess ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Save className="w-5 h-5" />}
              <span>{saving ? '保存中...' : saveSuccess ? '已保存' : '发布上线'}</span>
            </button>
            <button 
              onClick={handleLogout}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition"
            >
              <LogOut className="w-5 h-5" />
              <span>退出</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          
          {/* Section: Basic Settings */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">基础设置</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">默认初始电量 (局)</label>
                <input 
                  type="number" 
                  value={config.defaultBattery}
                  onChange={(e) => setConfig({...config, defaultBattery: Number(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">默认复活沙漏 (个)</label>
                <input 
                  type="number" 
                  value={config.defaultReviveItems}
                  onChange={(e) => setConfig({...config, defaultReviveItems: Number(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">看广告补充电量冷却时间 (秒)</label>
                <input 
                  type="number" 
                  value={config.parentConfig?.videoCooldown || 3600}
                  onChange={(e) => setConfig({...config, parentConfig: { ...config.parentConfig, videoCooldown: Number(e.target.value) }})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">控制家长专区中“补充电量”和“储备沙漏”按钮的冷却时间</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">电量不足提示文案</label>
              <textarea 
                rows={2}
                value={config.batteryAlertMessage}
                onChange={(e) => setConfig({...config, batteryAlertMessage: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </section>

          {/* Section: Game 1 Levels */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-xl font-bold text-gray-800">闪卡记忆训练 - 关卡配置</h2>
              <button 
                onClick={handleAddGame1Level}
                className="flex items-center space-x-1 bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-1.5 rounded-lg font-medium text-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>添加一关</span>
              </button>
            </div>
            <div className="space-y-4">
              {config.game1.levels.map((level: any, index: number) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-4 relative group">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-blue-600">第 {level.level} 关</h3>
                    <button 
                      onClick={() => handleRemoveGame1Level(index)}
                      className="text-red-400 hover:text-red-600 p-1 bg-white rounded-md shadow-sm border border-red-100 transition opacity-0 group-hover:opacity-100"
                      title="删除此关"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">目标图片数量 (闪现)</label>
                      <input 
                        type="number" 
                        value={level.flash}
                        onChange={(e) => handleLevelChange(index, 'flash', Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">干扰图片总数 (选项)</label>
                      <input 
                        type="number" 
                        value={level.inter}
                        onChange={(e) => handleLevelChange(index, 'inter', Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">展示时长 (毫秒)</label>
                      <input 
                        type="number" 
                        value={level.time}
                        onChange={(e) => handleLevelChange(index, 'time', Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                        step="500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">每关局数</label>
                      <input 
                        type="number" 
                        value={level.rounds || 5}
                        onChange={(e) => handleLevelChange(index, 'rounds', Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">难度展示 (如: ⭐⭐)</label>
                      <input 
                        type="text" 
                        value={level.difficulty}
                        onChange={(e) => handleLevelChange(index, 'difficulty', e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">选关界面玩法描述</label>
                    <input 
                      type="text" 
                      value={level.desc}
                      onChange={(e) => handleLevelChange(index, 'desc', e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Game 2 Levels */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-xl font-bold text-gray-800">连续记忆训练 - 关卡配置</h2>
              <button 
                onClick={handleAddGame2Level}
                className="flex items-center space-x-1 bg-purple-100 text-purple-600 hover:bg-purple-200 px-3 py-1.5 rounded-lg font-medium text-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>添加一关</span>
              </button>
            </div>
            <div className="space-y-4">
              {config.game2?.levels?.map((level: any, index: number) => (
                <div key={index} className="bg-purple-50 border border-purple-200 rounded-xl p-4 relative group">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-purple-600">第 {level.level} 关</h3>
                    <button 
                      onClick={() => handleRemoveGame2Level(index)}
                      className="text-red-400 hover:text-red-600 p-1 bg-white rounded-md shadow-sm border border-red-100 transition opacity-0 group-hover:opacity-100"
                      title="删除此关"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">每次出现的新卡数量</label>
                      <input 
                        type="number" 
                        value={level.cardsPerTurn || level.totalCards || 1}
                        onChange={(e) => handleGame2LevelChange(index, 'cardsPerTurn', Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">难度展示 (如: ⭐⭐)</label>
                      <input 
                        type="text" 
                        value={level.difficulty}
                        onChange={(e) => handleGame2LevelChange(index, 'difficulty', e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">选关界面玩法描述</label>
                      <input 
                        type="text" 
                        value={level.desc}
                        onChange={(e) => handleGame2LevelChange(index, 'desc', e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Game 3 Levels */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-xl font-bold text-gray-800">视觉注意力训练 - 关卡配置</h2>
              <button 
                onClick={handleAddGame3Level}
                className="flex items-center space-x-1 bg-teal-100 text-teal-600 hover:bg-teal-200 px-3 py-1.5 rounded-lg font-medium text-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>添加一关</span>
              </button>
            </div>
            <div className="space-y-4">
              {config.game3?.levels?.map((level: any, index: number) => (
                <div key={index} className="bg-teal-50 border border-teal-200 rounded-xl p-4 relative group">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-teal-600">第 {level.level} 关</h3>
                    <button 
                      onClick={() => handleRemoveGame3Level(index)}
                      className="text-red-400 hover:text-red-600 p-1 bg-white rounded-md shadow-sm border border-red-100 transition opacity-0 group-hover:opacity-100"
                      title="删除此关"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">原图数量 (目标数)</label>
                      <input 
                        type="number" 
                        value={level.targetCount || 1}
                        onChange={(e) => handleGame3LevelChange(index, 'targetCount', Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">展示时长 (毫秒)</label>
                      <input 
                        type="number" 
                        value={level.displayTime || 1000}
                        onChange={(e) => handleGame3LevelChange(index, 'displayTime', Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                        step="500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">选项数量</label>
                      <input 
                        type="number" 
                        value={level.optionsCount || 4}
                        onChange={(e) => handleGame3LevelChange(index, 'optionsCount', Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">每关局数</label>
                      <input 
                        type="number" 
                        value={level.rounds || 5}
                        onChange={(e) => handleGame3LevelChange(index, 'rounds', Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">难度展示 (如: ⭐⭐)</label>
                      <input 
                        type="text" 
                        value={level.difficulty}
                        onChange={(e) => handleGame3LevelChange(index, 'difficulty', e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">选关界面玩法描述</label>
                    <input 
                      type="text" 
                      value={level.desc}
                      onChange={(e) => handleGame3LevelChange(index, 'desc', e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

export default App;
