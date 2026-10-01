import pandas as pd

from db import get_connection

def get_training_data(conn):

    """
    stock_analysesとstock_pricesを結合して機械学習用データを作成
    分析日tのデータを特徴量とし、次の取引日t+1の終値を正解データとする
    """

    sql = """
        WITH price_data AS (
            SELECT
                stock_id,
                price_date,
                close_price,
                volume,
                LEAD(price_date) OVER (
                    PARTITION BY stock_id
                    ORDER BY price_date
                ) AS target_date,
                LEAD(close_price) OVER (
                    PARTITION BY stock_id
                    ORDER BY price_date
                ) AS target_price
            FROM stock_prices
        )

        SELECT
            a.stock_id,
            a.analysis_date,
            p.close_price AS current_price,
            p.volume,
            a.sma_5,
            a.sma_25,
            a.sma_75,
            a.rsi,
            a.macd,
            p.target_date,
            p.target_price
        FROM stock_analyses a
        INNER JOIN price_data p
            ON a.stock_id = p.stock_id
            AND a.analysis_date = p.price_date
        WHERE
            p.target_date IS NOT NULL
            AND p.target_price IS NOT NULL
        ORDER BY
            a.stock_id,
            a.analysis_date
    """

    return pd.read_sql_query(sql, conn,)

def main():
    conn = get_connection()

    try:
        print("機械学習用データを作成しています...")

        df = get_training_data(conn)

        print(f"作成された学習用データ：{len(df)}件")

        if df.empty:
            print("学習用データがありません")
            return

        print("学習用データ確認")
        print(df.head())

        print("カラム")
        print(df.columns.to_list())

        print("銘柄数")
        print(df["stock_id"].nunique())

        print("分析日の範囲")
        print(df["analysis_date"].min(),
              "〜",
              df["analysis_date"].max(),
        )

        print("対象日の範囲")
        print(
            df["target_date"].min(),
            "〜",
            df["target_date"].max(),
        )

    finally:
        conn.close()

if __name__ == "__main__":
    main()