import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Uploads a profile image (File or Blob) to Firebase Storage.
 * Returns the permanent HTTPS download URL.
 * Never writes raw Base64 strings to Firestore.
 */
export async function uploadProfileImageToStorage(
  file: File | Blob, 
  userId: string
): Promise<string> {
  if (!file) {
    throw new Error('No image file provided for upload.');
  }

  // Determine file extension from type or fallback to jpg
  let ext = 'jpg';
  if (file.type === 'image/png') ext = 'png';
  else if (file.type === 'image/webp') ext = 'webp';
  else if (file.type === 'image/gif') ext = 'gif';
  else if (file.type === 'image/jpeg') ext = 'jpg';

  const timestamp = Date.now();
  const filePath = `users/${userId}/avatar_${timestamp}.${ext}`;
  const storageRef = ref(storage, filePath);

  // Upload bytes to Firebase Storage
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type || 'image/jpeg',
    customMetadata: {
      uploadedBy: userId,
      uploadedAt: new Date().toISOString()
    }
  });

  // Retrieve permanent download URL
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}
