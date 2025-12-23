
import { format, addDays, isValid, differenceInMinutes, parse } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';
import { enUS } from 'date-fns/locale/en-US';

export const parseDate = (dateStr: string) => {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date(dateStr);
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
};

export const formatDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

export const formatDisplayDate = (dateStr: string, lang: 'en' | 'zh' = 'en', includeWeekday = false) => {
  const date = parseDate(dateStr);
  if (!isValid(date)) return dateStr;
  
  const locale = lang === 'zh' ? zhCN : enUS;
  
  if (includeWeekday) {
    return format(date, lang === 'zh' ? 'MM-dd EEE' : 'MMM d EEE', { locale });
  }
  
  return format(date, lang === 'zh' ? 'yyyy年MM月dd日' : 'MMMM d, yyyy', { locale });
};

/**
 * 格式化创建时间：MM-dd 创建
 */
export const formatCreationDate = (timestamp: number, lang: 'en' | 'zh' = 'zh') => {
  const date = new Date(timestamp);
  const suffix = lang === 'zh' ? '创建' : 'Created';
  return `${format(date, 'MM-dd')} ${suffix}`;
};

export const getNowTimestamp = () => format(new Date(), 'yyyy-MM-dd HH:mm');

export const getPreviousDateKey = (dateStr: string) => {
  const date = parseDate(dateStr);
  return formatDateKey(addDays(date, -1));
};

/**
 * 计算持续时间：从创建到现在，或从创建到完成
 * 返回格式：2D 4H 30M
 */
export const calculateDuration = (createdAt: number, completedAtStr?: string) => {
  const start = new Date(createdAt);
  let end = new Date();

  if (completedAtStr) {
    try {
      const parsed = parse(completedAtStr, 'yyyy-MM-dd HH:mm', new Date());
      if (isValid(parsed)) end = parsed;
    } catch (e) {}
  }

  const totalMinutes = differenceInMinutes(end, start);
  if (totalMinutes < 0) return '0M';
  
  const m = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const h = totalHours % 24;
  const d = Math.floor(totalHours / 24);

  const parts = [];
  if (d > 0) parts.push(`${d}D`);
  if (h > 0 || d > 0) parts.push(`${h}H`);
  parts.push(`${m}M`);
  
  return parts.join(' ');
};
