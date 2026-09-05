import React, {useState} from "react";

function SignupForm({ onSignup }) {
    // 3つのステートを定義し、フォーム送信時に実行
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // フォーム送信時に実行
    const handleSubmit = async (e) => {
        // デフォルトのフォーム送信をキャンセル
        e.preventDefault();
        const response = await fetch("/api/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            onSignup();
        } else {
            setError("入力されたお名前を登録できませんので、異なるお名前を登録してください");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="signup-input-group">
                <span className="signup-icon">🙎</span>
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
            </div>

            <div className="signup-input-group">
                <span className="input-icon">🔒</span>
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
            </div>

            <button type="submit" className="signup">
                新規登録
            </button>
            {error && <p>{error}</p>}
        </form>
    );
}

export default SignupForm;