import React, {useState} from "react";
import "./App.css";
// ログインページ（ログイン画面）用コンポーネント
import LoginPage from "./pages/LoginPage";
// ホームページ（ホーム画面）用コンポーネント
import HomePage from "./pages/HomePage";

function App() {
  // ログイン状態の管理用ステート（isLoggedInの真偽値で管理）
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 現在ページの管理用ステート
  const [page, setPage] = useState("login");

  // ログイン
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  // ログアウト
  const handleLogout = async () => {
    const response = await fetch("/api/logout", {
      method: "POST",
    });
    if (response.ok) {
      setIsLoggedIn(false);
    }
  };

  return (
    <div>
      {/* ログアウト中はログイン画面、ログイン中はホーム画面を表示 */}
      {!isLoggedIn ? (
        <>
          {page === "login" && (
            <LoginPage
              onLogin={handleLogin}
              onMoveSignup={() => setPage("signup")}
            />
          )}
        </>
      ) : (
        <>
          {page === "home" && (
            <HomePage onLogout={handleLogout} />
          )}
        </>
      )}
    </div>
  );
}

export default App;