// ==============================================
// 数据服务模块 - Vercel 部署版
// ==============================================

window.DataService = (function() {
    // 私有变量
    let remoteData = null;
    let lastFetchTime = null;
    let isOnline = true;
    
    // 从远程加载数据
    async function loadFromRemote() {
        if (!DATA_URL) {
            throw new Error('未配置数据文件 URL');
        }
        
        try {
            console.log('从远程加载数据:', DATA_URL);
            
            const response = await fetch(DATA_URL + '?t=' + Date.now(), {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            remoteData = data;
            lastFetchTime = Date.now();
            isOnline = true;
            
            console.log('远程数据加载成功');
            return data;
            
        } catch (error) {
            console.error('远程数据加载失败:', error);
            isOnline = false;
            throw error;
        }
    }
    
    // 检查网络状态
    async function checkNetwork() {
        try {
            const response = await fetch(DATA_URL, { 
                method: 'HEAD',
                cache: 'no-cache'
            });
            isOnline = response.ok;
            return isOnline;
        } catch (error) {
            isOnline = false;
            return false;
        }
    }
    
    // 导出数据（供下载）
    function exportData(data, filename = 'vehicle-data.json') {
        try {
            const jsonStr = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('数据导出成功:', filename);
            return true;
        } catch (error) {
            console.error('导出失败:', error);
            return false;
        }
    }
    
    // 导入数据（从文件）
    function importFromFile() {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,application/json';
            input.style.cssText = 'position:fixed;top:-100px;';
            
            input.onchange = function(event) {
                const file = event.target.files[0];
                if (!file) {
                    reject(new Error('未选择文件'));
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const data = JSON.parse(e.target.result);
                        resolve(data);
                    } catch (error) {
                        reject(new Error('文件格式错误'));
                    }
                };
                
                reader.onerror = function() {
                    reject(new Error('读取文件失败'));
                };
                
                reader.readAsText(file);
            };
            
            input.oncancel = function() {
                reject(new Error('用户取消'));
            };
            
            document.body.appendChild(input);
            input.click();
            
            // 自动清理
            setTimeout(() => {
                if (input.parentNode) {
                    input.parentNode.removeChild(input);
                }
            }, 1000);
        });
    }
    
    // 备份数据到本地
    function backupToLocal(data) {
        try {
            localStorage.setItem('vehicleData_backup_' + Date.now(), JSON.stringify(data));
            localStorage.setItem('vehicleData_latest_backup', Date.now().toString());
            console.log('数据备份到本地成功');
            return true;
        } catch (error) {
            console.error('本地备份失败:', error);
            return false;
        }
    }
    
    // 从本地备份恢复
    function restoreFromLocal() {
        try {
            const backupKey = localStorage.getItem('vehicleData_latest_backup');
            if (!backupKey) {
                throw new Error('没有找到备份');
            }
            
            const backupData = localStorage.getItem('vehicleData_backup_' + backupKey);
            if (!backupData) {
                throw new Error('备份数据损坏');
            }
            
            return JSON.parse(backupData);
        } catch (error) {
            console.error('恢复备份失败:', error);
            return null;
        }
    }
    
    // 公开方法
    return {
        // 初始化
        init: async function() {
            console.log('数据服务初始化');
            await checkNetwork();
            return true;
        },
        
        // 加载数据
        load: async function() {
            return await loadFromRemote();
        },
        
        // 导出数据
        exportData: function(data) {
            return exportData(data);
        },
        
        // 导入数据
        importData: function() {
            return importFromFile();
        },
        
        // 备份数据
        backup: function(data) {
            return backupToLocal(data);
        },
        
        // 恢复数据
        restore: function() {
            return restoreFromLocal();
        },
        
        // 获取状态
        getStatus: function() {
            return {
                online: isOnline,
                lastFetch: lastFetchTime,
                dataUrl: DATA_URL,
                hasRemoteData: !!remoteData
            };
        },
        
        // 获取使用说明
        getInstructions: function() {
            return `
                <h4>Vercel 数据管理说明</h4>
                <p><strong>数据存储位置：</strong></p>
                <ul>
                    <li>初始数据：<code>${DATA_URL}</code>（只读）</li>
                    <li>编辑数据：浏览器本地存储</li>
                    <li>备份数据：可导出为 JSON 文件</li>
                </ul>
                
                <p><strong>工作流程：</strong></p>
                <ol>
                    <li>系统从 Vercel 加载初始数据</li>
                    <li>所有编辑保存在浏览器本地</li>
                    <li>需要更新初始数据时导出文件</li>
                    <li>手动替换 Vercel 上的 data.json 文件</li>
                </ol>
                
                <p><strong>注意：</strong>多人使用时需要协调数据更新</p>
            `;
        },
        
        // 检查更新
        checkForUpdates: async function() {
            try {
                const response = await fetch(DATA_URL + '?check=' + Date.now(), {
                    method: 'HEAD',
                    cache: 'no-cache'
                });
                
                if (response.ok) {
                    const lastModified = response.headers.get('last-modified');
                    return {
                        available: true,
                        lastModified: lastModified,
                        current: lastFetchTime
                    };
                }
                return { available: false };
            } catch (error) {
                return { available: false, error: error.message };
            }
        }
    };
})();