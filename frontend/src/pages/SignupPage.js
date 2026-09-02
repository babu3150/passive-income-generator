import React from "react";
import SignupForm from "../components/SignupForm";
import logoImage from "../images/app-logo.png";
import robotSignUpImage from "../images/robot-signup.png";

function SignupPage({ onSignup }) {
    return (
        <div>

            <div>
                <img src={logoImage} alt="不労所得製造機" />
            </div>

            <div>
                <div>
                    <h1>新規登録</h1>
                    <SignupForm onSignup={onSignup} />
                    <div>
                        <span>アカウントをお持ちの方は</span>
                        <button type="button">
                            ログイン
                        </button>
                    </div>
                </div>

                <div>
                    <img src={robotSignUpImage} alt="ロボット" />
                </div>
            </div>
        </div>
    );
}

export default SignupPage;