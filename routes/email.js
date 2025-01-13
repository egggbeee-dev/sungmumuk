const express = require("express");
const nodemailer = require("nodemailer");
const db = require("../config/db"); // DB 연결 설정 파일
const router = express.Router();

// 인증번호 요청 라우터
router.post("/send-code", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).send({ message: "이메일이 필요합니다." });
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6자리 인증번호 생성
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 인증번호 10분 유효

  try {
    // 인증번호를 데이터베이스에 저장
    await db.query(
      "INSERT INTO email_verifications (email, code, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE code = ?, expires_at = ?",
      [email, verificationCode, expiresAt, verificationCode, expiresAt]
    );

    // 이메일 전송 설정
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // .env에 저장된 이메일
        pass: process.env.EMAIL_PASS, // .env에 저장된 비밀번호
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "회원가입 인증번호",
      text: `인증번호는 ${verificationCode}입니다. 10분 내로 입력해주세요.`,
    };

    // 이메일 전송
    await transporter.sendMail(mailOptions);

    res.status(200).send({ message: "인증번호가 전송되었습니다." });
  } catch (error) {
    console.error("Error sending verification code:", error);
    res.status(500).send({ message: "인증번호 요청 중 문제가 발생했습니다." });
  }
});

// 인증번호 확인 라우터
router.post("/verify-code", async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).send({ message: "이메일과 인증번호가 필요합니다." });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM email_verifications WHERE email = ? AND code = ? AND expires_at > NOW()",
      [email, code]
    );

    if (rows.length === 0) {
      return res.status(400).send({ message: "유효하지 않거나 만료된 인증번호입니다." });
    }

    // 인증 성공 시 데이터 삭제
    await db.query("DELETE FROM email_verifications WHERE email = ?", [email]);

    res.status(200).send({ message: "인증번호 확인 성공!" });
  } catch (error) {
    console.error("Error verifying code:", error);
    res.status(500).send({ message: "인증번호 확인 중 문제가 발생했습니다." });
  }
});

module.exports = router;
