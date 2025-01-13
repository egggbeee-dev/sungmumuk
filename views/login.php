<?php
session_start();
include 'db_connection.php'; // 데이터베이스 연결 파일

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'];
    $password = $_POST['password'];

    // 데이터베이스에서 아이디로 사용자 정보 조회
    $sql = "SELECT * FROM users WHERE username = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $username); // 아이디로 검색
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        
        // 비밀번호 검증
        if (password_verify($password, $user['password'])) {
            // 로그인 성공
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            header("Location: dashboard.php");
            exit();
        } else {
            echo "<p>잘못된 비밀번호입니다.</p>";
        }
    } else {
        echo "<p>존재하지 않는 아이디입니다.</p>";
    }
    
    $stmt->close();
    $conn->close();
}
?>