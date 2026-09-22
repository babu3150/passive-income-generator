import io

import pandas as pd
import requests
import yfinance as yf

from db import get_connection

# JPXの東証上場銘柄一覧を取得するためのURL
JPX_LIST_URL = (
    "https://www.jpx.co.jp/markets/statistics-equities/misc/"
    "01.html"
)

def get_jpx_stock_list():
    # JPXの東証上場銘柄一覧を取得する
    response = requests.get(JPX_LIST_URL, timeout=30)
    response.raise_for_status()

    # ページ内のExcelファイルへのリンクを取得
    tables = pd.read_html(io.StringIO(response.text))
    return tables

# ticker_symbolから銘柄情報を取得
def get_stock_info(ticker_symbol):
    code = ticker_symbol.split(".")[0]

    # Yahoo!ファイナンスから取得
    ticker = yf.Ticker(ticker_symbol)
    info = ticker.info
    name = info.get("longName") or info.get("shortName")

    # JPXの銘柄一覧（Excelファイル）から取得
    market = None
    industry_code = None
    industry = None

    return {
        "ticker": ticker_symbol,
        "code": code,
        "name": name,
        "market": market,
        "industry_code": industry_code,
        "industry": industry,
    }

# 銘柄情報をPostgreSQLへ保存
def save_stock(ticker_symbol):
    stock = get_stock_info(ticker_symbol)
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
                    industry_code,
                    industry
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (ticker)
                DO UPDATE SET
                    code = EXCLUDED.code,
                    name = EXCLUDED.name,
                    market = EXCLUDED.market,
                    industry_code = EXCLUDED.industry_code,
                    industry = EXCLUDED.industry
                """,
                (
                    stock["ticker"],
                    stock["code"],
                    stock["name"],
                    stock["market"],
                    stock["industry_code"],
                    stock["industry"],
                ),
            )
        connection.commit()

    finally:
        connection.close()

if __name__ == "__main__":
    save_stock("7203.T")
    print("銘柄情報を保存しました")