import pandas as pd
import psycopg2.extras

from db import get_connection

# 株価の異常値判定用（PostgreSQL NUMERIC(12, 2)の上限より十分小さい値を設定）
MAX_REASONABLE_PRICE = 100_000_000

# 銘柄一覧を取得
def get_stocks(conn):

    sql = """
        SELECT id, ticker, code, name
        FROM stocks
        ORDER BY code
    """

    with conn.cursor() as cur:
        cur.execute(sql)
        rows = cur.fetchall()

    return rows

# 指定した銘柄の株価を取得
def get_stock_prices(conn, stock_id):

    sql = """
        SELECT
            price_date,
            open_price,
            high_price,
            low_price,
            close_price,
            volume
        FROM stock_prices
        WHERE stock_id = %s
        ORDER BY price_date
    """

    with conn.cursor() as cur:
        cur.execute(sql, (stock_id,))
        rows = cur.fetchall()

    if not rows:
        return pd.DataFrame(
            columns=[
                "price_date",
                "open_price",
                "high_price",
                "low_price",
                "close_price",
                "volume",
            ]
        )

    return pd.DataFrame(
        rows,
        columns=[
            "price_date",
            "open_price",
            "high_price",
            "low_price",
            "close_price",
            "volume",
        ],
    )

# 異常な株価データを除外
def remove_invalid_prices(prices):

    price_columns = [
        "open_price",
        "high_price",
        "low_price",
        "close_price",
    ]

    # 数値に変換できない値をNaNにする
    for column in price_columns:
        prices[column] = pd.to_numeric(
            prices[column],
            errors="coerce"
        )

    # 株価がNaNの行を削除
    prices = prices.dropna(
        subset = price_columns
    ).copy()

    # 0以下の株価を除外
    for column in price_columns:
        prices = prices[
            prices[column] > 0
        ]

    # 極端に大きい株価を除外
    for column in price_columns:
        prices = prices[
            prices[column] <= MAX_REASONABLE_PRICE
        ]

    # OHLCの整合性を確認
    prices = prices[
        (prices["high_price"] >= prices["low_price"])
        & (prices["high_price"] >= prices["open_price"])
        & (prices["high_price"] >= prices["close_price"])
        & (prices["low_price"] <= prices["open_price"])
        & (prices["low_price"] <= prices["close_price"])
    ]

    return prices

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
def save_analysis(conn, stock_id, analysis_data):

    if not analysis_data:
        return

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
        VALUES %s
        ON CONFLICT (stock_id, analysis_date)
        DO UPDATE SET
            sma_5 = EXCLUDED.sma_5,
            sma_25 = EXCLUDED.sma_25,
            sma_75 = EXCLUDED.sma_75,
            rsi = EXCLUDED.rsi,
            macd = EXCLUDED.macd
    """

    with conn.cursor() as cur:
        psycopg2.extras.execute_values(
            cur,
            sql,
            analysis_data,
        )

def main():

    conn = get_connection()

    try:
        stocks = get_stocks(conn)

        print(f"分析対象銘柄数： {len(stocks)}")

        success_count = 0
        skip_count = 0
        total_saved = 0

        for stock_id, ticker, code, name in stocks:

            print(f"分析中： {ticker} {name}")

            # 株価の履歴を取得
            prices = get_stock_prices(conn, stock_id,)

            # 株価データが75件未満であればスキップ
            if len(prices) < 75:
                print(f"スキップ： {ticker} "
                      f"（株価データ不足： {len(prices)}件）"
                )

                skip_count += 1
                continue

            # 異常な株価を除外
            prices = remove_invalid_prices(prices)

            # 有効な株価が75件未満であればスキップ
            if len(prices) < 75:
                print(
                    f"スキップ： {ticker}"
                    f"（有効な株価データ不足： {len(prices)}件）"
                )

                skip_count += 1
                continue

            # テクニカル指標を計算
            prices = calculate_analysis(prices)

            # 指標をすべて計算できたレコードだけを使用
            analysis_prices = prices.dropna(
                subset=[
                    "sma_5",
                    "sma_25",
                    "sma_75",
                    "rsi",
                    "macd",
                ]
            ).copy()

            if analysis_prices.empty:
                print(
                    f"スキップ： {ticker}"
                    f"（分析データなし）"
                )

                skip_count += 1
                continue

            # 保存用データを作成
            analysis_data = []

            for _, row in analysis_prices.iterrows():

                analysis_date = pd.to_datetime(
                    row["price_date"]
                ).date()

                analysis_data.append(
                    (
                        int(stock_id),
                        analysis_date,
                        float(row["sma_5"]),
                        float(row["sma_25"]),
                        float(row["sma_75"]),
                        float(row["rsi"]),
                        float(row["macd"]),
                    )
                )

            # DBへ保存
            save_analysis(
                conn,
                stock_id,
                analysis_data,
            )

            conn.commit()

            saved_count = len(analysis_data)

            total_saved += saved_count
            success_count += 1

            print(
                f"保存完了： {ticker}"
                f"({saved_count}件)"
            )

        print("分析完了")
        print(f"処理成功銘柄： {success_count}件")
        print(f"スキップ銘柄： {skip_count}件")
        print(f"分析結果保存： {total_saved}件")

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()

if __name__ == "__main__":
    main()