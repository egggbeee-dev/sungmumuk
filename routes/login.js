const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db'); // MySQL connection pool

// 로그인 API
router.post('/', async (req, res) => {
    const { username, password } = req.body;

    console.log('로그인 요청 데이터:', { username, password });

    if (!username || !password) {
        return res.status(400).json({ message: '모든 필드를 채워주세요.' });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(username)) {
        return res.status(400).json({ message: '아이디는 이메일 형식이어야 합니다.' });
    }

    try {
        // 사용자 조회
        const query = 'SELECT * FROM users WHERE username = ?';
        const [results] = await pool.query(query, [username]);

        if (results.length === 0) {
            console.log('사용자 없음 또는 잘못된 이메일');
            return res.status(401).json({ message: '잘못된 이메일 또는 비밀번호입니다.' });
        }

        const user = results[0];

        // 비밀번호 확인
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('비밀번호 불일치');
            return res.status(401).json({ message: '잘못된 이메일 또는 비밀번호입니다.' });
        }

        // 세션 저장
        req.session.user = {
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            isAdmin : user.is_admin,
        };

        console.log('로그인 성공:', req.session.user);

        // 마지막 로그인 시간 업데이트
        const updateQuery = 'UPDATE users SET last_login_time = NOW() WHERE id = ?';
        try {
            await pool.query(updateQuery, [user.id]);
        } catch (updateError) {
            console.error('마지막 로그인 시간 업데이트 실패:', updateError);
        }

        // 클라이언트로 응답
        return res.status(200).json({
            message: '로그인 성공',
            user: {
                id: user.id,
                username: user.username,
                nickname: user.nickname,
                isAdmin : user.is_admin,
            },
            additionalInfo: {
                lastLoginTime: user.last_login_time || '정보 없음',
            },
        });
    } catch (err) {
        console.error('데이터베이스 오류:', err);

        // 중복 응답 방지
        if (!res.headersSent) {
            return res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
        }
    }
});

// 로그아웃 API
router.post('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.error('로그아웃 실패:', err);
                return res.status(500).json({ message: '로그아웃에 실패했습니다.' });
            }
            res.status(200).json({ message: '로그아웃 성공' });
        });
    } else {
        res.status(400).json({ message: '로그인 상태가 아닙니다.' });
    }
});

module.exports = router;