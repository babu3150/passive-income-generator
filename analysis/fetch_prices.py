from datetime import datetime, timedelta
import logging

import pandas as pd
import yfinance as yf

from db import get_connection

# 取得する過去の日数
HISTORY_DAYS = 365

# 株価の異常値判定用（PostgreSQL NUMERIC(12, 2)の上限より十分小さい値を設定）
MAX_REASONABLE_PRICE = 100_000_000

# エラーログ設定
logging.basicConfig(
    filename="fetch_prices_error.log",
    level=logging.ERROR,
    format="%(asctime)s [%(levelname)s] %(message)s",
    encoding="utf-8",
)

logger = logging.getLogger(__name__)

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
        repair=True,
        progress=False,
    )

    if isinstance(prices.columns, pd.MultiIndex):
        prices.columns = prices.columns.get_level_values(0)

    return prices

# 株価データの異常チェック
def validate_price_row(
    ticker,
    price_date,
    open_price,
    high_price,
    low_price,
    close_price,
    adj_close_price,
    volume,
):
    price_values = {
        "Open": open_price,
        "High": high_price,
        "Low": low_price,
        "Close": close_price,
        "Adj Close": adj_close_price,
    }

    for name, value in price_values.items():

        if value is None:
            continue

        if pd.isna(value):
            logger.error(
                "異常データ: ticker=%s date=%s %s=NaN",
                ticker,
                price_date,
                name,
            )

            return False

    # 価格が0以下でないかを確認
    for name, value in price_values.items():

        if value is None:
            continue

        if value <= 0:

            logger.error(
                "異常データ: ticker=%s date=%s %s=%s "
                "(0以下の株価)",
                ticker,
                price_date,
                name,
                value,
            )

            return False

    # 極端に大きな価格でないかを確認
    for name, value in price_values.items():

        if value is None:
            continue

        if value > MAX_REASONABLE_PRICE:

            logger.error(
                "異常データ: ticker=%s date=%s %s=%s "
                "(異常に大きな株価)",
                ticker,
                price_date,
                name,
                value,
            )

            return False

    # OHLCの整合性チェック
    if (
        high_price is not None
        and low_price is not None
        and high_price < low_price
    ):

        logger.error(
            "異常データ: ticker=%s date=%s "
            "High=%s < Low=%s",
            ticker,
            price_date,
            high_price,
            low_price,
        )

        return False

    if (
        high_price is not None
        and open_price is not None
        and high_price < open_price
    ):

        logger.error(
            "異常データ: ticker=%s date=%s "
            "High=%s < Open=%s",
            ticker,
            price_date,
            high_price,
            open_price,
        )

        return False

    if (
        high_price is not None
        and close_price is not None
        and high_price < close_price
    ):

        logger.error(
            "異常データ: ticker=%s date=%s "
            "High=%s < Close=%s",
            ticker,
            price_date,
            high_price,
            close_price,
        )

        return False

    if (
        low_price is not None
        and open_price is not None
        and low_price > open_price
    ):

        logger.error(
            "異常データ: ticker=%s date=%s "
            "Low=%s > Open=%s",
            ticker,
            price_date,
            low_price,
            open_price,
        )

        return False

    if (
        low_price is not None
        and close_price is not None
        and low_price > close_price
    ):

        logger.error(
            "異常データ: ticker=%s date=%s "
            "Low=%s > Close=%s",
            ticker,
            price_date,
            low_price,
            close_price,
        )

        return False

    return True

# 株価データをstock_pricesへ保存
def save_prices(stock_id, ticker, prices):

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            saved_count = 0
            skipped_count = 0

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

                # 異常データのチェック
                is_valid = validate_price_row(
                    ticker=ticker,
                    price_date=price_date.date(),
                    open_price=open_price,
                    high_price=high_price,
                    low_price=low_price,
                    close_price=close_price,
                    adj_close_price=adj_close_price,
                    volume=volume,
                )

                if not is_valid:
                    skipped_count += 1
                    print(
                        f"異常データをスキップ："
                        f"{ticker}"
                        f"{price_date.date()}"
                    )

                    continue

                # DBへ保存
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

                saved_count += 1

        connection.commit()

        return saved_count, skipped_count

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
    skipped_total = 0

    for stock_id, ticker in stocks:
        try:
            prices = fetch_stock_prices(ticker)

            if prices.empty:
                print(f"株価データなし： {ticker}")

                logger.error("株価データなし： ticker=%s", ticker)

                continue

            saved_count, skipped_count = save_prices(
                stock_id,
                ticker,
                prices,
            )

            skipped_total += skipped_count

            print(
                f"保存完了： {ticker}"
                f"({saved_count}件保存,"
                f"{skipped_count}件スキップ)"
            )

            success_count += 1

        except Exception as e:
            error_count += 1

            logger.exception("銘柄処理エラー： ticker=%s", ticker)

            print(f"エラー： {ticker}")
            print(f"{e}")

    print("株価取得処理が完了しました")
    print(f"成功： {success_count}")
    print(f"エラー： {error_count}")
    print(f"異常データとしてスキップ： {skipped_total}")

if __name__ == "__main__":
    main()