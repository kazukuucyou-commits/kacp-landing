import streamlit as st
import pandas as pd
from pathlib import Path
import glob

st.set_page_config(page_title="工事台帳一覧", layout="wide")
st.title("📋 工事台帳統合ビューア")

# サイドバー設定
with st.sidebar:
    st.header("⚙️ 設定")
    folder = st.text_input("台帳フォルダーパス", "c:/LP/data/工事台帳")
    sheet_name = st.text_input("シート名（空欄=先頭）", "")
    skip_rows = st.number_input("スキップ行数（見出しまで）", 0, 20, 0)
    st.markdown("---")
    st.caption("複数の工事台帳.xlsxを統合して表示・検索・CSV出力")

# メイン処理
if st.button("📥 統合実行", type="primary"):
    files = glob.glob(f"{folder}/*.xlsx") + glob.glob(f"{folder}/*.xlsm")
    
    if not files:
        st.error(f"❌ `{folder}` にExcelファイルが見つかりません")
    else:
        all_data = []
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        for i, f in enumerate(files):
            try:
                status_text.text(f"処理中: {Path(f).name}")
                df = pd.read_excel(
                    f,
                    sheet_name=sheet_name if sheet_name else 0,
                    skiprows=skip_rows,
                    engine='openpyxl'
                )
                df["ソースファイル"] = Path(f).name
                all_data.append(df)
            except Exception as e:
                st.warning(f"⚠️ {Path(f).name}: {str(e)[:100]}")
            
            progress_bar.progress((i + 1) / len(files))
        
        status_text.empty()
        progress_bar.empty()
        
        if all_data:
            merged = pd.concat(all_data, ignore_index=True)
            st.success(f"✅ {len(files)}ファイル、{len(merged):,}行を統合しました")
            
            # フィルタ行
            col1, col2, col3 = st.columns(3)
            
            with col1:
                if "ステータス" in merged.columns:
                    status_filter = st.multiselect(
                        "ステータスで絞込",
                        options=merged["ステータス"].dropna().unique().tolist()
                    )
                    if status_filter:
                        merged = merged[merged["ステータス"].isin(status_filter)]
            
            with col2:
                if "工事番号" in merged.columns:
                    search = st.text_input("🔍 工事番号検索")
                    if search:
                        merged = merged[
                            merged["工事番号"].astype(str).str.contains(search, case=False, na=False)
                        ]
            
            with col3:
                file_filter = st.multiselect(
                    "ファイルで絞込",
                    options=merged["ソースファイル"].unique().tolist()
                )
                if file_filter:
                    merged = merged[merged["ソースファイル"].isin(file_filter)]
            
            st.caption(f"表示: {len(merged):,}行")
            
            # データ表示
            st.dataframe(
                merged,
                use_container_width=True,
                height=500,
                hide_index=True
            )
            
            # 統計情報
            st.markdown("### 📊 統計")
            stat_col1, stat_col2, stat_col3 = st.columns(3)
            
            with stat_col1:
                st.metric("総行数", f"{len(merged):,}")
            
            with stat_col2:
                if "金額" in merged.columns:
                    total = merged["金額"].sum()
                    st.metric("金額合計", f"¥{total:,.0f}")
            
            with stat_col3:
                st.metric("ファイル数", len(merged["ソースファイル"].unique()))
            
            # CSVダウンロード
            csv = merged.to_csv(index=False, encoding="utf-8-sig")
            st.download_button(
                "📄 CSV出力",
                data=csv,
                file_name="工事台帳一覧.csv",
                mime="text/csv"
            )
            
            # Excelダウンロード（オプション）
            from io import BytesIO
            buffer = BytesIO()
            with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
                merged.to_excel(writer, index=False, sheet_name='一覧')
            
            st.download_button(
                "📗 Excel出力",
                data=buffer.getvalue(),
                file_name="工事台帳一覧.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
        else:
            st.error("統合できるデータがありませんでした")
