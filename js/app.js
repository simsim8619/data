// ==============================================
// 主应用模块 - 完整版
// ==============================================

const App = (function() {
    // 私有变量
    let currentTab = 'blackOil';
    let isDataLoaded = false;
    let storageStatus = null;
    
    // 显示通知
    function showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // 移除现有通知
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => {
            if (notif.parentNode) {
                notif.parentNode.removeChild(notif);
            }
        });
        
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // 图标映射
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        
        const icon = icons[type] || 'info-circle';
        const bgColors = {
            'success': '#4caf50',
            'error': '#f44336',
            'warning': '#ff9800',
            'info': '#2196f3'
        };
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-${icon}"></i>
                <span>${message}</span>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColors[type] || '#2196f3'};
            color: white;
            padding: 12px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            min-width: 300px;
            max-width: 500px;
        `;
        
        document.body.appendChild(notification);
        
        // 3秒后自动移除
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // 初始化数据
    async function initData() {
        try {
            console.log('开始初始化数据...');
            
            // 初始化数据模型
            await DataModel.init();
            console.log('DataModel 初始化完成');
            
            // 加载数据
            await DataModel.load();
            console.log('数据加载完成');
            
            // 获取存储状态
            storageStatus = DataModel.getStorageStatus();
            
            // 标记数据已加载
            isDataLoaded = true;
            
            // 显示数据来源提示
            const source = DataModel.getDataSource();
            let sourceMsg = '';
            switch (source) {
                case 'google-drive': 
                    sourceMsg = '数据已从 Google Drive 加载';
                    break;
                case 'local': 
                    sourceMsg = '数据已从本地缓存加载';
                    break;
                case 'default': 
                    sourceMsg = '使用默认数据（首次运行）';
                    break;
            }
            
            // 初始化各模块
            if (typeof BlackOil !== 'undefined') {
                BlackOil.init();
                console.log('BlackOil 模块初始化完成');
            }
            
            if (typeof GearOil !== 'undefined') {
                GearOil.init();
                console.log('GearOil 模块初始化完成');
            }
            
            if (typeof Predicted !== 'undefined') {
                Predicted.init();
                console.log('Predicted 模块初始化完成');
            }
            
            // 更新存储状态显示
            updateStorageStatus();
            
            // 显示欢迎消息
            setTimeout(() => {
                showNotification(sourceMsg, 'success');
            }, 1000);
            
            console.log('数据初始化完成');
            return true;
            
        } catch (error) {
            console.error('初始化数据失败:', error);
            showNotification('数据初始化失败: ' + error.message, 'error');
            return false;
        }
    }
    
    // 更新存储状态显示
    function updateStorageStatus() {
        const statusElement = document.getElementById('storageStatus');
        if (!statusElement) return;
        
        if (storageStatus) {
            const lastSave = storageStatus.lastSaveTime ? 
                new Date(storageStatus.lastSaveTime).toLocaleTimeString() : '从未保存';
            
            // 数据来源标识
            let sourceBadge = '';
            switch (storageStatus.source) {
                case 'google-drive':
                    sourceBadge = '<span class="status-badge status-safe"><i class="fab fa-google-drive"></i> 云端</span>';
                    break;
                case 'local':
                    sourceBadge = '<span class="status-badge status-warning"><i class="fas fa-desktop"></i> 本地</span>';
                    break;
                case 'default':
                    sourceBadge = '<span class="status-badge status-danger"><i class="fas fa-database"></i> 默认</span>';
                    break;
            }
            
            const statusHtml = `
                <div style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #666; flex-wrap: wrap;">
                    <div>${sourceBadge}</div>
                    <div><i class="far fa-clock"></i> 最后保存: ${lastSave}</div>
                    <div><i class="fas fa-cog"></i> 策略: ${storageStatus.strategy}</div>
                </div>
            `;
            
            statusElement.innerHTML = statusHtml;
        }
    }
    
    // 登录处理
    async function handleLogin() {
        const passwordInput = document.getElementById('password');
        const errorElement = document.getElementById('loginError');
        
        if (!passwordInput) {
            console.error('密码输入框未找到');
            return;
        }
        
        const password = passwordInput.value;
        console.log('输入的密码:', password);
        console.log('配置的密码:', PASSWORD);
        
        if (password === PASSWORD) {
            console.log('密码正确，开始登录...');
            
            // 显示加载状态
            errorElement.textContent = '';
            errorElement.innerHTML = '<div style="color: green;"><i class="fas fa-spinner fa-spin"></i> 登录中...</div>';
            
            try {
                // 隐藏登录页面
                document.getElementById('loginPage').style.display = 'none';
                
                // 显示主页面
                document.getElementById('mainPage').style.display = 'block';
                
                // 初始化数据
                await initData();
                
                // 显示成功消息
                showNotification('登录成功！', 'success');
                
            } catch (error) {
                console.error('登录过程中出错:', error);
                // 显示错误，退回登录页面
                document.getElementById('loginPage').style.display = 'flex';
                document.getElementById('mainPage').style.display = 'none';
                errorElement.innerHTML = `<div style="color: red;">登录失败: ${error.message}</div>`;
            }
            
        } else {
            console.log('密码错误');
            errorElement.textContent = '密码错误！请重试。';
            // 清空密码框
            passwordInput.value = '';
            passwordInput.focus();
        }
    }
    
    // 创建存储管理界面
    function createStorageManagement() {
        // 添加到头部
        const header = document.querySelector('.header');
        if (header && !document.getElementById('storageStatus')) {
            const statusDiv = document.createElement('div');
            statusDiv.id = 'storageStatus';
            statusDiv.style.flexBasis = '100%';
            statusDiv.style.marginTop = '10px';
            statusDiv.style.paddingTop = '10px';
            statusDiv.style.borderTop = '1px dashed rgba(255,255,255,0.2)';
            header.appendChild(statusDiv);
        }
    }
    
    // 创建 Google Drive 管理按钮
    function createDriveManagement() {
        const headerButtons = document.querySelector('.header-buttons');
        if (headerButtons && !document.getElementById('driveManageBtn') && typeof GoogleDrive !== 'undefined') {
            const driveBtn = document.createElement('button');
            driveBtn.id = 'driveManageBtn';
            driveBtn.className = 'btn btn-primary';
            driveBtn.innerHTML = '<i class="fab fa-google-drive"></i> Drive 管理';
            headerButtons.insertBefore(driveBtn, headerButtons.firstChild);
            
            driveBtn.addEventListener('click', showDriveManagementModal);
        }
    }
    
    // 显示 Google Drive 管理模态框
    function showDriveManagementModal() {
        if (typeof GoogleDrive === 'undefined') {
            showNotification('Google Drive 模块未加载', 'error');
            return;
        }
        
        const status = GoogleDrive.getStatus();
        const instructions = GoogleDrive.getInstructions();
        
        const modalHtml = `
            <div class="modal" id="driveModal">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3><i class="fab fa-google-drive"></i> Google Drive 管理</h3>
                        <button class="close-modal" id="closeDriveModal">&times;</button>
                    </div>
                    <div style="padding: 20px;">
                        <!-- 状态信息 -->
                        <div class="status-info" style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                            <h4><i class="fas fa-info-circle"></i> 当前状态</h4>
                            <p><strong>文件ID：</strong> <code>${status.fileId}</code></p>
                            <p><strong>最后同步：</strong> ${status.lastFetch ? new Date(status.lastFetch).toLocaleString() : '从未同步'}</p>
                            <p><strong>配置状态：</strong> ${status.configured ? '已配置' : '未配置'}</p>
                        </div>
                        
                        <!-- 操作按钮 -->
                        <div class="drive-actions" style="margin-bottom: 20px;">
                            <h4><i class="fas fa-cogs"></i> 操作</h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                                <button id="reloadDriveBtn" class="btn btn-warning">
                                    <i class="fas fa-sync-alt"></i> 重新加载
                                </button>
                                <button id="exportToDriveBtn" class="btn btn-primary">
                                    <i class="fas fa-cloud-upload-alt"></i> 导出到 Drive
                                </button>
                                <button id="openDriveBtn" class="btn btn-info">
                                    <i class="fab fa-google-drive"></i> 打开 Drive
                                </button>
                                <button id="clearDriveCacheBtn" class="btn btn-danger">
                                    <i class="fas fa-trash-alt"></i> 清除缓存
                                </button>
                            </div>
                        </div>
                        
                        <!-- 使用说明 -->
                        <div class="drive-instructions" style="background: #e8f4fd; padding: 15px; border-radius: 5px; border-left: 4px solid #2196f3;">
                            ${instructions}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 创建并显示模态框
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        const modal = document.getElementById('driveModal');
        modal.style.display = 'flex';
        
        // 绑定事件
        setupDriveModalEvents();
    }
    
    // 设置 Drive 模态框事件
    function setupDriveModalEvents() {
        // 关闭按钮
        document.getElementById('closeDriveModal').addEventListener('click', function() {
            document.getElementById('driveModal').style.display = 'none';
            setTimeout(() => {
                const modal = document.getElementById('driveModal');
                if (modal && modal.parentNode) {
                    modal.parentNode.remove();
                }
            }, 300);
        });
        
        // 点击外部关闭
        document.getElementById('driveModal').addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
                setTimeout(() => {
                    if (this.parentNode) {
                        this.parentNode.remove();
                    }
                }, 300);
            }
        });
        
        // 重新加载按钮
        document.getElementById('reloadDriveBtn').addEventListener('click', async function() {
            const btn = this;
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 加载中...';
            btn.disabled = true;
            
            try {
                await DataModel.reloadFromDrive();
                
                // 重新渲染表格
                if (typeof BlackOil !== 'undefined') BlackOil.renderTable();
                if (typeof GearOil !== 'undefined') GearOil.renderTable();
                if (typeof Predicted !== 'undefined') Predicted.renderTable();
                
                // 更新状态
                storageStatus = DataModel.getStorageStatus();
                updateStorageStatus();
                
                showNotification('已从 Google Drive 重新加载数据', 'success');
                
            } catch (error) {
                showNotification('重新加载失败: ' + error.message, 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
        
        // 导出到 Drive 按钮
        document.getElementById('exportToDriveBtn').addEventListener('click', function() {
            try {
                DataModel.exportData();
                showNotification('数据导出成功，请上传到 Google Drive', 'success');
            } catch (error) {
                showNotification('导出失败: ' + error.message, 'error');
            }
        });
        
        // 打开 Drive 按钮
        document.getElementById('openDriveBtn').addEventListener('click', function() {
            if (typeof GoogleDrive !== 'undefined') {
                GoogleDrive.openDrive();
            }
        });
        
        // 清除缓存按钮
        document.getElementById('clearDriveCacheBtn').addEventListener('click', function() {
            if (typeof GoogleDrive !== 'undefined') {
                GoogleDrive.clearCache();
                showNotification('Google Drive 缓存已清除', 'warning');
            }
        });
    }
    
    // 设置事件监听器
    function setupEventListeners() {
        console.log('正在设置事件监听器...');
        
        // 登录按钮
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            console.log('找到登录按钮');
            loginBtn.addEventListener('click', handleLogin);
        } else {
            console.error('未找到登录按钮！');
        }
        
        // 回车登录
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            console.log('找到密码输入框');
            passwordInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    console.log('按下了回车键');
                    handleLogin();
                }
            });
        }
        
        // 退出登录按钮
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                document.getElementById('mainPage').style.display = 'none';
                document.getElementById('loginPage').style.display = 'flex';
                document.getElementById('password').value = '';
                document.getElementById('loginError').textContent = '';
                isDataLoaded = false;
                showNotification('已退出登录', 'info');
            });
        }
        
        // 标签页切换
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', function() {
                const tabName = this.getAttribute('data-tab');
                console.log('切换到标签页:', tabName);
                
                // 更新当前标签
                currentTab = tabName;
                
                // 更新标签样式
                document.querySelectorAll('.tab').forEach(t => {
                    t.classList.remove('active');
                });
                
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                this.classList.add('active');
                document.getElementById(tabName).classList.add('active');
            });
        });
        
        // 手动检查预警按钮
        const manualCheckBtn = document.getElementById('manualCheckBtn');
        if (manualCheckBtn) {
            manualCheckBtn.addEventListener('click', function() {
                // 这里可以添加实际的预警检查逻辑
                if (typeof Alerts !== 'undefined') {
                    Alerts.showAlertModal();
                } else {
                    showNotification('预警检查功能未加载', 'warning');
                }
            });
        }
        
        // 保存数据按钮
        const saveDataBtn = document.getElementById('saveDataBtn');
        if (saveDataBtn) {
            saveDataBtn.addEventListener('click', function() {
                if (DataModel && DataModel.save) {
                    DataModel.save();
                    storageStatus = DataModel.getStorageStatus();
                    updateStorageStatus();
                    showNotification('数据保存成功！', 'success');
                } else {
                    showNotification('数据保存失败！', 'error');
                }
            });
        }
        
        // 添加新行按钮
        document.getElementById('addBlackOilRow')?.addEventListener('click', function() {
            if (typeof BlackOil !== 'undefined') {
                BlackOil.addNewRow();
            }
        });
        
        document.getElementById('addGearOilRow')?.addEventListener('click', function() {
            if (typeof GearOil !== 'undefined') {
                GearOil.addNewRow();
            }
        });
        
        document.getElementById('addPredictedRow')?.addEventListener('click', function() {
            if (typeof Predicted !== 'undefined') {
                Predicted.addNewRow();
            }
        });
        
        // 重新计算按钮
        document.getElementById('recalculateBlackOil')?.addEventListener('click', function() {
            if (typeof DataModel !== 'undefined') {
                DataModel.recalculateSheet('blackOil');
                if (typeof BlackOil !== 'undefined') {
                    BlackOil.renderTable();
                }
                showNotification('黑油表重新计算完成！', 'success');
            }
        });
        
        document.getElementById('recalculateGearOil')?.addEventListener('click', function() {
            if (typeof DataModel !== 'undefined') {
                DataModel.recalculateSheet('gearOil');
                if (typeof GearOil !== 'undefined') {
                    GearOil.renderTable();
                }
                showNotification('齿轮油表重新计算完成！', 'success');
            }
        });
        
        document.getElementById('recalculatePredicted')?.addEventListener('click', function() {
            if (typeof DataModel !== 'undefined') {
                DataModel.recalculateSheet('predictedChange');
                if (typeof Predicted !== 'undefined') {
                    Predicted.renderTable();
                }
                showNotification('预判表重新计算完成！', 'success');
            }
        });
        
        // 创建存储管理界面
        createStorageManagement();
        
        // 创建 Google Drive 管理
        createDriveManagement();
        
        console.log('事件监听器设置完成');
    }
    
    // 初始化应用
    function init() {
        console.log('App 初始化开始...');
        
        // 确保登录页面显示，主页面隐藏
        const loginPage = document.getElementById('loginPage');
        const mainPage = document.getElementById('mainPage');
        
        if (loginPage) loginPage.style.display = 'flex';
        if (mainPage) mainPage.style.display = 'none';
        
        // 设置默认密码提示
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.placeholder = `默认密码: ${PASSWORD}`;
        }
        
        // 设置事件监听器
        setupEventListeners();
        
        console.log('App 初始化完成');
    }
    
    // 公开方法
    return {
        // 初始化应用
        init: init,
        
        // 获取当前标签
        getCurrentTab: function() {
            return currentTab;
        },
        
        // 检查数据是否已加载
        isDataLoaded: function() {
            return isDataLoaded;
        },
        
        // 显示通知
        showNotification: showNotification
    };
})();

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM 加载完成，开始初始化 App...');
    App.init();
});

// 如果 DOMContentLoaded 已经触发，直接初始化
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => {
        console.log('文档已准备就绪，初始化 App...');
        App.init();
    }, 1);
}

// 添加 CSS 动画样式
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .loading-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
        }
    `;
    document.head.appendChild(style);
}