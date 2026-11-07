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

// 銘柄ごとの株価履歴・テクニカル分析を取得
router.get("/stocks/:stockId/history", async (req, res) => {
    const stockId = Number(req.params.stockId);

    if (!Number.isInteger(stockId) || stockId <= 0) {
        return res.status(400).json({
            message: "銘柄IDが正しくありません",
        });
    }

    try {
        const result = await pool.query(
            `
            SELECT *
            FROM (
                SELECT
                    p.price_date,
                    p.open_price,
                    p.high_price,
                    p.low_price,
                    p.close_price,
                    p.volume,

                    a.sma_5,
                    a.sma_25,
                    a.sma_75,
                    a.rsi,
                    a.macd

                FROM stock_prices p

                LEFT JOIN stock_analyses a
                    ON p.stock_id = a.stock_id
                    AND p.price_date = a.analysis_date

                WHERE p.stock_id = $1

                ORDER BY p.price_date DESC
                LIMIT 120
            ) history

            ORDER BY price_date ASC
            `,
            [stockId]
        );

        return res.status(200).json({
            history: result.rows,
        });

    } catch (error) {
        console.error("株価履歴取得エラー：", error);

        return res.status(500).json({
            message: "株価履歴の取得中にエラーが発生しました",
        });
    }
});

// 銘柄の検索
router.get("/stocks/search", async (req, res) => {
    const keyword = (req.query.q || "").trim();

    if (!keyword) {
        return res.status(200).json({ stocks: [] });
    }

    try {
        const result = await pool.query(
            `
            SELECT
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

                COALESCE(
                    p.current_price,
                    sp.close_price
                ) AS current_price,

                p.predicted_price,
                p.prediction_change_percent,
                p.target_date

            FROM stocks s

            LEFT JOIN LATERAL (
                SELECT
                    recommendation_date,
                    recommendation,
                    score,
                    buy_price,
                    sell_price,
                    target_price,
                    stop_loss_price,
                    reason
                FROM recommendations
                WHERE stock_id = s.id
                ORDER BY recommendation_date DESC, created_at DESC
                LIMIT 1
            ) r ON true

            LEFT JOIN LATERAL (
                SELECT
                    current_price,
                    predicted_price,
                    prediction_change_percent,
                    target_date
                FROM stock_predictions
                WHERE stock_id = s.id
                ORDER BY prediction_date DESC, target_date DESC
                LIMIT 1
            ) p ON true

            LEFT JOIN LATERAL (
                SELECT close_price
                FROM stock_prices
                WHERE stock_id = s.id
                ORDER BY price_date DESC
                LIMIT 1
            ) sp ON true

            WHERE
                s.code::text ILIKE '%' || $1 || '%'
                OR s.name ILIKE '%' || $1 || '%'
                OR s.ticker ILIKE '%' || $1 || '%'

            ORDER BY
                CASE
                    WHEN s.code::text = $1 THEN 0
                    WHEN s.ticker = $1 THEN 1
                    WHEN s.name = $1 THEN 2
                    ELSE 3
                END,
                s.code

            LIMIT 30
            `,
            [keyword]
        );

        return res.status(200).json({
            stocks: result.rows
        });

    } catch (error) {
        console.error("銘柄検索エラー：", error);

        return res.status(500).json({
            message: "銘柄検索中にエラーが発生しました"
        });
    }
});

module.exports = router;