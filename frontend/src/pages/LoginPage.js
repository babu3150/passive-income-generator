import React from "react";
import LoginForm from "../components/LoginForm";
import logoImage from "../images/app-logo.png";
import robotSignInImage from "../images/robot-signin.png";

function LoginPage({ onLogin }) {
    return (
        <div className="login-page">

            <div className="login-logo">
                <img src={logoImage} alt="不労所得製造機" />
            </div>

            <div className="login-main">
                <div className="login-card">
                    <h1>ログイン</h1>
                    <LoginForm onLogin={onLogin} />
                    <div className="signup-area">
                        <span>アカウントをお持ちでない方は</span>
                        <button className="signup-button">
                            新規登録
                        </button>
                    </div>
                </div>

                <div className="login-robot">
                    <img src={robotSignInImage} alt="ロボット" />
                </div>
            </div>
        </div>
    );
}

export default LoginPage;