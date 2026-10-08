---
doc: spec
status: approved
---

# Paperclear — Technical Spec

## How This Works, In Plain Language

Paperclearは、ElectronというしくみでHTML/CSS/JavaScriptをデスクトップアプリの「箱」に入れたものです。

動く順序はこうです。書類の写真をアプリに入れると、その画像データがGoogleの「Gemini API」というサービスに送られます。GeminiはAIで、画像を読んで「何をすべきか・いつまでに・どうやって」という情報を取り出し、日本語と英語の両方でテキストとして返してきます。アプリはそのテキストを受け取り、画面の右側に表示します。

APIキー（GeminiサービスへのパスワードのようなもNo）は、あなたのパソコンの中だけに保存されます。アプリのフォルダには入らず、GitHubにも公開されません。

このシンプルな形を選んだ理由：サーバーもデータベースも不要で、パソコン1台あれば動き、デモ動画を撮るのも簡単だからです。

## The Core Journey Through the System

PRD ref: `prd.md > The Core Journey`

```
1. アプリ起動
   └─ APIキーが保存されていない
      → キー入力画面を表示
      → ユーザーがキーを入力して「保存して始める」
      → Geminiにテスト通信（短いAPI呼び出し）
         ├─ 成功 → キーをAppDataに保存 → 初期画面へ
         └─ 失敗 → エラーメッセージ表示、画面に留まる

2. 初期画面
   └─ ユーザーが写真をドラッグ or「写真を選ぶ」ボタンをクリック
      → ファイルが選択される

3. 読み取り処理
   └─ 画面が左右に分割
      左：書類の写真
      右：「書類を読んでいます…」＋3行分のプレースホルダー
      左写真の上にスキャンアニメーション
      → メインプロセスがGemini APIに画像＋プロンプトを送信
      → Geminiが日本語・英語両方の構造化テキストを返す

4. 結果表示
   └─ 右パネルに結果を描画
      ・期限ブロック（朱色・大）
      ・3行が1行ずつ順番に現れる（staggered reveal）
      ・言語トグルで即座に切り替え（再通信なし）
      ・「別の書類を読む」ボタン → 初期画面に戻る
```

## Stack

| 項目 | 選択 | 理由 |
|------|------|------|
| デスクトップフレームワーク | **Electron** (最新安定版) | 既存のHTML/CSS/JS知識が使える。VS Code等と同じ実績ある技術。 |
| 言語 | **HTML / CSS / JavaScript** (ES Modules) | 学習者が経験済み。 |
| Gemini SDK | **@google/genai** (npm) | Google公式JS SDK。画像入力対応。 |
| AIモデル | **gemini-3.8-flash**（主）／ **gemini-3.5-flash-lite**（予備）— `gemini.js` の `CANDIDATE_MODELS` リストで管理 | 両モデルとも画像入力対応。429/503 時は次のモデルに自動切り替え、最大3巡リトライ。 |
| APIキー保存 | **Electronの`app.getPath('userData')`以下の`config.json`** | プロジェクトフォルダ外・リポジトリ外に保存される安全な場所。 |
| パッケージ管理 | **npm** | Electronの標準。 |

**ドキュメントリンク:**
- Electron: https://www.electronjs.org/docs/latest
- Google Generative AI SDK (JS): https://googleapis.github.io/js-genai/
- Gemini API Models: https://ai.google.dev/gemini-api/docs/models

**未確認事項（ビルド開始前に確認）:**
- `gemini-3.8-flash` の無料枠（レート制限・料金）: https://ai.google.dev/pricing

## Where It Runs and How Someone Tries It

**動作環境:** Windows（macOS対応可）、Node.js 18以上、npm。

**起動手順:**
```
npm install
npm start
```

**デモ録画の手順:**
1. `npm start` でアプリを起動
2. APIキーを入力して保存
3. 架空の書類の写真を入れて、3行の結果が出るまでを録画
4. 言語切り替えも見せる

**デプロイ:** 不要。ローカルで起動した画面を録画すれば提出可能。GitHubリポジトリの公開が必須（APIキーは含めない）。

## Look and Feel

PRD ref: `prd.md > Look and Feel`, `scope.md > Inspiration & Identity`

- **背景色:** `#f5f0e8`（和紙の生成り色）
- **テキスト:** `#1a1510`（墨色）
- **差し色:** `#c0392b`（朱色）— 期限表示のみに使用
- **見出しフォント:** `"Noto Serif JP", Georgia, serif`（明朝系）
- **本文フォント:** `"Noto Sans JP", "Hiragino Sans", sans-serif`（ゴシック系）
- **アニメーション:** スキャンライン（CSS `@keyframes` で上から下に移動）、結果3行は `animation-delay` で順番に `fadeInUp`
- **余白:** 広め。コンテンツを詰め込まない。
- **禁止:** 紫のグラデーション、ダッシュボード風テンプレートデザイン

## Components

### Main Process (`main.js`)

Electronのメインプロセス。アプリの起動・ウィンドウ生成・ファイルシステムアクセス・APIキーの読み書きを担当。RendererプロセスとはIPC（プロセス間通信）で通信する。

PRD ref: `prd.md > Features and Behavior > Settings`（キーの読み書き）

### Preload Script (`preload.js`)

RendererからMainに安全にアクセスするための橋渡し。`contextBridge` でAPIを公開する。セキュリティ上の理由でこのファイルが必要。

### Renderer — Setup Screen (`setup.html` / `setup.js`)

APIキー入力画面のUI。マスク入力・表示切り替え・「保存して始める」ボタン。Mainにキーの保存・検証を依頼する。

PRD ref: `prd.md > Screens and Layout > API Key Setup Screen`

### Renderer — Main App (`index.html` / `renderer.js`)

初期画面・処理中・結果画面・設定画面をすべてここで管理する（シングルページ構成）。画面の状態（`setup` / `home` / `loading` / `result`）に応じてHTMLの表示を切り替える。

PRD ref: `prd.md > Screens and Layout`（Initial / Processing / Result / Settings）

### Gemini Client (`gemini.js`)

Gemini APIとの通信を担当するモジュール。モデル名・プロンプトはここに集約。返ってきたテキストを構造化データ（期限・3行）にパースする。

PRD ref: `prd.md > Features and Behavior > Document Reading`

### Config Manager (`config.js`)

APIキーの読み書きを担当。保存先は `app.getPath('userData')/config.json`。プロジェクトフォルダ外のため `.gitignore` 不要。

PRD ref: `prd.md > Product Decisions`（APIキー保存）

### Stylesheet (`style.css`)

和紙パレット・明朝/ゴシックフォント・朱色・アニメーションの定義。

PRD ref: `prd.md > Look and Feel`

## Data Model

アプリはデータを永続保存しない（文書履歴なし）。セッション内で保持するデータのみ。

| データ | 保存場所 | 更新タイミング | アプリを閉じると |
|--------|---------|--------------|---------------|
| APIキー | `userData/config.json`（パソコン内） | キー入力・変更・削除時 | 残る |
| 現在の言語設定 | メモリ内（JS変数） | トグル操作時 | リセット（日本語に戻る） |
| 読み取り結果（JP/EN） | メモリ内（JS変数） | Gemini API応答時 | 消える |
| 表示中の書類写真 | メモリ内（ObjectURL） | 写真選択時 | 消える |

## File Structure

```
paperclear/
├── src/
│   ├── main.js          # Electronメインプロセス（ウィンドウ・IPC・キー保存）
│   ├── preload.js       # セキュリティブリッジ
│   ├── config.js        # APIキーの読み書き（userData/config.json）
│   ├── gemini.js        # Gemini API通信・レスポンスパース
│   ├── index.html       # メインアプリ画面（初期・処理中・結果・設定）
│   ├── renderer.js      # index.htmlのUIロジック
│   ├── setup.html       # APIキー入力画面（初回起動時）
│   ├── setup.js         # setup.htmlのUIロジック
│   └── style.css        # 全画面共通スタイル
├── assets/
│   └── icon.png         # アプリアイコン（仮）
├── demo-docs/           # 架空の書類サンプル（デモ用）
│   └── sample-kokumin-hoken.jpg
├── devpost/             # Devpostプランニングドキュメント
├── .gitignore           # node_modules, config.jsonのパスは不要（userData外のため）
├── package.json         # 依存関係・起動スクリプト
└── README.md            # セットアップ・起動方法
```

> **注意:** APIキーは `userData/config.json`（例: `C:\Users\username\AppData\Roaming\Paperclear\config.json`）に保存されます。プロジェクトフォルダには存在しないため、`.gitignore` に追記不要です。

## External Services and Dependencies

### Gemini API

- **エンドポイント:** `@google/genai` SDK経由（`generateContent`メソッド）
- **モデル戦略（主＋予備）:** `gemini.js` の `CANDIDATE_MODELS` リストで管理。
  - 主: `gemini-3.8-flash`（最新・高速）
  - 予備: `gemini-3.5-flash-lite`（主が 429/503 の場合に使用）
  - リトライ順序: 主を1回 → 失敗なら予備を1回 → 両方失敗なら3秒待って再巡、最大3巡
  - 1回の試行ごとに30秒タイムアウト
  - どのモデルで成功したかは開発者ログにのみ出力（画面には表示しない）
- **入力:** 画像（base64エンコード） + テキストプロンプト
- **プロンプト方針:**
  - 書類の「期限」「何をすべきか」「どうやって」を抽出
  - やさしい日本語と英語の両方を1回のAPIコールで返す
  - JSON形式で構造化して返すよう指示する
- **期待するレスポンス形式（JSON）:**
```json
{
  "deadline": "10月31日",
  "days_remaining": 23,
  "ja": {
    "what": "国民健康保険の保険料を支払う",
    "by_when": "10月31日",
    "how": "同封の納付書を持ってコンビニか銀行で支払う"
  },
  "en": {
    "what": "Pay national health insurance premium",
    "by_when": "October 31",
    "how": "Take the enclosed payment slip to a convenience store or bank"
  }
}
```
- **バリデーション用テスト通信:** セットアップ画面でキー保存前に短いテキスト入力で疎通確認
- **ドキュメント:** https://googleapis.github.io/js-genai/
- **料金（要確認):** https://ai.google.dev/pricing — 無料枠の有無をビルド開始前に確認

## Important Failure Modes

- **Gemini APIが混雑（503）または上限（429）** → 主モデル → 予備モデル → 3秒待って再巡、最大3巡の順で自動リトライ。全試行失敗時に「サーバーが混雑しています。数分待ってからもう一度お試しください」を表示。
- **30秒タイムアウト** → タイムアウトも 503 と同様に次のモデルへのフォールバックをトリガーする。
- **書類ではない画像を入れた** → GeminiのレスポンスにJSONパースエラーまたは期限・3行が空 → 「書類を読み取れませんでした」を表示。`prd.md > States and Boundaries`（non-document image状態）
- **APIキーが無効** → セットアップ画面でテスト通信が失敗 → 「鍵が正しくないようです。もう一度確認してください」を表示。`prd.md > Screens and Layout > API Key Setup Screen`

## What Was Simplified and Why

- **サーバーなし・データベースなし** — ローカルのJSON設定ファイルとメモリのみで動作。フルスタックWebアプリにすれば共有や履歴が実現できるが、PoC証明には不要で複雑度が大幅に増す。
- **文書履歴なし** — セッション内の1件のみ保持。履歴機能は `prd.md > Deferred From the POC` に明記。
- **シングルページ構成**（index.html 1ファイルで全画面管理） — 複数HTMLファイルに分けるより状態管理がシンプル。

## Decisions and Open Issues

**決定事項:**

| 決定 | 選択内容 | 理由とトレードオフ |
|------|---------|-----------------|
| フレームワーク | Electron | 学習者がHTML/JSを知っている。デスクトップアプリとして動く。ファイルサイズは大きいがPoC用途には問題なし。 |
| AIモデル | gemini-3.8-flash（主）/ gemini-3.5-flash-lite（予備） | 両モデル実在・画像入力対応をテストで確認済み。主が 429/503 の際に予備へ自動切り替え。モデルリストは `gemini.js` の `CANDIDATE_MODELS` 1か所で管理。 |
| APIキー保存場所 | Electronの`userData`ディレクトリ（AppData） | プロジェクトフォルダ外で.gitignore不要。OS標準のアプリデータ場所。 |
| 言語切り替え | 1回のAPIコールでJP/EN両方を取得 | トグル時に再通信不要。レスポンス速度を優先。 |

**学習者が持っていた不確かさと確認内容:**

- **Electronとは何か / なぜHTML/JSでデスクトップアプリが作れるのか:** 「ブラウザで動くHTMLをデスクトップアプリの箱に入れる仕組み」として説明。VS Code・Slackと同じ技術であることを確認した。
- **gemini-2.0-flashが廃止されていること:** 学習者が公式ページで確認・指摘。gemini-3.8-flashに変更し、モデル名をコードにハードコードしないよう設計した。これは良い実践（設定の外出し）。

**未解決（ビルド開始前に確認）:**

- `gemini-3.8-flash` の無料枠・レート制限: https://ai.google.dev/pricing で確認
- `@google/genai` SDKの最新バージョン番号: `npm install @google/genai` 時に確認
- 「鍵の取得方法を見る」リンクの正確なURL: Google AI Studio ( https://aistudio.google.com ) が最もシンプルな取得場所
