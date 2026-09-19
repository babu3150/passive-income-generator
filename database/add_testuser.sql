-- テストユーザー追加用SQL

INSERT INTO users (
    username,
    password_hash
)
VALUES (
    'testuser',
    -- パスワードのbcryptハッシュ
    '$2b$10$tDuvUhnDdfe9JS0GMYSOYeuNvPs.1ga6y4Me1bz5z4STLtg/mUHju'
)
ON CONFLICT (username) DO NOTHING;