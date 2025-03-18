import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import facebookPassport from '../authentication/facebook.js';
import User from '../models/User.js'; 
import dotenv from 'dotenv';
dotenv.config();
const router = express.Router();



passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

router.get('/google', (req, res, next) => {
  const returnUrl = req.query.returnUrl || '/';
  
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: returnUrl,
    prompt: 'select_account' 
  })(req, res, next);
});

// Google OAuth callback route
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=auth_failed' }),
  async (req, res) => {
    const user = req.user;

    const token = jwt.sign(
      { id: user.id, email: user.email, authProvider: user.authProvider },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    const returnUrl = req.session.returnUrl || req.query.state || '/';
    
    if (req.session.returnUrl) {
      delete req.session.returnUrl;
    }
    
    const userData = {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      authProvider: user.authProvider || 'google',
      profileImage: user.profileImage || ''
    };
    
    res.send(`
      <script>
        if (window.opener) {
          // Send data to parent window
          window.opener.postMessage({
            type: "AUTH_SUCCESS",
            token: "${token}",
            user: ${JSON.stringify(userData)}
          }, "${process.env.FRONTEND_API || 'http://localhost:5173'}");
          
          // Close popup
          window.close();
        } else {
          // Redirect to frontend with token
          window.location.href = "${process.env.FRONTEND_API}/login?token=${token}&userId=${userData.id}&username=${encodeURIComponent(userData.name)}&returnUrl=${encodeURIComponent(returnUrl)}";
        }
      </script>
      <p>Authentication successful! Redirecting...</p>
    `);
  }
);

router.get('/facebook', facebookPassport.authenticate('facebook',{auth_type: 'reauthenticate'} ));
router.get(
  '/facebook/callback',
  facebookPassport.authenticate('facebook', { failureRedirect: '/login?error=auth_failed' }),
  async (req, res) => {
    const user = req.user;

    const token = jwt.sign(
      { id: user.id, email: user.email, authProvider: user.authProvider },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    const returnUrl = req.session.returnUrl || req.query.state || '/';
    
    if (req.session.returnUrl) {
      delete req.session.returnUrl;
    }
    
    const userData = {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      authProvider: user.authProvider || 'FACEBOOK',
      profileImage: user.profileImage || ''
    };
    
    res.send(`
      <script>
        if (window.opener) {
          // Send data to parent window
          window.opener.postMessage({
            type: "AUTH_SUCCESS",
            token: "${token}",
            user: ${JSON.stringify(userData)}
          }, "${process.env.FRONTEND_API || 'http://localhost:5173'}");
          
          // Close popup
          window.close();
        } else {
          // Redirect to frontend with token
          window.location.href = "${process.env.FRONTEND_API}/login?token=${token}&userId=${userData.id}&username=${encodeURIComponent(userData.name)}&returnUrl=${encodeURIComponent(returnUrl)}";
        }
      </script>
      <p>Authentication successful! Redirecting...</p>
    `);
  }
);


export default router;