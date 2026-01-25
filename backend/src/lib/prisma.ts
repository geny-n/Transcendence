generator client {
	provider = "prisma-client"
	output   = "../generated/prisma"
}

datasource db {
	provider = "mysql"
}

// schema.prisma
model User {
	id				String  	@id @default(uuid())
	email			String		@unique
	password		String		// Nullable pour OAuth users rajouter ? a la fin pour ca
	username		String		@unique
	avatarUrl		String?		@default("default_avatar.png")
	createdAt		DateTime	@default(now())
	isOnline		Boolean		@default(false)
	refreshToken	String?
}
