import Compressor from 'compressorjs'
/**
 * 图片无损压缩并转为Base64
 * @param file 图片文件
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const compressor = new Compressor(file, {
      quality: 1.0, // 1.0 = 无损压缩
      maxWidth: 1024, // 限制宽度
      maxHeight: 1024, // 限制高度
      convertSize: 0, // 不自动转换为 WebP
      success(result) {
        const reader = new FileReader()
        reader.onload = (e) => {
          resolve(e.target?.result as string)
        }
        reader.readAsDataURL(result)
      },
      error(err) {
        console.error('压缩失败:', err)
        reject(err)
      },
    })
    return compressor
  })
}
