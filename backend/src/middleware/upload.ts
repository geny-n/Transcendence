import type { NextFunction, Request, Response } from "express";
import multer, { type FileFilterCallback } from "multer";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
console.log("Inside upload.ts __filename:", __filename);

const __dirname = path.dirname(__filename);
console.log("__dirname:", __dirname);

const storage = multer.memoryStorage();

// const storage  = multer.diskStorage({
// 	destination: function (request, file, cb) {
// 		cb(null, path.join(__dirname, "../public/avatars/"));
// 	},
// 	filename : function (request, file, cb) {
// 		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
// 		console.log("Inside filename fucntion uniqueSuffix:", uniqueSuffix);

// 		cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
// 	}
// });
console.log("storage:", storage);

const fileFilter = (request: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
	if (file.mimetype.startsWith('image/')) {
		cb(null, true);
	} else {
		cb(new Error('Not an image! Please upload only images.'))
	}
};

export const upload = multer({
	storage: storage,
	fileFilter: fileFilter,
	limits: { fileSize: 5 * 1024 * 1024 }
});

export const resizeAvatar = async (request:Request, response:Response, next: NextFunction) => {
	if (!request.file) {
		return next();
	}

	try {
		request.file.filenameForMemoryStorage = request.file.fieldname + '-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(request.file.originalname);
		const outputPath = path.join(__dirname, '../public/avatars', request.file.filenameForMemoryStorage);
		console.log("Inside resizeAvatar outputPath:", outputPath);

		await sharp(request.file.buffer, { animated: true })
			.resize({
				width: 512,
				height: 512,
				fit: 'fill',
				withoutEnlargement: true
			})
			.toFile(outputPath);

		next();
	} catch (error) {
		console.error('Erreur Sharp resisze:', error);
		return response.status(500).json({
			success: false,
			message: "Error during image processing"
		});
	}
}