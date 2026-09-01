import React from "react";
import LoginForm from "../components/LoginForm";
import logoImage from "../images/app-logo.png";
import robotSignInImage from "../images/robot-signin.png";

function LoginPage({ onLogin }) {
    return (
        <div>
            <div>
                <img src={logoImage} alt="不労所得製造機" />
            </div>
            <div>
                <div>
                    <h1>ログイン</h1>
                    <LoginForm onLogin={onLogin} />
                    <div>
                        <span>アカウントをお持ちでない方は</span>
                        <button>新規登録</button>
                    </div>
                </div>

                <div>
                    <img src={robotSignInImage} alt="ロボット" />
                </div>
            </div>
        </div>
    );
}

export default LoginPage;