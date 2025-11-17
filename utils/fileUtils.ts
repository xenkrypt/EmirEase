import { FILE_SIZE_LIMIT_MB } from '../constants';

export const validateFiles = (files: FileList | File[]): { validFiles: File[], error: string | null } => {
  const validFiles: File[] = [];
  for (const file of Array.from(files)) {
    if (file.size > FILE_SIZE_LIMIT_MB * 1024 * 1024) {
      // Return immediately on first error
      return { validFiles: [], error: `File "${file.name}" is too large. Maximum size is ${FILE_SIZE_LIMIT_MB}MB.` };
    }
    validFiles.push(file);
  }
  return { validFiles, error: null };
};
