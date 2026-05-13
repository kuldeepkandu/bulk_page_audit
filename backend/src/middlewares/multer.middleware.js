import multer from 'multer'

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '.public/tmp')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
})

// Memory storage for CSV processing
const memoryStorage = multer.memoryStorage();

export const upload = multer({ 
    storage,
})

export const uploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
})
