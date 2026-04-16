import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
const port = 3001;
const CONFIG_FILE = path.join(__dirname, 'config.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const JWT_SECRET = 'your-super-secret-key-12345'; // 在生产环境中应该使用环境变量

app.use(cors());
app.use(express.json());

// In-memory configuration store (simulating a database)
let gameConfig = {
  defaultBattery: 20, // As requested for testing
  maxBattery: 30,
  defaultReviveItems: 3, // Initial revive items for testing
  game1: {
    levels: [
      { level: 1, flash: 1, time: 3000, inter: 4, difficulty: '⭐', desc: '1张目标图片，在4个选项中选择' },
      { level: 2, flash: 2, time: 3000, inter: 6, difficulty: '⭐⭐', desc: '2张目标图片，在6个选项中选择' },
      { level: 3, flash: 3, time: 2000, inter: 8, difficulty: '⭐⭐⭐', desc: '3张目标图片，在8个选项中选择' },
      { level: 4, flash: 4, time: 2000, inter: 8, difficulty: '⭐⭐⭐⭐', desc: '4张目标图片，在8个选项中选择' },
      { level: 5, flash: 4, time: 1500, inter: 10, difficulty: '⭐⭐⭐⭐⭐', desc: '4张目标图片，在10个选项中选择' },
    ]
  },
  game2: {
    levels: [
      { level: 1, totalCards: 4, difficulty: '⭐', desc: '连续记住4张新出现的卡片' },
      { level: 2, totalCards: 8, difficulty: '⭐⭐', desc: '连续记住8张新出现的卡片' },
      { level: 3, totalCards: 12, difficulty: '⭐⭐⭐', desc: '连续记住12张新出现的卡片' },
      { level: 4, totalCards: 16, difficulty: '⭐⭐⭐⭐', desc: '连续记住16张新出现的卡片' },
    ]
  },
  game3: {
    roundsPerLevel: 5,
    levels: [
      { level: 1, targetCount: 1, displayTime: 3000, optionsCount: 4, difficulty: '⭐', desc: '显示3秒，从4个选项中找出1张原图' },
      { level: 2, targetCount: 1, displayTime: 2000, optionsCount: 4, difficulty: '⭐⭐', desc: '显示2秒，从4个选项中找出1张原图' },
      { level: 3, targetCount: 2, displayTime: 2000, optionsCount: 6, difficulty: '⭐⭐⭐', desc: '显示2秒，从6个选项中找出2张原图' },
      { level: 4, targetCount: 2, displayTime: 1000, optionsCount: 6, difficulty: '⭐⭐⭐⭐', desc: '显示1秒，从6个选项中找出2张原图' },
      { level: 5, targetCount: 3, displayTime: 1000, optionsCount: 8, difficulty: '⭐⭐⭐⭐⭐', desc: '显示1秒，从8个选项中找出3张原图' },
    ]
  },
  batteryAlertMessage: "游戏电量不足，请家长去家长专区看广告进行充电。",
  parentConfig: {
    videoCooldown: 3600
  }
};

// Load config from file if exists
if (fs.existsSync(CONFIG_FILE)) {
  try {
    const fileData = fs.readFileSync(CONFIG_FILE, 'utf8');
    gameConfig = { ...gameConfig, ...JSON.parse(fileData) };
  } catch (err) {
    console.error('Error reading config file:', err);
  }
}

// Initialize admin user if users.json doesn't exist
let users: any[] = [];
if (fs.existsSync(USERS_FILE)) {
  try {
    users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch (err) {
    console.error('Error reading users file:', err);
  }
} else {
  // Create default admin user and 5 test users
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync('admin123', salt);
  users.push({
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    password: hash,
    role: 'admin'
  });

  // Generate 5 test users
  for (let i = 1; i <= 5; i++) {
    const testHash = bcrypt.hashSync('123456', salt);
    users.push({
      id: Date.now() + i,
      username: `test${i}`,
      email: `test${i}@example.com`,
      password: testHash,
      role: 'user'
    });
  }
  
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.warn('Vercel Read-Only FS, skipping file write on init');
  }
}

// Save users helper
const saveUsers = () => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.warn('Vercel Read-Only FS, skipping saveUsers');
  }
};

// Middleware to verify JWT token
const authMiddleware = (req: any, res: any, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Middleware to check if user is admin
const adminMiddleware = (req: any, res: any, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Admin access required' });
  }
};

// ================= API ROUTES =================

// Auth: Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password, type } = req.body;
  
  // 模拟微信登录逻辑 (前端传 type: 'wechat' 即可直接登录)
  if (type === 'wechat') {
    const mockWechatUser = {
      id: Date.now(),
      username: 'WechatUser_' + Math.floor(Math.random() * 1000),
      role: 'user'
    };
    const token = jwt.sign({ id: mockWechatUser.id, username: mockWechatUser.username, role: mockWechatUser.role }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ message: 'Wechat login successful', token, user: mockWechatUser });
  }

  // 正常账号密码登录 (包含管理员登录)
  const user = users.find(u => u.username === username || u.email === username);
  
  if (!user) {
    return res.status(401).json({ error: '用户不存在' });
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: '密码错误' });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ message: 'Login successful', token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
});

// Auth: Register (For normal users)
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: '用户名已存在' });
  }
  
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: '邮箱已被注册' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  
  const newUser = {
    id: Date.now(),
    username,
    email,
    password: hash,
    role: 'user'
  };
  
  users.push(newUser);
  saveUsers();
  
  const token = jwt.sign({ id: newUser.id, username: newUser.username, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ message: 'Registration successful', token, user: { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role } });
});

// Root API route (for testing backend status)
app.get('/', (req: Request, res: Response) => {
  res.send(`
    <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
      <h1 style="color: #4ade80;">✅ 后端服务运行正常！</h1>
      <p style="color: #666;">记忆卡片 (JiyiCard) API 服务已成功启动。</p>
    </div>
  `);
});

// GET current configuration (Public)
app.get('/api/config', (req: Request, res: Response) => {
  res.json(gameConfig);
});

// POST to update configuration (Admin ONLY)
app.post('/api/config', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const newConfig = req.body;
    gameConfig = { ...gameConfig, ...newConfig };
    // Save to file
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(gameConfig, null, 2));
    } catch(e) {
      console.warn('Vercel Read-Only FS, config saved in memory only');
    }
    res.json({ message: 'Configuration updated successfully', config: gameConfig });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

export default app;
