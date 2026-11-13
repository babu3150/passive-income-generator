import React, {useState} from "react";
import "./App.css";
// ログインページ（ログイン画面）用コンポーネント
import LoginPage from "./pages/LoginPage";
// ホームページ（ホーム画面）用コンポーネント
import HomePage from "./pages/HomePage";
import SignupPage from "./pages/SignupPage";

function App() {
  // ログイン状態の管理用ステート（isLoggedInの真偽値で管理）
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 現在ページの管理用ステート
  const [page, setPage] = useState("login");

  // ログイン
  const handleLogin = () => {
    setIsLoggedIn(true);
    setPage("home");
  };

  // ログアウト
  const handleLogout = async () => {
    try {
        const response = await fetch("/api/logout", {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("ログアウトに失敗しました");
        }

        setIsLoggedIn(false);
        setPage("login");
    } catch (error) {
      console.error("ログアウトエラー：", error);
      alert("ログアウトに失敗しました");
    }
  };

  // ユーザー登録（登録後はホーム画面に遷移）
  const handleSignup = () => {
    setIsLoggedIn(true);
    setPage("home");
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

          {page === "signup" && (
            <SignupPage
              onSignup={handleSignup}
              onMoveLogin={() => setPage("login")}
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