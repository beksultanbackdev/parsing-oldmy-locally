import Course from '../models/Course.js';
import CurriculumCourse from '../models/CurriculumCourse.js';
import Syllabus from '../models/Syllabus.js';
import { runParser } from '../parser/parser.js';

const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({});
    res.json(courses);
  } catch (error) {
    console.error(`Error fetching courses: ${error.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getCurriculumCourses = async (req, res) => {
    try {
        const courses = await CurriculumCourse.find({});
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSyllabuses = async (req, res) => {
    try {
        const syllabuses = await Syllabus.find({});
        res.json(syllabuses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllData = async (req, res) => {
    try {
        const courses = await Course.find({}).lean();
        const curriculumCourses = await CurriculumCourse.find({}).lean();
        const syllabuses = await Syllabus.find({}).lean();

        const syllabusMap = new Map();
        syllabuses.forEach(s => {
            const key = `${s.courseCode}-${s.term}`;
            syllabusMap.set(key, s);
        });

        const combinedData = [...courses, ...curriculumCourses].map(course => {
            const key = `${course.courseCode}-${course.term}`;
            const syllabus = syllabusMap.get(key);
            return {
                ...course,
                syllabusDetails: syllabus || null
            };
        });

        res.json(combinedData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const startParsing = async (req, res) => {
  const { cookie } = req.body;

  if (!cookie) {
    return res.status(400).json({ message: 'PHPSESSID cookie is required' });
  }

  res.status(202).json({ message: 'Parsing process started. This may take a while.' });

  // Run the parser in the background
  runParser(cookie).catch(error => {
    console.error('Error during background parsing:', error);
  });
};

export { getCourses, getCurriculumCourses, getSyllabuses, getAllData, startParsing };
