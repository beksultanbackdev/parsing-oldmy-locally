import express from 'express';
import { getCourses } from '../controllers/courseController.js';

const router = express.Router();

// @desc    Fetch all courses
// @route   GET /api/courses
// @access  Public
router.get('/', getCourses);

export default router;
