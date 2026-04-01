import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ElectiveGroup from '../models/ElectiveGroup.js';

dotenv.config({ path: '../.env' });

const electiveData = [
  "Physical Education 1 (MDE 291/ MDE 241, MDE 245, MDE 249, MDE 253, MDE 257, MDE 261, MDE 265, MDE 269, MDE 273, MDE 277)",
  "Turkish language 1 (MDE 131, MDE 135, MDE 201, MDE 205, MDE 209, MDE 213, MDE 217, MDE 221, MDE 225, MDE 229, MDE 233, MDE 237)",
  "Foreign language 1 (MDE 190, MDE 192)",
  "Physical Education 2 (MDE 292/ MDE 242, MDE 246, MDE 250, MDE 254, MDE 258, MDE 262, MDE 266, MDE 270, MDE 274, MDE 278)",
  "Foreign language 2 (MDE 191, MDE 194)",
  "Turkish language 2 (MDE 132, MDE 136, MDE 202, MDE 206, MDE 210, MDE 214, MDE 218, MDE 222, MDE 226, MDE 230, MDE 234, MDE 238)",
  "Physical Education 3 (MDE 293/ MDE 243, MDE 247, MDE 251, MDE 255, MDE 259, MDE 263, MDE 267, MDE 271, MDE 275, MDE 279)",
  "Turkish language 3 (MDE 133, MDE 137, MDE 203, MDE 207, MDE 211, MDE 215, MDE 219, MDE 223, MDE 227, MDE 231, MDE 235, MDE 239)",
  "Kazakh / Russian language 1 (MDE 111, MDE 113, MDE 115, MDE 117, MDE 121, MDE 123, MDE 125, MDE 127)",
  "Track electives 1 (INF 231/CSS 250/ CSS 328)",
  "Physical Education 4 (MDE 294/ MDE 244, MDE 248, MDE 252, MDE 256, MDE 260, MDE 264, MDE 268, MDE 272, MDE 276, MDE 280)",
  "Turkish language 4 (MDE 134, MDE 138, MDE 204, MDE 208, MDE 212, MDE 216, MDE 220, MDE 224, MDE 228, MDE 232, MDE 236, MDE 240)",
  "Kazakh / Russian language 2 (MDE 112, MDE 114, MDE 116, MDE 118, MDE 122, MDE 124, MDE 126, MDE 128)",
  "Track electives 2 (CSS 217/CSS 254/ INF 423)",
  "Track electives 4 (CSS 319/CSS 346/CSS 439)",
  "Track electives 3 (CSS 342, CSS 309, CSS 324)",
  "General area electives 1 (CSS 327 / CSS 214/ CSS 216/ INF 326/ INF 228/ CSS 303/ CSS 321/ CSS 417/ INF 361/ INF 328)",
  "General area electives 2 (CSS 409/ INF 368/ INF 305/ CSS 464/ CSS 306/ INF 349)",
  "Track electives 6 (CSS 323, CSS 345, INF 324, INF 376)",
  "Track electives 5 (CSS 356, INF 345, INF 337, CSS 438)",
  "Natural Science electives (INF 251/ CSS 325/ CSS 251)",
  "General education elective (MDE 161, MDE 162, MDE 164, MDE 166)",
  "General area electives 4 (CSS 415, CSS 465, CSS 450)",
  "General area electives 6 (MAT 364/ INF 261/CSS 451)",
  "General area electives 5 (INF 415/INF 360/CSS 452/ INF 474 )",
  "General area electives 7 (INF 405/ INF 263/ CSS 446/CSS 453)",
  "Graduation thesis / Graduation exam (CSS 492, CSS 493)",
  "General area electives 8 (CSS 412/CSS 497)"
];

const seedDB = async () => {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('MongoDB connected...');

  await ElectiveGroup.deleteMany({});
  console.log('Existing elective groups cleared.');

  const parsedData = electiveData.map(item => {
    const nameMatch = item.match(/^(.*?)\s*\(/);
    const course_name = nameMatch ? nameMatch[1].trim() : item.trim();

    const codesMatch = item.match(/\((.*?)\)/);
    let codes = [];
    if (codesMatch && codesMatch[1]) {
      codes = codesMatch[1].split(/[,\/]/).map(code => code.trim());
    }

    return { course_name, codes };
  });

  await ElectiveGroup.insertMany(parsedData);
  console.log('Elective groups have been seeded!');
  
  mongoose.connection.close();
};

seedDB().catch(err => {
  console.error(err);
  mongoose.connection.close();
});
