// ==============================================
// 数据模型管理 - 修复版
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
    
    // ========== 添加缺失的函数 ==========
    
    // 自动保存到本地存储
    function startAutoSave() {
    // 自动保存逻辑（根据你的需求实现）
    console.log("自动保存功能已启动");
    // 示例：每隔5分钟自动保存一次数据
    setInterval(() => {
        // 这里写你的保存逻辑，比如调用 saveData() 函数
        saveToLocal();
    }, 5 * 60 * 1000);
    }
    
    function stopAutoSave() {
        if (saveInterval) {
            clearInterval(saveInterval);
            saveInterval = null;
        }
        window.removeEventListener('beforeunload', handleBeforeUnload);
        console.log('自动保存已停止');
    }
    
    function handleBeforeUnload(e) {
        // 防止数据丢失
        if (lastSaveTime && (Date.now() - lastSaveTime) > 5000) {
            saveToLocal();
        }
    }
    
    // 保存到本地存储
    function saveToLocal() {
        try {
            localStorage.setItem('vehicleOilData', JSON.stringify(vehicleData));
            localStorage.setItem('vehicleOilData_lastSave', Date.now().toString());
            localStorage.setItem('vehicleOilData_source', dataSource);
            
            lastSaveTime = Date.now();
            
            console.log('数据已保存到本地存储');
            return true;
        } catch (error) {
            console.error('保存到本地存储失败:', error);
            return false;
        }
    }
    
    // 从本地存储加载
    function loadFromLocal() {
        try {
            const savedData = localStorage.getItem('vehicleOilData');
            if (savedData) {
                vehicleData = JSON.parse(savedData);
                const lastSave = localStorage.getItem('vehicleOilData_lastSave');
                const source = localStorage.getItem('vehicleOilData_source');
                
                lastSaveTime = lastSave ? parseInt(lastSave) : null;
                dataSource = source || 'local';
                
                console.log('从本地存储加载数据成功');
                return true;
            }
        } catch (error) {
            console.error('从本地存储加载失败:', error);
        }
        return false;
    }
    
    // ========== 继续其他函数 ==========
    
    // 检查 DataService 是否可用
    function isDataServiceAvailable() {
        return typeof DataService !== 'undefined' && DataService !== null;
    }
    
    // 初始化默认数据
    function initializeDefaultData() {
        vehicleData = {
            blackOil: [
                {
                    id: Utils.generateId(),
                    plate: "ABC1234",
                    maintenanceDate: "15/05/2024",
                    nextServiceKm: 10000,
                    entryDate: "15/05/2023",
                    totalMileage: 8500,
                    updateDate: "10/10/2023",
                    remainingKm: 1500
                },
                {
                    id: Utils.generateId(),
                    plate: "XYZ5678",
                    maintenanceDate: "20/06/2024",
                    nextServiceKm: 15000,
                    entryDate: "20/06/2023",
                    totalMileage: 14500,
                    updateDate: "05/10/2023",
                    remainingKm: 500
                }
            ],
            gearOil: [
                {
                    id: Utils.generateId(),
                    plate: "ABC1234",
                    maintenanceDate: "15/05/2024",
                    nextServiceKm: 50000,
                    entryDate: "15/05/2023",
                    totalMileage: 45000,
                    updateDate: "10/10/2023",
                    remainingKm: 5000
                },
                {
                    id: Utils.generateId(),
                    plate: "XYZ5678",
                    maintenanceDate: "20/06/2024",
                    nextServiceKm: 60000,
                    entryDate: "20/06/2023",
                    totalMileage: 59000,
                    updateDate: "05/10/2023",
                    remainingKm: 1000
                }
            ],
            predictedChange: [
                {
                    id: Utils.generateId(),
                    plate: "ABC1234",
                    plannedMileage: 1000,
                    blackCurrentMileage: 8500,
                    blackNextService: 10000,
                    blackRemainingAfter: 500,
                    blackAlert: "Black Oil Reminder (Low Remain)",
                    gearCurrentMileage: 45000,
                    gearNextService: 50000,
                    gearRemainingAfter: 4000,
                    gearAlert: "Gear Oil Safe"
                }
            ]
        };
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
    
    // 确保数据完整性
    function ensureDataIntegrity() {
        if (!vehicleData.blackOil) vehicleData.blackOil = [];
        if (!vehicleData.gearOil) vehicleData.gearOil = [];
        if (!vehicleData.predictedChange) vehicleData.predictedChange = [];
        
        // 确保所有行都有 ID
        ensureIds();
        
        // 确保数值字段是数字
        convertNumericFields();
    }
    
    // 确保所有行都有 ID
    function ensureIds() {
        Object.keys(vehicleData).forEach(sheetType => {
            vehicleData[sheetType].forEach((row, index) => {
                if (!row.id) {
                    row.id = Utils.generateId();
                }
            });
        });
    }
    
    // 转换数值字段
    function convertNumericFields() {
        const numericFields = {
            blackOil: ['nextServiceKm', 'totalMileage', 'remainingKm'],
            gearOil: ['nextServiceKm', 'totalMileage', 'remainingKm'],
            predictedChange: ['plannedMileage', 'blackCurrentMileage', 'blackNextService', 
                            'blackRemainingAfter', 'gearCurrentMileage', 'gearNextService', 'gearRemainingAfter']
        };
        
        Object.keys(numericFields).forEach(sheetType => {
            if (vehicleData[sheetType]) {
                vehicleData[sheetType].forEach(row => {
                    numericFields[sheetType].forEach(field => {
                        if (row[field] !== undefined && row[field] !== null) {
                            row[field] = parseFloat(row[field]) || 0;
                        }
                    });
                });
            }
        });
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
        
        // 获取所有数据
        getAllData: function() {
            return Utils.deepClone(vehicleData);
        },
        
        // 获取特定类型数据
        getData: function(sheetType) {
            return Utils.deepClone(vehicleData[sheetType] || []);
        },
        
        // 设置数据
        setData: function(sheetType, data) {
            if (vehicleData.hasOwnProperty(sheetType)) {
                vehicleData[sheetType] = Utils.deepClone(data);
                this.save();
                return true;
            }
            return false;
        },
        
        // 获取单行数据
        getRow: function(sheetType, rowIndex) {
            if (vehicleData[sheetType] && vehicleData[sheetType][rowIndex]) {
                return Utils.deepClone(vehicleData[sheetType][rowIndex]);
            }
            return null;
        },
        
        // 更新单行数据
        updateRow: function(sheetType, rowIndex, rowData) {
            if (vehicleData[sheetType] && vehicleData[sheetType][rowIndex]) {
                vehicleData[sheetType][rowIndex] = Utils.deepClone(rowData);
                this.save();
                return true;
            }
            return false;
        },
        
        // 添加新行
        addRow: function(sheetType, rowData) {
            if (vehicleData.hasOwnProperty(sheetType)) {
                rowData.id = rowData.id || Utils.generateId();
                vehicleData[sheetType].push(Utils.deepClone(rowData));
                this.save();
                return vehicleData[sheetType].length - 1;
            }
            return -1;
        },
        
        // 删除行
        deleteRow: function(sheetType, rowIndex) {
            if (vehicleData[sheetType] && vehicleData[sheetType][rowIndex]) {
                vehicleData[sheetType].splice(rowIndex, 1);
                this.save();
                return true;
            }
            return false;
        },
        
        // 根据车牌查找行
        findRowByPlate: function(sheetType, plate) {
            if (!vehicleData[sheetType]) return null;
            
            return vehicleData[sheetType].find(item => item.plate === plate);
        },
        
        // 验证车牌唯一性
        isPlateUnique: function(plate, sheetType, excludeIndex = -1) {
            if (!plate || plate.trim() === "") return true;
            
            const data = vehicleData[sheetType] || [];
            
            for (let i = 0; i < data.length; i++) {
                if (i === excludeIndex) continue;
                
                if (data[i].plate === plate) {
                    return false;
                }
            }
            
            return true;
        },
        
        // 保存数据
        save: function() {
            return saveToLocal();
        },
        
        // 加载数据
        load: async function() {
            return await loadWithStrategy();
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
        
        // 获取数据源信息
        getDataSource: function() {
            return dataSource;
        },
        
        // 获取最后保存时间
        getLastSaveTime: function() {
            return lastSaveTime;
        },
        
        // 启用/禁用自动保存
        setAutoSave: function(enabled) {
            autoSaveEnabled = enabled;
            if (enabled) {
                startAutoSave();
            } else {
                stopAutoSave();
            }
        },
        
        // 获取存储状态
        getStorageStatus: function() {
            const serviceStatus = isDataServiceAvailable() ? 
                DataService.getStatus() : 
                { online: false, error: '服务未加载' };
            
            return {
                strategy: STORAGE_STRATEGY,
                source: dataSource,
                lastSaveTime: lastSaveTime,
                autoSaveEnabled: autoSaveEnabled,
                dataService: serviceStatus
            };
        }
    };
})();