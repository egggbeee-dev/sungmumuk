const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const { ensureAuthenticated } = require('../middlewares/auth'); // 인증 미들웨어 임포트

// MySQL 데이터베이스 연결 설정
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'sungmumuk',
});

// 데이터베이스 연결 확인
db.connect((err) => {
  if (err) {
    console.error('MySQL 연결 실패:', err.message);
  } else {
    console.log('MySQL 연결 성공');
  }
});

// Multer 설정 - 이미지 파일 저장 위치 및 이름 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('이미지 파일만 업로드 가능합니다.'));
    }
    cb(null, true);
  },
});

// 게시글 저장 API (POST /free_new/posts)
router.post('/posts', ensureAuthenticated, upload.single('image'), (req, res) => {
  const { title, content, category } = req.body;
  const userId = req.user.id; // 로그인된 사용자 ID
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  if (!title || !content || !category) {
    return res.status(400).json({ message: '제목, 내용 및 카테고리를 모두 입력하세요.' });
  }

  const query = 'INSERT INTO free_posts (title, content, category, image_url, user_id) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [title, content, category, imageUrl, userId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: '게시물 저장에 실패했습니다.' });
    }
    res.status(201).json({ message: '게시물이 저장되었습니다.' });
  });
});

module.exports = router;
