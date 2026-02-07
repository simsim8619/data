// ==============================================
// 配置项 - Vercel 部署版
// ==============================================

// 数据文件 URL（Vercel 部署地址）
const DATA_URL = "/data.json"; // 相对路径，部署在同一个域名下

// 存储策略
const STORAGE_STRATEGY = "hybrid"; // 'local' | 'remote' | 'hybrid'

// 登录密码
const PASSWORD = "admin123";

// 排除同步的车牌
const EXCLUDE_PLATES = ["QM8517L", "QAA2805W", "Q2805"];

// 预警阈值
const BLACK_OIL_RED_THRESHOLD = 500;
const BLACK_OIL_YELLOW_THRESHOLD = 1000;
const GEAR_OIL_RED_THRESHOLD = 5000;
const GEAR_OIL_YELLOW_THRESHOLD = 10000;
const BLACK_OIL_MIN_DIFF = -2000;
const GEAR_OIL_MIN_DIFF = -10000;
const PREDICTED_RED_THRESHOLD = 0;
const PREDICTED_YELLOW_THRESHOLD = 1000;
const UPDATE_WARNING_DAYS = 3;

// 自动保存设置
const AUTO_SAVE_INTERVAL = 30000; // 30秒