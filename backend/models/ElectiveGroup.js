import mongoose from 'mongoose';

const electiveGroupSchema = new mongoose.Schema({
  course_name: {
    type: String,
    required: true,
    trim: true
  },
  codes: [{
    type: String,
    trim: true
  }]
});

const ElectiveGroup = mongoose.model('ElectiveGroup', electiveGroupSchema);

export default ElectiveGroup;
