require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");

// ルートハンドラ用モジュールのインポート
const routes = require("./routes");

// Expressアプリの使用
const app = express();

// フォーム利用のための設定
app.use(express.urlencoded({ extended: false }));
// JSONを扱うための設定
app.use(express.json());

// セッション管理
app.use(
    session({
        secret: "your_secret_key",
        resave: false,
        saveUninitialized: true,
    }),
);

// frontend/build以下の静的ファイルを使用
app.use(express.static(path.join(__dirname, "../frontend/build")));

// "/api"パスに対するルートハンドラの設定
app.use("/api", routes);

// とくに指定がない場合はポート3000で起動する
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`サーバーはポート${PORT}で起動中`);
});