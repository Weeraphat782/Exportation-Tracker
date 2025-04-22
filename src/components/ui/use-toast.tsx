// ไฟล์ดัมมี่สำหรับใช้แทน use-toast

export const toast = {
  // ฟังก์ชันดัมมี่สำหรับแจ้งข้อความ error
  error: (options: { title?: string; description?: string }) => {
    console.error('[Toast Error]', options.title, options.description);
  },
  
  // ฟังก์ชันดัมมี่สำหรับแจ้งข้อความ success
  success: (options: { title?: string; description?: string }) => {
    console.log('[Toast Success]', options.title, options.description);
  }
} 