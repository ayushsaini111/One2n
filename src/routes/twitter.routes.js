// routes/twitter.routes.js

import express from 'express';
import { twitterLogin, twitterCallback, postToTwitter } from '../controllers/twitter.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';  // For authenticated routes

const router = express.Router();

// Route to redirect user to Twitter login page
router.get('/twitter/login', twitterLogin);

// Route to handle callback from Twitter after user authorization
router.get('/twitter/callback', twitterCallback);

// Route to post a tweet (user must be authenticated)
router.post('/twitter/tweet', verifyJWT, postToTwitter); // "protect" ensures the user is authenticated

export default router;
