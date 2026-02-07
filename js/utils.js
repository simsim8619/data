// ==============================================
// 工具函数库
// ==============================================

const Utils = {
    // 格式化日期为dd/mm/yyyy
    formatDate: function(date) {
        if (!date) return "";
        
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        
        return `${day}/${month}/${year}`;
    },

    // 解析dd/mm/yyyy格式的日期
    parseDate: function(dateStr) {
        if (!dateStr) return null;
        
        const parts = dateStr.split('/');
        if (parts.length !== 3) return null;
        
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        
        return new Date(year, month, day);
    },

    // 计算日期差（天数）
    dateDiffInDays: function(date1, date2) {
        const d1 = this.parseDate(date1) || new Date();
        const d2 = this.parseDate(date2) || new Date();
        
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    // 日期加一年
    addOneYear: function(dateStr) {
        const date = this.parseDate(dateStr) || new Date();
        date.setFullYear(date.getFullYear() + 1);
        return this.formatDate(date);
    },

    // 获取当前日期（格式dd/mm/yyyy）
    getCurrentDate: function() {
        const today = new Date();
        return this.formatDate(today);
    },

    // 显示错误消息
    showError: function(message) {
        alert(`错误: ${message}`);
    },

    // 显示确认对话框
    showConfirm: function(message) {
        return confirm(message);
    },

    // 验证数字是否为正整数
    validatePositiveNumber: function(value, fieldName) {
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
            this.showError(`${fieldName}必须为正数！`);
            return false;
        }
        return true;
    },

    // 验证日期格式
    validateDateFormat: function(value) {
        if (!value) return true;
        
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
            this.showError('日期格式必须为 dd/mm/yyyy！');
            return false;
        }
        
        if (!this.parseDate(value)) {
            this.showError('无效的日期！');
            return false;
        }
        
        return true;
    },

    // 生成唯一ID
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // 深拷贝对象
    deepClone: function(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    // 防抖函数
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// 导出Utils对象
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}