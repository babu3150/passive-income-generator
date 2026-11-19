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

  // ログインユーザーの管理用ステート
  const [loginUser, setLoginUser] = useState(null);

  // 現在ページの管理用ステート
  const [page, setPage] = useState("login");

  // 選択した銘柄の管理用ステート
  const [selectedStock, setSelectedStock] = useState(null);

  // ログイン
  const handleLogin = (user) => {
    setLoginUser(user);
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
        setSelectedStock(null);
        setPage("login");

    } catch (error) {
      console.error("ログアウトエラー：", error);
      alert("ログアウトに失敗しました");
    }
  };

  // 銘柄詳細画面に遷移
  const handleMoveStockDetail = (stock) => {
    setSelectedStock(stock);
    setPage("stock-detail");
  }

  // 銘柄検索画面に遷移
  const handleMoveStockSearch = () => {
    setPage("stock-search");
  }

  // ホーム画面に遷移
  const handleMoveHome = () => {
    setSelectedStock(null);
    setPage("home");
  }

  // ユーザー登録（登録後はホーム画面に遷移）
  const handleSignup = () => {
    setIsLoggedIn(true);
    setPage("home");
  };

  return (
    <div>
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
              onSelectStock={handleMoveStockDetail}
              loginUser={loginUser}
            />
          )}

          {page === "stock-detail" && selectedStock && (
            <StockDetailPage
              key={selectedStock.stock_id}
              stock={selectedStock}
              onLogout={handleLogout}
              onMoveHome={handleMoveHome}
              onMoveStockSearch={handleMoveStockSearch}
            />
          )}

          {page === "stock-search" && (
            <StockSearchPage
              onLogout={handleLogout}
              onMoveHome={handleMoveHome}
              onSelectStock={handleMoveStockDetail}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;