import React, {useState, useEffect} from "react";
import StockDetailPage from "./StockDetailPage";
import StockSearchPage from "./StockSearchPage";

function HomePage({ onLogout, onMoveStockSearch, onSelectStock, onMoveTransactionRegister, loginUser }) {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [transactions, setTransactions] = useState([]);
    const [transactionsLoading, setTransactionsLoading] = useState(true);
    const [transactionsError, setTransactionsError] = useState("");

    // 銘柄の推奨情報をAPIから取得
    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const response = await fetch("/api/recommendations");

                if (!response.ok) {
                    throw new Error("銘柄の推奨情報の取得に失敗しました");
                }

                const data = await response.json();

                setRecommendations(data.recommendations || []);

            } catch (error) {
                console.error("エラー：", error);
                setError("銘柄の推奨情報の取得に失敗しました");

            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, []);

    // 売買履歴をAPIから取得
    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await fetch("/api/transactions");

                if (!response.ok) {
                    throw new Error("売買履歴の取得に失敗しました");
                }

                const data = await response.json();

                setTransactions(data.transactions || []);
            } catch (error) {
                console.error("売買履歴取得エラー：", error);
                setTransactionsError(error.message);
            } finally {
                setTransactionsLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    // スコアが最も高い銘柄を取得
    const getTopStock = (recommendation) => {
        return recommendations
            .filter((stock) => stock.recommendation === recommendation )
            .sort((a, b) => Number(b.score) - Number(a.score))[0] || null;
    };

    // 最も買い候補の銘柄
    const buyStock = getTopStock("BUY");

    // 最も売り候補の銘柄
    const sellStock = getTopStock("SELL");

    // 株価の表示形式
    const formatPrice = (price) => {
        if (price == null) return "-";

        return Number(price).toLocaleString("ja-JP", {
            maximumFractionDigits: 2,
        });
    };

    // 予測変動率の表示形式
    const formatPrediction = (value) => {
        if (value == null) return "-";

        const number = Number(value);
        const sign = number > 0 ? "+" : "";

        return `${sign}${number.toFixed(2)}%`;
    };

    // 銘柄カード
    const renderStockCard = (stock, type) => {
        const isBuy = type === "buy";

        return (
            <div className={`recommendation-card ${isBuy ? "buy-card" : "sell-card"}`}>

                <div className="recommendation-label">
                    {isBuy ? "🟢買い候補" : "🔴売却検討"}
                </div>

                <h3 className="stock-name">
                    {stock.name} ({stock.code || stock.ticker})
                </h3>

                <div className="stock-score">
                    {isBuy ? "⭐" : "⚠️"}
                    {Number(stock.score).toFixed(0)}点
                </div>

                <div className="stock-price">
                    <span>現在株価</span>
                    <strong>{formatPrice(stock.current_price)}円</strong>
                </div>

                <div className="stock-price">
                    <span>AI予測株価</span>
                    <strong>{formatPrice(stock.predicted_price)}円</strong>
                </div>

                <div className={`stock-prediction ${isBuy ? "positive" : "negative"}`}>
                    {isBuy ? "📈" : "📉"}
                    {formatPrediction(stock.prediction_change_percent)}予想
                </div>

                <button type="button" className="detail-button" onClick={() => onSelectStock(stock)}>
                    詳細をみる
                </button>
            </div>
        );
    };

    // 売買履歴の金額の表示形式
    const formatTransactionPrice = (price) => {
        if (price == null ) return "-";

        return Number(price).toLocaleString("ja-JP", {
            maximumFractionDigits: 2,
        });
    };

    // 売買履歴の取引日時の表示形式
    const formatTransactionDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleString("ja-JP");
    };

    return (
        <div className="home-page">
            <header className="header">
                <h2 className="header-title">不労所得製造機</h2>

                <div className="header-buttons">
                    <button
                        type="button"
                        className="stock-search-button"
                        onClick={onMoveStockSearch}
                    >
                        銘柄を検索する
                    </button>
                    <button className="logout" onClick={onLogout}>
                        ログアウト
                    </button>
                </div>
            </header>

            <section className="recommendation-section">
                <h2 className="section-title">
                    🔥現在のおすすめ
                </h2>

                {loading ? (
                    <p>おすすめの銘柄を読み込み中...</p>
                ) : error ? (
                    <p className="error-message">{error}</p>
                ) : (
                    <div className="recommendation-list">

                    {/* 買い候補 */}
                    {buyStock ? (
                        renderStockCard(buyStock, "buy")
                    ) : (
                        <div className="recommendation-card buy-card">
                            <div className="recommendation-label">
                                🟢買い候補
                            </div>
                            <p>現在、買い候補の銘柄はありません</p>
                        </div>
                    )}

                    {/* 売却検討 */}
                    {sellStock ? (
                        renderStockCard(sellStock, "sell")
                    ) : (
                        <div className="recommendation-card sell-card">
                            <div className="recommendation-label">
                                🔴売却検討
                            </div>
                            <p>現在、売却候補の銘柄はありません</p>
                        </div>
                    )}

                </div>
                )}
            </section>

            <hr className="section-divider" />

            <section className="holdings-section">

                <div className="portfolio-header">
                    <h2 className="section-title">
                        💰{loginUser?.username}さんの売買履歴
                    </h2>

                    <button
                        type="button"
                        onClick={onMoveTransactionRegister}
                    >
                        売買を登録
                    </button>
                </div>

                {transactionsLoading ? (
                    <p>売買履歴を読み込み中...</p>
                ) : transactionsError ? (
                    <p className="error-message">{transactionsError}</p>
                ) : transactions.length === 0 ? (
                    <p>まだ売買履歴が登録されていません</p>
                ) : (
                    <div className="transaction-history-list">
                        {transactions.map((transaction) => (
                            <div className="transaction-history-item" key={transaction.transaction_id}>
                                {/* 銘柄名・取引区分・日時 */}
                                <div className="transaction-history-info">
                                    <div className="transaction-history-title">
                                        <strong>
                                            {transaction.name} ({transaction.code})
                                        </strong>

                                        <span
                                            className={`transaction-type-label ${
                                                transaction.transaction_type === "BUY"
                                                    ? "buy"
                                                    : "sell"
                                            }`}
                                        >
                                            {transaction.transaction_type === "BUY"
                                                ? "🟢 購入"
                                                : "🔴 売却"}
                                        </span>
                                    </div>

                                    <span className="transaction-history-date">
                                        {formatTransactionDate(transaction.traded_at)}
                                    </span>
                                </div>

                                {/* 数量・価格・手数料 */}
                                <div className="transaction-history-details">
                                    <div>
                                        <span>数量</span>
                                        <strong>
                                            {Number(transaction.quantity).toLocaleString("ja-JP")}株
                                        </strong>
                                    </div>

                                    <div>
                                        <span>約定価格</span>
                                        <strong>
                                            {formatTransactionPrice(transaction.price)}円
                                        </strong>
                                    </div>

                                    <div>
                                        <span>手数料</span>
                                        <strong>
                                            {formatTransactionPrice(transaction.fee)}円
                                        </strong>
                                    </div>
                                </div>

                                {/* メモ */}
                                {transaction.memo && (
                                    <div className="transaction-history-memo">
                                        <span>メモ：</span>
                                        {transaction.memo}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

export default HomePage;