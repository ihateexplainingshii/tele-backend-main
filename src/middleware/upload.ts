import multer from 'multer';
import { storage } from '../config/cloudinary';

// Configure Multer to use the Cloudinary storage engine
const upload = multer({
  storage: storage,
  // Optional: Add file size limits, file filters, etc.
  limits: {
    fileSize: 1024 * 1024 * 5, // 5 MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Example file filter to accept only certain image types
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  },
});

export default upload;


// import { v2 as cloudinary } from "cloudinary";
// import { CloudinaryStorage } from "multer-storage-cloudinary";
// import multer from "multer";

// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: "profile_pics",  // all profile pics stored here
//     allowed_formats: ["jpg", "jpeg", "png"],
//     transformation: [{ width: 500, height: 500, crop: "limit" }],
//   } as any,
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
// });

// export default upload;