
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt'); // 비밀번호 해싱용 bcrypt

// 이메일 인증번호 전송 API
router.post('/send-code', async (req, res) => {
    let { email } = req.body;

    email = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@sungshin\.ac\.kr$/;

    if (!emailPattern.test(email)) {
        return res.status(400).json({ message: '@sungshin.ac.kr 이메일을 사용해주세요.' });
    }

    try {
        const verificationCode = Math.floor(100000 + Math.random() * 900000);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: '"TEAM sungmumuk" <no-reply@sungshin.ac.kr>',
            to: email,
            subject: '성뭐먹 이메일 인증번호',
            text: `인증번호: ${verificationCode}`,
        });

        console.log(`인증번호 ${verificationCode}이(가) ${email}로 전송됨`);
        return res.status(200).json({ message: '인증번호가 전송되었습니다.' });
    } catch (err) {
        console.error('이메일 전송 오류:', err);
        return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// ✅ 회원가입 API 추가 (/api/signup)
router.post('/', async (req, res) => {
    const { username, email, password, nickname } = req.body;

    if (!username || !email || !password || !nickname) {
        return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
    }

    try {
        // 중복 회원 체크
        const [existingUser] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ message: '이미 가입된 이메일입니다.' });
        }

        // 비밀번호 해싱 (bcrypt 적용)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 사용자 등록 (username을 email과 동일하게 저장)
        const query = 'INSERT INTO users (username, email, password, nickname) VALUES (?, ?, ?, ?)';
        const [result] = await pool.query(query, [username, email, hashedPassword, nickname]);

        if (result.affectedRows > 0) {
            return res.status(200).json({ message: '회원가입이 완료되었습니다.' });
        } else {
            return res.status(500).json({ message: '회원가입에 실패했습니다.' });
        }
    } catch (error) {
        console.error('회원가입 오류:', error);
        return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;
