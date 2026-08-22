import React, {useState} from "react";
import "./App.css";
// ログインページ（ログイン画面）用コンポーネント
import LoginPage from "./pages/LoginPage";
// ホームページ（ホーム画面）用コンポーネント
import HomePage from "./pages/HomePage";

function App() {
  // ログイン状態の管理用ステート（isLoggedInの真偽値で管理）
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
      {/* ログイン中はホーム画面、ログアウト中はログイン画面を表示 */}
      {isLoggedIn ? (
        <HomePage onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;