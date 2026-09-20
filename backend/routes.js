const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("./db");

const router = express.Router();

router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: "ユーザー名とパスワードを入力してください",
        });
    }

    try {
        const result = await pool.query(
            `SELECT id, username, password_hash FROM users WHERE username = $1`, [username]
        );

        if (result.rows.length === 0 ) {
            return res.status(401).json({
                message: "ユーザー名またはパスワードが正しくありません",
            });
        }

        const user = result.rows[0];
        const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "ユーザー名またはパスワードが正しくありません",
            });
        }

        return res.status(200).json({
            message: "ログインしました",
            user: {
                id: user.id,
                username: user.username,
            },
        });

    } catch (error) {
        console.error("ログインエラー：", error);
        
        return res.status(500).json({
            message: "ログイン処理中にエラーが発生しました",
        });
    }
});

module.exports = router;