import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'owl-code-notes',
        resource_type: 'raw', // Force RAW storage to prevent PDF corruption
        // allowed_formats: ['pdf', 'doc', 'docx', 'ppt', 'pptx'], // Optional: Restrict if needed
        public_id: (req, file) => `note-${Date.now()}-${file.originalname}`
    },
});

export { cloudinary, storage };
