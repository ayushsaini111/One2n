// routes/linkedin.routes.js
import express from 'express';
import { login, callback, postContent } from '../controllers/linkedin.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/linkedin/login').get( login);
router.route('/linkedin/callback').get( verifyJWT, callback);
router.route('/linkedin/post').post( verifyJWT, postContent);

export default router;
