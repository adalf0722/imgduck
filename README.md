# 圖片鴨（Imgduck）

可愛、完全本地化的圖片壓縮工具。以 React + TypeScript + Vite 打造，支援拖放 / 點擊 / 貼上 / 整個資料夾上傳、批次佇列壓縮、多種輸出格式與全螢幕比較體驗。

![screenshot](./public/dock.webp)

- Demo：https://adalf0722.github.io/imgduck/

## 特色

- **無伺服器上傳**：所有壓縮流程皆在瀏覽器執行，隱私安全。
- **多種輸入方式**：拖曳、貼上、單檔選擇或一次選整個資料夾，快速建立批次佇列。
- **批次流程**：每張圖片都有進度、完成後可單檔下載或一次 ZIP 打包。
- **比較模式**：分隔線 / 並排 / 滑動三種檢視，支援同步縮放、滑鼠滾輪、平移與切換提示。
- **粉彩主題**：浮動控制面板、輸出卡與鴨鴨提示皆為玻璃風格，不遮擋主畫面。
- **多格式壓縮**：WebP、MozJPEG、OxiPNG，自訂品質、最大寬高與即時節省資訊。

## 技術堆疊

| 類別 | 使用技術 |
| ---- | -------- |
| 前端框架 | React 18、TypeScript 5 |
| 打包工具 | Vite 5 |
| 樣式 | Tailwind CSS、自訂 CSS（粉彩主題與動畫） |
| 圖片處理 | browser-image-compression、Canvas API、JSZip |

## 目錄結構

```
src/
├── components/       # ImageUploader、ImagePreview、BatchList、CompressionSettings 等 UI
├── hooks/            # useBatchCompression、useFileDrop 等自訂 hook
├── utils/            # 壓縮/檔案工具
├── types/            # 共用型別
├── main.tsx          # 進入點
└── index.css         # 粉彩主題
```

## 開發與建置

```bash
# 安裝相依套件
npm install

# 開發伺服器（http://localhost:5173）
npm run dev

# 程式碼檢查
npm run lint

# 產生發佈用 build
npm run build
```

## 開發提示

- `src/hooks/useBatchCompression.ts`：批次佇列核心，包含驗證、載入圖片資訊、序列化壓縮與 ZIP 打包，可在此擴充 Web Worker 或進度回報。
- `src/components/BatchList.tsx`：顯示佇列、狀態與下載按鈕，若要加入排序、搜尋或重新壓縮可在此延伸。
- `src/components/ImagePreview.tsx`：控制比較模式、同步縮放、滑動模式指示等互動。
- 圖示可使用 `public/dock.webp` / `dock.png` 或 emoji，透過 `.duck-logo` class 客製。

## 授權

本專案為示範專用，歡迎依需求自行延伸與部署。***
