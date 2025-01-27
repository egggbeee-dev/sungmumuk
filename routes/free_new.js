const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { ensureAuthenticated } = require('../middlewares/auth'); // 인증 미들웨어 임포트
const pool = require('../config/db'); // 연결 풀 가져오기

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
router.post('/posts', ensureAuthenticated, upload.single('image'), async (req, res) => {
  const { title, content, category } = req.body;
  const userId = req.user.id; // 로그인된 사용자 ID
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  if (!title || !content || !category) {
    return res.status(400).json({ message: '제목, 내용 및 카테고리를 모두 입력하세요.' });
  }

  const query = 'INSERT INTO posts (title, content, category, image_url, user_id) VALUES (?, ?, ?, ?, ?)';

  try {
    const [result] = await pool.query(query, [title, content, category, imageUrl, userId]);
    res.status(201).json({ message: '게시물이 저장되었습니다.', postId: result.insertId });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: '게시물 저장에 실패했습니다.' });
  }
});

module.exports = router;

