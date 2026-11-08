import React, { useState, useEffect } from "react";
import StockSearchPage from "./StockSearchPage";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine,
} from "recharts";

function StockDetailPage({ stock, onBack, onSearch, onLogout }) {
    const isBuy = stock.recommendation === "BUY";
    const isSell = stock.recommendation === "SELL";
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState("");

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await fetch(
                    `/api/stocks/${stock.stock_id}/history`
                );

                if (!response.ok) {
                    throw new Error("株価履歴の取得に失敗しました");
                }

                const data = await response.json();

                setHistory(data.history || []);

            } catch (error) {
                console.error("株価履歴取得エラー：", error);
                setHistoryError("株価履歴を取得できませんでした");

            } finally {
                setHistoryLoading(false);
            }
        };

        fetchHistory();
    }, [stock.stock_id]);

    // チャート用データに変換
    const chartData = history.map((item) => ({
        ...item,
        date: String(item.price_date).slice(5, 10).replace("-", "/"),
        close: Number(item.close_price),
        sma5: item.sma_5 == null ? null : Number(item.sma_5),
        sma25: item.sma_25 == null ? null : Number(item.sma_25),
        sma75: item.sma_75 == null ? null : Number(item.sma_75),
        rsi: item.rsi == null ? null : Number(item.rsi),
        macd: item.macd == null ? null : Number(item.macd),
    }));

    // 株価の表示
    const formatPrice = (price) => {
        if (price == null) return "-";

        return Number(price).toLocaleString("ja-JP", {
            maximumFractionDigits: 2,
        });
    };

    // 日付の表示
    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString("ja-JP");
    };

    // 詳細項目
    const DetailItem = ({ label, value }) => (
        <div className="detail-item">
            <span>{label}</span>
            <strong>{value ?? "-"}</strong>
        </div>
    );

    return (
        <div className="stock-detail-page">
            <header className="header">
                <h2 className="header-title">不労所得製造機</h2>

                <div className="header-buttons">
                    <button type="button" className="back-button" onClick={onBack}>
                        ホームに戻る
                    </button>
                    <button
                        type="button"
                        className="stock-search-button"
                        onClick={onSearch}
                    >
                        銘柄を検索する
                    </button>
                    <button className="logout" onClick={onLogout}>
                        ログアウト
                    </button>
                </div>
            </header>

            <main className="stock-detail-content">

                {/* 銘柄情報 */}
                <section className="detail-section">
                    <div className="detail-heading">
                        <div>
                            <h2>{stock.name}</h2>
                            <p>
                                {stock.code || stock.ticker}
                                {stock.market && ` / ${stock.market}`}
                            </p>
                        </div>

                        <span className={`detail-recommendation ${
                            isBuy ? "buy" : isSell ? "sell" : "hold"
                        }`}>
                            {isBuy ? "BUY" : isSell ? "SELL" : "HOLD"}
                        </span>
                    </div>
                </section>

                {/* 株価情報 */}
                <section className="detail-section">
                    <h3>📊 株価情報</h3>

                    <div className="detail-price-list">
                        <div className="detail-price-card">
                            <span>現在株価</span>
                            <strong>
                                {formatPrice(stock.current_price)}円
                            </strong>
                        </div>

                        <div className="detail-price-card">
                            <span>AI予測株価</span>
                            <strong>
                                {formatPrice(stock.predicted_price)}円
                            </strong>
                        </div>
                    </div>

                    <div className="detail-item">
                        <span>予測変動率</span>
                        <strong className={
                            Number(stock.prediction_change_percent) >= 0
                                ? "positive"
                                : "negative"
                        }>
                            {stock.prediction_change_percent == null
                                ? "-"
                                : `${Number(stock.prediction_change_percent) > 0 ? "+" : ""}${Number(stock.prediction_change_percent).toFixed(2)}%`}
                        </strong>
                    </div>

                    <DetailItem
                        label="予測対象日"
                        value={formatDate(stock.target_date)}
                    />
                </section>

                {/* 株価チャート・テクニカル分析 */}
                <section className="detail-section">
                    <h3>📈 株価チャート</h3>

                    {historyLoading ? (
                        <p>株価データを読み込み中...</p>
                    ) : historyError ? (
                        <p className="error-message">{historyError}</p>
                    ) : chartData.length === 0 ? (
                        <p>株価データがありません。</p>
                    ) : (
                        <>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart
                                        data={chartData}
                                        margin={{ top: 10, right: 15, left: 5, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="date"
                                            minTickGap={30}
                                        />
                                        <YAxis
                                            domain={["auto", "auto"]}
                                            tickFormatter={(value) =>
                                                value.toLocaleString("ja-JP")
                                            }
                                        />
                                        <Tooltip
                                            formatter={(value) =>
                                                value == null
                                                    ? "-"
                                                    : `${Number(value).toLocaleString("ja-JP", {
                                                        maximumFractionDigits: 2,
                                                    })}円`
                                            }
                                        />
                                        <Legend />

                                        <Line
                                            type="monotone"
                                            dataKey="close"
                                            name="終値"
                                            stroke="#2563eb"
                                            strokeWidth={2}
                                            dot={false}
                                            connectNulls
                                        />

                                        <Line
                                            type="monotone"
                                            dataKey="sma5"
                                            name="SMA5"
                                            stroke="#f59e0b"
                                            dot={false}
                                            connectNulls
                                        />

                                        <Line
                                            type="monotone"
                                            dataKey="sma25"
                                            name="SMA25"
                                            stroke="#16a34a"
                                            dot={false}
                                            connectNulls
                                        />

                                        <Line
                                            type="monotone"
                                            dataKey="sma75"
                                            name="SMA75"
                                            stroke="#9333ea"
                                            dot={false}
                                            connectNulls
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <h3>RSI（相対力指数）</h3>

                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" minTickGap={30} />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip />
                                        <ReferenceLine y={70} stroke="#dc2626" strokeDasharray="5 5" />
                                        <ReferenceLine y={30} stroke="#2563eb" strokeDasharray="5 5" />
                                        <Line
                                            type="monotone"
                                            dataKey="rsi"
                                            name="RSI"
                                            stroke="#ea580c"
                                            strokeWidth={2}
                                            dot={false}
                                            connectNulls
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <h3>MACD</h3>

                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" minTickGap={30} />
                                        <YAxis domain={["auto", "auto"]} />
                                        <Tooltip />
                                        <ReferenceLine y={0} stroke="#888" />
                                        <Line
                                            type="monotone"
                                            dataKey="macd"
                                            name="MACD"
                                            stroke="#7c3aed"
                                            strokeWidth={2}
                                            dot={false}
                                            connectNulls
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}
                </section>

                {/* AI推奨情報 */}
                <section className="detail-section">
                    <h3>🤖 AI推奨情報</h3>

                    <div className="detail-score">
                        <span>推奨スコア</span>
                        <strong>{Number(stock.score).toFixed(0)}点</strong>
                        <span className="score-max">/ 100点</span>
                    </div>

                    <DetailItem
                        label="推奨判定日"
                        value={formatDate(stock.recommendation_date)}
                    />

                    <DetailItem
                        label="推奨理由"
                        value={stock.reason}
                    />
                </section>

                {/* 売買目安 */}
                <section className="detail-section">
                    <h3>💰 売買目安</h3>

                    {isBuy && (
                        <>
                            <DetailItem
                                label="推奨購入価格"
                                value={
                                    stock.buy_price == null
                                        ? "-"
                                        : `${formatPrice(stock.buy_price)}円`
                                }
                            />

                            <DetailItem
                                label="目標株価"
                                value={
                                    stock.target_price == null
                                        ? "-"
                                        : `${formatPrice(stock.target_price)}円`
                                }
                            />

                            <DetailItem
                                label="損切り価格"
                                value={
                                    stock.stop_loss_price == null
                                        ? "-"
                                        : `${formatPrice(stock.stop_loss_price)}円`
                                }
                            />
                        </>
                    )}

                    {isSell && (
                        <>
                            <DetailItem
                                label="推奨売却価格"
                                value={
                                    stock.sell_price == null
                                        ? "-"
                                        : `${formatPrice(stock.sell_price)}円`
                                }
                            />

                            <DetailItem
                                label="予測株価"
                                value={
                                    stock.target_price == null
                                        ? "-"
                                        : `${formatPrice(stock.target_price)}円`
                                }
                            />
                        </>
                    )}

                    {!isBuy && !isSell && (
                        <p>現在は売買を控え、様子見を推奨しています</p>
                    )}
                </section>

                {/* 注意書き */}
                <p className="detail-disclaimer">
                    ※ AIによる予測・推奨は将来の株価を保証するものではありませんので、投資判断はご自身の責任で行ってください
                </p>

            </main>
        </div>
    );
}

export default StockDetailPage;