from db import get_connection

# ================================================================
# 売買の判定ルールは次のとおり
  # 予測変動率が＋1％以上、かつRSIが70未満の場合は買い候補（BUY）
  # 予測変動率が-1％以下の場合は売り候補（SELL）
  # 上記以外の場合は様子見（HOLD）
# ================================================================

BUY_THRESHOLD = 1.0
SELL_THRESHOLD = -1.0
OVERBOUGHT_RSI = 70.0

# 損切り価格の目安（現在株価から3%ダウン）
STOP_LOSS_RATE = 0.03

# 予測結果とテクニカル指標を取得
def get_prediction_data(conn):
    sql = """
        SELECT DISTINCT ON (p.stock_id)
            p.stock_id,
            p.prediction_date,
            p.target_date,
            p.current_price,
            p.predicted_price,
            p.prediction_change_percent,
            a.rsi
        FROM stock_predictions p
        INNER JOIN stock_analyses a
            ON a.stock_id = p.stock_id
            AND a.analysis_date = p.prediction_date
        WHERE
            p.current_price > 0
            AND p.predicted_price > 0
            AND p.prediction_change_percent IS NOT NULL
        ORDER BY
            p.stock_id,
            p.prediction_date DESC,
            p.target_date DESC
    """

    with conn.cursor() as cur:
        cur.execute(sql)
        return cur.fetchall()

# BUY / SELL / HOLDを判定
def determine_recommendation(
    current_price,
    predicted_price,
    change_percent,
    rsi,
):
    
    """
    予測変動率とRSIから売買候補を判定
    """
    # 予測変動率が大きくマイナスなら売り候補
    if change_percent <= SELL_THRESHOLD:
        recommendation = "SELL"
        reason = (
            f"翌営業日の予測変動率が"
            f"{change_percent:.2f}%のため、売り候補"
        )

    # 予測変動率がプラスで、RSIが70未満なら買い候補
    elif (
        change_percent >= BUY_THRESHOLD
        and rsi is not None
        and rsi < OVERBOUGHT_RSI
    ):
        recommendation = "BUY"
        reason = (
            f"翌営業日の予測変動率が"
            f"{change_percent:.2f}%、"
            f"RSIが{rsi:.2f}のため、買い候補"
        )

    else:
        recommendation = "HOLD"

        if rsi is None:
            reason = "RSIを取得できないため、様子見"
        elif rsi >= OVERBOUGHT_RSI:
            reason = (
                f"RSIが{rsi:.2f}と高いため、"
                "新規購入は様子見"
            )
        else:
            reason = (
                f"翌営業日の予測変動率が"
                f"{change_percent:.2f}%のため、様子見"
            )

    # 価格の初期値
    buy_price = None
    sell_price = None
    target_price = predicted_price
    stop_loss_price = None

    if recommendation == "BUY":
        buy_price = current_price
        stop_loss_price = current_price * (
            1 - STOP_LOSS_RATE
        )

    elif recommendation == "SELL":
        sell_price = current_price

    return (
        recommendation,
        buy_price,
        sell_price,
        target_price,
        stop_loss_price,
        reason,
    )

# 判定結果をDBに保存
def save_recommendations(conn, recommendations):
    sql = """
        INSERT INTO recommendations (
            stock_id,
            recommendation_date,
            recommendation,
            score,
            buy_price,
            sell_price,
            target_price,
            stop_loss_price,
            reason
        )
        VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
        ON CONFLICT (
            stock_id,
            recommendation_date
        )
        DO UPDATE SET
            recommendation = EXCLUDED.recommendation,
            score = EXCLUDED.score,
            buy_price = EXCLUDED.buy_price,
            sell_price = EXCLUDED.sell_price,
            target_price = EXCLUDED.target_price,
            stop_loss_price = EXCLUDED.stop_loss_price,
            reason = EXCLUDED.reason
    """

    with conn.cursor() as cur:
        cur.executemany(sql, recommendations)

def main():
    conn = get_connection()

    try:
        print("株価予測データを取得しています...")

        prediction_data = get_prediction_data(conn)

        if not prediction_data:
            print(
                "予測データがありません"
                "先に predict_stocks.py を実行してください"
            )
            return

        recommendations = []

        for row in prediction_data:
            (
                stock_id,
                prediction_date,
                target_date,
                current_price,
                predicted_price,
                change_percent,
                rsi,
            ) = row

            # Decimal型などを通常の数値に変換
            current_price = float(current_price)
            predicted_price = float(predicted_price)
            change_percent = float(change_percent)

            if rsi is not None:
                rsi = float(rsi)

            (
                recommendation,
                buy_price,
                sell_price,
                target_price,
                stop_loss_price,
                reason,
            ) = determine_recommendation(
                current_price,
                predicted_price,
                change_percent,
                rsi,
            )

            recommendations.append((
                stock_id,
                prediction_date,
                recommendation,
                change_percent,
                buy_price,
                sell_price,
                target_price,
                stop_loss_price,
                reason,
            ))

        print("判定結果をDBに保存しています...")

        save_recommendations(conn, recommendations)
        conn.commit()

        # 判定件数を集計
        counts = {
            "BUY": 0,
            "HOLD": 0,
            "SELL": 0,
        }

        for row in recommendations:
            counts[row[2]] += 1

        print()
        print("================================")
        print("売買候補の判定完了")
        print("================================")
        print(f"対象銘柄数：{len(recommendations)}")
        print(f"BUY ：{counts['BUY']}件")
        print(f"HOLD：{counts['HOLD']}件")
        print(f"SELL：{counts['SELL']}件")

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()

if __name__ == "__main__":
    main()