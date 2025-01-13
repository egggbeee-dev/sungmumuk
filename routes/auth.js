const express = require('express');
const router = express.Router();

// 인증 상태 확인 라우트
router.get('/status', (req, res) => {
    try {
        if (req.session && req.session.user) {
            console.log('인증 상태 확인: 로그인된 사용자입니다.');
            res.status(200).json({
                loggedIn: true,
                user: {
                    id: req.session.user.id,
                    nickname: req.session.user.nickname,
                },
            });
        } else {
            console.log('인증 상태 확인: 비로그인 사용자입니다.');
            res.status(200).json({ loggedIn: false });
        }
    } catch (error) {
        console.error('인증 상태 확인 중 오류 발생:', error);
        res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
    }
});

// 로그아웃 라우트
router.post('/logout', (req, res) => {
    try {
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    console.error('세션 삭제 중 오류 발생:', err);
                    return res.status(500).json({ message: '로그아웃 중 오류가 발생했습니다.' });
                }
                console.log('로그아웃 성공: 세션이 삭제되었습니다.');
                res.status(200).json({ message: '로그아웃 성공' });
            });
        } else {
            console.log('로그아웃 시도: 세션이 없습니다.');
            res.status(400).json({ message: '로그인 상태가 아닙니다.' });
        }
    } catch (error) {
        console.error('로그아웃 처리 중 오류 발생:', error);
        res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
    }
});

// 세션 갱신 라우트 (선택 사항)
router.post('/refresh-session', (req, res) => {
    try {
        if (req.session && req.session.user) {
            req.session.touch(); // 세션 만료 시간을 갱신
            console.log('세션 갱신: 세션 만료 시간이 갱신되었습니다.');
            res.status(200).json({ message: '세션 갱신 성공' });
        } else {
            console.log('세션 갱신 실패: 로그인된 사용자가 없습니다.');
            res.status(400).json({ message: '로그인 상태가 아닙니다.' });
        }
    } catch (error) {
        console.error('세션 갱신 중 오류 발생:', error);
        res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
    }
});

module.exports = router;
