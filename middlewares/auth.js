// 인증 미들웨어: 로그인된 사용자만 접근 가능
const ensureAuthenticated = (req, res, next) => {
    try {
        if (req.session && req.session.user) {
            req.user = req.session.user; // 세션에서 사용자 정보 설정
            console.log('인증된 사용자:', req.user); // 디버깅용 로그
            return next(); // 다음 미들웨어 또는 라우터로 이동
        }
        console.log('미인증 사용자 접근 시도.');
        res.status(401).json({ message: '로그인이 필요합니다.' });
    } catch (error) {
        console.error('인증 미들웨어 처리 중 오류 발생:', error);
        res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
    }
};


// 두 미들웨어를 함께 내보냄
module.exports = { ensureAuthenticated };

