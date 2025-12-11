import { supabase } from '@/lib/supabase';

/**
 * อัปโหลดไฟล์ไปยัง Supabase Storage
 * @param bucket ชื่อ bucket ('documents', 'company-logos', 'quotation-attachments')
 * @param path พาธของไฟล์ใน bucket
 * @param file ไฟล์ที่ต้องการอัปโหลด
 * @returns URL ของไฟล์หรือ null หากเกิดข้อผิดพลาด
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<string | null> {
  try {
    // แก้ไขปัญหาชื่อไฟล์ภาษาไทย โดยการสร้างชื่อไฟล์ใหม่ที่ปลอดภัย
    // สร้าง path ใหม่โดยเปลี่ยนชื่อไฟล์เป็น timestamp และนามสกุลเดิม
    const fileExtension = file.name.split('.').pop() || '';
    const timestamp = Date.now();
    const sanitizedFileName = `file_${timestamp}.${fileExtension}`;
    
    // แยก path เป็นส่วนของโฟลเดอร์และชื่อไฟล์
    const lastSlashIndex = path.lastIndexOf('/');
    const folderPath = lastSlashIndex !== -1 ? path.substring(0, lastSlashIndex) : '';
    
    // สร้าง path ใหม่
    const safePath = lastSlashIndex !== -1 
      ? `${folderPath}/${sanitizedFileName}` 
      : sanitizedFileName;
    
    // เก็บชื่อไฟล์ดั้งเดิมไว้ใน metadata
    const metadata = {
      originalFileName: file.name
    };

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(safePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
        metadata
      });

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    // สร้าง public URL สำหรับไฟล์
    const { data: publicUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl.publicUrl;
  } catch (error) {
    console.error('Unexpected error uploading file:', error);
    return null;
  }
}

/**
 * ดาวน์โหลดไฟล์จาก Supabase Storage
 * @param bucket ชื่อ bucket
 * @param path พาธของไฟล์ใน bucket
 * @returns ข้อมูลไฟล์หรือ null หากเกิดข้อผิดพลาด
 */
export async function downloadFile(
  bucket: string,
  path: string
): Promise<Blob | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error) {
      console.error('Error downloading file:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error downloading file:', error);
    return null;
  }
}

/**
 * ลบไฟล์จาก Supabase Storage
 * @param bucket ชื่อ bucket
 * @param path พาธของไฟล์ใน bucket
 * @returns true หากลบสำเร็จ, false หากเกิดข้อผิดพลาด
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error deleting file:', error);
    return false;
  }
}

/**
 * รับลิสต์ของไฟล์ในโฟลเดอร์
 * @param bucket ชื่อ bucket
 * @param folderPath พาธของโฟลเดอร์ใน bucket
 * @returns รายการไฟล์หรือ empty array หากเกิดข้อผิดพลาด
 */
export async function listFiles(
  bucket: string,
  folderPath: string
): Promise<Array<{
  name: string;
  size: number;
  created_at: string;
  url: string;
}>> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folderPath);

    if (error) {
      console.error('Error listing files:', error);
      return [];
    }

    // แปลงข้อมูลเป็นรูปแบบที่ใช้งานง่าย
    const files = data
      .filter(item => !item.id.endsWith('/')) // กรองโฟลเดอร์ออก
      .map(item => {
        const fullPath = folderPath ? `${folderPath}/${item.name}` : item.name;
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(fullPath);

        return {
          name: item.name,
          size: item.metadata.size,
          created_at: item.created_at,
          url: urlData.publicUrl
        };
      });

    return files;
  } catch (error) {
    console.error('Unexpected error listing files:', error);
    return [];
  }
}

/**
 * สร้างลิงก์แชร์สำหรับอัปโหลดเอกสาร
 * @param quotationId ID ของใบเสนอราคา
 * @param companyName ชื่อบริษัทลูกค้า
 * @param destination ปลายทาง
 * @returns URL สำหรับแชร์กับลูกค้า
 */
export function generateDocumentUploadLink(
  quotationId: string,
  companyName: string,
  destination: string
): string {
  // สร้าง URL ไปยังหน้าอัปโหลดเอกสาร
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'https://your-app-url.com';
  
  const url = new URL(`${baseUrl}/documents-upload/${quotationId}`);
  url.searchParams.append('company', companyName);
  url.searchParams.append('destination', destination);
  
  return url.toString();
}

/**
 * คำนวณขนาดไฟล์ให้อยู่ในรูปแบบที่อ่านง่าย
 * @param bytes ขนาดไฟล์เป็นไบต์
 * @returns ขนาดไฟล์ในรูปแบบที่อ่านง่าย (KB, MB, GB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return bytes + ' bytes';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(2) + ' KB';
  } else if (bytes < 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  } else {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }
} 