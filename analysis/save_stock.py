import yfinance as yf
from db import get_connection

def save_stock(ticker_symbol):
    ticker = yf.Ticker(ticker_symbol)

    info = ticker.info

    name = info.get("longName") or info.get("shortName")
    market = info.get("market")
    sector = info.get("sector")

    # 7203.T → 7203
    code = ticker_symbol.split(".")[0]

    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO stocks (
                    ticker,
                    code,
                    name,
                    market,
                    sector
                )
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (ticker)
                DO UPDATE SET
                    name = EXCLUDED.name,
                    market = EXCLUDED.market,
                    sector = EXCLUDED.sector
                """,
                (
                    ticker_symbol,
                    code,
                    name,
                    market,
                    sector,
                ),
            )
        connection.commit()

    finally:
        connection.close()

if __name__ == "__main__":
    save_stock("7203.T")
    print("銘柄情報を保存しました")