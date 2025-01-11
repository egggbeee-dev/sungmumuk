const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // DB 연결 설정
const multer = require('multer');
const path = require('path');

// 파일 업로드 디렉토리와 파일명 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../review/')); // 'review' 디렉토리로 변경
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname); // 고유한 파일명 생성
    },
});

const upload = multer({ storage });

// 리뷰 상세 조회
router.get('/api/store_review/:id', async (req, res) => {
    const reviewId = req.params.id;

    try {
        const [rows] = await pool.query('SELECT * FROM review WHERE review_id = ?', [reviewId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
        }

        const review = rows[0];
        const currentUserId = req.session.user ? req.session.user.id : null; // 현재 로그인된 사용자 ID

        res.json({
            ...review,
            isEditable: review.user_id === currentUserId // 작성자와 현재 사용자 비교
        });
    } catch (error) {
        console.error('리뷰 조회 중 오류 발생:', error);
        res.status(500).json({ message: '리뷰 데이터를 가져오는 중 오류가 발생했습니다.' });
    }
});

// 리뷰 수정
router.put('/api/store_review/:id', upload.single('review_photo'), async (req, res) => {
    const { id } = req.params;
    const { review_text, taste_rating, access_rating, revisit_rating } = req.body;
    const review_photo = req.file ? req.file.filename : null;

    try {
        const [result] = await pool.query(`
            UPDATE review
            SET review_text = ?, taste_rating = ?, access_rating = ?, revisit_rating = ?, review_photo = ?
            WHERE review_id = ?
        `, [review_text, taste_rating, access_rating, revisit_rating, review_photo, id]);

        // restaurant_id를 별도 쿼리로 가져옴
        const [review] = await pool.query(`SELECT restaurant_id FROM review WHERE review_id = ?`, [id]);

        if (review.length === 0) {
            return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
        }

        res.status(200).json({ message: '리뷰가 성공적으로 수정되었습니다.', restaurant_id: review[0].restaurant_id });
    } catch (error) {
        console.error('리뷰 수정 중 오류:', error);
        res.status(500).json({ message: '리뷰 수정 중 오류가 발생했습니다.' });
    }
});



// 리뷰 삭제
router.delete('/api/store_review/:id', async (req, res) => {
    const reviewId = req.params.id;

    try {
        const [rows] = await pool.query('SELECT restaurant_id FROM review WHERE review_id = ?', [reviewId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
        }

        const restaurantId = rows[0].restaurant_id;

        // 리뷰 삭제
        await pool.query('DELETE FROM review WHERE review_id = ?', [reviewId]);

        // restaurant_id 반환
        res.status(200).json({
            message: '리뷰가 성공적으로 삭제되었습니다.',
            restaurant_id: restaurantId,
        });
    } catch (error) {
        console.error('리뷰 삭제 중 오류 발생:', error);
        res.status(500).json({ message: '리뷰 삭제 중 오류가 발생했습니다.' });
    }
});



module.exports = router;
