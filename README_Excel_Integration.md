# 工事台帳（案件ごと複数ファイル）→ 一覧への自動統合（VBAなし）

VBAが使えない環境向けに、Power Queryだけで「フォルダー内の複数の工事台帳.xlsx」を自動結合して一覧にまとめる手順と、コピペで使えるMコード（クエリ）を用意しました。

## 前提
- Excel for Microsoft 365（推奨）/ 2019以降（Windows）。
- 案件ごとの台帳ファイルを1つのフォルダーに格納。
- 各台帳の構造が概ね同じ（列見出しが一致）。
- できれば各台帳の明細をテーブル化し、テーブル名を統一（例: `t_Ledger`）。

例）フォルダー構成
```
C:\Data\工事台帳\
  ├─ 工事台帳_0001.xlsx
  ├─ 工事台帳_0002.xlsx
  └─ ...
```

## 一覧ブックの作り方（概要）
1) 一覧用の新規ブックを作成（例: `一覧.xlsx`）。  
2) データ → データの取得 → フォルダーから → `C:\Data\工事台帳` を指定。  
3) 「データの変換」を選び、Power Queryエディターで整形。  
4) 下記の「関数クエリ」「メインクエリ」を追加（コピペ）。  
5) 「閉じて読み込む」→ シート上にテーブルとして配置し、更新は「すべて更新」または自動更新設定。

> 注意: プライバシーレベルのダイアログが出たら、同一フォルダーは同レベルに設定。OneDrive/SharePointの場合は専用コネクタ（SharePointフォルダー）を利用してください。

---

## クエリ1: 変換関数（各ファイルからテーブル`t_Ledger`を取り出し、ファイル名を付与）
Power Query → クエリの追加 → 空のクエリ → 右クリック「詳細エディター」→ 下記を貼り付け → 名前を `TransformLedger` に変更。

```m
(file as binary, fileName as text) as table =>
let
    Source = Excel.Workbook(file, true),
    // 1ファイル内のテーブル一覧から、テーブル名 t_Ledger を取得（なければ空テーブル）
    TryTable = try Source{[Kind = "Table", Name = "t_Ledger"]}[Data] otherwise null,
    BaseTable = if TryTable = null then #table({}, {}) else TryTable,
    // Standardized = Table.TransformColumnNames(BaseTable, each Text.Trim(_)),
    WithFile = Table.AddColumn(BaseTable, "ソースファイル", each fileName)
in
    WithFile
```

### 関数クエリが見当たらないとき（3つの対処）
- A) 自動生成（最短・おすすめ）
  - データ → データの取得 → フォルダーから → 対象フォルダー → プレビューで「結合と変換（Combine & Transform）」を選択。
  - 左ペインに「サンプルファイルの変換」「ファイルの変換（関数）」などが自動作成されます。
  - サンプル側で `t_Ledger` を選び直し、不要列や型を調整 → メインで列を展開。
- B) 手動作成（本章のMをコピペ）
  - Power Query → クエリの追加 → 空のクエリ → 詳細エディター → `TransformLedger` のMを貼り付け。
  - クエリ一覧で fx アイコン（関数）になっていることを確認し、名前を `TransformLedger` に変更。
- C) 関数を使わない代替
  - メインクエリ内でローカル関数を定義して `Table.AddColumn` に直接組み込み（下の代替例を参照）。

---

## クエリ2: メイン（フォルダー内の全xlsxに関数を適用して結合）
Power Query → クエリの追加 → 空のクエリ → 詳細エディター → 下記を貼り付け → 名前を `LedgerList` に変更。

```m
let
    // フォルダーを指定（必要に応じて変更）
    Source = Folder.Files("C:\\Data\\工事台帳"),

    // 余計なファイルを除外し、Excelブックのみ対象
    Filtered = Table.SelectRows(Source, each [Extension] = ".xlsx" or [Extension] = ".xlsm"),

    // ファイル名でフィルタする場合（例: "工事台帳_" で始まる）
    // Filtered = Table.SelectRows(Filtered, each Text.StartsWith([Name], "工事台帳_")),

    // 各行（各ファイル）に TransformLedger を適用
    Applied = Table.AddColumn(Filtered, "Table", each TransformLedger([Content], [Name])),

    // 展開（列名は後で利用者に合わせて調整可能）
    Expanded = Table.ExpandTableColumn(
        Applied,
        "Table",
        {"工事番号", "工事名", "金額", "ステータス", "更新日", "ソースファイル"},
        {"工事番号", "工事名", "金額", "ステータス", "更新日", "ソースファイル"}
    ),

    // 型を設定（列名が違う場合は適宜修正）
    Typed = Table.TransformColumnTypes(
        Expanded,
        {
            {"工事番号", type text},
            {"工事名", type text},
            {"金額", Currency.Type},
            {"ステータス", type text},
            {"更新日", type date},
            {"ソースファイル", type text}
        }
    )
in
    Typed
```

> 使い方:

### 関数なし（代替）でのメインクエリ例
関数クエリを作らずに、メイン側だけで完結させる版です。

```m
let
    Source = Folder.Files("C:\\Data\\工事台帳"),
    Filtered = Table.SelectRows(Source, each [Extension] = ".xlsx" or [Extension] = ".xlsm"),
    Applied = Table.AddColumn(
        Filtered,
        "Table",
        each let
            // ローカル関数で1ファイルをテーブル化
            fn = (file as binary, fileName as text) as table =>
                let
                    Wb = Excel.Workbook(file, true),
                    TryTable = try Wb{[Kind = "Table", Name = "t_Ledger"]}[Data] otherwise null,
                    BaseTable = if TryTable = null then #table({}, {}) else TryTable,
                    WithFile = Table.AddColumn(BaseTable, "ソースファイル", each fileName)
                in
                    WithFile
        in fn([Content], [Name])
    ),
    Expanded = Table.ExpandTableColumn(
        Applied,
        "Table",
        {"工事番号", "工事名", "金額", "ステータス", "更新日", "ソースファイル"},
        {"工事番号", "工事名", "金額", "ステータス", "更新日", "ソースファイル"}
    ),
    Typed = Table.TransformColumnTypes(
        Expanded,
        {{"工事番号", type text},{"工事名", type text},{"金額", Currency.Type},{"ステータス", type text},{"更新日", type date},{"ソースファイル", type text}}
    )
in
    Typed
```
> - フォルダーに台帳ファイルを追加/更新 → 一覧ブックで「データ」→「すべて更新」を押すだけ。
> - 自動更新: クエリのプロパティで「ファイルを開くときに更新」「◯分ごとに更新」を有効化可能。

---
## よくある調整ポイント
- 列名が台帳ごとに微妙に違う → `TransformLedger` 内で `Table.TransformColumnNames` で正規化、または `Table.RenameColumns` を追加。
- シート上の範囲から取得したい → `Excel.Workbook(file, true)` の結果から `Kind = "Sheet"` を選び、`Data` をトリミング（`Table.PromoteHeaders` 等）。
- 複数テーブル/シートがある → `try ... otherwise` で優先順位を決めてフォールバック。
- OneDrive/SharePoint → 「SharePoint フォルダー」接続を使用（URLはサイトURL、サブパスで絞り込み）。

---

## 次に（列仕様が決まり次第）
- 一覧に出したい項目が固まったら、`Expanded` の列リストと `Typed` の型定義を更新します。

---

## トラブルシュート
- 列が出てこない/エラーになる: 各台帳にテーブル `t_Ledger` が存在するか確認。シート保護・パスワードの影響も確認。
- プライバシーレベルで結合できない: すべて「組織」または「なし」に揃える。データ ソース設定から変更可能。
- 遅い: フォルダー内の対象ファイルを減らす、不要列を早めに削除、ネットワークドライブよりローカル/SharePoint直結を検討。
---

## 付録: 列名が不揃いなときの標準化例（任意）
`TransformLedger` の `BaseTable` の直後に差し込んでください。

```m
Standardized = Table.TransformColumnNames(BaseTable, each Text.Trim(Text.Replace(_, "　", " "))),
FixedNames = Table.RenameColumns(
    Standardized,
    {
        {"名称", "工事名"}
    },
    MissingField.Ignore
),
WithFile = Table.AddColumn(FixedNames, "ソースファイル", each fileName)
```
---

