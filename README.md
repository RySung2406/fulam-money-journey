# 富臨錢進號 · FuLam Money Journey

港大學生團隊「搏富臨」的 21 天校園理財計劃。參加者在 WhatsApp 社群學習，到網站填問卷、每日打卡或參加校園攤位。首頁亦提供中英文理財遊戲入口。[開啟網站](https://rysung2406.github.io/fulam-money-journey/)

## 本機開發

使用 Node.js 22（與 GitHub Actions 一致），在專案根目錄安裝依賴並啟動伺服器。

```sh
npm ci
npm run dev
```

開啟 [本機網站](http://127.0.0.1:5173/fulam-money-journey/)。修改首頁 HTML 或 CSS 後，重新整理瀏覽器即可看到更新。連接埠已被使用時，可執行 `npm run dev -- --port 5174`。VS Code 使用者可開啟 [工作區](fulam-money-journey.code-workspace)，按 F5 在 Edge 預覽。

本機帳戶頁預設連接現有 Supabase 專案，使用真實電郵登入會寄出驗證碼。[帳戶設定與測試方式](docs/account.md)

## 從哪裏修改

| 工作 | 檔案或目錄 |
| --- | --- |
| 更新首頁、活動總覽或問卷入口 | [首頁](site/index.html) · [活動總覽](site/hub/index.html) · [問卷頁](site/questionnaire/index.html) |
| 發布校園理財誌內容 | 在[內容目錄](site/content-data.js)填入作品的 HTTPS 網址，同步更新[首頁卡片](site/index.html)及[英文文案](site/i18n-home.js)。網址留空時，觀看連結會隱藏。 |
| 維護會員登入、打卡或抽獎資訊 | [會員帳戶及打卡指南](docs/account.md) · [帳戶頁](site/account/index.html) · [資料庫設定及遷移](supabase/) |
| 修改富臨一刀、捕財達人、富臨財富戰機或攤位工作站 | [遊戲及攤位指南](docs/games.md)列出每款遊戲的原始檔、產生的檔案，以及工作站成績的儲存方式。 |
| 查閱計劃定位、視覺規格或機構標誌來源 | [產品說明](PRODUCT.md) · [設計規格](DESIGN.md) · [計劃標誌及出處](docs/programme-logos/README.md) |

## 建置、測試與發布

GitHub Pages 發布 [site/](site/) 的內容。這個目錄同時包含直接維護的網頁及建置產物。修改共用遊戲程式、捕財達人或財富戰機時，請編輯 [sources/](sources/) 下的原始檔，然後用 Python 3 重新建置。開發伺服器會在記憶體中自動重建 `site/app.js` 和 `site/game-auth.js` 的 JavaScript bundle。

安裝依賴後，在根目錄執行以下指令即可按發布順序建置及測試。

```sh
python3 sources/arcade/build.py
python3 sources/fishing/build.py
python3 sources/fleet/build.py
npm run check
npm test
npm run bundle
```

[scripts/](scripts/) 包含開發伺服器、語法檢查及打包工具，[tests/](tests/) 包含帳戶、打卡、遊戲與攤位測試。合併到 `main` 後，GitHub Actions 會執行上述步驟並發布網站。資料庫遷移由維護者另行套用。[Pages 工作流程](.github/workflows/pages.yml)

## 改版紀錄

- [2026 年 10 月網站改版與畫面](docs/history/website-redesign.md)
- [早期遊戲與攤位規則](docs/history/arcade-booth-v2.md)
- [2026 年 11 月 4 日捕財達人及戰機平衡調整](docs/history/combat-balance-2026-11-04.md)
