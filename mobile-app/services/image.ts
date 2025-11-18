import { http } from '@/utils/http';

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
    formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type,
    } as any);

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

