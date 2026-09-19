-- テストユーザー追加用SQL

INSERT INTO users (
    username,
    password_hash
)
VALUES (
    'testuser',
    -- パスワードのbcryptハッシュをあとで書く
    ''
)
ON CONFLICT (username) DO NOTHING;