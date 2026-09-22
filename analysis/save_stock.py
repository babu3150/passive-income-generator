from pathlib import Path
import pandas as pd

from db import get_connection

# JPXの東証上場銘柄一覧を取得するExcelファイル
BASE_DIR = Path(__file__).resolve().parent.parent

JPX_FILE = BASE_DIR / "analysis" / "data" / "data_j.xlsx"

def get_jpx_stock_info(code):

    if not JPX_FILE.exists():
        raise FileNotFoundError(
            f"JPX銘柄一覧が見つかりません: {JPX_FILE}"
        )

    # Excelファイルの読み込み
    df = pd.read_excel(JPX_FILE)

    # 証券コードを文字列として扱う？
    code_column = "コード"

    # コードを4桁/5桁文字列として比較
    df[code_column] = (
        df[code_column]
        .astype(str)
        .str.replace(".0", "", regex=False)
        .str.strip()
    )

    result = df[df[code_column] == code ]

    if result.empty:
        raise ValueError(
            f"JPX銘柄一覧に証券コード {code} が見つかりません"
        )

    row = result.iloc[0]

    return {
        "code": code,
        "name": row["銘柄名"],
        "market": row["市場・商品区分"],
        "industry_code": str(row["33業種コード"]),
        "industry": row["33業種区分"],
    }

# ticker_symbolから銘柄情報を取得
def get_stock_info(ticker_symbol):
    code = ticker_symbol.split(".")[0]

    # JPXから基本情報を取得
    jpx_info = get_jpx_stock_info(code)

    return {
        "ticker": ticker_symbol,
        "code": jpx_info["code"],
        "name": jpx_info["name"],
        "market": jpx_info["market"],
        "industry_code": jpx_info["industry_code"],
        "industry": jpx_info["industry"],
    }

# 銘柄情報をPostgreSQLへ保存
def save_stock(ticker_symbol):
    stock = get_stock_info(ticker_symbol)

    print("取得した銘柄情報")
    print(f"コード     : {stock['code']}")
    print(f"銘柄名     : {stock['name']}")
    print(f"市場       : {stock['market']}")
    print(f"業種コード : {stock['industry_code']}")
    print(f"業種       : {stock['industry']}")

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