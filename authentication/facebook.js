import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import dotenv from 'dotenv'; 
import User from '../models/User.js';

dotenv.config();

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const CALLBACK_URL = process.env.NODE_ENV === 'production' 
  ? process.env.FACEBOOK_CALLBACK_URL 
  : 'http://localhost:5000/auth/facebook/callback';

passport.use(
  new FacebookStrategy(
    {
      clientID: FACEBOOK_APP_ID,
      clientSecret: FACEBOOK_APP_SECRET,
      callbackURL: CALLBACK_URL,
      profileFields: ['id', 'displayName', 'photos'], 
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const { id, displayName, photos } = profile;
        const profileImage = photos?.[0]?.value || "default-avatar.png";

        let user = await User.findOne({ authId: id });

        if (!user) {
          user = new User({
            authId: id,
            name: displayName,
            profileImage: profileImage,
            authProvider: "FACEBOOK"
          });
        } else {
          user.authProvider = user.authProvider || "FACEBOOK";
          user.profileImage = user.profileImage || profileImage;
        }

        await user.save();

        if (req.query.state) {
          req.session.returnUrl = req.query.state;
        }

        return done(null, user);
      } catch (error) {
        console.error("FACEBOOK auth error:", error);
        return done(error, null);
      }
    }
  )
);

export default passport;
