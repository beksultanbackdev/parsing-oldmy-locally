import mongoose from 'mongoose';

const syllabusSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: true,
    trim: true
  },
  term: {
    type: Number,
    required: true
  },
  basic: {
    type: Object
  },
  description: {
    type: Object
  },
  contents: {
    type: Object
  }
});

syllabusSchema.index({ courseCode: 1, term: 1 }, { unique: true });

const Syllabus = mongoose.model('Syllabus', syllabusSchema);

export default Syllabus;
