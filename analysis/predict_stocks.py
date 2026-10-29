from datetime import date, timedelta
from pathlib import Path

import jpholiday
import joblib
import pandas as pd

from db import get_connection


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "random_forest_model.joblib"

FEATURES = [
    "current_price",
    "volume",
    "sma_5",
    "sma_25",
    "sma_75",
    "rsi",
    "macd",
]


def get_next_business_day(current_date):
    # 休場日（土日祝、年末年始）は避ける
    next_date = current_date + timedelta(days=1)

    while (
        next_date.weekday() >= 5
        or jpholiday.is_holiday(next_date)
        or (next_date.month == 1 and next_date.day in (1, 2, 3))
        or (next_date.month == 12 and next_date.day == 31)
    ):
        next_date += timedelta(days=1)

    return next_date


def get_latest_data(conn):
    # 各銘柄の最新の株価とテクニカル指標を取得
    sql = """
        SELECT DISTINCT ON (p.stock_id)
            p.stock_id,
            p.price_date,
            p.close_price AS current_price,
            p.volume,
            a.sma_5,
            a.sma_25,
            a.sma_75,
            a.rsi,
            a.macd
        FROM stock_prices p
        INNER JOIN stock_analyses a
            ON a.stock_id = p.stock_id
            AND a.analysis_date = p.price_date
        WHERE
            p.close_price > 0
            AND p.close_price <= 100000000
            AND p.volume IS NOT NULL
            AND a.sma_5 IS NOT NULL
            AND a.sma_25 IS NOT NULL
            AND a.sma_75 IS NOT NULL
            AND a.rsi IS NOT NULL
            AND a.macd IS NOT NULL
        ORDER BY
            p.stock_id,
            p.price_date DESC
    """

    return pd.read_sql_query(sql, conn)


def save_predictions(conn, predictions):
    # 予測結果を保存（同じ銘柄・予測日・対象日は更新）
    sql = """
        INSERT INTO stock_predictions (
            stock_id,
            prediction_date,
            target_date,
            current_price,
            predicted_price,
            prediction_change_percent
        )
        VALUES (
            %s, %s, %s, %s, %s, %s
        )
        ON CONFLICT (
            stock_id,
            prediction_date,
            target_date
        )
        DO UPDATE SET
            current_price = EXCLUDED.current_price,
            predicted_price = EXCLUDED.predicted_price,
            prediction_change_percent =
                EXCLUDED.prediction_change_percent
    """

    with conn.cursor() as cur:
        for row in predictions:
            cur.execute(sql, row)


def main():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"学習済みモデルがありません: {MODEL_PATH}\n"
            "先に train_random_forest.py を実行してください"
        )

    print("RandomForestモデルを読み込んでいます...")
    model = joblib.load(MODEL_PATH)

    conn = get_connection()

    try:
        print("最新の株価・分析データを取得しています...")
        df = get_latest_data(conn)

        if df.empty:
            print("予測対象のデータがありません")
            return

        # 欠損値、無限値は除外
        df[FEATURES] = df[FEATURES].apply(
            pd.to_numeric,
            errors="coerce"
        )

        df = df.replace(
            [float("inf"), float("-inf")],
            float("nan")
        )

        df = df.dropna(subset=FEATURES).copy()

        if df.empty:
            print("有効な予測データがありません")
            return

        print(f"予測対象銘柄数：{len(df)}")

        # 最新データから翌営業日の株価を予測
        print("翌営業日の株価を予測しています...")
        df["predicted_price"] = model.predict(df[FEATURES])

        # 予測日、対象日、予測変動率を計算
        predictions = []

        for _, row in df.iterrows():
            prediction_date = pd.Timestamp(
                row["price_date"]
            ).date()

            target_date = get_next_business_day(
                prediction_date
            )

            current_price = float(row["current_price"])
            predicted_price = float(row["predicted_price"])

            if current_price <= 0:
                continue

            change_percent = (
                (predicted_price / current_price) - 1
            ) * 100

            predictions.append((
                int(row["stock_id"]),
                prediction_date,
                target_date,
                current_price,
                predicted_price,
                change_percent,
            ))

        if not predictions:
            print("保存できる予測結果がありません")
            return

        save_predictions(conn, predictions)
        conn.commit()

        print()
        print("==============================")
        print("予測・保存完了")
        print("==============================")
        print(f"保存件数：{len(predictions)}件")

        print()
        print("予測結果のサンプル")

        # サンプルとして10件の予測結果を表示
        for row in predictions[:10]:
            (
                stock_id,
                prediction_date,
                target_date,
                current_price,
                predicted_price,
                change_percent,
            ) = row

            print(
                f"銘柄ID：{stock_id} | "
                f"予測日：{prediction_date} | "
                f"対象日：{target_date} | "
                f"現在株価：{current_price:.2f}円 | "
                f"予測株価：{predicted_price:.2f}円 | "
                f"予測変動率：{change_percent:+.2f}%"
            )

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()


if __name__ == "__main__":
    main()
