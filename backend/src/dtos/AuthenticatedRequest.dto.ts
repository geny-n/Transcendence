import type { User as PrismaUser } from '../../generated/prisma/client.js'

declare module 'socket.io' {
	interface Socket {
		user: PrismaUser
	}
}

declare global {
	namespace Express {
		interface User extends PrismaUser {}

		interface request {
			user?: User;
		}
	}
}

declare global {
	namespace Express {
		namespace Multer {
			interface File {
				filenameForMemoryStorage: string;
			}
		}
	}
}

export {};