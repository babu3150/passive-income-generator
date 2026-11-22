import React, { useState } from "react";

function TransactionRegisterPage({ onMoveHome, onLogout }) {
    const [searchText, setSearchText] = useState("");
    const [stocks, setStocks] = useState([]);
    const [selectedStock, setSelectedStock] = useState(null);

    const [transactionType, setTransactionType] = useState("BUY");
    const [quantity, setQuantity] = useState("");
    const [price, setPrice] = useState("");
    const [fee, setFee] = useState("0");
    const [tradedAt, setTradedAt] = useState(() => {
        const now = new Date();
        const localDate = new Date(
            now.getTime() - now.getTimezoneOffset() * 60000
        );
        return localDate.toISOString().slice(0, 16);
    });
    const [memo, setMemo] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    // 銘柄検索
    const handleSearch = async (value) => {
        setSearchText(value);
        setSelectedStock(null);
        setError("");
        setSuccess("");

        if (!value.trim()) {
            setStocks([]);
            return;
        }

        try {
            const response = await fetch(
                `/api/stocks/search?q=${encodeURIComponent(value)}`
            );

            if (!response.ok) {
                throw new Error("銘柄検索に失敗しました");
            }

            const data = await response.json();
            setStocks(data.stocks || []);

        } catch (err) {
            console.error("銘柄検索エラー:", err);
            setError(err.message);
        }
    };

    // 銘柄選択
    const handleSelectStock = (stock) => {
        setSelectedStock(stock);
        setSearchText(`${stock.code} ${stock.name}`);
        setStocks([]);
        setError("");
    };

    // 売買登録
    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!selectedStock) {
            setError("銘柄を検索して選択してください");
            return;
        }

        if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
            setError("数量は1以上の整数を入力してください");
            return;
        }

        if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
            setError("約定価格を正しく入力してください");
            return;
        }

        if (!Number.isFinite(Number(fee)) || Number(fee) < 0) {
            setError("手数料を正しく入力してください");
            return;
        }

        if (!tradedAt) {
            setError("取引日時を入力してください");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/transactions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    stock_id: selectedStock.stock_id,
                    transaction_type: transactionType,
                    quantity: Number(quantity),
                    price: Number(price),
                    fee: Number(fee),
                    traded_at: tradedAt,
                    memo
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "売買履歴の登録に失敗しました"
                );
            }

            setSuccess("売買履歴を登録しました！");
            setQuantity("");
            setPrice("");
            setFee("0");
            setMemo("");

        } catch (err) {
            console.error("売買登録エラー:", err);
            setError(err.message);

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="transaction-register-page">
            <header className="header">
                <h2 className="header-title">不労所得製造機</h2>
                
                <div className="header-buttons">
                    <button type="button" className="back-button" onClick={onMoveHome}>
                        ホームに戻る
                    </button>
                    <button className="logout" onClick={onLogout}>
                        ログアウト
                    </button>
                </div>
            </header>

            <main className="transaction-register-main">
                <h2>保有株・売買登録</h2>
                <p className="transaction-description">
                    保有株の購入・売却履歴を登録できます
                </p>

                <form onSubmit={handleSubmit}>
                    {/* 銘柄検索 */}
                    <div className="transaction-form-group">
                        <label>銘柄</label>

                        <input
                            type="text"
                            value={searchText}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="銘柄名・証券コードで検索"
                        />

                        {stocks.length > 0 && (
                            <ul className="transaction-stock-results">
                                {stocks.map((stock) => (
                                    <li key={stock.stock_id}>
                                        <button
                                            type="button"
                                            onClick={() => handleSelectStock(stock)}
                                        >
                                            {stock.code} - {stock.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {selectedStock && (
                            <p className="transaction-selected-stock">
                                選択中：{selectedStock.name}
                                （{selectedStock.code}）
                            </p>
                        )}
                    </div>

                    {/* 取引区分 */}
                    <div className="transaction-form-group">
                        <label>取引区分</label>

                        <div className="transaction-type-buttons">
                            <button
                                type="button"
                                className={transactionType === "BUY" ? "active" : ""}
                                onClick={() => setTransactionType("BUY")}
                            >
                                購入
                            </button>

                            <button
                                type="button"
                                className={transactionType === "SELL" ? "active" : ""}
                                onClick={() => setTransactionType("SELL")}
                            >
                                売却
                            </button>
                        </div>
                    </div>

                    {/* 数量 */}
                    <div className="transaction-form-group">
                        <label>数量（株）</label>
                        <input
                            type="number"
                            min="1"
                            step="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="例：100"
                            required
                        />
                    </div>

                    {/* 約定価格 */}
                    <div className="transaction-form-group">
                        <label>約定価格（1株あたり・円）</label>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="例：2500"
                            required
                        />
                    </div>

                    {/* 手数料 */}
                    <div className="transaction-form-group">
                        <label>手数料（円）</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={fee}
                            onChange={(e) => setFee(e.target.value)}
                        />
                    </div>

                    {/* 取引日時 */}
                    <div className="transaction-form-group">
                        <label>取引日時</label>
                        <input
                            type="datetime-local"
                            value={tradedAt}
                            onChange={(e) => setTradedAt(e.target.value)}
                            required
                        />
                    </div>

                    {/* メモ */}
                    <div className="transaction-form-group">
                        <label>メモ</label>
                        <textarea
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            placeholder="取引に関するメモ（任意）"
                        />
                    </div>

                    {error && (
                        <p className="transaction-error">{error}</p>
                    )}

                    {success && (
                        <p className="transaction-success">{success}</p>
                    )}

                    <button
                        type="submit"
                        className="transaction-submit-button"
                        disabled={loading}
                    >
                        {loading ? "登録中..." : "売買を登録する"}
                    </button>

                    <button
                        type="button"
                        className="transaction-back-button"
                        onClick={onMoveHome}
                    >
                        戻る
                    </button>
                </form>
            </main>
        </div>
    );
}

export default TransactionRegisterPage;