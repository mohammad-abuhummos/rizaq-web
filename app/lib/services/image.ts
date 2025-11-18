import { http } from '../utils/http';

export interface ImageUploadResponse {
    fileName: string;
    originalFileName: string;
    url: string;
    relativePath: string;
    size: number;
    contentType: string;
    uploadedAt: string;
}

export interface ImageFile {
    uri: string;
    name: string;
    type: string;
}

/**
 * Upload a single image to the server
 * @param file - Image file object with uri, name, and type
 * @returns Promise with the upload response containing the image URL
 */
export async function uploadImage(file: ImageFile) {
    const formData = new FormData();
    // For web, we need to convert uri to a File or Blob
    // If file.uri is a data URL or blob URL, we can fetch it
    let fileBlob: File | Blob;
    
    if (file.uri.startsWith('data:')) {
        // Data URL
        const response = await fetch(file.uri);
        fileBlob = await response.blob();
    } else if (file.uri.startsWith('blob:')) {
        // Blob URL
        const response = await fetch(file.uri);
        fileBlob = await response.blob();
    } else {
        // Regular URL or file path - fetch it
        const response = await fetch(file.uri);
        fileBlob = await response.blob();
    }
    
    // Create a File object if we have a name, otherwise use Blob
    const fileToUpload = fileBlob instanceof File 
        ? fileBlob 
        : new File([fileBlob], file.name || 'image', { type: file.type || 'image/jpeg' });
    
    formData.append('file', fileToUpload);

    const response = await http.post<ImageUploadResponse>('/api/Images/upload', formData, {
        headers: {
            Accept: '*/*',
        },
    });

    return response;
}

/**
 * Upload multiple images to the server
 * @param files - Array of image file objects
 * @returns Promise with array of image URLs
 */
export async function uploadImages(files: ImageFile[]): Promise<string[]> {
    const uploadPromises = files.map((file) => uploadImage(file));
    const results = await Promise.all(uploadPromises);
    
    // Extract URLs from successful uploads
    return results
        .filter((result) => result.success && result.data?.url)
        .map((result) => result.data.url);
}

