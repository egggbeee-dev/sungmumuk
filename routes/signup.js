const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const nodemailer = require('nodemailer');

router.post('/send-code', async (req, res) => {
    let { email } = req.body;

    // 공백 제거 및 소문자로 변환
    email = email.trim().toLowerCase();

    // 이메일 형식 및 도메인 확인
    const emailPattern = /^[^\s@]+@sungshin\.ac\.kr$/;
    if (!emailPattern.test(email)) {
        return res.status(400).json({ message: '@sungshin.ac.kr 이메일을 사용해주세요.' });
    }

    try {
        // 랜덤 인증번호 생성
        const verificationCode = Math.floor(100000 + Math.random() * 900000); // 6자리 숫자

        // 이메일 전송 설정
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // Gmail 계정
                pass: process.env.EMAIL_PASS, // Gmail 앱 비밀번호
            },
        });

        // 이메일 전송
        await transporter.sendMail({
            from: '"성신여대 인증 시스템" <no-reply@sungshin.ac.kr>',
            to: email,
            subject: '성신여대 이메일 인증번호',
            text: `인증번호: ${verificationCode}`,
        });

        console.log(`인증번호 ${verificationCode}이(가) ${email}로 전송됨`);
        return res.status(200).json({ message: '인증번호가 전송되었습니다.' });
    } catch (err) {
        console.error('이메일 전송 오류:', err);
        return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;



