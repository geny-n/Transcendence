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
				// Gestion de l'email
				const email = profile.emails?.[0]?.value;
				console.log("Inside 42-strategy.ts: email:", email);

				const user = await prisma.user.upsert({
					where : { fortyTwoId: profile.id },
					update: {
						username: profile.username,
						email: email || null,
					},
					create: {
						fortyTwoId: profile.id,
						email: email || null,
						username: profile.username,
						avatarUrl: profile.photos?.[0]?.value || null
					},
				});
				console.log('user:', user);
				cb(null, user);
			} catch (error) {
				console.error("Erreur Passport 42:", error);
				return cb(error, false);
			}
		}
	)
)