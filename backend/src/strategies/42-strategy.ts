import passport from "passport";
import Strategy from "passport-42";
import prisma from "../lib/prisma.js";

const options = {
	clientID: process.env["APP_42_ID"]!,
	clientSecret: process.env["APP_42_SECRET"]!,
	callbackURL: process.env["APP_42_CALLBACK"]!,
}

export default passport.use(
	new Strategy(
		options, async (accessToken, refreshToken, profile, cb) => {
			try {
				const whereClause = profile.emails?.[0]
				? {
					OR: [
						{ fortyTwoId: profile.id },
						{ email: profile.emails[0].value }
					]
				} : {
					OR: [
						{ fortyTwoId: profile.id }
					]
				}

				const { image : { link : avatarUrl } } = profile._json;

				let user = await prisma.user.findFirst({
					where: whereClause
				});

				if (user) {
					user = await prisma.user.update({
						where: { id: user.id },
						data: {
							email: profile.emails?.[0]?.value ?? null,
							fortyTwoId: profile.id,
						}
					})
				} else {
					user = await prisma.user.create({
						data: {
							username: profile.username,
							email: profile.emails?.[0]?.value ?? null,
							fortyTwoId: profile.id,
							avatarUrl: avatarUrl ?? '/avatars/default_avatar.png'
						}
					})
				}

				cb(null, user);
			} catch (error) {
				console.error("Erreur Passport 42:", error);
				return cb(error, false);
			}
		}
	)
)