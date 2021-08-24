// 通用工具函数

/**
 * 日期格式
 */
function formatDate(date) {
  var y = date.getFullYear();
  var m = date.getMonth() + 1;
  m = m < 10 ? '0' + m : m;
  var d = date.getDate();
  d = d < 10 ? ('0' + d) : d;
  return y + '-' + m + '-' + d;
};

/**
 * 获取月的最后一天日期
 */
function getEndDateFromMonth(date) {
  // 年
  var year = date.getFullYear();
  // 月
  var month = date.getMonth() + 1;
  return timeFormat(new Date(year, month, 0));
}

/**
 * 获取月的第一天日期
 */
function getStartDateFromMonth(date) {
  date.setDate(1);
  return timeFormat(date);
}

/**
 * 日期格式化，返回值形式为yy-mm-dd
 */
function timeFormat(date) {
  if (!date || typeof (date) === "string") {
    this.error("参数异常，请检查...");
  }
  // 年
  var y = date.getFullYear();
  // 月
  var m = date.getMonth() + 1;
  // 日
  var d = date.getDate();
  return y + "-" + m + "-" + d;
}

module.exports = {
  getEndDateFromMonth: getEndDateFromMonth,
  getStartDateFromMonth: getStartDateFromMonth,
  timeFormat: timeFormat,
  formatDate: formatDate
}