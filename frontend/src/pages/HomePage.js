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
        <div>
            <header>
                <h2>不労所得製造機</h2>
                <div>
                    <h3>Aさん</h3>
                    <button onClick={onLogout}>
                        ログアウト
                    </button>
                </div>
            </header>

            <section>
                <h2>🔥現在のおすすめ</h2>
                <div>
                    {/* 買い候補 */}
                    <div>
                        <div>🟢買い候補</div>
                        <h3>{buyStock.name}</h3>
                        <div>⭐{buyStock.score}点</div>
                        <div>📈{buyStock.prediction}予想</div>
                        <button>詳細をみる</button>
                    </div>

                    {/* 売却検討 */}
                    <div>
                        <div>🔴売却検討</div>
                        <h3>{sellStock.name}</h3>
                        <div>⚠️{sellStock.score}点</div>
                        <div>📉{sellStock.prediction}予想</div>
                        <button>詳細をみる</button>
                    </div>
                </div>
            </section>

            <hr />

            <section>
                <h2>💰Aさんの保有株</h2>
                <div>
                    {holdings.map((stock) => (
                        <div>
                            <span>{stock.name}</span>
                            <span>
                                {stock.type === "buy" && "🟢"}
                                {stock.type === "sell" && "🔴"}
                                {stock.type === "hold" && "🟡"}
                                {stock.status}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default HomePage;