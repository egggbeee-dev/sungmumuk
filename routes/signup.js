const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

// 회원가입 라우터
router.post('/', async (req, res) => {
    const { username, password, nickname } = req.body;

    // 이메일 형식 및 도메인 확인 (정규식)
    const emailPattern = /^[^\s@]+@sungshin\.ac\.kr$/;
    if (!emailPattern.test(username)) {
        return res.status(400).json({ message: '아이디는 @sungshin.ac.kr 이메일만 사용 가능합니다.' });
    }

    if (!username || !password || !nickname) {
        console.log('빈 필드 확인:', { username, password, nickname });
        return res.status(400).json({ message: '모든 필드를 채워주세요.' });
    }

    console.log('Received data:', { username, password, nickname }); // 데이터 확인

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // 데이터베이스에 사용자 추가
        const query = 'INSERT INTO users (username, email, password, nickname) VALUES (?, ?, ?, ?)';
        const [results] = await pool.query(query, [username, username, hashedPassword, nickname]); // 비동기로 쿼리 실행

        console.log('User successfully registered:', results);
        return res.status(201).json({ message: '회원가입이 완료되었습니다.' });
    } catch (err) {
        console.error('회원 정보 저장 오류:', err); // 쿼리 오류 출력
        return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;
