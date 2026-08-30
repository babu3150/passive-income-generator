import React, {useState, useEffect} from "react";

function HomePage({ onLogout }) {

    // 仮データを表示

    // 買い候補
    const buyStock = {
        name: "トヨタ自動車",
        code: "7203",
        score: "92",
        prediction: "+7.6%",
    };

    // 売却検討
    const sellStock = {
        name: "ソニーグループ",
        code: "6758",
        score: "82",
        prediction: "-5.2%",
    };

    // 保有株
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
                            {buyStock.name}（{buyStock.code}）
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
                            {sellStock.name}（{sellStock.code}）
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