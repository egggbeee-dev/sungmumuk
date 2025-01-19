const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../middlewares/auth');
const pool = require('../config/db'); // 데이터베이스 연결 설정


router.get('/my_reviews', (req, res) => {
    // `my_reviews.html` 파일을 렌더링
    res.sendFile(path.join(__dirname, '../views', 'reviews.html'));
  });


router.get('/api/reviews', ensureAuthenticated, async (req, res) => {
    const userId = req.user.id; // 로그인된 사용자 ID 가져오기
    console.log("로그인된 사용자 ID:", userId); // 디버깅 로그
    try {
      const [rows] = await pool.query(
        `SELECT 
           review_id AS reviewId,
           restaurant_name AS restaurantName,
           review_photo AS reviewPhoto,
           review_text AS reviewText,
           taste_rating AS tasteRating,
           revisit_rating AS revisitRating,
           access_rating AS accessRating,
           DATE_FORMAT(created_at, "%Y-%m-%d") AS createdAt
         FROM review
         WHERE user_id = ?`,
        [userId]
      );
      res.json(rows); // 클라이언트에 리뷰 데이터 전송
    } catch (error) {
      console.error(error);
      res.status(500).send('리뷰 데이터를 가져오는 중 오류가 발생했습니다.');
    }
  });

  module.exports = router;