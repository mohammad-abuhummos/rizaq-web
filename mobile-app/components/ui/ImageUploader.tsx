/**
 * ImageUploader Component
 * 
 * A reusable component for uploading images to the server.
 * Supports selecting images from gallery or camera, previewing selected images,
 * and automatically uploading them to get URLs.
 * 
 * @example
 * ```tsx
 * <ImageUploader
 *   maxImages={5}
 *   autoUpload={true}
 *   onImagesUploaded={(urls) => {
 *     console.log('Uploaded image URLs:', urls);
 *     // Use the URLs in your form or API call
 *   }}
 * />
 * ```
 * 
 * @example
 * ```tsx
 * // Manual upload mode
 * <ImageUploader
 *   autoUpload={false}
 *   onImagesSelected={(files) => {
 *     console.log('Selected files:', files);
 *   }}
 *   onImagesUploaded={(urls) => {
 *     console.log('Uploaded URLs:', urls);
 *   }}
 * />
 * ```
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { uploadImages, type ImageFile } from '@/services/image';

export interface ImageUploaderProps {
    /**
     * Callback function that receives an array of image URLs after successful upload
     */
    onImagesUploaded?: (urls: string[]) => void;
    
    /**
     * Maximum number of images that can be selected
     * @default 10
     */
    maxImages?: number;
    
    /**
     * Whether to automatically upload images when selected
     * @default true
     */
    autoUpload?: boolean;
    
    /**
     * Custom label for the upload button
     */
    buttonLabel?: string;
    
    /**
     * Whether to allow multiple image selection
     * @default true
     */
    allowsMultipleSelection?: boolean;
    
    /**
     * Initial image URLs to display (for editing existing images)
     */
    initialImages?: string[];
    
    /**
     * Callback when images are selected (before upload)
     */
    onImagesSelected?: (files: ImageFile[]) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
    onImagesUploaded,
    maxImages = 10,
    autoUpload = true,
    buttonLabel = 'اختر الصور',
    allowsMultipleSelection = true,
    initialImages = [],
    onImagesSelected,
}) => {
    const [selectedFiles, setSelectedFiles] = useState<ImageFile[]>([]);
    const [uploadedUrls, setUploadedUrls] = useState<string[]>(initialImages);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<number, boolean>>({});

    const requestPermissions = async () => {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
            Alert.alert(
                'الإذن مطلوب',
                'نحتاج إلى إذن للوصول إلى الكاميرا ومعرض الصور',
                [{ text: 'حسناً' }]
            );
            return false;
        }
        return true;
    };

    const pickImages = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: allowsMultipleSelection && maxImages > 1,
                quality: 0.8,
                selectionLimit: maxImages - selectedFiles.length,
            });

            if (!result.canceled && result.assets?.length) {
                const newFiles: ImageFile[] = result.assets.map((asset) => ({
                    uri: asset.uri,
                    name: asset.fileName || `image_${Date.now()}.${asset.type || 'jpg'}`,
                    type: asset.mimeType || 'image/jpeg',
                }));

                const updatedFiles = [...selectedFiles, ...newFiles].slice(0, maxImages);
                setSelectedFiles(updatedFiles);
                
                if (onImagesSelected) {
                    onImagesSelected(updatedFiles);
                }

                if (autoUpload) {
                    await handleUpload(updatedFiles);
                }
            }
        } catch (error: any) {
            Alert.alert('خطأ', 'فشل اختيار الصور: ' + (error.message || 'خطأ غير معروف'));
        }
    };

    const takePhoto = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
            });

            if (!result.canceled && result.assets?.length) {
                const newFile: ImageFile = {
                    uri: result.assets[0].uri,
                    name: result.assets[0].fileName || `photo_${Date.now()}.jpg`,
                    type: result.assets[0].mimeType || 'image/jpeg',
                };

                const updatedFiles = [...selectedFiles, newFile].slice(0, maxImages);
                setSelectedFiles(updatedFiles);
                
                if (onImagesSelected) {
                    onImagesSelected(updatedFiles);
                }

                if (autoUpload) {
                    await handleUpload(updatedFiles);
                }
            }
        } catch (error: any) {
            Alert.alert('خطأ', 'فشل التقاط الصورة: ' + (error.message || 'خطأ غير معروف'));
        }
    };

    const handleUpload = async (filesToUpload: ImageFile[] = selectedFiles) => {
        if (filesToUpload.length === 0) {
            Alert.alert('تنبيه', 'لم يتم اختيار أي صور');
            return;
        }

        setIsUploading(true);
        setUploadProgress({});

        try {
            const urls = await uploadImages(filesToUpload);
            
            if (urls.length > 0) {
                const allUrls = [...uploadedUrls, ...urls];
                setUploadedUrls(allUrls);
                setSelectedFiles([]);
                
                if (onImagesUploaded) {
                    onImagesUploaded(allUrls);
                }
            } else {
                Alert.alert('خطأ', 'فشل رفع الصور');
            }
        } catch (error: any) {
            Alert.alert('خطأ', 'فشل رفع الصور: ' + (error.message || 'خطأ غير معروف'));
        } finally {
            setIsUploading(false);
            setUploadProgress({});
        }
    };

    const removeSelectedImage = (index: number) => {
        const updated = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(updated);
        if (onImagesSelected) {
            onImagesSelected(updated);
        }
    };

    const removeUploadedImage = (index: number) => {
        const updated = uploadedUrls.filter((_, i) => i !== index);
        setUploadedUrls(updated);
        if (onImagesUploaded) {
            onImagesUploaded(updated);
        }
    };

    const showImageSourceOptions = () => {
        Alert.alert(
            'اختر مصدر الصورة',
            '',
            [
                { text: 'إلغاء', style: 'cancel' },
                { text: 'الكاميرا', onPress: takePhoto },
                { text: 'المعرض', onPress: pickImages },
            ],
            { cancelable: true }
        );
    };

    const totalImages = selectedFiles.length + uploadedUrls.length;
    const canAddMore = totalImages < maxImages;

    return (
        <View style={styles.container}>
            {/* Uploaded Images */}
            {uploadedUrls.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>الصور المرفوعة</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageList}>
                        {uploadedUrls.map((url, index) => (
                            <View key={`uploaded-${index}`} style={styles.imageWrapper}>
                                <Image source={{ uri: url }} style={styles.image} />
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => removeUploadedImage(index)}
                                >
                                    <Ionicons name="close-circle" size={24} color="#ff4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Selected Images (not yet uploaded) */}
            {selectedFiles.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>الصور المحددة</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageList}>
                        {selectedFiles.map((file, index) => (
                            <View key={`selected-${index}`} style={styles.imageWrapper}>
                                <Image source={{ uri: file.uri }} style={styles.image} />
                                {!autoUpload && (
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => removeSelectedImage(index)}
                                    >
                                        <Ionicons name="close-circle" size={24} color="#ff4444" />
                                    </TouchableOpacity>
                                )}
                                {uploadProgress[index] && (
                                    <View style={styles.uploadingOverlay}>
                                        <ActivityIndicator size="small" color="#fff" />
                                    </View>
                                )}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
                {canAddMore && (
                    <TouchableOpacity
                        style={[styles.button, styles.primaryButton]}
                        onPress={showImageSourceOptions}
                        disabled={isUploading}
                    >
                        <Ionicons name="images-outline" size={20} color="#fff" style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>{buttonLabel}</Text>
                    </TouchableOpacity>
                )}

                {!autoUpload && selectedFiles.length > 0 && (
                    <TouchableOpacity
                        style={[styles.button, styles.uploadButton]}
                        onPress={() => handleUpload()}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="cloud-upload-outline" size={20} color="#fff" style={styles.buttonIcon} />
                                <Text style={styles.buttonText}>رفع الصور</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {totalImages > 0 && (
                <Text style={styles.counter}>
                    {totalImages} / {maxImages} صورة
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    imageList: {
        flexDirection: 'row',
    },
    imageWrapper: {
        position: 'relative',
        marginRight: 12,
        borderRadius: 8,
        overflow: 'hidden',
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    removeButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    uploadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
    },
    primaryButton: {
        backgroundColor: '#007AFF',
    },
    uploadButton: {
        backgroundColor: '#34C759',
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    counter: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },
});

export default ImageUploader;

