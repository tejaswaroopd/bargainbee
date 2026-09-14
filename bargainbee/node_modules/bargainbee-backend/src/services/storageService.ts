import { v4 as uuidv4 } from 'uuid';

export const uploadFile = async (
  buffer: Buffer,
  originalName: string,
  folder: string = 'vouchers'
): Promise<string> => {
  const ext = originalName.split('.').pop() || 'png';
  const filename = `${folder}/${uuidv4()}.${ext}`;

  console.log(`[Storage] Mock uploaded: ${filename} (${buffer.length} bytes)`);

  // Returns placeholder or data URL / CDN mock URL
  return `https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80`;
};
