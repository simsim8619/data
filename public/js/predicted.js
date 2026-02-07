// ==============================================
// 计划预判管理模块
// ==============================================

const Predicted = (function() {
    // 私有方法
    
    // 计算预判表单行数据
    function calculateRow(rowIndex) {
        const row = DataModel.getRow('predictedChange', rowIndex);
        if (!row) return;
        
        // 查找黑油数据
        const blackOilRow = BlackOil.getDataByPlate(row.plate);
        if (blackOilRow) {
            row.blackCurrentMileage = blackOilRow.totalMileage || 0;
            row.blackNextService = blackOilRow.nextServiceKm || 0;
            
            // 计算黑油原剩余里程和计划后剩余里程
            const blackOriginalRemaining = (row.blackNextService || 0) - (row.blackCurrentMileage || 0);
            row.blackRemainingAfter = blackOriginalRemaining - (row.plannedMileage || 0);
            
            // 生成黑油预警
            if (row.blackRemainingAfter <= PREDICTED_RED_THRESHOLD) {
                row.blackAlert = "Need Black Oil Change (Overdue)";
            } else if (row.blackRemainingAfter <= PREDICTED_YELLOW_THRESHOLD) {
                row.blackAlert = "Black Oil Reminder (Low Remain)";
            } else {
                row.blackAlert = "Black Oil Safe";
            }
        } else {
            row.blackCurrentMileage = 0;
            row.blackNextService = 0;
            row.blackRemainingAfter = 0;
            row.blackAlert = "车牌未找到";
        }
        
        // 查找齿轮油数据
        const gearOilRow = GearOil.getDataByPlate(row.plate);
        if (gearOilRow) {
            row.gearCurrentMileage = gearOilRow.totalMileage || 0;
            row.gearNextService = gearOilRow.nextServiceKm || 0;
            
            // 计算齿轮油原剩余里程和计划后剩余里程
            const gearOriginalRemaining = (row.gearNextService || 0) - (row.gearCurrentMileage || 0);
            row.gearRemainingAfter = gearOriginalRemaining - (row.plannedMileage || 0);
            
            // 生成齿轮油预警
            if (row.gearRemainingAfter <= PREDICTED_RED_THRESHOLD) {
                row.gearAlert = "Need Gear Oil Change (Overdue)";
            } else if (row.gearRemainingAfter <= PREDICTED_YELLOW_THRESHOLD) {
                row.gearAlert = "Gear Oil Reminder (Low Remain)";
            } else {
                row.gearAlert = "Gear Oil Safe";
            }
        } else {
            row.gearCurrentMileage = 0;
            row.gearNextService = 0;
            row.gearRemainingAfter = 0;
            row.gearAlert = "车牌未找到";
        }
        
        // 更新数据模型
        DataModel.updateRow('predictedChange', rowIndex, row);
    }
    
    // 渲染表格
    function renderTable() {
        const tableBody = document.getElementById('predictedTableBody');
        if (!tableBody) return;
        
        const data = DataModel.getData('predictedChange');
        let html = '';
        
        data.forEach((row, index) => {
            // 确定黑油预警样式
            let blackAlertClass = '';
            let blackAlertText = row.blackAlert || '';
            
            if (blackAlertText.includes('Overdue')) {
                blackAlertClass = 'status-danger';
            } else if (blackAlertText.includes('Reminder')) {
                blackAlertClass = 'status-warning';
            } else {
                blackAlertClass = 'status-safe';
            }
            
            // 确定齿轮油预警样式
            let gearAlertClass = '';
            let gearAlertText = row.gearAlert || '';
            
            if (gearAlertText.includes('Overdue')) {
                gearAlertClass = 'status-danger';
            } else if (gearAlertText.includes('Reminder')) {
                gearAlertClass = 'status-warning';
            } else {
                gearAlertClass = 'status-safe';
            }
            
            html += `<tr data-index="${index}">`;
            
            // 车牌
            html += `<td class="editable-cell"><input type="text" value="${row.plate || ''}" data-field="plate" data-sheet="predictedChange" data-row="${index}"></td>`;
            
            // 计划行驶里程
            html += `<td class="editable-cell"><input type="number" value="${row.plannedMileage || ''}" data-field="plannedMileage" data-sheet="predictedChange" data-row="${index}" min="0"></td>`;
            
            // 黑油当前总里程（只读）
            html += `<td>${row.blackCurrentMileage || 0}</td>`;
            
            // 黑油下次保养公里数（只读）
            html += `<td>${row.blackNextService || 0}</td>`;
            
            // 黑油计划后剩余里程（只读）
            html += `<td>${row.blackRemainingAfter || 0}</td>`;
            
            // 黑油预警（只读）
            html += `<td><span class="status-badge ${blackAlertClass}">${blackAlertText}</span></td>`;
            
            // 齿轮油当前总里程（只读）
            html += `<td>${row.gearCurrentMileage || 0}</td>`;
            
            // 齿轮油下次保养公里数（只读）
            html += `<td>${row.gearNextService || 0}</td>`;
            
            // 齿轮油计划后剩余里程（只读）
            html += `<td>${row.gearRemainingAfter || 0}</td>`;
            
            // 齿轮油预警（只读）
            html += `<td><span class="status-badge ${gearAlertClass}">${gearAlertText}</span></td>`;
            
            html += '</tr>';
        });
        
        tableBody.innerHTML = html;
        
        // 添加事件监听器
        attachEventListeners();
    }
    
    // 添加事件监听器
    function attachEventListeners() {
        // 输入框变化事件
        const inputs = document.querySelectorAll('input[data-sheet="predictedChange"]');
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
        const oldRow = DataModel.getRow('predictedChange', rowIndex);
        const oldValue = oldRow ? oldRow[field] : '';
        
        // 字段验证
        let isValid = true;
        
        // 车牌验证
        if (field === 'plate') {
            if (value === '') {
                Utils.showError('车牌不能为空！');
                isValid = false;
            }
        }
        
        // 计划里程验证
        if (field === 'plannedMileage' && value !== '') {
            isValid = Utils.validatePositiveNumber(value, '计划行驶里程');
            if (isValid) {
                value = parseFloat(value);
            }
        }
        
        // 如果不通过验证，恢复旧值
        if (!isValid) {
            input.value = oldValue || '';
            return;
        }
        
        // 更新数据模型
        const row = DataModel.getRow('predictedChange', rowIndex);
        if (row) {
            row[field] = value;
            DataModel.updateRow('predictedChange', rowIndex, row);
            
            // 重新计算该行
            calculateRow(rowIndex);
            
            // 重新渲染表格
            renderTable();
            
            // 保存数据
            DataModel.saveToLocal();
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
            const data = DataModel.getData('predictedChange');
            data.forEach((row, index) => {
                calculateRow(index);
            });
            renderTable();
            DataModel.saveToLocal();
        },
        
        // 重新计算指定车牌的行
        recalculateForPlate: function(plate) {
            const data = DataModel.getData('predictedChange');
            data.forEach((row, index) => {
                if (row.plate === plate) {
                    calculateRow(index);
                }
            });
            renderTable();
        },
        
        // 添加新行
        addNewRow: function() {
            const newRow = {
                plate: '',
                plannedMileage: '',
                blackCurrentMileage: 0,
                blackNextService: 0,
                blackRemainingAfter: 0,
                blackAlert: '',
                gearCurrentMileage: 0,
                gearNextService: 0,
                gearRemainingAfter: 0,
                gearAlert: ''
            };
            
            DataModel.addRow('predictedChange', newRow);
            renderTable();
            DataModel.saveToLocal();
        },
        
        // 渲染表格
        renderTable: renderTable,
        
        // 获取所有数据
        getAllData: function() {
            return DataModel.getData('predictedChange');
        }
    };
})();