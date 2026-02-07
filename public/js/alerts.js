// ==============================================
// 预警管理模块
// ==============================================

const Alerts = (function() {
    // 私有方法
    function checkBlackOilAlerts() {
        const alerts = {
            change: [],  // 更换预警（红/黄）
            update: []   // 更新预警（超3天未更新）
        };
        
        const blackOilData = DataModel.getData('blackOil');
        
        blackOilData.forEach(row => {
            const remaining = row.remainingKm || 0;
            
            // 检查更换预警
            if (remaining <= BLACK_OIL_YELLOW_THRESHOLD) {
                const alertType = remaining <= BLACK_OIL_RED_THRESHOLD ? '红' : '黄';
                alerts.change.push({
                    plate: row.plate,
                    remaining: remaining,
                    type: alertType,
                    maintenanceDate: row.maintenanceDate
                });
            }
            
            // 检查更新预警（超3天未更新）
            if (row.updateDate) {
                const daysSinceUpdate = Utils.dateDiffInDays(row.updateDate, Utils.getCurrentDate());
                if (daysSinceUpdate > UPDATE_WARNING_DAYS) {
                    alerts.update.push({
                        plate: row.plate,
                        lastUpdate: row.updateDate,
                        days: daysSinceUpdate
                    });
                }
            }
            
            // 检查维保过期预警
            if (row.maintenanceDate) {
                const maintenanceDate = Utils.parseDate(row.maintenanceDate);
                if (maintenanceDate && maintenanceDate <= new Date()) {
                    alerts.change.push({
                        plate: row.plate,
                        remaining: remaining,
                        type: '红',
                        maintenanceDate: row.maintenanceDate,
                        isExpired: true
                    });
                }
            }
        });
        
        return alerts;
    }
    
    function checkGearOilAlerts() {
        const alerts = {
            change: [],  // 更换预警（红/黄）
            update: []   // 更新预警（超3天未更新）
        };
        
        const gearOilData = DataModel.getData('gearOil');
        
        gearOilData.forEach(row => {
            const remaining = row.remainingKm || 0;
            
            // 检查更换预警
            if (remaining <= GEAR_OIL_YELLOW_THRESHOLD) {
                const alertType = remaining <= GEAR_OIL_RED_THRESHOLD ? '红' : '黄';
                alerts.change.push({
                    plate: row.plate,
                    remaining: remaining,
                    type: alertType,
                    maintenanceDate: row.maintenanceDate
                });
            }
            
            // 检查更新预警（超3天未更新）
            if (row.updateDate) {
                const daysSinceUpdate = Utils.dateDiffInDays(row.updateDate, Utils.getCurrentDate());
                if (daysSinceUpdate > UPDATE_WARNING_DAYS) {
                    alerts.update.push({
                        plate: row.plate,
                        lastUpdate: row.updateDate,
                        days: daysSinceUpdate
                    });
                }
            }
            
            // 检查维保过期预警
            if (row.maintenanceDate) {
                const maintenanceDate = Utils.parseDate(row.maintenanceDate);
                if (maintenanceDate && maintenanceDate <= new Date()) {
                    alerts.change.push({
                        plate: row.plate,
                        remaining: remaining,
                        type: '红',
                        maintenanceDate: row.maintenanceDate,
                        isExpired: true
                    });
                }
            }
        });
        
        return alerts;
    }
    
    function generateAlertHTML(alerts) {
        let html = '';
        let hasAlerts = false;
        
        // 黑油更换预警
        if (alerts.blackOil.change.length > 0) {
            hasAlerts = true;
            html += '<h4>=== BLACK OIL CHANGE ALERT ===</h4><ul class="alert-list">';
            alerts.blackOil.change.forEach(alert => {
                const alertText = alert.isExpired ? 
                    `维保已过期 (${alert.maintenanceDate})` : 
                    `剩余里程: ${alert.remaining}`;
                
                html += `<li><span class="status-badge status-${alert.type === '红' ? 'danger' : 'warning'}">${alert.type}色预警</span> 车牌: ${alert.plate} | ${alertText} | 黑油即将到期</li>`;
            });
            html += '</ul>';
        }
        
        // 黑油更新预警
        if (alerts.blackOil.update.length > 0) {
            hasAlerts = true;
            html += '<h4>=== BLACK OIL UPDATE ALERT ===</h4><ul class="alert-list">';
            alerts.blackOil.update.forEach(alert => {
                html += `<li>车牌: ${alert.plate} | 最后更新: ${alert.lastUpdate} | 已超 ${alert.days} 天未更新消耗数据</li>`;
            });
            html += '</ul>';
        }
        
        // 齿轮油更换预警
        if (alerts.gearOil.change.length > 0) {
            hasAlerts = true;
            html += '<h4>=== GEAR OIL CHANGE ALERT ===</h4><ul class="alert-list">';
            alerts.gearOil.change.forEach(alert => {
                const alertText = alert.isExpired ? 
                    `维保已过期 (${alert.maintenanceDate})` : 
                    `剩余里程: ${alert.remaining}`;
                
                html += `<li><span class="status-badge status-${alert.type === '红' ? 'danger' : 'warning'}">${alert.type}色预警</span> 车牌: ${alert.plate} | ${alertText} | 齿轮油即将到期</li>`;
            });
            html += '</ul>';
        }
        
        // 齿轮油更新预警
        if (alerts.gearOil.update.length > 0) {
            hasAlerts = true;
            html += '<h4>=== GEAR OIL UPDATE ALERT ===</h4><ul class="alert-list">';
            alerts.gearOil.update.forEach(alert => {
                html += `<li>车牌: ${alert.plate} | 最后更新: ${alert.lastUpdate} | 已超 ${alert.days} 天未更新消耗数据</li>`;
            });
            html += '</ul>';
        }
        
        if (!hasAlerts) {
            html = '<p style="text-align:center; color:green; padding:20px;"><i class="fas fa-check-circle"></i> 目前没有预警信息，一切正常！</p>';
        }
        
        return { html, hasAlerts };
    }
    
    // 公开方法
    return {
        // 检查所有预警
        checkAllAlerts: function() {
            const blackOilAlerts = checkBlackOilAlerts();
            const gearOilAlerts = checkGearOilAlerts();
            
            return {
                blackOil: blackOilAlerts,
                gearOil: gearOilAlerts
            };
        },
        
        // 生成预警消息HTML
        generateAlertMessage: function(alerts) {
            return generateAlertHTML(alerts);
        },
        
        // 获取预警数量
        getAlertCount: function(alerts) {
            let count = 0;
            
            if (alerts.blackOil) {
                count += alerts.blackOil.change.length + alerts.blackOil.update.length;
            }
            
            if (alerts.gearOil) {
                count += alerts.gearOil.change.length + alerts.gearOil.update.length;
            }
            
            return count;
        },
        
        // 显示预警弹窗
        showAlertModal: function() {
            const alerts = this.checkAllAlerts();
            const { html } = generateAlertHTML(alerts);
            
            document.getElementById('alertModalContent').innerHTML = html;
            document.getElementById('alertModal').style.display = 'flex';
        },
        
        // 更新页面预警栏
        updateAlertBox: function() {
            const alerts = this.checkAllAlerts();
            const { html, hasAlerts } = generateAlertHTML(alerts);
            
            const alertBox = document.getElementById('alertBox');
            if (hasAlerts) {
                alertBox.style.display = 'block';
                document.getElementById('alertContent').innerHTML = html;
            } else {
                alertBox.style.display = 'none';
            }
        }
    };
})();