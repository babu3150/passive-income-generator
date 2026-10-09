import joblib
import pandas as pd

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from db import get_connection
from create_training_data import get_training_data

def main():
    conn = get_connection()

    try:
        # 1. 学習用データを作成
        print("機械学習用データを取得しています...")

        df = get_training_data(conn)

        print(f"取得した学習用データ：{len(df)}件")

        if df.empty:
            print("学習用データがありませんでした")
            return

        # 2. 使用する特徴量と正解データ
        features = [
            "current_price",
            "volume",
            "sma_5",
            "sma_25",
            "sma_75",
            "rsi",
            "macd",
        ]

        target = "target_price"

        X = df[features]
        y = df[target]

        # 3. 時系列順に学習・テストへ分割
        split_index = int(len(df) * 0.8)

        X_train = X.iloc[:split_index]
        X_test = X.iloc[split_index:]

        y_train = y.iloc[:split_index]
        y_test = y.iloc[split_index:]

        print("データを分割した結果を表示します")
        print(f"学習用データ：{len(X_train)}件")
        print(f"テスト用データ：{len(X_test)}件")

        # 4. RandomForestモデル作成
        print("RandomForestを学習しています...")

        model = RandomForestRegressor(
            n_estimators=100,
            max_depth=20,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        )

        model.fit(X_train, y_train)

        print("学習完了")

        # 5. テスト用データを使って予測
        print("テスト用データを使って予測しています...")

        predictions = model.predict(X_test)

        # 6. モデル評価
        mae = mean_absolute_error(y_test, predictions)

        rmse = mean_squared_error(y_test, predictions) ** 0.5

        r2 = r2_score(y_test, predictions)

        print("モデル評価を表示します")
        print(f"MAE： {mae:.2f}円")
        print(f"RMSE： {rmse:.2f}円")
        print(f"R2： {r2:.4f}")

        # 7. 特徴量の重要度
        importance = pd.DataFrame({
            "feature": features,
            "importance": model.feature_importances_,
        })

        importance = importance.sort_values(
            "importance",
            ascending=False
        )

        print("特徴量の重要度を表示します")

        print(importance.to_string(index=False))

        # 8. モデル保存
        model_path = "random_forest_model.joblib"

        joblib.dump(model, model_path)

        print("モデルを保存します")
        print(f"保存先： {model_path}")

    finally:
        conn.close()

if __name__ == "__main__":
    main()