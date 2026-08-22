import React, {useState} from "react";

function LoginForm({ onLogin }) {
    // 3つのステートを定義し、フォーム送信時に実行
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // フォーム送信時に実行
    const handleSubmit = async (e) => {
        // デフォルトのフォーム送信をキャンセル
        e.preventDefault();
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            onLogin();
        } else {
            setError("入力内容に誤りがありますので、入力し直してください");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onInvalid={(e) => {
                e.target.setCustomValidity("あなたのお名前を入力してください");
              }}
              onInput={(e) => {
                e.target.setCustomValidity("");
              }}
              placeholder="お名前"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onInvalid={(e) => {
                e.target.setCustomValidity("あなたのパスワードを入力してください");
              }}
              onInput={(e) => {
                e.target.setCustomValidity("");
              }}
              placeholder="パスワード"
              required
            />
            <button type="submit">
                ログイン
            </button>
            {error && <p>{error}</p>}
        </form>
    );
}

export default LoginForm;