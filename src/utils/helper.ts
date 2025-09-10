import dayjs from 'dayjs'
// 防抖函数
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: any, ...args: Parameters<T>): void {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}
// 获取当前时间
export function getCurrentTime() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss')
}
