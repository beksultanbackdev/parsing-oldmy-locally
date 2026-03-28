import mongoose from 'mongoose';

const curriculumCourseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: true,
    trim: true
  },
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  credit: {
    type: Number,
    required: true
  },
  ects: {
    type: Number,
    required: true
  },
  term: {
    type: Number
  },
  grade: {
    type: String,
    trim: true
  },
  requisites: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    trim: true
  },
  syllabusLink: {
    type: String,
    default: null
  },
});

curriculumCourseSchema.index({ courseCode: 1, term: 1 }, { unique: true });

const CurriculumCourse = mongoose.model('CurriculumCourse', curriculumCourseSchema);

export default CurriculumCourse;
