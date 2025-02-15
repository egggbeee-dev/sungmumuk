const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

// 회원가입 라우터
router.post('/', async (req, res) => {
    let { username, password, nickname } = req.body;

    // 입력값 검증
    if (!username || !password || !nickname) {
        console.log('빈 필드 확인:', { username, password, nickname });
        return res.status(400).json({ message: '모든 필드를 채워주세요.' });
    }

    // 공백 제거
    username = username.trim();

    // 이메일 형식 및 도메인 확인 (정규식)
    const emailPattern = /^[^\s@]+@sungshin\.ac\.kr$/;
    if (!emailPattern.test(username)) {
        return res.status(400).json({ message: '@sungshin.ac.kr 이메일을 사용해주세요.' });
    }

    console.log('Received data:', { username, password, nickname }); // 데이터 확인

    try {
        // 이메일 중복 체크
        const [existingUser] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: '이미 가입된 이메일입니다.' });
        }

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


