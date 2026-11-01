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

// 銘柄の推奨情報を取得
router.get("/recommendations", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT ON (r.stock_id)
                s.id AS stock_id,
                s.ticker,
                s.code,
                s.name,
                s.market,

                r.recommendation_date,
                r.recommendation,
                r.score,
                r.buy_price,
                r.sell_price,
                r.target_price,
                r.stop_loss_price,
                r.reason,

                p.current_price,
                p.predicted_price,
                p.prediction_change_percent,
                p.target_date

            FROM recommendations r

            INNER JOIN stocks s
                ON r.stock_id = s.id

            LEFT JOIN LATERAL (
                SELECT
                    current_price,
                    predicted_price,
                    prediction_change_percent,
                    target_date
                FROM stock_predictions
                WHERE stock_id = r.stock_id
                    AND prediction_date = r.recommendation_date
                ORDER BY target_date DESC
                LIMIT 1
            ) p ON true

            ORDER BY
                r.stock_id,
                r.recommendation_date DESC,
                r.created_at DESC
        `);

        return res.status(200).json({
            recommendations: result.rows,
        });

    } catch (error) {
        console.error("エラー：", error);

        return res.status(500).json({
            message: "銘柄の推奨情報の取得に失敗しました",
        });
    }
});

module.exports = router;