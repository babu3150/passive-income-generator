import React from "react";
import LoginForm from "../components/LoginForm";

function LoginPage({ onLogin }) {
    return (
        <div>
            <h2>不労所得製造機</h2>
            <LoginForm onLogin={onLogin} />
        </div>
    );
}

export default LoginPage;