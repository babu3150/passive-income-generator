from datetime import datetime, timedelta

import pandas as pd
import yfinance as yf

from db import get_connection

# 取得する過去の日数
HISTORY_DAYS = 365

# stocksテーブルから全銘柄を取得
def get_stocks():

    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, ticker
                FROM stocks
                ORDER BY code
                """
            )

            return cursor.fetchall()

    finally:
        connection.close()

# yfinanceから株価を取得
def fetch_stock_prices(ticker):
    end_date = datetime.now()
    start_date = end_date - timedelta(days=HISTORY_DAYS)

    print(f"株価取得中： {ticker}")

    prices = yf.download(
        ticker,
        start=start_date.strftime("%Y-%m-%d"),
        end=end_date.strftime("%Y-%m-%d"),
        auto_adjust=False,
        progress=False,
    )

    if isinstance(prices.columns, pd.MultiIndex):
        prices.columns = prices.columns.get_level_values(0)

    return prices

# 株価データをstock_pricesへ保存
def save_prices(stock_id, ticker, prices):

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            for price_date, row in prices.iterrows():
                open_price = row["Open"]
                high_price = row["High"]
                low_price = row["Low"]
                close_price = row["Close"]
                adj_close_price = row["Adj Close"]
                volume = row["Volume"]

                # NaNをNoneに変換
                if pd.isna(open_price):
                    open_price = None

                if pd.isna(high_price):
                    high_price = None

                if pd.isna(low_price):
                    low_price = None

                if pd.isna(close_price):
                    close_price = None

                if pd.isna(adj_close_price):
                    adj_close_price = None

                if pd.isna(volume):
                    volume = None

                # numpy形式をPython形式に変換
                if open_price is not None:
                    open_price = float(open_price)

                if high_price is not None:
                    high_price = float(high_price)

                if low_price is not None:
                    low_price = float(low_price)

                if close_price is not None:
                    close_price = float(close_price)

                if adj_close_price is not None:
                    adj_close_price = float(adj_close_price)

                if volume is not None:
                    volume = int(volume)

                cursor.execute(
                    """
                    INSERT INTO stock_prices (
                        stock_id,
                        price_date,
                        open_price,
                        high_price,
                        low_price,
                        close_price,
                        adj_close_price,
                        volume
                    )
                    VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s
                    )
                    ON CONFLICT (stock_id, price_date)
                    DO UPDATE SET
                        open_price = EXCLUDED.open_price,
                        high_price = EXCLUDED.high_price,
                        low_price = EXCLUDED.low_price,
                        close_price = EXCLUDED.close_price,
                        adj_close_price = EXCLUDED.adj_close_price,
                        volume = EXCLUDED.volume
                    """,
                    (
                        stock_id,
                        price_date.date(),
                        open_price,
                        high_price,
                        low_price,
                        close_price,
                        adj_close_price,
                        volume,
                    ),
                )

        connection.commit()

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()

def main():
    stocks = get_stocks()

    print(f"取得対象銘柄数： {len(stocks)}")

    success_count = 0
    error_count = 0

    for stock_id, ticker in stocks:
        try:
            prices = fetch_stock_prices(ticker)

            if prices.empty:
                print(f"株価データなし： {ticker}")
                continue

            save_prices(
                stock_id,
                ticker,
                prices,
            )

            print(
                f"保存完了： {ticker}"
                f"({len(prices)}件)"
            )

            success_count += 1

        except Exception as e:
            error_count += 1

            print(f"エラー： {ticker}")
            print(f"{e}")

    print("株価取得処理が完了しました")
    print(f"成功： {success_count}")
    print(f"エラー： {error_count}")

if __name__ == "__main__":
    main()