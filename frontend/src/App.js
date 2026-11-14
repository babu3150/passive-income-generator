import React, {useState} from "react";
import "./App.css";
// ログインページ（ログイン画面）用コンポーネント
import LoginPage from "./pages/LoginPage";
// ユーザー登録ページ（ユーザー登録画面）用コンポーネント
import SignupPage from "./pages/SignupPage";
// ホームページ（ホーム画面）用コンポーネント
import HomePage from "./pages/HomePage";
// 銘柄詳細ページ（銘柄詳細画面）用コンポーネント
import StockDetailPage from "./pages/StockDetailPage";
// 銘柄検索ページ（銘柄検索画面）用コンポーネント
import StockSearchPage from "./pages/StockSearchPage";

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
            <HomePage
              onLogout={handleLogout}
              onMoveStockSearch={() => setPage("stock-search")}
            />
          )}

          {page === "stock-detail" && (
            <StockDetailPage
              onLogout={handleLogout}
              onMoveHome={() => setPage("home")}
              onMoveStockSearch={() => setPage("stock-search")}
            />
          )}

          {page === "stock-search" && (
            <StockSearchPage
              onLogout={handleLogout}
              onMoveHome={() => setPage("home")}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;