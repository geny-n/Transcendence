import passport from "passport";
import Strategy from "passport-42";
import prisma from "../../lib/prisma";

const options = {
	clientID: process.env["42_APP_ID"] || "u-s4t2ud-e002018159131e4059b031968d41954251050765695dcd3ed86d50e43a8d7629",
	clientSecret: process.env["42_APP_SECRET"] || "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",
	callbackURL: "http://localhost:3100/auth/42/callback",
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