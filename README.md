# Gachapon API (Express + MySQL)

Minimal API for authentication and gachas (example for local dev).
# Gachapon API (Express + MySQL)

Minimal API for authentication and gachas (example for local dev).

Setup

1. Copy `.env.example` to `.env` and set your DB credentials and JWT_SECRET.

2. Apply migrations to your MySQL database:

```powershell
mysql -u root -p gachapon < migrations/001_init.sql
```

3. Install dependencies and start server:

```powershell
npm install
npm run dev
```

4. Open `login.html` (or your existing `index.html`) and use the API endpoints under `/api`.

Notes

## Integration / smoke tests

Quick manual + automated smoke test instructions to verify API and basic flows.

1) Ensure server and static front-end are running

```powershell
npm install
npm run dev        # starts API (default port 4000)
# in a separate shell (serve static files)
# python -m http.server 5500
```

2) Seed an admin (optional if already done)

```powershell
# Gachapon — ローカル開発ガイド（日本語）

このリポジトリは、学習/開発用のガチャ（Gachapon）アプリです。バックエンド（Node.js + Express + MySQL）とシンプルなフロント（静的 HTML/JS）を含みます。

以下は Windows (PowerShell) 環境でのセットアップ手順、起動方法、トラブルシュート、および簡易のスモークテスト手順です。

---

## 前提

- Node.js（推奨 18+）と npm がインストールされていること
- MySQL がインストールされ、データベースを作成できること
- PowerShell（Windows）を使って操作できること

## 1) 環境変数の準備

リポジトリルートにある `.env.example` をコピーして `.env` を作成し、中身を編集してください。

主な設定例:

```text
DB_HOST=localhost
DB_USER=root
DB_PASS=your_db_password
DB_NAME=gachapon
JWT_SECRET=change-me-to-a-secret
CLIENT_ORIGIN=http://localhost:5500
ADMIN_EMAIL=admin@example.com
ADMIN_PASS=adminpass
PORT=4000
```

`CLIENT_ORIGIN` は開発時にブラウザからアクセスする origin（例: `http://localhost:5500`）を指定します。

## 2) データベースの準備（マイグレーション）

MySQL にスキーマを適用します（`migrations/001_init.sql` を使用）：

```powershell
mysql -u root -p gachapon < migrations/001_init.sql
```

※ `gachapon` データベースが存在しない場合は先に作成してください。

## 3) 依存関係のインストールとサーバー起動

```powershell
npm install
npm run dev    # nodemon で開発サーバーを起動（PORT は .env かデフォルト 4000）
```

サーバーが起動すると `API running on <PORT>` が表示されます。

## 4) フロント（静的ファイル）の配信（開発用）

```powershell
# Python がある場合
python -m http.server 5500

# あるいは Node の簡易サーバー
npx serve -l 5500 .
```

ブラウザで `http://localhost:5500` や `http://127.0.0.1:5500` を開いてください。

## 5) 管理者アカウントの作成（任意）

`.env` に `ADMIN_EMAIL` / `ADMIN_PASS` を設定している場合、次で管理者を作成または更新できます：

```powershell
node scripts/seed-admin.js
```

## 6) スモークテスト（自動）

API の基本フロー（ログイン→ガチャ作成→取得→削除）を自動で確認するスクリプトを用意しています。サーバー起動中に実行してください。

```powershell
node tests/api-smoke.js
```

`.env` の `ADMIN_EMAIL` / `ADMIN_PASS` が使われます。最後に `SMOKE TEST PASSED` が出れば成功です。

---

## よくあるトラブルと対処

### 1) ポートが既に使われている（EADDRINUSE）

エラー例: `Error: listen EADDRINUSE: address already in use :::4000`

対処（PowerShell）:

```powershell
# どのプロセスがポートを使用しているか確認
netstat -ano | findstr :4000

# 表示された PID を確認
tasklist /FI "PID eq <PID>"
Get-CimInstance Win32_Process -Filter "ProcessId=<PID>" | Select-Object ProcessId,Name,CommandLine

# 問題なければ停止
taskkill /PID <PID> /F
```

別案: 一時的に別ポートで起動

```powershell
$env:PORT = "4001"
node server.js
```

### 2) CORS（ブラウザのプリフライトで弾かれる）

ブラウザ上で `Access-Control-Allow-Origin` 関連のエラーが出る場合は、`.env` の `CLIENT_ORIGIN` をブラウザでアクセスしている origin（例: `http://127.0.0.1:5500`）に合わせるか、開発用に複数 origin を許可してください。今回の実装では開発時の localhost / 127.0.0.1 の混在を考慮した CORS 設定を含めています。

### 3) MySQL 接続エラー

- `Access denied for user 'root'@'localhost'` などが出る場合は `.env` の `DB_USER` / `DB_PASS` を確認してください。
- MySQL サーバーが起動しているか（`systemctl` / サービスマネージャー）も確認してください。

### 4) 認証に失敗する

- ログイン失敗（401）が出る場合は、`ADMIN_EMAIL` / `ADMIN_PASS` が正しいか、`seed-admin` を使って管理者を作成しているか確認してください。

## ログとデバッグ

- 開発中は `npm run dev`（nodemon）で起動し、ターミナル出力でエラーを確認してください。
- 簡易デバッグ用に `server-error.log` への出力を行っています。長期運用では `winston` や `pino` といったロギングを検討してください。

---

もし README をさらに詳しく（API 仕様の詳細、テーブル設計、CI 連携手順など）書いてほしい箇所があれば教えてください。

# gachapon
授業課題JAVA
