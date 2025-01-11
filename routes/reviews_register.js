const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // pool 가져오기
const multer = require('multer');
const fs = require('fs'); // 파일 시스템 모듈
const path = require('path');
const { ensureAuthenticated } = require('../middlewares/auth');



router.get('/reviews_register', ensureAuthenticated, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).send('인증되지 않은 사용자입니다.');
        }
        res.render('reviews_register', { nickname: req.users.nickname }); // 사용자 닉네임 전달
    } catch (error) {
        console.error('페이지 로드 중 오류 발생:', error);
        res.status(500).send('서버 오류');
    }
});


// 파일 저장 디렉토리 확인 및 생성
const uploadDir = 'review/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir); // 디렉토리가 없으면 생성
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // 업로드 디렉토리
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`); // 파일 이름
    }
});

const upload = multer({ storage });

router.post('/submit', ensureAuthenticated, upload.single('review_photo'), async (req, res) => {
    const {
        restaurant_name,
        restaurant_id,
        taste_rating,
        access_rating,
        revisit_rating,
        review_text,
    } = req.body;

    const user_id = req.user.id; //로그인된 사용자의 ID
    const reviewer = req.user.nickname; // 로그인한 사용자 닉네임
    const review_photo = req.file ? req.file.filename : null;

    try {
        const query = `
            INSERT INTO review (
                restaurant_name,
                restaurant_id,
                user_id,
                taste_rating,
                access_rating,
                revisit_rating,
                reviewer,
                review_photo,
                review_text
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        await pool.query(query, [
            restaurant_name,
            restaurant_id,
            user_id,
            taste_rating,
            access_rating,
            revisit_rating,
            reviewer, // 닉네임 저장
            review_photo,
            review_text,
        ]);

        res.status(200).send('리뷰가 성공적으로 저장되었습니다!');
    } catch (error) {
        console.error('리뷰 저장 중 오류:', error);
        res.status(500).send('리뷰 저장 중 오류가 발생했습니다.');
    }
});



module.exports = router;



