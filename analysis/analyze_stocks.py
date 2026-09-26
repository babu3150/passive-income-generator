import pandas as pd
import psycopg2

from db import get_connection

# 銘柄一覧を取得
def get_stocks(conn):

    sql = """
        SELECT id, ticker, code, name
        FROM stocks
        ORDER BY code
    """

    return pd.read_sql(sql, conn)

# 指定した銘柄の株価を取得
def get_stock_prices(conn, stock_id):

    sql = """
        SELECT price_date, open_price, high_price, low_price, close_price, volume
        FROM stock_prices
        WHERE stock_id = %s
        ORDER BY price_date
    """

    return pd.read_sql(sql, conn, params=(stock_id,))

# テクニカル指標を計算
def calculate_analysis(prices):

    # 終値
    close = prices["close_price"]

    # 移動平均
    prices["sma_5"] = close.rolling(window=5).mean()
    prices["sma_25"] = close.rolling(window=25).mean()
    prices["sma_75"] = close.rolling(window=75).mean()

    # RSI
    delta = close.diff()

    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_gain = gain.rolling(window=14).mean()
    avg_loss = loss.rolling(window=14).mean()

    rs = avg_gain / avg_loss

    prices["rsi"] = 100 - (100 / (1 + rs))

    # MACD
    ema_12 = close.ewm(span=12, adjust=False).mean()
    ema_26 = close.ewm(span=26, adjust=False).mean()

    prices["macd"] = ema_12 - ema_26

    return prices

# 分析結果をstock_analysesに保存
def save_analysis(conn, stock_id, analysis_date, row):

    sql = """
        INSERT INTO stock_analyses (
            stock_id,
            analysis_date,
            sma_5,
            sma_25,
            sma_75,
            rsi,
            macd
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (stock_id, analysis_date)
        DO UPDATE SET
            sma_5 = EXCLUDED.sma_5,
            sma_25 = EXCLUDED.sma_25,
            sma_75 = EXCLUDED.sma_75,
            rsi = EXCLUDED.rsi,
            macd = EXCLUDED.macd
    """

    with conn.cursor() as cur:
        cur.execute(
            sql,
            (
                stock_id,
                analysis_date,
                row["sma_5"],
                row["sma_25"],
                row["sma_75"],
                row["rsi"],
                row["macd"],
            ),
        )

def main():

    conn = get_connection()

    try:
        stocks = get_stocks(conn)

        print(f"分析対象銘柄数： {len(stocks)}")

        success_count = 0
        skip_count = 0

        for _, stock in stocks.iterrows():

            stock_id = stock["id"]
            ticker = stock["ticker"]
            name = stock["name"]

            print(f"分析中： {ticker} {name}")

            prices = get_stock_prices(conn, stock_id)

            # 75日移動平均を計算するためにチェック
            if len(prices) < 75:
                print(f"スキップ： {ticker} {name}（株価データ不足）")
                skip_count += 1
                continue

            prices = calculate_analysis(prices)

            # 最新日の分析結果を取得
            latest = prices.iloc[-1]

            analysis_date = latest["price_date"]

            # NaNチェック
            if pd.isna(latest["sma_75"]):
                print(f"スキップ： {ticker} {name}（75日移動平均計算不可）")
                skip_count += 1
                continue

            save_analysis(
                conn,
                int(stock_id),
                analysis_date,
                {
                    "sma_5": float(latest["sma_5"]),
                    "sma_25": float(latest["sma_25"]),
                    "sma_75": float(latest["sma_75"]),
                    "rsi": float(latest["rsi"]),
                    "macd": float(latest["macd"]),
                },
            )

            conn.commit()

            success_count += 1

        print("分析完了")
        print(f"保存成功：{success_count}件")
        print(f"スキップ：{skip_count}件")

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()

if __name__ == "__main__":
    main()