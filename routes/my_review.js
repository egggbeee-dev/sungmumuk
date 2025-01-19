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

  // /mypage/reviews API
router.get('/mypage/reviews', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id; // 현재 로그인한 사용자 ID
    console.log("현재 로그인한 사용자 ID:", userId);

    const query = `
      SELECT 
        r.review_id,
        r.restaurant_id,
        r.restaurant_name,
        r.review_photo,
        r.review_text,
        r.taste_rating,
        r.revisit_rating,
        r.access_rating,
        r.created_at
      FROM 
        review r
      WHERE 
        r.user_id = ?
      ORDER BY 
        r.created_at DESC
      LIMIT 3
    `;

    const [rows] = await pool.query(query, [userId]); // MySQL 쿼리 실행

    if (rows.length === 0) {
      return res.status(404).json({ message: '작성된 리뷰가 없습니다.' });
    }

    console.log('가져온 리뷰 데이터:', rows);
    res.json(rows); // 클라이언트로 리뷰 데이터 반환
  } catch (error) {
    console.error('리뷰 데이터를 가져오는 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});



  module.exports = router;