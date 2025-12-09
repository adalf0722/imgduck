# Imgduck（繁體中文）

Imgduck 是一款完全在瀏覽器內運行的圖片壓縮小工具，使用 React + TypeScript + Vite 打造。拖拉檔案、貼上剪貼簿內容，或一次上傳整個資料夾，建立批次佇列、全螢幕比對品質，並可單檔下載或打包 ZIP。

![screenshot](./duck.zh-TW.webp)

- [English Version](README.md)
- Demo：https://adalf0722.github.io/imgduck/

## 亮點

- **純瀏覽器端** — 所有壓縮都在本地完成，無須上傳伺服器。
- **多元輸入** — 拖放、點擊上傳、剪貼簿貼上、整個資料夾匯入，全部進入批次佇列。
- **批次流程** — 每筆任務顯示狀態與節省容量，支援單檔/ZIP 下載；下載按鈕更醒目並顯示壓縮後大小。
- **視覺比對** — 分割、並排、滑動三種模式，含同步縮放/平移；預覽燈箱可用按鈕或鍵盤左右鍵切換上一張/下一張。
- **友善介面** — 桌機預設展開壓縮設定（仍可收合），浮動面板不遮蔽影像。
- **多種格式** — MozJPEG（預設）、WebP、OxiPNG，提供品質與最大尺寸設定。

## 技術堆疊

| 類別 | 工具 |
| --- | --- |
| 前端框架 | React 18、TypeScript 5 |
| 建置 | Vite 5 |
| 樣式 | Tailwind CSS + 自訂粉彩主題 |
| 圖片處理 | browser-image-compression、Canvas API、JSZip |

## 專案結構

```
src/
├── components/       # ImageUploader、ImagePreview、BatchList、CompressionSettings 等 UI
├── hooks/            # useBatchCompression、useFileDrop、useImageCompression
├── utils/            # 壓縮/檔案處理工具
├── types/            # 共用型別
├── main.tsx          # 進入點
└── index.css         # 主題樣式
```

## 開發指令

```bash
npm install
npm run dev    # http://localhost:5173
npm run lint
npm run build
```

## 開發提示

- `src/hooks/useBatchCompression.ts`：批次佇列、驗證、壓縮流程與 ZIP 匯出，可在此擴充 Web Worker 或自訂預設。
- `src/components/ImagePreview.tsx`：比對模式、縮放平移、滑動手勢的控制。
- `src/components/BatchList.tsx`：佇列狀態與下載入口，適合加入排序/分組/篩選。
- `.duck-logo` 可替換 `public/` 下的素材或 emoji，自訂品牌風格。

## 授權

此專案供示範用途，歡迎依需求調整、部署與延伸。
