const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // 데이터베이스 연결

// 모든 리뷰 가져오기
router.get('/api/reviews', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM review ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '리뷰 데이터를 가져오는 중 오류가 발생했습니다.' });
  }
});

// 특정 리뷰 가져오기
router.get('/api/reviews/:id', async (req, res) => {
  const reviewId = req.params.id;
  try {
    const [rows] = await pool.query('SELECT * FROM review WHERE review_id = ?', [reviewId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '리뷰 데이터를 가져오는 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
