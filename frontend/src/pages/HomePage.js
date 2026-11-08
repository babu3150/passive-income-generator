import React, {useState, useEffect} from "react";
import StockDetailPage from "./StockDetailPage";
import StockSearchPage from "./StockSearchPage";

function HomePage({ onLogout }) {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedStock, setSelectedStock] = useState(null);
    const [showSearchPage, setShowSearchPage] = useState(false);

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

                <button type="button" className="detail-button" onClick={() => setSelectedStock(stock)}>
                    詳細をみる
                </button>
            </div>
        );
    };

    // 銘柄検索画面を表示
    if (showSearchPage) {
        return (
            <StockSearchPage
                onBack={() => setShowSearchPage(false)}
                onSelectStock={(stock) => {
                    setSelectedStock(stock);
                    setShowSearchPage(false);
                }}
            />
        );
    }

    // 詳細画面を表示
    if (selectedStock) {
        return (
            <StockDetailPage
                key={selectedStock.stock_id}
                stock={selectedStock}
                onBack={() => setSelectedStock(null)}
                onSearch={() => {
                    setSelectedStock(null);
                    setShowSearchPage(true);
                }}
            />
        );
    }

    // 保有株（現時点では仮データ）
    const holdings = [
        {
            name: "三菱UFJフィナンシャル・グループ",
            code: "8306",
            status: "保有継続",
            type: "buy",
        },
        {
            name: "ソニーグループ",
            code: "6758",
            status: "売却検討",
            type: "sell",
        },
        {
            name: "任天堂",
            code: "7974",
            status: "様子見",
            type: "hold",
        },
    ];

    return (
        <div className="home-page">
            <header className="header">
                <h2 className="header-title">不労所得製造機</h2>

                <div className="header-buttons">
                    <button
                        type="button"
                        className="stock-search-button"
                        onClick={() => {
                            setSelectedStock(null);
                            setShowSearchPage(true);
                        }}
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

                {/* 現時点では仮データ */}
                <h2 className="section-title">
                    💰Aさんの保有株
                </h2>

                <div className="holdings-list">

                    {holdings.map((stock) => (
                        <div className="holding-item" key={stock.name}>
                            <span className="holding-stock-name">
                                {stock.name}（{stock.code}）
                            </span>

                            <span className={`holding-status ${stock.type}`}>
                                {stock.type === "buy" && "🟢"}
                                {stock.type === "sell" && "🔴"}
                                {stock.type === "hold" && "🟡"}

                                {stock.status}
                                <button type="button" className="detail-button">
                                    詳細をみる
                                </button>
                            </span>
                        </div>
                    ))}

                </div>
            </section>
        </div>
    );
}

export default HomePage;