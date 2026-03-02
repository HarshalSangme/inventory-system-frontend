import api from './api';

/**
 * Upload a product image through the backend.
 * The backend handles storage (local in dev, S3 in production).
 * Returns the public URL of the uploaded image.
 */
export async function uploadProductImage(blob: Blob, filename: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', blob, filename);

    const response = await api.post<{ image_url: string; filename: string }>(
        '/upload-product-image/',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.image_url;
}

/**
 * Delete a product image via the backend.
 * The backend handles deletion from the correct storage (local or S3).
 */
export async function deleteProductImage(imageUrl: string): Promise<void> {
    if (!imageUrl) return;

    try {
        const filename = imageUrl.split('/').pop();
        if (filename) {
            await api.delete('/delete-product-image/', { params: { filename } });
        }
    } catch (err) {
        console.error('Failed to delete image:', err);
        // Don't throw — image deletion failure shouldn't block product operations
    }
}
