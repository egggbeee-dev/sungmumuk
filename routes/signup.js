/*const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const dotenv = require('dotenv');

// .env 파일에서 환경 변수 로드
dotenv.config();

// MySQL 데이터베이스 연결 설정
const db = mysql.createConnection({
    host: process.env.DB_HOST,       // 데이터베이스 호스트
    user: process.env.DB_USER,       // 데이터베이스 사용자 이름
    password: process.env.DB_PASSWORD, // 데이터베이스 비밀번호
    database: process.env.DB_NAME     // 사용할 데이터베이스 이름
});

// 데이터베이스 연결 확인
db.connect((err) => {
    if (err) {
        console.error('MySQL 연결 오류:', err);
        return;
    }
    console.log('MySQL에 연결되었습니다.');
});

// 회원가입 라우터
router.post('/', async (req, res) => {
    const { username, password, nickname } = req.body;

    // 이메일 형식 확인 (정규식)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(username)) {
        return res.status(400).json({ message: '아이디는 이메일 형식이어야 합니다.' });
    }

    if (!username || !password || !nickname) {
        console.log('빈 필드 확인:', { username, password, nickname });
        return res.status(400).json({ message: '모든 필드를 채워주세요.' });
    }

    console.log('Received data:', { username, password, nickname }); // 데이터 확인

    try {
        // 비밀번호 해시 처리
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Hashed password:', hashedPassword);

        // 사용자 정보를 데이터베이스에 저장하는 쿼리
        const query = 'INSERT INTO users (username, email, password, nickname) VALUES (?, ?, ?, ?)';
        db.query(query, [username, username, hashedPassword, nickname], (err, results) => {
            if (err) {
                console.error('회원 정보 저장 오류:', err);
                return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
            }
            console.log('User successfully registered:', results);
            return res.status(201).json({ message: '회원가입이 완료되었습니다.' });
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;

*/



// routes/signup.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

// 회원가입 라우터
router.post('/', async (req, res) => {
    const { username, password, nickname } = req.body;

    // 이메일 형식 확인 (정규식)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(username)) {
        return res.status(400).json({ message: '아이디는 이메일 형식이어야 합니다.' });
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
