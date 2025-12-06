# 圖片鴨鴨 (Imgduck) - 技術規格說明書

## 📋 目錄

1. [專案概述](#專案概述)
2. [技術架構](#技術架構)
3. [功能規格](#功能規格)
4. [數據結構](#數據結構)
5. [API 規格](#api-規格)
6. [UI/UX 規格](#uiux-規格)
7. [性能要求](#性能要求)
8. [瀏覽器兼容性](#瀏覽器兼容性)
9. [安全要求](#安全要求)
10. [部署規格](#部署規格)

---

## 專案概述

### 專案名稱
**圖片鴨鴨** (Imgduck)

### 專案描述
Vibe Coding專案，一個類似 [Squoosh](https://squoosh.app/) 的客戶端圖片壓縮工具，所有圖片處理都在瀏覽器中完成，保護用戶隱私。採用可愛的「鴨鴨」主題設計，提供直觀的全屏對比體驗。

### 核心價值
- 🔒 **完全本地處理**：所有圖片處理在瀏覽器中完成，不上傳到伺服器
- ⚡ **即時預覽**：實時壓縮並對比原圖和壓縮後的畫質差異
- 🎨 **優秀體驗**：全屏模式、可拖動分割線、流暢動畫
- 🖼️ **多格式支援**：WebP、MozJPEG、OxiPNG 三種壓縮格式

### 版本資訊
- **當前版本**: 0.0.0
- **構建工具**: Vite 5.0.8
- **框架**: React 18.2.0
- **語言**: TypeScript 5.2.2

---

## 技術架構

### 技術棧

#### 前端框架
- **React 18.2.0**: UI 框架，使用函數式組件和 Hooks
- **TypeScript 5.2.2**: 類型安全，提供完整的類型定義

#### 構建工具
- **Vite 5.0.8**: 快速構建工具，提供 HMR 和優化
- **@vitejs/plugin-react**: React 插件

#### 樣式
- **Tailwind CSS 3.3.6**: 實用優先的 CSS 框架
- **PostCSS 8.4.32**: CSS 後處理器
- **Autoprefixer 10.4.16**: 自動添加瀏覽器前綴

#### 圖片處理
- **browser-image-compression 2.0.2**: 圖片壓縮庫（用於 OxiPNG）
- **Canvas API**: 圖片格式轉換和壓縮（WebP、MozJPEG）

#### 開發工具
- **ESLint 8.55.0**: 代碼檢查
- **TypeScript ESLint**: TypeScript 專用 ESLint 規則

### 專案結構

```
imgduck/
├── src/
│   ├── components/          # React 組件
│   │   ├── ImageUploader.tsx      # 圖片上傳組件
│   │   ├── ImagePreview.tsx       # 圖片預覽和對比組件
│   │   ├── CompressionSettings.tsx # 壓縮參數設置組件
│   │   └── DownloadButton.tsx      # 下載按鈕組件
│   ├── hooks/               # 自定義 Hooks
│   │   ├── useImageCompression.ts # 圖片壓縮邏輯 Hook
│   │   └── useFileDrop.ts         # 文件拖放功能 Hook
│   ├── utils/               # 工具函數
│   │   ├── compression.ts         # 壓縮核心邏輯
│   │   ├── formatConverter.ts     # 格式轉換工具
│   │   └── fileUtils.ts           # 文件處理工具
│   ├── types/               # TypeScript 類型定義
│   │   └── index.ts
│   ├── App.tsx              # 主應用組件
│   ├── main.tsx             # 應用入口
│   └── index.css            # 全局樣式
├── public/                  # 靜態資源
├── deploy/                  # 部署配置
├── dist/                    # 構建輸出目錄
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### 架構設計模式

#### 組件化設計
- **單一職責原則**: 每個組件負責單一功能
- **組合優於繼承**: 使用組件組合構建複雜 UI
- **Props 向下流動**: 數據通過 props 從父組件傳遞到子組件

#### 狀態管理
- **本地狀態**: 使用 `useState` 管理組件內部狀態
- **自定義 Hooks**: 封裝複雜邏輯（如 `useImageCompression`）
- **狀態提升**: 共享狀態提升到共同父組件

#### 性能優化
- **防抖處理**: 300ms 防抖避免頻繁壓縮
- **內存管理**: 自動清理 blob URL
- **任務取消**: 使用 AbortController 取消重複任務
- **代碼分割**: Vite 自動進行代碼分割和優化

---

## 功能規格

### 1. 圖片上傳功能

#### 1.1 上傳方式
- **拖放上傳**: 支持將圖片拖放到上傳區域
- **點擊選擇**: 點擊上傳區域打開文件選擇器
- **粘貼上傳**: 支持 `Ctrl/Cmd + V` 粘貼剪貼板中的圖片

#### 1.2 文件驗證
- **格式限制**: JPEG、PNG、WebP、GIF
- **大小限制**: 最大 50MB
- **驗證反饋**: 顯示清晰的錯誤提示

#### 1.3 文件處理
- **讀取圖片信息**: 寬度、高度、文件大小
- **生成預覽**: 使用 `URL.createObjectURL` 生成預覽 URL
- **錯誤處理**: 完善的錯誤捕獲和提示

### 2. 圖片壓縮功能

#### 2.1 支援的壓縮格式

##### WebP
- **壓縮類型**: 有損/無損壓縮
- **透明度**: ✅ 支援
- **實現方式**: Canvas API `toBlob` 方法
- **瀏覽器檢測**: 自動檢測瀏覽器支持
- **質量範圍**: 0-100%

##### MozJPEG
- **壓縮類型**: 有損壓縮
- **透明度**: ❌ 不支援
- **實現方式**: Canvas API 轉換為 JPEG
- **質量範圍**: 0-100%
- **相容性**: 所有支援 JPEG 的瀏覽器

##### OxiPNG
- **壓縮類型**: 無損壓縮
- **透明度**: ✅ 支援
- **實現方式**: browser-image-compression + Canvas API
- **質量範圍**: 0-100%（影響最終 PNG 質量）

#### 2.2 壓縮參數

##### 質量 (Quality)
- **範圍**: 0-100
- **預設值**: 80
- **控制方式**: 滑塊輸入
- **影響**: 質量越低，文件越小，但畫質可能下降

##### 最大尺寸 (Max Dimensions)
- **最大寬度**: 可選，單位像素
- **最大高度**: 可選，單位像素
- **行為**: 如果圖片超過設定值，按比例縮放
- **預設**: 無限制

#### 2.3 壓縮流程
1. 用戶選擇圖片 → 驗證文件
2. 讀取圖片信息 → 生成預覽
3. 用戶調整參數 → 觸發壓縮（300ms 防抖）
4. 執行壓縮 → 顯示進度
5. 完成壓縮 → 顯示結果和對比

### 3. 圖片預覽和對比功能

#### 3.1 全屏模式
- **自動進入**: 上傳圖片後自動進入全屏模式
- **背景**: 深色半透明背景（`bg-slate-900/85`）
- **佔滿視窗**: 圖片區域佔滿整個視窗

#### 3.2 分割線對比
- **可拖動分割線**: 垂直分割線可左右拖動
- **視覺效果**: 漸層色彩（鴨藍到鴨黃）
- **控制手柄**: 圓形手柄，帶左右箭頭圖標
- **實時更新**: 拖動時實時更新對比區域

#### 3.3 圖片操作
- **縮放**: `Ctrl/Cmd + 滾輪` 縮放圖片（0.5x - 3x）
- **拖動**: 縮放後可拖動查看不同區域
- **重置**: 點擊重置按鈕恢復原始大小和位置
- **同步**: 原圖和壓縮圖同步縮放和移動

#### 3.4 標籤顯示
- **原圖標籤**: 顯示在左側區域
- **壓縮標籤**: 顯示在右側區域
- **樣式**: 鴨鴨主題膠囊樣式

### 4. 控制面板功能

#### 4.1 浮動面板
- **位置**: 右上角
- **樣式**: 半透明毛玻璃效果（`glass-card`）
- **內容**: 文件信息、壓縮設置、下載按鈕
- **響應式**: 自動調整寬度和高度

#### 4.2 文件信息顯示
- **原始大小**: 顯示原始文件大小（格式化）
- **壓縮後大小**: 顯示壓縮後文件大小
- **節省百分比**: 計算並顯示節省的百分比
- **格式**: 顯示當前壓縮格式

#### 4.3 壓縮設置
- **格式選擇**: 三個按鈕選擇格式（WebP/MozJPEG/OxiPNG）
- **質量滑塊**: 拖動滑塊調整質量（0-100）
- **尺寸輸入**: 兩個數字輸入框設置最大寬高
- **實時預覽**: 參數改變時自動觸發壓縮

### 5. 下載功能

#### 5.1 下載按鈕
- **位置**: 浮動面板底部
- **樣式**: 鴨鴨主題按鈕（`duck-button`）
- **狀態**: 僅在壓縮完成後顯示

#### 5.2 文件命名
- **命名規則**: `原檔名-compressed.副檔名`
- **副檔名映射**:
  - WebP → `.webp`
  - MozJPEG → `.jpg`
  - OxiPNG → `.png`
- **自動生成**: 無需用戶輸入

#### 5.3 下載流程
1. 點擊下載按鈕
2. 創建臨時 `<a>` 標籤
3. 設置 `href` 為 blob URL
4. 設置 `download` 屬性
5. 觸發點擊事件
6. 清理臨時元素

### 6. 用戶體驗功能

#### 6.1 動畫效果
- **淡入動畫**: 組件出現時淡入（`animate-fade-in`）
- **懸停效果**: 按鈕和可交互元素有懸停效果
- **過渡動畫**: 狀態改變時平滑過渡
- **加載動畫**: 壓縮時顯示旋轉動畫

#### 6.2 錯誤處理
- **文件驗證錯誤**: 顯示清晰的錯誤提示
- **壓縮錯誤**: 捕獲並顯示錯誤信息
- **超時處理**: 30秒超時保護
- **瀏覽器兼容性**: 自動檢測並提示

#### 6.3 響應式設計
- **桌面端**: 完整功能體驗
- **移動端**: 自適應布局和觸控支持
- **平板**: 優化的中間尺寸布局

---

## 數據結構

### TypeScript 類型定義

#### CompressionFormat
```typescript
type CompressionFormat = 'webp' | 'mozjpeg' | 'oxipng';
```

#### CompressionOptions
```typescript
interface CompressionOptions {
  format: CompressionFormat;    // 壓縮格式
  quality: number;              // 質量 0-100
  maxWidth?: number;            // 最大寬度（像素）
  maxHeight?: number;           // 最大高度（像素）
}
```

#### ImageInfo
```typescript
interface ImageInfo {
  file: File;                   // 原始文件對象
  url: string;                  // 預覽 URL (blob URL)
  width: number;                // 圖片寬度（像素）
  height: number;               // 圖片高度（像素）
  size: number;                 // 文件大小（字節）
}
```

#### CompressedImage
```typescript
interface CompressedImage {
  blob: Blob;                   // 壓縮後的 Blob 對象
  url: string;                  // 預覽 URL (blob URL)
  size: number;                 // 文件大小（字節）
  format: CompressionFormat;    // 壓縮格式
}
```

### 狀態管理

#### App 組件狀態
```typescript
{
  originalImage: ImageInfo | null;
  compressedImage: CompressedImage | null;
  isCompressing: boolean;
  error: string | null;
  options: CompressionOptions;
  errorMessage: string | null;
}
```

#### ImagePreview 組件狀態
```typescript
{
  zoom: number;                 // 縮放比例 (0.5 - 3)
  position: { x: number; y: number };  // 圖片位置
  isDragging: boolean;          // 是否正在拖動圖片
  splitPosition: number;        // 分割線位置 (0-100%)
  isDraggingSplit: boolean;     // 是否正在拖動分割線
}
```

---

## API 規格

### 工具函數 API

#### formatFileSize(bytes: number): string
格式化文件大小為可讀字符串。

**參數**:
- `bytes`: 文件大小（字節）

**返回**: 格式化後的字符串（如 "1.5 MB"）

**範例**:
```typescript
formatFileSize(1572864) // "1.5 MB"
```

#### validateImageFile(file: File): { valid: boolean; error?: string }
驗證圖片文件。

**參數**:
- `file`: 文件對象

**返回**: 驗證結果對象

**範例**:
```typescript
const result = validateImageFile(file);
if (!result.valid) {
  console.error(result.error);
}
```

#### getImageInfo(file: File): Promise<ImageInfo>
獲取圖片信息。

**參數**:
- `file`: 文件對象

**返回**: Promise<ImageInfo>

**範例**:
```typescript
const imageInfo = await getImageInfo(file);
console.log(imageInfo.width, imageInfo.height);
```

#### compressImage(imageInfo: ImageInfo, options: CompressionOptions): Promise<CompressedImage>
壓縮圖片。

**參數**:
- `imageInfo`: 圖片信息
- `options`: 壓縮選項

**返回**: Promise<CompressedImage>

**範例**:
```typescript
const compressed = await compressImage(imageInfo, {
  format: 'webp',
  quality: 80
});
```

#### convertImageFormat(imageUrl: string, options: CompressionOptions): Promise<CompressedImage>
轉換圖片格式。

**參數**:
- `imageUrl`: 圖片 URL
- `options`: 壓縮選項

**返回**: Promise<CompressedImage>

**錯誤處理**:
- 瀏覽器不支持 WebP 時拋出錯誤
- 圖片載入失敗時拋出錯誤
- 30秒超時保護

### Hooks API

#### useImageCompression()
圖片壓縮邏輯 Hook。

**返回**:
```typescript
{
  originalImage: ImageInfo | null;
  setOriginalImage: (image: ImageInfo | null) => void;
  compressedImage: CompressedImage | null;
  isCompressing: boolean;
  error: string | null;
  compress: (imageInfo: ImageInfo, options: CompressionOptions) => Promise<void>;
  reset: () => void;
}
```

#### useFileDrop(onDrop: (files: FileList) => void)
文件拖放功能 Hook。

**參數**:
- `onDrop`: 文件拖放回調函數

**返回**:
```typescript
{
  dropRef: RefObject<HTMLDivElement>;
  isDragging: boolean;
}
```

---

## UI/UX 規格

### 設計主題

#### 色彩系統
- **鴨黃色**: `#FFE08A` - 主色調
- **鴨藍色**: `#7ED4F8` - 輔助色
- **粉色**: `#F9C4D2` - 點綴色
- **深色背景**: `rgba(15, 23, 42, 0.85)` - 全屏模式背景

#### 字體
- **系統字體**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', ...`
- **字體大小**: 
  - 標題: `text-5xl` (3rem)
  - 副標題: `text-lg` (1.125rem)
  - 正文: `text-sm` (0.875rem)
  - 小字: `text-xs` (0.75rem)

#### 圓角
- **大圓角**: `rounded-xl` (0.75rem) - 按鈕、卡片
- **中圓角**: `rounded-lg` (0.5rem) - 輸入框
- **小圓角**: `rounded` (0.25rem) - 標籤

#### 陰影
- **卡片陰影**: `shadow-lg` - 浮動面板
- **按鈕陰影**: `shadow-md` - 按鈕懸停
- **分割線陰影**: `shadow-lg` - 分割線

### 組件規格

#### ImageUploader
- **尺寸**: 全寬，最小高度 200px
- **邊框**: 2px 虛線邊框
- **拖拽狀態**: 邊框變色，背景變色，輕微放大
- **圖標**: 上傳圖標或鴨鴨圖標

#### ImagePreview
- **全屏模式**: `absolute inset-0`
- **分割線**: 1px 寬，漸層色彩
- **控制手柄**: 48px × 48px 圓形
- **標籤**: 膠囊樣式，半透明背景

#### CompressionSettings
- **布局**: 垂直堆疊，間距 16px
- **格式按鈕**: 3 列網格布局
- **質量滑塊**: 全寬，自定義樣式
- **輸入框**: 2 列網格布局

#### DownloadButton
- **樣式**: 鴨鴨主題漸層按鈕
- **圖標**: 下載圖標
- **狀態**: 僅在壓縮完成後顯示

### 動畫規格

#### 淡入動畫
```css
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**持續時間**: 0.3s  
**緩動**: ease-out

#### 懸停效果
- **按鈕**: 輕微放大（`scale-105`）
- **過渡時間**: 200ms
- **分割線手柄**: 放大並變色

---

## 性能要求

### 壓縮性能
- **小圖片 (< 1MB)**: < 1秒
- **中等圖片 (1-5MB)**: < 3秒
- **大圖片 (5-10MB)**: < 10秒
- **超大圖片 (> 10MB)**: < 30秒（超時保護）

### 內存管理
- **自動清理**: 組件卸載時清理 blob URL
- **任務取消**: 新任務開始時取消舊任務
- **內存限制**: 單個圖片最大 50MB

### 響應性能
- **防抖延遲**: 300ms
- **UI 響應**: < 100ms
- **動畫流暢度**: 60 FPS

### 構建優化
- **代碼分割**: 自動分割
- **資源壓縮**: Gzip 壓縮
- **生產構建大小**: 
  - JS: ~215 KB (gzip: ~74 KB)
  - CSS: ~17 KB (gzip: ~4 KB)

---

## 瀏覽器兼容性

### 完全支援
- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

### 部分支援
- ⚠️ Safari 13: WebP 不支援，需使用其他格式
- ⚠️ IE 11: 不支援（不建議使用）

### 功能檢測
- **WebP 支持檢測**: 自動檢測並提示
- **Canvas API**: 所有現代瀏覽器支援
- **File API**: 所有現代瀏覽器支援
- **Blob URL**: 所有現代瀏覽器支援

---

## 安全要求

### 客戶端安全
- **文件驗證**: 嚴格驗證文件類型和大小
- **XSS 防護**: React 自動轉義
- **無伺服器交互**: 所有處理在本地完成

### 隱私保護
- **不上傳**: 圖片不離開用戶設備
- **無追蹤**: 不收集用戶數據
- **無 Cookie**: 不使用 Cookie

### 錯誤處理
- **異常捕獲**: 所有異步操作都有錯誤處理
- **用戶提示**: 清晰的錯誤信息
- **超時保護**: 防止長時間阻塞

---

## 部署規格

### 構建輸出
- **輸出目錄**: `dist/`
- **靜態文件**: HTML、CSS、JS
- **資源路徑**: 相對路徑

### 伺服器要求
- **Web 伺服器**: Nginx、Apache、或其他
- **SPA 路由**: 需要配置所有路徑返回 `index.html`
- **靜態資源**: 支持靜態文件服務

### 推薦配置
- **Gzip 壓縮**: 啟用
- **緩存策略**: 靜態資源長期緩存
- **HTTPS**: 強烈推薦

詳細部署說明請參考 [deploy/README.md](deploy/README.md)

---

## 測試規格

### 功能測試
- ✅ 圖片上傳（拖放、點擊、粘貼）
- ✅ 文件驗證（格式、大小）
- ✅ 三種格式壓縮
- ✅ 參數調整
- ✅ 圖片對比
- ✅ 下載功能

### 兼容性測試
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ 移動瀏覽器

### 性能測試
- ✅ 小圖片壓縮速度
- ✅ 大圖片壓縮速度
- ✅ 內存使用情況
- ✅ UI 響應速度

---

## 未來擴展

### 可能的改進
- [ ] 支援更多壓縮格式（AVIF、HEIC）
- [ ] 批量處理多張圖片
- [ ] 圖片編輯功能（裁剪、旋轉）
- [ ] 壓縮歷史記錄
- [ ] 自定義壓縮預設
- [ ] PWA 支持（離線使用）

### 技術債務
- [ ] 添加單元測試
- [ ] 添加 E2E 測試
- [ ] 性能監控
- [ ] 錯誤日誌收集

---

**文檔版本**: 1.0.0  
**最後更新**: 2025/12/06  
**維護者**: 開發團隊

