import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import Game1 from './pages/Game1';
import Game2 from './pages/Game2';
import Game3 from './pages/Game3';
import ParentArea from './pages/ParentArea';
import Auth from './pages/Auth';
import { useStore } from './store/useStore';

function App() {
  const token = useStore((state) => state.user.token);

  useEffect(() => {
    // 自动修复之前的测试遗留数据 (如果发现等级是 99，就重置为 1)
    const state = useStore.getState();
    if (state.game1Level === 99 || state.game2Level === 99) {
      useStore.setState({
        game1Level: 1,
        game2Level: 1,
        game1Progress: 0,
        game2MaxCombo: 0
      });
    }

    // 根据当前环境自动决定 API 地址
    // 现在开发环境下配置了 Vite proxy，直接使用空字符串相对路径即可让 Vite 代理到 localhost:3001
    const API_BASE_URL = import.meta.env.VITE_API_URL || '';

    // 从后端拉取配置
    fetch(`${API_BASE_URL}/api/config`)
      .then(res => res.json())
      .then(config => {
        useStore.getState().setServerConfig(config);
        
        // 把后台拉取到的配置同步到前端状态管理里
        if (config.game1) {
          useStore.getState().updateGame1Config(config.game1);
        }
        if (config.game2) {
          useStore.getState().updateGame2Config(config.game2);
        }
        if (config.game3) {
          useStore.getState().updateGame3Config(config.game3);
        }
        if (config.parentConfig) {
          useStore.getState().updateParentConfig(config.parentConfig);
        }
        
        // 如果后端有指定默认电量，可以覆盖本地的初始设置
        if (config.defaultBattery !== undefined) {
          useStore.setState({ battery: config.defaultBattery });
        }
      })
      .catch(err => {
        console.error('Failed to fetch config, using fallback defaults', err);
      });
  }, []);

  return (
    <Router>
      <div className="w-full max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col relative overflow-hidden shadow-xl pt-[10px]">
        <Routes>
          <Route path="/auth" element={token ? <Navigate to="/" /> : <Auth />} />
          <Route path="/" element={token ? <Home /> : <Navigate to="/auth" />} />
          <Route path="/game1" element={token ? <Game1 /> : <Navigate to="/auth" />} />
          <Route path="/game2" element={token ? <Game2 /> : <Navigate to="/auth" />} />
          <Route path="/game3" element={token ? <Game3 /> : <Navigate to="/auth" />} />
          <Route path="/parent" element={token ? <ParentArea /> : <Navigate to="/auth" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
