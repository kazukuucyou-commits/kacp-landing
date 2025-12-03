# 工事台帳統合Webアプリ化（Excel不要）

Excel/Power Queryではなく、**ブラウザで動くWebアプリ**として台帳統合を実現する選択肢です。

## メリット
- Excel不要。スマホ・タブレットからもアクセス可能。
- 複数人で同時アクセス可能（Excel排他ロックなし）。
- 検索・フィルタ・ソート・グラフがインタラクティブ。
- 定期自動実行（cron/タスクスケジューラ）で夜間統合。
- PDF/CSV出力、メール通知、DB保存など拡張が容易。

## デメリット
- サーバー（またはローカルPC）の起動が必要。
- PythonまたはNode.jsの環境構築が必要。
- Excel直接編集の手軽さは失われる（閲覧・分析に特化）。

---

## 方式A: Python + Streamlit（最短・おすすめ）

### 特徴
- ノーコードに近い簡単UI
- データフレーム・グラフが標準装備
- ローカルで即起動、クラウドデプロイも簡単（Streamlit Cloud無料枠あり）

### セットアップ（Windows PowerShell）
```powershell
# Python 3.9以降が必要（python.orgからインストール済み前提）
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install streamlit pandas openpyxl xlrd
```

### ファイル構成
```
c:\LP\
  ├─ app_streamlit.py      # メインアプリ
  ├─ requirements.txt      # 依存パッケージ
  └─ data\工事台帳\*.xlsx  # 統合対象
```

### `app_streamlit.py`（サンプル）
```python
import streamlit as st
import pandas as pd
from pathlib import Path
import glob

st.set_page_config(page_title="工事台帳一覧", layout="wide")
st.title("📋 工事台帳統合ビューア")

# フォルダー指定
folder = st.text_input("台帳フォルダーパス", "c:/LP/data/工事台帳")
sheet_name = st.text_input("シート名（空欄=先頭）", "")
table_name = st.text_input("テーブル名（空欄=自動）", "t_Ledger")

if st.button("📥 統合実行"):
    files = glob.glob(f"{folder}/*.xlsx")
    if not files:
        st.error("ファイルが見つかりません")
    else:
        all_data = []
        for f in files:
            try:
                # テーブル名が指定されていればそれを優先
                if table_name:
                    df = pd.read_excel(f, sheet_name=sheet_name or 0, engine='openpyxl')
                    # テーブル範囲の取得は手動。簡易版として全体を読む
                else:
                    df = pd.read_excel(f, sheet_name=sheet_name or 0)
                
                df["ソースファイル"] = Path(f).name
                all_data.append(df)
            except Exception as e:
                st.warning(f"{Path(f).name}: {e}")
        
        if all_data:
            merged = pd.concat(all_data, ignore_index=True)
            st.success(f"✅ {len(files)}ファイル、{len(merged)}行を統合")
            
            # フィルタ
            col1, col2 = st.columns(2)
            with col1:
                if "ステータス" in merged.columns:
                    status_filter = st.multiselect("ステータス", merged["ステータス"].unique())
                    if status_filter:
                        merged = merged[merged["ステータス"].isin(status_filter)]
            with col2:
                if "工事番号" in merged.columns:
                    search = st.text_input("工事番号検索")
                    if search:
                        merged = merged[merged["工事番号"].astype(str).str.contains(search, na=False)]
            
            # 表示
            st.dataframe(merged, use_container_width=True, height=500)
            
            # ダウンロード
            csv = merged.to_csv(index=False, encoding="utf-8-sig")
            st.download_button("📄 CSV出力", csv, "工事台帳一覧.csv", "text/csv")
```

### 起動
```powershell
streamlit run app_streamlit.py
```
ブラウザで `http://localhost:8501` が自動的に開きます。

### デプロイ（任意）
- Streamlit Cloud: GitHubリポジトリをプッシュ → [streamlit.io/cloud](https://streamlit.io/cloud) で無料デプロイ
- Docker: `FROM python:3.11` → `pip install -r requirements.txt` → `CMD streamlit run app_streamlit.py --server.port=8080`

---

## 方式B: Python + Flask（カスタマイズ重視）

### 特徴
- REST API化して他システムと連携可能
- HTML/CSS/JSを自由にカスタム
- 認証・権限管理の追加が容易

### セットアップ
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install flask pandas openpyxl
```

### `app_flask.py`（簡易版）
```python
from flask import Flask, render_template, jsonify, send_file
import pandas as pd
import glob
from pathlib import Path

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/merge')
def merge_ledgers():
    folder = "c:/LP/data/工事台帳"
    files = glob.glob(f"{folder}/*.xlsx")
    all_data = []
    for f in files:
        try:
            df = pd.read_excel(f, sheet_name=0)
            df["ソースファイル"] = Path(f).name
            all_data.append(df)
        except Exception as e:
            pass
    if all_data:
        merged = pd.concat(all_data, ignore_index=True)
        return jsonify(merged.to_dict(orient='records'))
    return jsonify([])

@app.route('/api/export')
def export_csv():
    # 統合処理（省略）
    # ...
    return send_file("output.csv", as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

### `templates/index.html`（最小構成）
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>工事台帳一覧</title>
</head>
<body>
    <h1>工事台帳統合</h1>
    <button onclick="loadData()">データ読込</button>
    <div id="result"></div>
    <script>
        async function loadData() {
            const res = await fetch('/api/merge');
            const data = await res.json();
            document.getElementById('result').innerHTML = 
                `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        }
    </script>
</body>
</html>
```

### 起動
```powershell
python app_flask.py
```
`http://localhost:5000` をブラウザで開く。

---

## 方式C: Node.js + Express（JavaScript環境）

### 特徴
- フロントエンド開発者に馴染みやすい
- npm豊富なライブラリ（xlsx, exceljs, papaparse）
- Next.js/Reactと組み合わせてモダンUI

### セットアップ
```powershell
npm init -y
npm install express xlsx
```

### `server.js`
```javascript
const express = require('express');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.get('/api/merge', (req, res) => {
    const folder = 'c:/LP/data/工事台帳';
    const files = fs.readdirSync(folder).filter(f => f.endsWith('.xlsx'));
    let allData = [];
    
    files.forEach(file => {
        const wb = XLSX.readFile(path.join(folder, file));
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        data.forEach(row => row['ソースファイル'] = file);
        allData = allData.concat(data);
    });
    
    res.json(allData);
});

app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
```

### 起動
```powershell
node server.js
```

---

## どれを選ぶか

| 方式              | 難易度 | UI品質 | 拡張性 | 用途                     |
|------------------|--------|--------|--------|--------------------------|
| Streamlit        | ★☆☆   | ★★★   | ★★☆   | 社内ダッシュボード・PoC   |
| Flask            | ★★☆   | ★☆☆   | ★★★   | API連携・カスタムUI       |
| Node.js/Express  | ★★☆   | ★★☆   | ★★★   | React/Vue統合・SPA化      |

**迷ったらStreamlit推奨**: 環境構築5分、コード20行で動くダッシュボードが完成します。

---

## 次のステップ
- 具体的なデータ構造（列名・シート名・テーブル名）が決まったら、上記のサンプルを最適化します。
- 認証（ログイン）、権限、DB保存、定期実行、メール通知などの追加実装も可能です。必要に応じて指示してください。
- クラウド展開（Azure App Service、AWS Elastic Beanstalk、Google Cloud Run）の手順も用意できます。

どの方式で進めますか？または、Excelのまま（Power Query）で十分でしょうか？
