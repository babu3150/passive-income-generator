const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("./db");

const router = express.Router();

// ログイン
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

        // ログインユーザーのIDをセッションに保存
        req.session.userId = user.id;

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

// ログアウト
router.post("/logout",  (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error("ログアウトエラー：", error);

            return res.status(500).json({
                message: "ログアウトに失敗しました",
            });
        }

        // セッションのCookieを削除
        res.clearCookie("connect.sid");

        return res.status(200).json({
            message: "ログアウトしました",
        });
    });
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

// 売買履歴の取得
router.get("/transactions", async (req, res) => {
    // ログインユーザーを取得
    const userId = req.session?.userId;

    if (!userId) {
        return res.status(401).json({
            message: "ログインしてください",
        });
    }

    try {
        const result = await pool.query(
            `SELECT
                t.id AS transaction_id,
                t.transaction_type,
                t.quantity,
                t.price,
                t.fee,
                t.traded_at,
                t.memo,
                s.code,
                s.name
            FROM transactions t
            JOIN stocks s ON t.stock_id = s.id
            WHERE t.user_id = $1
            ORDER BY t.traded_at DESC, t.id DESC`,
            [userId]
        );

        res.json({
            transactions: result.rows,
        });
    } catch (error) {
        console.error("売買履歴取得エラー：", error);

        res.status(500).json({
            message: "売買履歴の取得に失敗しました",
        });
    }
});

// 売買履歴の登録
router.post("/transactions", async (req, res) => {
    // ログインユーザーを取得
    const userId = req.session?.userId;

    if (!userId) {
        return res.status(401).json({
            message: "ログインしてください",
        });
    }

    const {
        stock_id,
        transaction_type,
        quantity,
        price,
        fee = 0,
        traded_at,
        memo = "",
    } = req.body;

    // 入力値のチェック
    const stockId = Number(stock_id);
    const tradeQuantity = Number(quantity);
    const tradePrice = Number(price);
    const tradeFee = Number(fee);

    if (
        !Number.isInteger(stockId) ||
        stockId <= 0 ||
        !["BUY", "SELL"].includes(transaction_type) ||
        !Number.isInteger(tradeQuantity) ||
        tradeQuantity <= 0 ||
        !Number.isFinite(tradePrice) ||
        tradePrice <= 0 ||
        !Number.isFinite(tradeFee) ||
        tradeFee < 0 ||
        typeof traded_at !== "string" ||
        !traded_at ||
        Number.isNaN(Date.parse(traded_at))
    ) {
        return res.status(400).json({
            message: "入力内容を確認してください",
        });
    }

    const client = await pool.connect();
    let transactionStarted = false;

    try {
        // DBのトランザクション開始
        await client.query("BEGIN");
        transactionStarted = true;

        // 銘柄の存在確認
        const stockResult = await client.query(
            "SELECT id FROM stocks WHERE id = $1",
            [stockId]
        );

        if (stockResult.rowCount === 0 ) {
            throw new Error("指定された銘柄が見つかりません");
        }

        // 保有情報がなければ新規作成
        await client.query(
            `
            INSERT INTO portfolios (
                user_id,
                stock_id,
                quantity,
                average_price
            )
            VALUES ($1, $2, 0, NULL)
            ON CONFLICT (user_id, stock_id) DO NOTHING
            `,
            [userId, stockId]
        );

        // 保有情報をロックして取得
        const portfolioResult = await client.query(
            `
            SELECT quantity, average_price
            FROM portfolios
            WHERE user_id = $1
                AND stock_id = $2
            FOR UPDATE
            `,
            [userId, stockId]
        );

        const portfolio = portfolioResult.rows[0];

        const oldQuantity = Number(portfolio.quantity);
        const oldAveragePrice =
            portfolio.average_price === null
                ? 0
                : Number(portfolio.average_price);

        let newQuantity;
        let newAveragePrice;

        if (transaction_type === "BUY") {
            // 購入の場合
            newQuantity = oldQuantity + tradeQuantity;

            // 手数料を含めて平均取得価格を計算
            const totalCost =
                oldQuantity * oldAveragePrice +
                tradeQuantity * tradePrice +
                tradeFee;

            newAveragePrice = totalCost / newQuantity;

        } else {
            // 売却の場合
            if (tradeQuantity > oldQuantity) {
                throw new Error(
                    `保有数量が不足しています。現在の保有数量は${oldQuantity}株です`
                );
            }

            newQuantity = oldQuantity - tradeQuantity;

            // 全株売却した場合は平均取得価格をNULLにする
            // 一部売却の場合は平均取得価格を維持する
            newAveragePrice =
                newQuantity === 0 ? null : oldAveragePrice;
        }

        // 売買履歴を登録
        await client.query(
            `
            INSERT INTO transactions (
                user_id,
                stock_id,
                transaction_type,
                quantity,
                price,
                fee,
                traded_at,
                memo
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `,
            [
                userId,
                stockId,
                transaction_type,
                tradeQuantity,
                tradePrice,
                tradeFee,
                traded_at,
                memo,
            ]
        );

        // 保有状況を更新
        await client.query(
            `
            UPDATE portfolios
            SET
                quantity = $1,
                average_price = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $3
                AND stock_id = $4
            `,
            [
                newQuantity,
                newAveragePrice,
                userId,
                stockId,
            ]
        );

        // DBトランザクション確定
        await client.query("COMMIT");
        transactionStarted = false;

        return res.status(201).json({
            message: "売買履歴を登録しました",
            portfolio: {
                stock_id: stockId,
                quantity: newQuantity,
                average_price: newAveragePrice,
            },
        });

    } catch (error) {
        if (transactionStarted) {
            await client.query("ROLLBACK");
        }

        console.error("売買登録エラー：", error);

        return res.status(400).json({
            message: error.message || "売買履歴の登録に失敗しました",
        });

    } finally {
        client.release();
    }
});

module.exports = router;