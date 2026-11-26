# 遊戲及攤位維護

從網站的 `booth/` 進入「HKU 聖誕理財遊樂場」，可以直接試玩三款中英雙語遊戲。要為現場參加者登記成績，請由同頁的「攤位 UID 登記」開始。下表的路徑均以網站根目錄為起點。

| 遊戲及路徑 | 現行攤位玩法 | 修改位置 |
| --- | --- | --- |
| 富臨一刀 · `game/` | 依次辨認理財工具及投資產品，每關最多 45 秒，完成兩關即可結算。 | [site/game/](../site/game/) 的 `questions.js` 存放中英文題目，`engine.js` 處理計分及錢袋軌跡，`app.js` 控制畫面流程。 |
| 捕財達人 · `fishing/` | 點按瞄準、自動連射。四回合依次為 15、20、25、30 秒，回合之間回答醫療保險問題。 | [sources/fishing/](../sources/fishing/) 有版面、Canvas 圖像、魚群隊形和遊戲邏輯。 |
| 財富戰機 · `fleet/` | 拖曳戰機閃避，四回合共 90 秒，回合之間回答投資風險及平台牌照問題。 | [sources/fleet/](../sources/fleet/) 的 `core.js` 處理戰鬥規則，`app.js` 處理輸入及畫面。 |

三個入口均使用攤位中等難度。答題及暫停期間停鐘。共同的回合時間、關間題目和結算規則在 [sources/arcade/journey.js](../sources/arcade/journey.js)。

## 現場登記及核對成績

1. 在 `booth/station.html` 輸入工作人員入口密碼。首次使用該裝置時，另設 4 至 8 位數字 PIN，供核對及匯出成績。入口驗證有效期間可連續登記下一位參加者。
2. 輸入以 `303` 開頭的十位數字 UID，再選遊戲。系統為該局建立一次性遊戲連結，結算後把待核對的成績儲存在同一瀏覽器。
3. 參加者在 Microsoft Forms 後測填寫相同 UID 及聯絡方法。工作人員核對回覆後，在成績頁輸入裝置 PIN 確認，也可保留待核對紀錄，先讓下一位參加者遊玩。
4. `booth/station.html?view=ranking` 按遊戲列出本機每個 UID 已核對的最高分，公開顯示末四位，同分並列。多部裝置的成績可在「工作人員紀錄」匯出 CSV，再匯入同一部裝置合併。

登記介面在 [site/booth/station.js](../site/booth/station.js)，遊戲登記、成績儲存及 CSV 合併在 [site/booth/marks.js](../site/booth/marks.js)。正式站使用 Supabase 驗證工作人員入口及簽發遊戲局次。開發伺服器在 `127.0.0.1` 或 `localhost` 會改用本機 PGlite 處理這些請求。如要測試登記流程，可在啟動伺服器前執行 `node scripts/booth-preview.mjs --set-password`，從標準輸入提供一行本機測試密碼。

## 重建及驗證

在 repo 根目錄使用 Node.js 22 及 Python 3，以下指令依照 GitHub Pages 工作流程排列。

```sh
npm ci
python3 sources/arcade/build.py
python3 sources/fishing/build.py
python3 sources/fleet/build.py
npm run check
npm test
npm run bundle
```

第一個 Python 腳本將共用的 `journey.js`、`journey.css` 和場景 SVG 複製到 `site/arcade/`。另外兩個腳本分別產生 `site/fishing/index.html` 和 `site/fleet/index.html`，把共用程式、`marks.js` 和素材嵌入頁面，並複製相應的鳴謝檔案。修改這些輸入後，重新執行腳本並一起提交有變更的生成檔，即可用 `npm run dev` 預覽。富臨一刀的專屬程式直接由 `site/game/` 載入。

測試可從 [tests/](../tests/) 查找。`journey.test.mjs` 檢查計時、答題、計分紀錄及生成頁面是否包含目前的共用程式。`knife-*.test.mjs`、`fishing.test.mjs` 及 `fleet*.test.mjs` 覆蓋個別遊戲，`booth-entry.test.mjs` 和 `booth-station.test.mjs` 則覆蓋入口驗證、UID、每局成績及 CSV 合併。

## 素材來源及舊版紀錄

修改或替換素材時，保留相應授權聲明並更新來源記錄。捕魚及戰機沿用 MIT 授權的遊戲程式，音效來自 Kenney，圖示來自 Lucide。富臨一刀另有記錄投擲軌跡、生成計時及音效的來源。[共用素材及授權](../sources/arcade/CREDITS.md) · [富臨一刀開源聲明](../site/game/OPEN_SOURCE.md)

早期的規則及平衡測試可供追溯回合長度和難度的演變。[攤位版本紀錄](history/arcade-booth-v2.md) · [捕魚與戰機平衡紀錄](history/combat-balance-2026-11-04.md)
