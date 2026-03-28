import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
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
  syllabusLink: {
    type: String,
    default: null
  },
});

// Create a compound index to prevent duplicate courses based on code and term
courseSchema.index({ courseCode: 1, term: 1 }, { unique: true });

const Course = mongoose.model('Course', courseSchema);

export default Course;
