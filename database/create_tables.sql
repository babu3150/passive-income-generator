-- テーブル作成用SQL

-- usersテーブル（ユーザー情報）
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- stocksテーブル（銘柄マスタ）
CREATE TABLE IF NOT EXISTS stocks (
    id SERIAL PRIMARY KEY,
    -- yfinanceで使うティッカー
    ticker VARCHAR(20) NOT NULL UNIQUE,
    -- 証券コード
    code VARCHAR(10) NOT NULL UNIQUE,
    -- 銘柄名
    name VARCHAR(100) NOT NULL,
    -- 市場
    market VARCHAR(50),
    -- 業種
    sector VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP    
);

-- stock_pricesテーブル（株価情報）
CREATE TABLE IF NOT EXISTS stock_prices (
    id BIGSERIAL PRIMARY KEY,
    stock_id INTEGER NOT NULL REFERENCES stocks(id),
    -- 株価の日付
    price_date DATE NOT NULL,
    -- 始値
    open_price NUMERIC(12, 2),
    -- 最高値
    high_price NUMERIC(12, 2),
    -- 最安値
    low_price NUMERIC(12, 2),
    -- 終値
    close_price NUMERIC(12, 2),
    -- 調整後終値
    adj_close_price NUMERIC(12, 2),
    -- 出来高
    volume BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 1銘柄・1日につき1レコード
    UNIQUE(stock_id, price_date)
);

-- stock_analysesテーブル（分析結果）
CREATE TABLE IF NOT EXISTS stock_analyses (
    id BIGSERIAL PRIMARY KEY,
    stock_id INTEGER NOT NULL REFERENCES stocks(id),
    -- 分析をおこなった日
    analysis_date DATE NOT NULL,
    -- 5日移動平均線
    sma_5 NUMERIC(12, 2),
    -- 25日移動平均線
    sma_25 NUMERIC(12, 2),
    -- 75日移動平均線
    sma_75 NUMERIC(12, 2),
    -- RSI
    rsi NUMERIC(8, 4),
    -- MACD
    macd NUMERIC(12, 4),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 1銘柄・1日につき1分析結果
    UNIQUE(stock_id, analysis_date)
);

-- stock_predictionsテーブル（予測結果）
CREATE TABLE IF NOT EXISTS stock_predictions (
    id BIGSERIAL PRIMARY KEY,
    stock_id INTEGER NOT NULL REFERENCES stocks(id),
    -- 予測をおこなった日
    prediction_date DATE NOT NULL,
    -- 予測対象日
    target_date DATE NOT NULL,
    -- 予測時点の現在価格
    current_price NUMERIC(12, 2),
    -- 予測価格
    predicted_price NUMERIC(12, 2),
    -- 予測による変動率
    prediction_change_percent NUMERIC(8, 4),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 同じ銘柄・予測日・予測対象日について1レコード
    UNIQUE(stock_id, prediction_date, target_date)
);

-- recommendationsテーブル（買い・売りなどの推奨情報）
CREATE TABLE IF NOT EXISTS recommendations (
    id BIGSERIAL PRIMARY KEY,
    stock_id INTEGER NOT NULL REFERENCES stocks(id),
    -- 推奨を作成した日
    recommendation_date DATE NOT NULL,
    -- 推奨内容（BUY/HOLD/SELL）
    recommendation VARCHAR(20) NOT NULL,
    -- 推奨スコア
    score NUMERIC(8, 4),
    -- 買いを検討する価格
    buy_price NUMERIC(12, 2),
    -- 売りを検討する価格
    sell_price NUMERIC(12, 2),
    -- 利益確定の目標価格
    target_price NUMERIC(12, 2),
    -- 損切りを検討する価格
    stop_loss_price NUMERIC(12, 2),
    -- 推奨理由（文章はLLMが作成する）
    reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 1銘柄・1日につき1推奨
    UNIQUE(stock_id, recommendation_date)
);

-- portfoliosテーブル（保有銘柄）
CREATE TABLE IF NOT EXISTS portfolios (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    stock_id INTEGER NOT NULL REFERENCES stocks(id),
    -- 保有株数
    quantity INTEGER NOT NULL DEFAULT 0,
    -- 平均取得価格
    average_price NUMERIC(12, 2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 最終更新日時
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 1ユーザー・1銘柄につき1レコード
    UNIQUE(user_id, stock_id)
);

-- インデックス

-- 株価情報
CREATE INDEX IF NOT EXISTS idx_stock_prices_stock_id ON stock_prices(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_prices_price_date ON stock_prices(price_date);

-- 分析結果
CREATE INDEX IF NOT EXISTS idx_stock_analysis_stock_id ON stock_analysis(stock_id);

-- 予測結果
CREATE INDEX IF NOT EXISTS idx_stock_predictions_stock_id ON stock_predictions(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_predictions_target_date ON stock_predictions(target_date);

-- 買い・売りなどの推奨情報
CREATE INDEX IF NOT EXISTS idx_recommendations(stock_id);

-- 保有銘柄
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_stock_id ON portfolios(stock_id);
