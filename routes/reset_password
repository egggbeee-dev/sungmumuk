const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../config/db"); // DB 연결 설정 파일
const router = express.Router();

// 비밀번호 재설정 폼 제공 (GET 요청)
router.get("/", (req, res) => {
    const token = req.query.token;

    if (!token) {
        return res.status(400).send("잘못된 토큰입니다.");
    }

    // 토큰을 검증하고, 비밀번호 재설정 폼을 제공
    res.send(`
        <form action="/reset_password" method="POST">
            <input type="hidden" name="token" value="${token}" />
            <label for="password">새 비밀번호:</label>
            <input type="password" name="password" required />
            <button type="submit">비밀번호 변경</button>
        </form>
    `);
});

// 비밀번호 변경 처리 (POST 요청)
router.post("/", (req, res) => {
    const token = req.body.token;
    const newPassword = req.body.password;

    if (!token) {
        return res.status(400).send("잘못된 토큰입니다.");
    }

    // 토큰을 통해 해당 사용자 확인 (토큰을 DB에 저장하거나 토큰을 검증하는 방법 필요)
    db.query("SELECT * FROM password_reset_tokens WHERE token = ?", [token], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send("DB 조회 오류");
        }

        if (results.length === 0) {
            return res.status(400).send("유효하지 않은 토큰입니다.");
        }

        // 비밀번호 암호화
        bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
            if (err) {
                return res.status(500).send("비밀번호 암호화에 실패했습니다.");
            }

            // 비밀번호를 DB에 저장
            db.query(
                "UPDATE users SET password = ? WHERE email = ?",
                [hashedPassword, results[0].email],
                (err, updateResult) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send("비밀번호 변경에 실패했습니다.");
                    }

                    // 토큰 삭제 (더 이상 사용되지 않도록)
                    db.query("DELETE FROM password_reset_tokens WHERE token = ?", [token], (err) => {
                        if (err) {
                            console.log(err);
                        }
                    });

                    res.send("비밀번호가 성공적으로 변경되었습니다.");
                }
            );
        });
    });
});

module.exports = router;
