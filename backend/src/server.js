const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const port = 3000;
const JWT_SECRET = 'your-secret-key'; // 在生产环境中应该使用环境变量

// 配置文件上传
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('只允许上传图片文件'));
    }
    cb(null, true);
  }
});

// 中间件
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器内部错误' });
});

// 测试路由
app.get('/', (req, res) => {
  res.json({ message: '服务器运行正常' });
});

// 创建数据库连接
const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// 初始化数据库表
function initializeDatabase() {
  db.serialize(() => {
    // 用户表
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    )`, (err) => {
      if (err) {
        console.error('创建用户表失败:', err);
      } else {
        console.log('用户表创建成功或已存在');
      }
    });

    // 行为类型表
    db.run(`CREATE TABLE IF NOT EXISTS behavior_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('创建行为类型表失败:', err);
      } else {
        console.log('行为类型表创建成功或已存在');
        // 插入默认行为类型
        const defaultTypes = [
          { name: '迟到', category: '违纪', description: '上课迟到' },
          { name: '早退', category: '违纪', description: '未经允许提前离开' },
          { name: '打架', category: '违纪', description: '与他人发生肢体冲突' },
          { name: '作弊', category: '违纪', description: '考试作弊' },
          { name: '志愿服务', category: '优秀', description: '参与志愿服务活动' },
          { name: '学习进步', category: '优秀', description: '学习成绩显著提升' },
          { name: '助人为乐', category: '优秀', description: '帮助他人' },
          { name: '比赛获奖', category: '优秀', description: '在比赛中获得奖项' }
        ];

        defaultTypes.forEach(type => {
          db.run(
            'INSERT OR IGNORE INTO behavior_types (name, category, description) VALUES (?, ?, ?)',
            [type.name, type.category, type.description]
          );
        });
      }
    });

    // 学生表
    db.run(`CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      student_id TEXT UNIQUE NOT NULL,
      class TEXT,
      grade TEXT,
      photo_url TEXT,
      address TEXT,
      emergency_contact TEXT,
      emergency_phone TEXT,
      notes TEXT
    )`, (err) => {
      if (err) {
        console.error('创建学生表失败:', err);
      } else {
        console.log('学生表创建成功或已存在');
      }
    });

    // 行为记录表
    db.run(`CREATE TABLE IF NOT EXISTS behaviors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      behavior_type TEXT,
      description TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id)
    )`);

    // 创建默认管理员账户
    const defaultAdmin = {
      username: 'admin',
      password: bcrypt.hashSync('admin123', 10),
      role: 'admin'
    };

    db.get('SELECT id FROM users WHERE username = ?', [defaultAdmin.username], (err, row) => {
      if (err) {
        console.error('检查管理员账户失败:', err);
      } else if (!row) {
        db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
          [defaultAdmin.username, defaultAdmin.password, defaultAdmin.role],
          (err) => {
            if (err) {
              console.error('创建默认管理员账户失败:', err);
            } else {
              console.log('默认管理员账户创建成功');
            }
          });
      } else {
        console.log('默认管理员账户已存在');
      }
    });
  });
}

// 身份验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '无效的认证令牌' });
    }
    req.user = user;
    next();
  });
};

// 登录路由
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', { username }); // 添加日志

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Database error:', err); // 添加日志
      return res.status(500).json({ message: '服务器错误' });
    }
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    console.log('Login successful:', { username }); // 添加日志
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  });
});

// 获取学生列表（包含行为统计）
app.get('/api/students', authenticateToken, (req, res) => {
  console.log('获取学生列表请求');
  const query = `
    SELECT 
      s.*,
      (SELECT COUNT(*) FROM behaviors WHERE student_id = s.id AND behavior_type = '违纪') as violation_count,
      (SELECT COUNT(*) FROM behaviors WHERE student_id = s.id AND behavior_type = '优秀') as excellent_count
    FROM students s
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('获取学生列表失败:', err);
      return res.status(500).json({ 
        message: '获取学生列表失败',
        error: err.message 
      });
    }
    console.log('返回的学生列表:', rows);
    res.json(rows);
  });
});

// 获取行为类型统计
app.get('/api/students/:id/behavior-stats', authenticateToken, (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT 
      behavior_type,
      COUNT(*) as count,
      GROUP_CONCAT(description) as descriptions
    FROM behaviors 
    WHERE student_id = ?
    GROUP BY behavior_type
  `;
  
  db.all(query, [id], (err, rows) => {
    if (err) {
      console.error('获取学生行为统计失败:', err);
      return res.status(500).json({ 
        message: '获取学生行为统计失败',
        error: err.message 
      });
    }
    res.json(rows);
  });
});

// 添加学生
app.post('/api/students', authenticateToken, (req, res) => {
  const { 
    name, 
    student_id, 
    class: className, 
    grade,
    photo_url,
    address,
    emergency_contact,
    emergency_phone,
    notes
  } = req.body;
  
  console.log('接收到的学生数据:', req.body);

  // 验证必填字段
  if (!name || !student_id) {
    return res.status(400).json({ message: '姓名和学号为必填项' });
  }

  // 检查学号是否已存在
  db.get('SELECT id FROM students WHERE student_id = ?', [student_id], (err, row) => {
    if (err) {
      console.error('检查学号是否存在时出错:', err);
      return res.status(500).json({ message: '服务器错误' });
    }

    if (row) {
      return res.status(400).json({ message: '该学号已存在' });
    }

    const query = `
      INSERT INTO students (
        name, student_id, class, grade, photo_url, 
        address, emergency_contact, emergency_phone, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      name.trim(), 
      student_id.trim(), 
      className ? className.trim() : null, 
      grade ? grade.trim() : null,
      photo_url || null,
      address ? address.trim() : null,
      emergency_contact ? emergency_contact.trim() : null,
      emergency_phone ? emergency_phone.trim() : null,
      notes ? notes.trim() : null
    ];

    console.log('执行的SQL查询:', query);
    console.log('SQL参数:', values);

    db.run(query, values, function(err) {
      if (err) {
        console.error('添加学生失败:', err);
        return res.status(500).json({ 
          message: '创建学生记录失败',
          error: err.message 
        });
      }

      const newId = this.lastID;
      db.get('SELECT * FROM students WHERE id = ?', [newId], (err, row) => {
        if (err) {
          console.error('获取新添加的学生数据失败:', err);
          return res.status(500).json({ 
            message: '获取新添加的学生数据失败',
            error: err.message 
          });
        }

        console.log('新添加的学生数据:', row);
        res.json(row);
      });
    });
  });
});

app.put('/api/students/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    student_id, 
    class: className, 
    grade,
    photo_url,
    address,
    emergency_contact,
    emergency_phone,
    notes
  } = req.body;
  
  db.run(`UPDATE students SET 
    name = ?, 
    student_id = ?, 
    class = ?, 
    grade = ?,
    photo_url = ?,
    address = ?,
    emergency_contact = ?,
    emergency_phone = ?,
    notes = ?
    WHERE id = ?`,
    [name, student_id, className, grade, photo_url, address, 
     emergency_contact, emergency_phone, notes, id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: '更新学生记录失败' });
      }
      res.json({ 
        id, 
        name, 
        student_id, 
        class: className, 
        grade,
        photo_url,
        address,
        emergency_contact,
        emergency_phone,
        notes
      });
    });
});

app.delete('/api/students/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM students WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: '删除学生记录失败' });
    }
    res.json({ message: '删除成功' });
  });
});

// 行为记录路由
app.get('/api/behaviors', authenticateToken, (req, res) => {
  const query = `
    SELECT b.*, s.name as student_name 
    FROM behaviors b 
    JOIN students s ON b.student_id = s.id
    ORDER BY b.date DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: '获取行为记录失败' });
    }
    res.json(rows);
  });
});

app.post('/api/behaviors', authenticateToken, (req, res) => {
  const { student_id, behavior_type, description } = req.body;
  
  db.run('INSERT INTO behaviors (student_id, behavior_type, description) VALUES (?, ?, ?)',
    [student_id, behavior_type, description],
    function(err) {
      if (err) {
        return res.status(500).json({ message: '创建行为记录失败' });
      }
      res.json({ id: this.lastID, student_id, behavior_type, description });
    });
});

app.delete('/api/behaviors/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM behaviors WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: '删除行为记录失败' });
    }
    res.json({ message: '删除成功' });
  });
});

// 统计分析路由
app.get('/api/analysis/behavior-summary', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      s.name as student_name,
      b.behavior_type,
      COUNT(*) as count
    FROM behaviors b
    JOIN students s ON b.student_id = s.id
    GROUP BY s.name, b.behavior_type
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: '获取行为统计失败' });
    }
    res.json(rows);
  });
});

// 添加文件上传路由
app.post('/api/upload', authenticateToken, (req, res) => {
  upload.single('file')(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      // Multer 错误处理
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: '文件大小不能超过2MB' });
      }
      return res.status(400).json({ message: '文件上传错误' });
    } else if (err) {
      // 其他错误
      console.error('文件上传错误:', err);
      return res.status(500).json({ message: '服务器错误' });
    }

    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      url: fileUrl,
      message: '文件上传成功'
    });
  });
});

// 获取所有行为类型
app.get('/api/behavior-types', authenticateToken, (req, res) => {
  const query = 'SELECT * FROM behavior_types ORDER BY category, name';
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('获取行为类型失败:', err);
      return res.status(500).json({ 
        message: '获取行为类型失败',
        error: err.message 
      });
    }
    res.json(rows);
  });
});

// 添加行为类型
app.post('/api/behavior-types', authenticateToken, (req, res) => {
  const { name, category, description } = req.body;

  if (!name || !category) {
    return res.status(400).json({ message: '名称和类别为必填项' });
  }

  const query = `
    INSERT INTO behavior_types (name, category, description)
    VALUES (?, ?, ?)
  `;

  db.run(query, [name, category, description], function(err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(400).json({ message: '该行为类型名称已存在' });
      }
      console.error('添加行为类型失败:', err);
      return res.status(500).json({ 
        message: '添加行为类型失败',
        error: err.message 
      });
    }

    res.json({
      id: this.lastID,
      name,
      category,
      description
    });
  });
});

// 删除行为类型
app.delete('/api/behavior-types/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  // 检查是否有关联的行为记录
  db.get('SELECT COUNT(*) as count FROM behaviors WHERE behavior_type IN (SELECT name FROM behavior_types WHERE id = ?)', 
    [id], 
    (err, row) => {
      if (err) {
        console.error('检查行为类型使用情况失败:', err);
        return res.status(500).json({ message: '服务器错误' });
      }

      if (row.count > 0) {
        return res.status(400).json({ 
          message: '该行为类型已被使用，无法删除' 
        });
      }

      db.run('DELETE FROM behavior_types WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('删除行为类型失败:', err);
          return res.status(500).json({ 
            message: '删除行为类型失败',
            error: err.message 
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: '行为类型不存在' });
        }

        res.json({ message: '删除成功' });
      });
    }
  );
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 