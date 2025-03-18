import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import User from '../models/User.js';
dotenv.config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const { id, displayName, emails, photos } = profile;
      const email = emails[0].value;
      
      let user = await User.findOne({ authId: id });
      
      if (!user) {
        user = await User.findOne({ email });
        
        if (user) {
          user.authId = id;
          user.authProvider = "google"; 
          user.profileImage = user.profileImage || photos[0].value; 
          await user.save();
        } else {
          // Create new user
          user = new User({
            authId: id,
            name: displayName,
            email: email,
            profileImage: photos[0].value,
            authProvider: "google"
          });
          await user.save();
        }
      } else {
        if (!user.authProvider) {
          user.authProvider = "google";
          await user.save();
        }
      }
      
      if (req.query.state) {
        req.session.returnUrl = req.query.state;
      }
      
      return done(null, user);
    } catch (error) {
      console.error("Google auth error:", error);
      return done(error, null);
    }
  }
));

export default passport;