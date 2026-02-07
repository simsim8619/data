// ==============================================
// 数据模型管理 - Vercel 版
// ==============================================

const DataModel = (function() {
    // 私有数据
    let vehicleData = {
        blackOil: [],
        gearOil: [],
        predictedChange: []
    };
    
    let lastSaveTime = null;
    let autoSaveEnabled = true;
    let saveInterval = null;
    let dataSource = 'local';
    
    // 检查 DataService 是否可用
    function isDataServiceAvailable() {
        return typeof DataService !== 'undefined' && DataService !== null;
    }
    
    // 初始化默认数据
    function initializeDefaultData() {
        // ...（保持原有默认数据不变）
    }
    
    // 从远程加载数据
    async function loadFromRemote() {
        if (!isDataServiceAvailable()) {
            console.warn('DataService 不可用');
            return false;
        }
        
        try {
            console.log('尝试从远程加载数据...');
            const data = await DataService.load();
            
            if (data) {
                vehicleData = data;
                dataSource = 'remote';
                
                // 确保数据完整性
                ensureDataIntegrity();
                
                // 保存到本地缓存
                saveToLocal();
                
                console.log('远程数据加载成功');
                return true;
            }
        } catch (error) {
            console.warn('远程数据加载失败:', error.message);
        }
        
        return false;
    }
    
    // 根据策略加载数据
    async function loadWithStrategy() {
        console.log('开始加载数据，策略:', STORAGE_STRATEGY);
        
        try {
            let loaded = false;
            
            switch (STORAGE_STRATEGY) {
                case 'hybrid':
                    // 混合策略：先尝试远程，失败则用本地
                    try {
                        loaded = await loadFromRemote();
                        if (!loaded) {
                            console.log('远程加载失败，尝试本地存储');
                            loaded = loadFromLocal();
                        }
                    } catch (error) {
                        console.warn('远程加载异常，尝试本地存储:', error);
                        loaded = loadFromLocal();
                    }
                    break;
                    
                case 'remote':
                    // 仅从远程加载
                    loaded = await loadFromRemote();
                    if (!loaded) {
                        console.log('远程加载失败，使用默认数据');
                        initializeDefaultData();
                        dataSource = 'default';
                        loaded = true;
                    }
                    break;
                    
                case 'local':
                default:
                    // 仅从本地加载
                    loaded = loadFromLocal();
                    break;
            }
            
            if (!loaded) {
                console.log('无保存的数据，使用默认数据');
                initializeDefaultData();
                dataSource = 'default';
                loaded = true;
            }
            
            // 确保数据完整性
            ensureDataIntegrity();
            
            console.log('数据加载完成，来源:', dataSource);
            return loaded;
            
        } catch (error) {
            console.error('加载数据失败:', error);
            
            // 使用默认数据
            initializeDefaultData();
            dataSource = 'default';
            
            return false;
        }
    }
    
    // 其他函数保持不变...
    // ...（复制之前 dataModel.js 中的所有其他函数）
    
    // 公开方法
    return {
        // 初始化
        init: async function() {
            console.log('DataModel 初始化开始');
            
            // 初始化 DataService 模块（如果可用）
            if (isDataServiceAvailable()) {
                try {
                    await DataService.init();
                    console.log('DataService 初始化成功');
                } catch (error) {
                    console.warn('DataService 初始化失败:', error);
                }
            }
            
            // 启动自动保存
            startAutoSave();
            
            console.log('DataModel 初始化完成');
            return true;
        },
        
        // 从远程重新加载
        reloadFromRemote: async function() {
            return await loadFromRemote();
        },
        
        // 导出数据
        exportData: function() {
            if (isDataServiceAvailable()) {
                return DataService.exportData(vehicleData);
            } else {
                // 手动导出
                const jsonStr = JSON.stringify(vehicleData, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = 'vehicle-data.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                return true;
            }
        },
        
        // 导入数据
        importData: async function() {
            if (isDataServiceAvailable()) {
                try {
                    const data = await DataService.importData();
                    if (data) {
                        vehicleData = data;
                        ensureDataIntegrity();
                        this.save();
                        return true;
                    }
                } catch (error) {
                    console.error('导入失败:', error);
                }
            }
            return false;
        },
        
        // 备份数据
        backup: function() {
            if (isDataServiceAvailable()) {
                return DataService.backup(vehicleData);
            }
            return false;
        },
        
        // 恢复备份
        restoreBackup: function() {
            if (isDataServiceAvailable()) {
                const data = DataService.restore();
                if (data) {
                    vehicleData = data;
                    ensureDataIntegrity();
                    this.save();
                    return true;
                }
            }
            return false;
        },
        
        // 其他方法保持不变...
        // ...（复制之前的所有其他公开方法）
    };
})();