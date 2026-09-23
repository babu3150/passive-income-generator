from pathlib import Path
import pandas as pd

from db import get_connection

# JPXの東証上場銘柄一覧を取得するExcelファイル
BASE_DIR = Path(__file__).resolve().parent.parent

JPX_FILE = BASE_DIR / "analysis" / "data" / "data_j.xlsx"

# JPXの銘柄一覧を読み込み
def get_jpx_stock_list():

    if not JPX_FILE.exists():
        raise FileNotFoundError(
            f"JPX銘柄一覧が見つかりません: {JPX_FILE}"
        )

    # Excelファイルの読み込み
    df = pd.read_excel(JPX_FILE)

    return df

# JPXの銘柄一覧をPostgreSQLのstocksテーブルへ一括登録
def save_all_stocks():

    df = get_jpx_stock_list()

    # 証券コードを文字列として扱う
    df["コード"] = (
        df["コード"]
        .astype(str)
        .str.replace(".0", "", regex=False)
        .str.strip()
    )

    # 国内株式のみを対象（ETF、REIT、ETNを除外）とする
    target_markets = ["プライム（内国株式）", "スタンダード（内国株式）", "グロース（内国株式）",]

    df = df[df["市場・商品区分"].isin(target_markets)]

    print(f"登録対象銘柄数： {len(df)}")

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            for _, row in df.iterrows():

                code = row["コード"]

                # yfinance用
                ticker = f"{code}.T"
                name = row["銘柄名"]
                market = row["市場・商品区分"]
                industry_code = str(row["33業種コード"])
                industry = row["33業種区分"]

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
                        ticker,
                        code,
                        name,
                        market,
                        industry_code,
                        industry,
                    ),
                )

        connection.commit()

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()

    print("全銘柄の登録が完了しました")

if __name__ == "__main__":
    save_all_stocks()