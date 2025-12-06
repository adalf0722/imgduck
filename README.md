# 圖片鴨（Imgduck）

可愛、完全本地化的圖片壓縮工具。以 React + TypeScript + Vite 打造，支援拖放/點擊/貼上/資料夾上傳、多種壓縮格式、可視化比較與下載。

![screenshot](./public/dock.webp)

## ✨ 特色

- **無伺服器上傳**：所有壓縮都在瀏覽器中完成，隱私無虞。
- **多種輸入方式**：拖曳、點擊選擇、貼上剪貼簿內容，並可擴充為資料夾/批次壓縮。
- **即時預覽**：提供分隔線、並排、滑動三種比較模式，支援縮放與拖曳瀏覽。
- **全浮動控制**：設定抽屜、輸出卡片、工具列與鴨醫生提示皆為粉彩玻璃風格，不遮擋圖片。
- **多格式壓縮**：WebP / MozJPEG / OxiPNG，自訂品質與尺寸，預設 300ms debounce 自動壓縮。
- **可愛主題**：粉彩背景、鴨鴨徽章、膠囊按鈕，並提供輔助資訊（原始大小、節省比例等）。

## 🧱 技術堆疊

| 類別 | 使用技術 |
| ---- | -------- |
| 前端框架 | React 18、TypeScript 5 |
| 打包工具 | Vite 5 |
| 樣式 | Tailwind CSS、自訂 CSS（粉彩主題與動畫） |
| 圖片處理 | `browser-image-compression`、Canvas API |

## 📂 目錄結構

```
src/
├── components/       # ImageUploader、ImagePreview、CompressionSettings 等 UI 元件
├── hooks/            # useImageCompression、useFileDrop 等 custom hooks
├── utils/            # 壓縮流程、檔案資訊、轉檔工具
├── types/            # TypeScript 型別定義
├── main.tsx          # Vite 入口
└── index.css         # 全域主題（粉彩鴨）
```

## 🚀 開發與建置

```bash
# 安裝相依套件
npm install

# 啟動開發伺服器（http://localhost:5173）
npm run dev

# 程式碼檢查
npm run lint

# 產出最終 build
npm run build
```

## 🔧 開發提示

- `src/hooks/useImageCompression.ts` 是壓縮流程核心，可在此加入批次壓縮、ZIP 打包等進階功能。
- `src/components/ImagePreview.tsx` 控制比較模式與手勢，若要新增交互可由此延伸。
- 圖示使用 `public/dock.webp` / `dock.png` 或 🐣 emoji，可依設計調整 `duck-logo` 樣式。

## 📄 授權

本專案為示範性質，依據專案需求進行自訂與部署。歡迎延伸成個人或團隊的圖片壓縮工具。 ***
