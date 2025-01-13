const express = require('express');
const pool = require('../config/db'); // pool 객체 가져오기
const {ensureAuthenticated} = require('../middlewares/auth');
const router = express.Router();

// 문의 페이지 렌더링
router.get('/inquiry',  ensureAuthenticated, async (req, res) => {
    try {
        res.sendFile(__dirname + '/../inquiry.html'); // inquiry.html 경로 확인
    } catch (error) {
        console.error('파일 전송 중 오류:', error);
        res.status(500).send('파일을 전송하는 중 오류가 발생했습니다.');
    }
});

// 문의 데이터 저장 처리
router.post('/', ensureAuthenticated, async (req, res) => {
    const { title, content } = req.body; 
    if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용을 모두 입력해주세요.' });
    }

    try {
        if (!req.user) { //로그인한 사용자 확인
            return res.status(401).send('인증되지 않은 사용자입니다.');
          }
          const userId = req.user.id;
          console.log("로그인한 사용자 ID:", userId);
        // 데이터베이스에 문의 데이터 삽입
        const query = `
            INSERT INTO inquiry (user_id, title, content, created_at) 
            VALUES (?, ?, ?, NOW())
        `;
        const [result] = await pool.query(query, [userId, title, content]);

        console.log(`문의 데이터 저장 완료: ID=${result.insertId}`);
        res.status(200).json({ message: '문의가 성공적으로 제출되었습니다.' });
    } catch (error) {
        console.error('문의 데이터 저장 중 오류:', error);
        res.status(500).json({ message: '서버 오류로 인해 데이터를 저장하지 못했습니다.' });
    }
});

module.exports = router;
