// ==============================================
// 黑油管理模块
// ==============================================

const BlackOil = (function() {
    // 私有方法
    
    // 计算黑油表单行数据
    function calculateRow(rowIndex) {
        const row = DataModel.getRow('blackOil', rowIndex);
        if (!row) return;
        
        // 计算剩余里程 G = C - E
        if (row.nextServiceKm !== undefined && row.totalMileage !== undefined) {
            row.remainingKm = row.nextServiceKm - row.totalMileage;
        } else {
            row.remainingKm = 0;
        }
        
        // 检查数据限制 C-E≥-2000
        if (row.remainingKm < BLACK_OIL_MIN_DIFF) {
            row.remainingKm = BLACK_OIL_MIN_DIFF;
        }
        
        // 更新数据模型
        DataModel.updateRow('blackOil', rowIndex, row);
    }
    
    // 处理字段变化逻辑
    function handleFieldChange(field, rowIndex, newValue, oldValue) {
        const row = DataModel.getRow('blackOil', rowIndex);
        if (!row) return false;
        
        // C列（下次保养公里数）变化
        if (field === 'nextServiceKm') {
            // 自动填充D列（录入日期）为当前日期
            row.entryDate = Utils.getCurrentDate();
            
            // 自动计算B列（维保到期日期）= D列 + 1年
            row.maintenanceDate = Utils.addOneYear(row.entryDate);
            
            // 检查C-E≥-2000限制
            if (row.totalMileage !== undefined) {
                const diff = newValue - row.totalMileage;
                if (diff < BLACK_OIL_MIN_DIFF) {
                    Utils.showError(`C-E差异不能小于 ${BLACK_OIL_MIN_DIFF}！请调整。`);
                    return false;
                }
            }
        }
        
        // E列（总里程）变化
        if (field === 'totalMileage') {
            // 自动填充F列（总里程更新日期）为当前日期
            row.updateDate = Utils.getCurrentDate();
            
            // 检查C-E≥-2000限制
            if (row.nextServiceKm !== undefined) {
                const diff = row.nextServiceKm - newValue;
                if (diff < BLACK_OIL_MIN_DIFF) {
                    Utils.showError(`C-E差异不能小于 ${BLACK_OIL_MIN_DIFF}！请调整。`);
                    return false;
                }
            }
            
            // 如果新值小于旧值，需要确认
            if (newValue < oldValue) {
                const confirmed = Utils.showConfirm(`减少总里程从 ${oldValue} 到 ${newValue}？确认继续？`);
                if (!confirmed) {
                    return false;
                }
            }
            
            // 同步到齿轮油表（排除指定车牌）
            if (!EXCLUDE_PLATES.includes(row.plate)) {
                GearOil.syncFromBlackOil(row.plate, newValue);
            }
        }
        
        // D列（录入日期）变化
        if (field === 'entryDate' && newValue !== '') {
            // 自动计算B列（维保到期日期）= D列 + 1年
            row.maintenanceDate = Utils.addOneYear(newValue);
        }
        
        // 更新数据
        DataModel.updateRow('blackOil', rowIndex, row);
        return true;
    }
    
    // 获取行颜色类
    function getRowColorClass(row) {
        // 首先检查维保日期是否过期
        if (row.maintenanceDate) {
            const maintenanceDate = Utils.parseDate(row.maintenanceDate);
            if (maintenanceDate && maintenanceDate <= new Date()) {
                return 'row-red'; // 维保过期，强制红色
            }
        }
        
        // 检查是否超过3天未更新
        if (row.updateDate) {
            const daysSinceUpdate = Utils.dateDiffInDays(row.updateDate, Utils.getCurrentDate());
            if (daysSinceUpdate > UPDATE_WARNING_DAYS) {
                return 'row-cyan'; // 超3天未更新，青色
            }
        }
        
        // 基于剩余里程判断颜色
        const remaining = row.remainingKm || 0;
        
        if (remaining <= BLACK_OIL_RED_THRESHOLD) return 'row-red';
        if (remaining <= BLACK_OIL_YELLOW_THRESHOLD) return 'row-yellow';
        
        return ''; // 默认白色
    }
    
    // 获取状态文本
    function getStatusText(row) {
        const remaining = row.remainingKm || 0;
        
        if (remaining <= BLACK_OIL_RED_THRESHOLD) return '需更换';
        if (remaining <= BLACK_OIL_YELLOW_THRESHOLD) return '需关注';
        return '正常';
    }
    
    // 渲染表格
    function renderTable() {
        const tableBody = document.getElementById('blackOilTableBody');
        if (!tableBody) return;
        
        const data = DataModel.getData('blackOil');
        let html = '';
        
        data.forEach((row, index) => {
            const rowClass = getRowColorClass(row);
            const statusText = getStatusText(row);
            
            html += `<tr class="${rowClass}" data-index="${index}">`;
            
            // 车牌
            html += `<td class="editable-cell"><input type="text" value="${row.plate || ''}" data-field="plate" data-sheet="blackOil" data-row="${index}"></td>`;
            
            // 维保到期日期
            html += `<td class="editable-cell"><input type="text" value="${row.maintenanceDate || ''}" data-field="maintenanceDate" data-sheet="blackOil" data-row="${index}" placeholder="dd/mm/yyyy"></td>`;
            
            // 下次保养公里数
            html += `<td class="editable-cell"><input type="number" value="${row.nextServiceKm || ''}" data-field="nextServiceKm" data-sheet="blackOil" data-row="${index}" min="0"></td>`;
            
            // 录入日期
            html += `<td class="editable-cell"><input type="text" value="${row.entryDate || ''}" data-field="entryDate" data-sheet="blackOil" data-row="${index}" placeholder="dd/mm/yyyy"></td>`;
            
            // 总里程
            html += `<td class="editable-cell"><input type="number" value="${row.totalMileage || ''}" data-field="totalMileage" data-sheet="blackOil" data-row="${index}" min="0"></td>`;
            
            // 总里程更新日期
            html += `<td class="editable-cell"><input type="text" value="${row.updateDate || ''}" data-field="updateDate" data-sheet="blackOil" data-row="${index}" placeholder="dd/mm/yyyy"></td>`;
            
            // 剩余里程（只读）
            html += `<td>${row.remainingKm || 0}</td>`;
            
            // 状态
            let statusClass = 'status-safe';
            if (statusText === '需更换') statusClass = 'status-danger';
            else if (statusText === '需关注') statusClass = 'status-warning';
            
            html += `<td><span class="status-badge ${statusClass}">${statusText}</span></td>`;
            
            html += '</tr>';
        });
        
        tableBody.innerHTML = html;
        
        // 添加事件监听器
        attachEventListeners();
    }
    
    // 添加事件监听器
    function attachEventListeners() {
        // 输入框变化事件
        const inputs = document.querySelectorAll('input[data-sheet="blackOil"]');
        inputs.forEach(input => {
            // 移除现有事件监听器
            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);
            
            // 添加新的事件监听器
            newInput.addEventListener('change', handleCellChange);
            newInput.addEventListener('blur', handleCellChange);
        });
    }
    
    // 处理单元格变化
    function handleCellChange(event) {
        const input = event.target;
        const field = input.getAttribute('data-field');
        const rowIndex = parseInt(input.getAttribute('data-row'));
        
        let value = input.value.trim();
        const oldRow = DataModel.getRow('blackOil', rowIndex);
        const oldValue = oldRow ? oldRow[field] : '';
        
        // 字段验证
        let isValid = true;
        
        // 车牌验证
        if (field === 'plate') {
            if (value === '') {
                Utils.showError('车牌不能为空！');
                isValid = false;
            } else if (!DataModel.isPlateUnique(value, 'blackOil', rowIndex)) {
                Utils.showError('车牌重复！请输入唯一值。');
                isValid = false;
            }
        }
        
        // 数字字段验证
        if ((field === 'nextServiceKm' || field === 'totalMileage') && value !== '') {
            isValid = Utils.validatePositiveNumber(value, field === 'nextServiceKm' ? '下次保养公里数' : '总里程');
            if (isValid) {
                value = parseFloat(value);
            }
        }
        
        // 日期字段验证
        if ((field === 'maintenanceDate' || field === 'entryDate' || field === 'updateDate') && value !== '') {
            isValid = Utils.validateDateFormat(value);
        }
        
        // 如果不通过验证，恢复旧值
        if (!isValid) {
            input.value = oldValue || '';
            return;
        }
        
        // 更新数据模型
        const row = DataModel.getRow('blackOil', rowIndex);
        if (row) {
            row[field] = value;
            DataModel.updateRow('blackOil', rowIndex, row);
            
            // 处理字段变化逻辑
            const success = handleFieldChange(field, rowIndex, value, oldValue);
            
            if (success) {
                // 重新计算该行
                calculateRow(rowIndex);
                
                // 重新渲染表格
                renderTable();
                
                // 更新预警信息
                Alerts.updateAlertBox();
                
                // 重新计算预判表
                Predicted.recalculateForPlate(row.plate);
                
                // 保存数据
                DataModel.saveLocal();
            } else {
                // 恢复原值
                input.value = oldValue;
            }
        }
    }
    
    // 公开方法
    return {
        // 初始化
        init: function() {
            renderTable();
        },
        
        // 重新计算所有行
        recalculateAll: function() {
            const data = DataModel.getData('blackOil');
            data.forEach((row, index) => {
                calculateRow(index);
            });
            renderTable();
            DataModel.saveToLocal();
        },
        
        // 添加新行
        addNewRow: function() {
            const newRow = {
                plate: '',
                maintenanceDate: '',
                nextServiceKm: '',
                entryDate: '',
                totalMileage: '',
                updateDate: '',
                remainingKm: 0
            };
            
            DataModel.addRow('blackOil', newRow);
            renderTable();
            DataModel.saveToLocal();
        },
        
        // 渲染表格
        renderTable: renderTable,
        
        // 根据车牌获取数据
        getDataByPlate: function(plate) {
            return DataModel.findRowByPlate('blackOil', plate);
        },
        
        // 获取所有数据
        getAllData: function() {
            return DataModel.getData('blackOil');
        }
    };
})();