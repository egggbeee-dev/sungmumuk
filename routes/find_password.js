const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const db = require('../config/db'); // DB 연결 설정 파일
const router = express.Router();

// 비밀번호 재설정 링크를 이메일로 보내는 처리
router.post('/', (req, res) => {
    const email = req.body.email;

    if (!email || !email.endsWith('@sungshin.ac.kr')) {
        return res.status(400).send('성신여대 이메일(@sungshin.ac.kr)을 입력해 주세요.');
    }

    // DB에서 이메일 주소 확인
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.log('DB 조회 오류:', err);
            return res.status(500).send('DB 조회 오류');
        }

        if (results.length === 0) {
            return res.status(400).send('등록된 이메일이 없습니다.');
        }

        // 고유한 비밀번호 재설정 링크 생성 (랜덤 토큰)
        const resetToken = crypto.randomBytes(16).toString('hex');
        const resetLink = `http://sungmumuk.com/reset_password?token=${resetToken}`;

        // 인증번호 유효기간 설정 (10분)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // 이메일 전송 설정 (Nodemailer 사용)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: '비밀번호 재설정 링크',
            text: `안녕하세요.\n\n비밀번호 재설정을 위해 아래 링크를 클릭해주세요.\n\n${resetLink}\n\n이 링크는 10분 내에 사용해야 합니다.`,
        };

        // 이메일 전송
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('이메일 전송 실패:', error);
                return res.status(500).send('이메일 전송에 실패했습니다.');
            }

            console.log('이메일 전송 완료: ' + info.response); // 전송 성공 로그
            res.send('비밀번호 재설정 링크가 이메일로 전송되었습니다.');

            // DB에 토큰과 만료 시간 저장
            db.query(
                'INSERT INTO password_reset_tokens (email, token, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token = ?, expires_at = ?',
                [email, resetToken, expiresAt, resetToken, expiresAt],
                (err, results) => {
                    if (err) {
                        console.log('토큰 저장 오류:', err);
                    }
                }
            );
        });
    });
});

module.exports = router;


