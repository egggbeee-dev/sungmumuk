const express = require("express");
const bcrypt = require("bcrypt");
const path = require("path");
const pool = require("../config/db"); // MySQL 연결
const router = express.Router();

// ✅ 비밀번호 재설정 HTML 제공 (GET 요청)
router.get("/", (req, res) => {
    const token = req.query.token;
    console.log("🔎 요청된 토큰:", token);

    if (!token) {
        console.log("🚨 토큰이 제공되지 않음! 요청 URL 확인 필요");
        return res.status(400).send("잘못된 요청입니다. (토큰이 없음)");
    }

    res.sendFile(path.join(__dirname, "../views/reset_password.html"));
});

// ✅ 비밀번호 변경 처리 (POST 요청)
router.post("/", async (req, res) => {
    try {
        const { token, password } = req.body;
        console.log("🔎 비밀번호 변경 요청 - 토큰:", token);

        if (!token || !password) {
            console.log("🚨 토큰 또는 비밀번호 없음!");
            return res.status(400).json({ message: "잘못된 요청입니다. (토큰 또는 비밀번호 없음)" });
        }

        // ✅ MySQL에서 토큰 검증 및 이메일 가져오기
        const [rows] = await pool.query("SELECT email FROM password_reset_tokens WHERE token = ?", [token]);

        if (rows.length === 0) {
            console.log(`🚨 DB에서 토큰 조회 실패 - token: ${token}`);
            return res.status(400).json({ message: "유효하지 않은 토큰입니다." });
        }

        console.log("✅ 유효한 토큰 확인 완료:", token);

        const userEmail = rows[0].email;
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ 비밀번호 업데이트
        const updateResult = await pool.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, userEmail]);

        if (updateResult.affectedRows === 0) {
            console.log(`🚨 비밀번호 업데이트 실패 - 이메일: ${userEmail}`);
            return res.status(400).json({ message: "비밀번호 변경 실패 (유저 없음)" });
        }

        // ✅ 사용된 토큰 삭제 (재사용 방지)
        await pool.query("DELETE FROM password_reset_tokens WHERE token = ?", [token]);

        return res.status(200).json({ message: "비밀번호가 성공적으로 변경되었습니다." });

    } catch (error) {
        console.error("⚠️ 비밀번호 변경 오류:", error);
        return res.status(500).json({ message: "서버 오류 발생" });
    }
});

module.exports = router;
