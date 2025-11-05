import { storage } from '@/lib/firebase/config';
import { ref, uploadBytesResumable, getDownloadURL, UploadTask } from 'firebase/storage';

export interface UploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

/**
 * Upload a file to Firebase Storage
 * @param file - The file to upload
 * @param path - The storage path (e.g., 'task-attachments/{taskId}/{filename}')
 * @param onProgress - Callback for upload progress updates
 * @returns Promise with the download URL
 */
export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Timeout after 30 seconds to prevent infinite loops
    const timeout = setTimeout(() => {
      uploadTask.cancel();
      reject(new Error('Upload timeout - Firebase Storage might not be configured'));
    }, 30000);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(Math.round(progress));
        }
      },
      (error) => {
        clearTimeout(timeout);
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        clearTimeout(timeout);
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

/**
 * Upload multiple files to Firebase Storage
 * @param files - Array of files to upload
 * @param basePath - Base storage path (e.g., 'task-attachments/{taskId}')
 * @param onProgress - Callback for overall progress updates
 * @returns Promise with array of download URLs
 */
export async function uploadMultipleFiles(
  files: File[],
  basePath: string,
  onProgress?: (progress: number) => void
): Promise<string[]> {
  const urls: string[] = [];
  const totalFiles = files.length;
  let completedFiles = 0;

  for (const file of files) {
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `${basePath}/${fileName}`;

    try {
      const url = await uploadFile(file, filePath, (fileProgress) => {
        // Calculate overall progress
        const overallProgress = ((completedFiles + fileProgress / 100) / totalFiles) * 100;
        if (onProgress) {
          onProgress(Math.round(overallProgress));
        }
      });

      urls.push(url);
      completedFiles++;

      if (onProgress) {
        onProgress(Math.round((completedFiles / totalFiles) * 100));
      }
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
      throw error;
    }
  }

  return urls;
}

/**
 * Validate file before upload
 * @param file - File to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const { maxSizeMB = 10, allowedTypes } = options;

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `Il file è troppo grande. Dimensione massima: ${maxSizeMB}MB`,
    };
  }

  // Check file type
  if (allowedTypes && allowedTypes.length > 0) {
    const fileType = file.type;
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    const isAllowed = allowedTypes.some((type) => {
      if (type.includes('/')) {
        // MIME type
        return fileType === type || fileType.startsWith(type.replace('*', ''));
      } else {
        // File extension
        return fileExtension === type.toLowerCase().replace('.', '');
      }
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: `Tipo di file non consentito. Formati accettati: ${allowedTypes.join(', ')}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
