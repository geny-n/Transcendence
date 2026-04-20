import passport from "passport";
import { Strategy, DiscordScope } from "discord-strategy"
import prisma from "../lib/prisma.js";

const options = {
	clientID: process.env["APP_DISCORD_ID"]!,
	clientSecret: process.env["APP_DISCORD_SECRET"]!,
	callbackURL: process.env["APP_DISCORD_CALLBACK"]!,
	authorizationURL: "https://discord.com/oauth2/authorize",
	tokenURL: "https://discord.com/api/oauth2/token",
	scope: [
		DiscordScope.Identify,
		DiscordScope.Email,
	]
};

export default passport.use(new Strategy(options, async (accessToken, refreshToken, profile, done) => {
	try {
		const whereClause = profile.email
		? {
			OR: [
				{ discordId: profile.id },
				{ email: profile.email }
			]
		} : {
			OR: [
				{ discordId: profile.id }
			]
		}

		let user = await prisma.user.findFirst({
			where: whereClause
		});

		if (user) {
			user = await prisma.user.update({
				where: { id: user.id },
				data: {
					email: profile.email ?? null,
					discordId: profile.id,
				}
			})
		} else {
			user = await prisma.user.create({
				data: {
					username: profile.username,
					email: profile.email ?? null,
					discordId: profile.id,
					avatarUrl: profile.avatarUrl ?? '/avatars/default_avatar.png'
				}
			})
		}

		done(null, user);
	} catch (error) {
		console.error("Erreur Passport Discord:", error);
		return done(error, false);
	}
}))