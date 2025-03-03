const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const pool = require('../config/db'); // MySQL 연결
const router = express.Router();

// ✅ 비밀번호 재설정 링크 이메일 전송 API
router.post('/', async (req, res) => {
    let { email } = req.body;
    email = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@sungshin\.ac\.kr$/;

    if (!emailPattern.test(email)) {
        console.log(`🚨 차단된 이메일 시도: ${email}`);
        return res.status(400).json({ message: '성신여대 이메일(@sungshin.ac.kr)만 입력 가능합니다.' });
    }

    try {
        // 🔹 해당 이메일이 존재하는지 확인
        const [user] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

        if (user.length === 0) {
            console.log(`🚨 이메일이 DB에 없음: ${email}`);
            return res.status(400).json({ message: '등록된 이메일이 없습니다.' });
        }

        // 🔹 랜덤 토큰 생성
        const resetToken = crypto.randomBytes(16).toString('hex');
        const resetLink = `http://sungmumuk.com/reset_password?token=${resetToken}`;
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10분 후 만료

        // 🔹 Gmail SMTP 설정
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // 🔹 이메일 전송
        await transporter.sendMail({
            from: `"TEAM sungmumuk" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '비밀번호 재설정 링크',
            text: `안녕하세요.\n\n비밀번호 재설정을 위해 아래 링크를 클릭해서 변경 부탁드립니다.\n\n${resetLink}\n\n이 링크는 10분 내에 사용해야 합니다.`,
        });

        // 🔹 토큰을 DB에 저장
        await pool.query(
            `INSERT INTO password_reset_tokens (email, token, expires_at) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE token = ?, expires_at = ?`,
            [email, resetToken, expiresAt, resetToken, expiresAt]
        );

        return res.status(200).json({ message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.' });

    } catch (error) {
        console.error('⚠️ 비밀번호 재설정 오류:', error);
        return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;

