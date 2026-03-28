import Course from '../models/Course.js';

// @desc    Fetch all courses
// @route   GET /api/courses
// @access  Public
const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({});
    res.json(courses);
  } catch (error) {
    console.error(`Error fetching courses: ${error.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
};

export { getCourses };
