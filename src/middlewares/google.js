var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20');


passport.use('auth-google',new GoogleStrategy({
	clientID: process.env.GOOGLE_CLIENT_ID,
	clientSecret: process.env.GOOGLE_CLIENT_SECRET,
	callbackURL: 'http://localhost:3000/api/google/callback'
},
async (accessToken, refreshToken, profile,done)  => {

	return done(null, profile);
}
));

passport.serializeUser((user, done) => {
	done(null, user);
});

passport.deserializeUser((user, done) => {
	done(null, user);
});