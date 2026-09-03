import React from "react";
import SignupForm from "../components/SignupForm";
import logoImage from "../images/app-logo.png";
import robotSignUpImage from "../images/robot-signup.png";

function SignupPage({ onSignup, onMoveLogin }) {
    return (
        <div className="signup-page">

            <div className="signup-logo">
                <img src={logoImage} alt="不労所得製造機" />
            </div>

            <div className="signup-main">
                <div className="signup-card">
                    <h1>新規登録</h1>
                    <SignupForm onSignup={onSignup} />
                    <div className="login-area">
                        <span>アカウントをお持ちの方は</span>
                        <button className="login-button" onClick={onMoveLogin}>
                            ログイン
                        </button>
                    </div>
                </div>

                <div className="signup-robot">
                    <img src={robotSignUpImage} alt="ロボット" />
                </div>
            </div>
        </div>
    );
}

export default SignupPage;