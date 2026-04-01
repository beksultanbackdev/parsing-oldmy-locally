import express from 'express';
import { getAllData, getCourses, getCurriculumCourses, getSyllabuses, startParsing } from '../controllers/courseController.js';

const router = express.Router();

// @desc    Fetch all courses
// @route   GET /api/courses
// @access  Public
router.get('/', getCourses);
router.get('/syllabuses', getSyllabuses);
router.post('/parse', startParsing);

export default router;
