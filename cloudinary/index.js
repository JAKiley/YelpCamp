const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// Multer storage engine that streams each uploaded file straight to Cloudinary.
// Replaces the multer-storage-cloudinary package, which does not support cloudinary v2.
// Each file ends up with the same fields the controllers already use:
//   file.path     -> the image's https URL
//   file.filename -> the Cloudinary public_id (used to delete the image later)
class CloudinaryStorage {
  constructor(uploadOptions) {
    this.uploadOptions = uploadOptions;
  }

  _handleFile(req, file, cb) {
    const uploadStream = cloudinary.uploader.upload_stream(
      this.uploadOptions,
      (err, result) => {
        if (err) return cb(err);
        cb(null, {
          path: result.secure_url,
          filename: result.public_id,
          size: result.bytes,
        });
      }
    );
    file.stream.pipe(uploadStream);
  }

  _removeFile(req, file, cb) {
    cloudinary.uploader.destroy(file.filename, () => cb(null));
  }
}

const storage = new CloudinaryStorage({
  folder: "YelpCamp",
  allowed_formats: ["jpeg", "png", "jpg"],
});

module.exports = {
  cloudinary,
  storage,
};
