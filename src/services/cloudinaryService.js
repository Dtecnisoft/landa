// ─────────────────────────────────────────────────────────────────────────────
// Cloudinary Service for Web / Landa Application (Hardened & Secure)
// ─────────────────────────────────────────────────────────────────────────────

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const FORBIDDEN_EXTENSIONS = /\.(svg|html|htm|js|exe|bat|cmd|sh|php)$/i;
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'application/pdf'
];

/**
 * Retorna las credenciales de Cloudinary desde las variables de entorno VITE_
 */
const getCloudinaryConfig = () => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'da49luyee';
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'landa_uploads';
    return { cloudName, uploadPreset };
};

const getBaseUrl = (cloudName) => `https://api.cloudinary.com/v1_1/${cloudName}`;

/**
 * Valida un archivo cliente antes de iniciar la petición HTTP a Cloudinary.
 * @param {File | Blob} file 
 */
export const validateFileForSecurity = (file) => {
    if (!file) return;

    if (file instanceof File) {
        // 1. Validar extensiones peligrosas (ej. SVG que puede contener scripts XSS)
        if (FORBIDDEN_EXTENSIONS.test(file.name)) {
            throw new Error(`El tipo de archivo (${file.name.split('.').pop()}) no está permitido por razones de seguridad.`);
        }

        // 2. Validar MIME Types
        if (file.type && !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
            throw new Error(`El formato del archivo (${file.type}) no es un tipo permitido (JPEG, PNG, WEBP, MP4, MOV, PDF).`);
        }

        // 3. Validar tamaño máximo
        const isVideo = file.type && file.type.startsWith('video');
        const maxSize = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
        const maxMb = isVideo ? 50 : 10;

        if (file.size > maxSize) {
            throw new Error(`El archivo excede el tamaño máximo permitido de ${maxMb} MB.`);
        }
    }
};

/**
 * Optimiza una URL de video de Cloudinary para streaming rápido.
 * Aplica transformaciones q_auto y f_mp4 para que Cloudinary entregue
 * un video re-codificado y optimizado para web y móvil.
 * Si la URL no es de Cloudinary, la retorna sin cambios.
 * @param {string} videoUrl - URL del video original
 * @returns {string} - URL optimizada para streaming
 */
export const getOptimizedVideoUrl = (videoUrl) => {
    if (!videoUrl || typeof videoUrl !== 'string') return videoUrl;

    // Solo transformar URLs de Cloudinary
    if (!videoUrl.includes('res.cloudinary.com')) return videoUrl;

    // Evitar doble-transformación si ya tiene q_auto
    if (videoUrl.includes('q_auto')) return videoUrl;

    // Insertar transformaciones después de /upload/
    const uploadIndex = videoUrl.indexOf('/upload/');
    if (uploadIndex === -1) return videoUrl;

    const before = videoUrl.substring(0, uploadIndex + '/upload/'.length);
    const after = videoUrl.substring(uploadIndex + '/upload/'.length);

    // q_auto: calidad automática optimizada
    // f_mp4: formato MP4 compatible con todos los navegadores
    return `${before}q_auto,f_mp4/${after}`;
};

/**
 * Determina si una URL o extensión de archivo corresponde a un video.
 * @param {string} url 
 * @returns {boolean}
 */
export const isVideoUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const lowercase = url.toLowerCase();
    return (
        lowercase.includes('/video/upload/') ||
        /\.(mp4|mov|webm|avi|mkv|ogv|m4v)(\?.*)?$/i.test(lowercase)
    );
};

/**
 * Upload a local file (File, Blob, or file URI string) to Cloudinary.
 * Supports image, video, and documents.
 * @param {File | Blob | string | {uri: string, name: string, type: string}} file - Local file to upload
 * @param {'auto' | 'image' | 'video' | 'raw'} resourceType - Cloudinary resource type
 * @param {function} onProgress - Optional progress callback (0-100)
 * @returns {Promise<string>} - Secure public URL of the uploaded file
 */
export const uploadToCloudinary = async (file, resourceType = 'auto', onProgress = null) => {
    if (!file) throw new Error('No se especificó ningún archivo para cargar.');

    // Validar seguridad previa del archivo (tamaño, tipo MIME, extensión)
    validateFileForSecurity(file);

    const config = getCloudinaryConfig();
    const baseUrl = getBaseUrl(config.cloudName);

    let detectedType = resourceType;

    if (file instanceof File || file instanceof Blob) {
        if (file.type && file.type.startsWith('video')) {
            detectedType = 'video';
        } else if (file.type && file.type.startsWith('image')) {
            detectedType = 'image';
        }
    } else if (typeof file === 'string') {
        if (isVideoUrl(file)) {
            detectedType = 'video';
        }
    } else if (typeof file === 'object' && file.type) {
        if (file.type.startsWith('video')) {
            detectedType = 'video';
        } else if (file.type.startsWith('image')) {
            detectedType = 'image';
        }
    }

    const formData = new FormData();

    if (file instanceof File || file instanceof Blob) {
        formData.append('file', file);
    } else if (typeof file === 'object' && file.uri) {
        formData.append('file', file);
    } else {
        formData.append('file', file);
    }

    formData.append('upload_preset', config.uploadPreset);
    formData.append('folder', 'landa-app');

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const endpoint = detectedType === 'auto' ? `${baseUrl}/auto/upload` : `${baseUrl}/${detectedType}/upload`;
        xhr.open('POST', endpoint);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
                const progress = Math.round((event.loaded / event.total) * 100);
                onProgress(progress);
            }
        };

        xhr.onload = () => {
            try {
                const response = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300 && response.secure_url) {
                    let finalUrl = response.secure_url;
                    if (response.resource_type === 'video' || detectedType === 'video') {
                        finalUrl = getOptimizedVideoUrl(finalUrl);
                    }
                    resolve(finalUrl);
                } else {
                    console.error('Cloudinary Error Details:', response);
                    reject(new Error(response.error?.message || 'Error en la carga a Cloudinary'));
                }
            } catch (e) {
                console.error('Cloudinary Parse Error:', xhr.responseText);
                reject(new Error('Respuesta inválida del servidor de Cloudinary'));
            }
        };

        xhr.onerror = (e) => {
            console.error('Cloudinary Network Error:', e);
            reject(new Error('Error de conexión a internet o de configuración de Cloudinary.'));
        };

        xhr.send(formData);
    });
};

/**
 * Upload a profile avatar image to Cloudinary.
 * @param {File|string} file
 * @param {string} accountKey
 * @returns {Promise<string>}
 */
export const uploadAvatar = (file, accountKey = 'primary') =>
    uploadToCloudinary(file, 'image', null, accountKey);

/**
 * Upload a post media file (image or video) to Cloudinary.
 * @param {File|string} file
 * @param {string} mediaType - 'auto', 'image' or 'video'
 * @param {function} onProgress
 * @param {string} accountKey
 * @returns {Promise<string>}
 */
export const uploadPostMedia = (file, mediaType = 'auto', onProgress = null, accountKey = 'primary') =>
    uploadToCloudinary(file, mediaType, onProgress, accountKey);

/**
 * Upload a driver document.
 * @param {File|string} file
 * @param {string} accountKey
 * @returns {Promise<string>}
 */
export const uploadDriverDocument = (file, accountKey = 'primary') =>
    uploadToCloudinary(file, 'image', null, accountKey);

/**
 * Upload a chat document.
 * @param {File|string} file
 * @param {string} accountKey
 * @returns {Promise<string>}
 */
export const uploadChatDocument = (file, accountKey = 'primary') =>
    uploadToCloudinary(file, 'auto', null, accountKey);
