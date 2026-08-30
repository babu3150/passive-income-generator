import React, {useState, useEffect} from "react";

function HomePage({ onLogout }) {

    // 買い候補
    const buyStock = {
        name: "トヨタ",
        score: "92",
        prediction: "+7.6%",
    };

    // 売却検討
    const sellStock = {
        name: "ソニー",
        score: "82",
        prediction: "-5.2%",
    };

    // 保有株
    const holdings = [
        {
            name: "MUFG",
            status: "保有継続",
            type: "buy",
        },
        {
            name: "ソニー",
            status: "売却検討",
            type: "sell",
        },
        {
            name: "任天堂",
            status: "様子見",
            type: "hold",
        },
    ];

    return (
        <div className="home-page">
            <header className="header">
                <h2 className="header-title">不労所得製造機</h2>
                <button className="logout" onClick={onLogout}>
                    ログアウト
                </button>
            </header>

            <section className="recommendation-section">
                <h2 className="section-title">
                    🔥現在のおすすめ
                </h2>

                <div className="recommendation-list">

                    {/* 買い候補 */}
                    <div className="recommendation-card buy-card">
                        <div className="recommendation-label">
                            🟢買い候補
                        </div>

                        <h3 className="stock-name">
                            {buyStock.name}
                        </h3>

                        <div className="stock-score">
                            ⭐{buyStock.score}点
                        </div>

                        <div className="stock-prediction positive">
                            📈{buyStock.prediction}予想
                        </div>

                        <button type="button" className="detail-button">
                            詳細をみる
                        </button>
                    </div>

                    {/* 売却検討 */}
                    <div className="recommendation-card sell-card">
                        <div className="recommendation-label">
                            🔴売却検討
                        </div>

                        <h3 className="stock-name">
                            {sellStock.name}
                        </h3>

                        <div className="stock-score">
                            ⚠️{sellStock.score}点
                        </div>

                        <div className="stock-prediction negative">
                            📉{sellStock.prediction}予想
                        </div>

                        <button type="button" className="detail-button">
                            詳細をみる
                        </button>
                    </div>

                </div>
            </section>

            <hr className="section-divider" />

            <section className="holdings-section">

                <h2 className="section-title">
                    💰Aさんの保有株
                </h2>

                <div className="holdings-list">

                    {holdings.map((stock) => (
                        <div className="holding-item" key={stock.name}>
                            <span className="holding-stock-name">
                                {stock.name}
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