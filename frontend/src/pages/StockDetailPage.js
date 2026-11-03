
import React from "react";

function StockDetailPage({ stock, onBack }) {
    const isBuy = stock.recommendation === "BUY";
    const isSell = stock.recommendation === "SELL";

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

                <button className="back" onClick={onBack}>
                    おすすめ一覧に戻る
                </button>

            </main>
        </div>
    );
}

export default StockDetailPage;