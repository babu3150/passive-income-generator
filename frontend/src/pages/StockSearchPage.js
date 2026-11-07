import React, { useState } from "react";

function StockSearchPage({ onSelectStock, onBack }) {
    const [keyword, setKeyword] = useState("");
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const searchStocks = async (e) => {
        e.preventDefault();

        if (!keyword.trim()) {
            setStocks([]);
            setError("銘柄コードまたは銘柄名を入力してください");
            return;
        }

        setLoading(true);
        setError("");
        setStocks([]);

        try {
            const response = await fetch(
                `/api/stocks/search?q=${encodeURIComponent(keyword.trim())}`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "検索に失敗しました");
            }

            setStocks(data.stocks || []);

            if (data.stocks.length === 0) {
                setError("該当する銘柄が見つかりませんでした");
            }

        } catch (error) {
            console.error("銘柄検索エラー：", error);
            setError("銘柄検索中にエラーが発生しました");

        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        if (price == null) return "-";

        return `${Number(price).toLocaleString("ja-JP", {
            maximumFractionDigits: 2
        })}円`;
    };

    return (
        <div className="stock-search-page">

            <button type="button" className="back-button" onClick={onBack}>
                ← ホームに戻る
            </button>

            <h2>銘柄検索</h2>

            <p>銘柄コード・銘柄名・ティッカーから銘柄を検索できます。</p>

            <form onSubmit={searchStocks} className="stock-search-form">

                <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="例：7203、トヨタ自動車"
                />

                <button type="submit" disabled={loading}>
                    {loading ? "検索中..." : "検索"}
                </button>

            </form>

            {error && (
                <p className="search-message">{error}</p>
            )}

            {stocks.length > 0 && (
                <div className="stock-search-results">

                    <h3>検索結果（{stocks.length}件）</h3>

                    {stocks.map((stock) => (
                        <div key={stock.stock_id} className="stock-search-card">

                            <div className="stock-search-info">
                                <h3>{stock.name}</h3>

                                <p>銘柄コード：{stock.code}</p>

                                <p>ティッカー：{stock.ticker}</p>

                                <p>市場：{stock.market || "-"}</p>

                                <p>現在株価： {formatPrice(stock.current_price)}</p>
                            </div>

                            <button type="button" className="detail-button" onClick={() => onSelectStock(stock)}>
                                詳細を見る
                            </button>

                        </div>
                    ))}

                </div>
            )}

        </div>
    );
}

export default StockSearchPage;
