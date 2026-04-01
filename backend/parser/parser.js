import puppeteer from 'puppeteer';
import Course from '../models/Course.js';
import CurriculumCourse from '../models/CurriculumCourse.js';
import Syllabus from '../models/Syllabus.js';

async function setAuthCookie(page, cookieValue) {
    console.log('Setting authentication cookie...');
    if (!cookieValue) {
        throw new Error('PHPSESSID cookie was not provided to the parser.');
    }

    const cookie = {
        name: 'PHPSESSID',
        value: cookieValue,
        domain: 'my.sdu.edu.kz',
        path: '/',
        httpOnly: true,
        secure: true,
    };

    await page.setCookie(cookie);
    console.log('Authentication cookie has been set.');
}

async function parseSyllabus(browser, url) {
    let syllabusPage;
    try {
        syllabusPage = await browser.newPage();
        await syllabusPage.goto(url, { waitUntil: 'networkidle2' });

        const syllabusData = {};

        const clickTabAndWaitForContent = async (tabId) => {
            const contentDiv = await syllabusPage.$('#divContent');
            if (!contentDiv) throw new Error('#divContent not found');
            const initialHTML = await syllabusPage.evaluate(div => div.innerHTML, contentDiv);
            await syllabusPage.click(tabId);
            await syllabusPage.waitForFunction(
                (div, initial) => div.innerHTML !== initial,
                { timeout: 30000 },
                contentDiv, initialHTML
            );
        };

        // --- 1. Parse Basic Info ---
        syllabusData.basic = await syllabusPage.evaluate(() => {
            const data = {};
            const headerDiv = Array.from(document.querySelectorAll('#divContent div')).find(div => div.innerText.trim() === 'Course Syllabus');
            const table = headerDiv?.nextElementSibling;

            if (table && table.tagName === 'TABLE') {
                const headerCells = Array.from(table.querySelectorAll('tr:first-child td')).map(cell => cell.innerText.trim());
                const dataCells = Array.from(table.querySelectorAll('tr:last-child td')).map(cell => cell.innerText.trim());
                
                headerCells.forEach((key, index) => {
                    if (key) data[key] = dataCells[index] || '';
                });
            }
            return data;
        });

        // --- 2. Parse Description ---
        await clickTabAndWaitForContent('#stabDesc');
        syllabusData.description = await syllabusPage.evaluate(() => {
            const data = {};
            const allElements = document.querySelectorAll('#divContent > *');
            let captureDescription = false;
            let captureInstructors = false;

            for (const elem of allElements) {
                const text = elem.innerText.trim();
                if (text.includes('Course description')) {
                    captureDescription = true;
                    captureInstructors = false;
                    data.courseDescription = ''; 
                    continue;
                }
                if (text.includes('Instructor(s)')) {
                    captureDescription = false;
                    captureInstructors = true;
                    data.instructors = [];
                    continue;
                }

                if (captureDescription && elem.tagName !== 'DIV') {
                     data.courseDescription += text + '\n';
                }

                if (captureInstructors && elem.tagName === 'TABLE') {
                    const rows = elem.querySelectorAll('tr');
                    // Skip the header row (i=1)
                    for (let i = 1; i < rows.length; i++) {
                        const cells = rows[i].querySelectorAll('td');
                        if (cells.length > 1) {
                            data.instructors.push({
                                name: cells[0]?.innerText.trim(),
                                email: cells[1]?.innerText.trim(),
                            });
                        }
                    }
                    captureInstructors = false; // Stop after capturing the table
                }
            }
            if(data.courseDescription) data.courseDescription = data.courseDescription.trim();
            return data;
        });

        // --- 3. Parse Contents ---
        await clickTabAndWaitForContent('#stabContents');
        syllabusData.contents = await syllabusPage.evaluate(() => {
            const data = {};
            const headers = ['Academic Skills', 'Subject-Specific Skills', 'Weekly Course Plan', 'Course Learning Outcomes'];
            const allDivs = Array.from(document.querySelectorAll('#divContent div'));

            headers.forEach(headerText => {
                const headerDiv = allDivs.find(div => div.innerText.trim() === headerText);
                let nextElement = headerDiv?.nextElementSibling;
                while(nextElement && nextElement.tagName !== 'TABLE'){
                     nextElement = nextElement.nextElementSibling;
                }

                if (nextElement && nextElement.tagName === 'TABLE') {
                    const key = headerText.replace(/\s+/g, ''); // e.g., 'WeeklyCoursePlan'
                    const tableData = [];
                    const rows = nextElement.querySelectorAll('tr');
                    const headerRow = rows[0];
                    if (!headerRow) return;
                    const headerCells = Array.from(headerRow.querySelectorAll('td, th')).map(cell => cell.innerText.trim());

                    for (let i = 1; i < rows.length; i++) {
                        const rowData = {};
                        const cells = rows[i].querySelectorAll('td');
                        for (let j = 0; j < headerCells.length; j++) {
                            rowData[headerCells[j]] = cells[j]?.innerText.trim() || '';
                        }
                        tableData.push(rowData);
                    }
                    data[key] = tableData;
                }
            });
            return data;
        });

        // Calculate total credits from string
        if (syllabusData.basic && syllabusData.basic.Credits && typeof syllabusData.basic.Credits === 'string') {
            const creditsStr = syllabusData.basic.Credits;
            if (creditsStr.includes('+')) {
                const sum = creditsStr.split('+').reduce((acc, val) => {
                    const num = parseInt(val.trim(), 10);
                    return isNaN(num) ? acc : acc + num;
                }, 0);
                syllabusData.basic.Credits = sum;
            } else {
                const num = parseInt(creditsStr, 10);
                if (!isNaN(num)) {
                    syllabusData.basic.Credits = num;
                }
            }
        }

        return syllabusData;
    } catch (error) {
        console.error(`Error parsing syllabus at ${url}:`, error.message);
        return null;
    } finally {
        if (syllabusPage) {
            await syllabusPage.close();
        }
    }
}

export async function runParser(cookie) {
    console.log('Starting parser...');
    const browser = await puppeteer.launch({ headless: false }); // Set to true for production
    const page = await browser.newPage();

    try {
        await setAuthCookie(page, cookie);

        console.log('Navigating to course structure page...');
        await page.goto('https://my.sdu.edu.kz/index.php?mod=course_struct', { waitUntil: 'networkidle2' });

        const pageTitle = await page.title();
        console.log(`Page title: "${pageTitle}"`);

        if (pageTitle.toLowerCase().includes('login')) {
            throw new Error('Failed to authenticate with cookie. The page redirected to login. Your cookie might be expired.');
        }

        console.log('Successfully navigated to the course structure page.');

        console.log('Parsing course data...');
        const { electiveCourses, curriculumCourses } = await page.evaluate(() => {
            const baseUrl = 'https://my.sdu.edu.kz/';
            
            // --- PARSER 1: Elective Courses (AE, NAE, RC, NTE) ---
            const electiveCourseMap = new Map();
            const electiveTables = document.querySelectorAll('table.clsTbl');
            electiveTables.forEach(table => {
                const header = table.querySelector('div[title]');
                if (header && ['AE - Area elective', 'NAE - Non-area elective', 'RC - Requisite Courses', 'NTE - Non Theoretical Elective'].includes(header.innerText.trim())) {
                    const courseRows = table.querySelectorAll('tbody > tr');
                    courseRows.forEach(row => {
                        const cells = row.querySelectorAll('td.clsTd');
                        if (cells.length !== 9) return;
                        const courseCode = cells[1]?.innerText.trim();
                        if (!courseCode) return;

                        const courseName = cells[2]?.innerText.trim();
                        const credit = parseInt(cells[5]?.innerText, 10);
                        const ects = parseInt(cells[6]?.innerText, 10);
                        const term = cells[7]?.innerText.trim() ? parseInt(cells[7].innerText.trim(), 10) : null;
                        const syllabusLinkTag = cells[8]?.querySelector('a');
                        let syllabusLink = syllabusLinkTag ? baseUrl + syllabusLinkTag.getAttribute('href') : null;
                        if (syllabusLink) {
                            syllabusLink = syllabusLink.replace(/lang=[A-Z]{2}/, 'lang=EN');
                        }

                        if (!isNaN(credit)) {
                            const key = courseCode + '-' + (term || '');
                            if (!electiveCourseMap.has(key)) {
                                electiveCourseMap.set(key, { courseCode, courseName, credit, ects, term, syllabusLink });
                            }
                        }
                    });
                }
            });

            // --- PARSER 2: Main Curriculum (tblMufredatProg) ---
            const curriculumCourseMap = new Map();
            const curriculumTable = document.getElementById('tblMufredatProg');
            if (curriculumTable) {
                const semesterTables = curriculumTable.querySelectorAll('table.relParent');
                semesterTables.forEach(semesterTable => {
                    const semesterNum = parseInt(semesterTable.querySelector('.absNum .num')?.innerText, 10) || null;
                    const courseRows = semesterTable.querySelectorAll('table.clsTbl > tbody > tr');
                    courseRows.forEach(row => {
                        const cells = row.querySelectorAll('td.clsTd');
                        if (cells.length < 12) return;

                        let courseCode = cells[1]?.innerText.split('\n')[0].trim();
                        if (!courseCode) return;

                        if (courseCode.includes('XXX')) {
                            const titleText = cells[2]?.getAttribute('title');
                            if (titleText) {
                                const match = titleText.match(/^([A-Z]{3}\s\d{3})/);
                                if (match) courseCode = match[0];
                            }
                        }

                        const courseName = cells[2]?.getAttribute('title') || cells[2]?.innerText.trim();
                        const credit = parseInt(cells[6]?.innerText, 10);
                        const ects = parseInt(cells[7]?.innerText, 10);
                        const grade = cells[8]?.innerText.trim();
                        const requisites = cells[9]?.innerText.trim();
                        const status = cells[10]?.innerText.trim();
                        const syllabusLinkTag = cells[11]?.querySelector('a');
                        let syllabusLink = syllabusLinkTag ? baseUrl + syllabusLinkTag.getAttribute('href') : null;
                        if (syllabusLink) {
                            syllabusLink = syllabusLink.replace(/lang=[A-Z]{2}/, 'lang=EN');
                        }

                        if (!isNaN(credit)) {
                            const key = courseCode + '-' + (semesterNum || '');
                            if (!curriculumCourseMap.has(key)) {
                                curriculumCourseMap.set(key, { courseCode, courseName, credit, ects, term: semesterNum, grade, requisites, status, syllabusLink });
                            }
                        }
                    });
                });
            }

            return {
                electiveCourses: Array.from(electiveCourseMap.values()),
                curriculumCourses: Array.from(curriculumCourseMap.values()),
            };
        });

        // Save Elective Courses
        console.log(`Found ${electiveCourses.length} elective courses. Saving to 'courses' collection...`);
        await Course.deleteMany({});
        if (electiveCourses.length > 0) {
            await Course.insertMany(electiveCourses);
        }
        console.log('Elective courses saved.');

        // Save Curriculum Courses
        console.log(`Found ${curriculumCourses.length} curriculum courses. Saving to 'curriculumcourses' collection...`);
        await CurriculumCourse.deleteMany({});
        if (curriculumCourses.length > 0) {
            await CurriculumCourse.insertMany(curriculumCourses);
        }
        console.log('Curriculum courses saved.');

        // --- PARSE AND SAVE SYLLABUS DETAILS ---
        console.log('\n--- Starting Syllabus Parsing ---');
        await Syllabus.deleteMany({}); // Clear old syllabus data
        console.log('Cleared old syllabus data.');

        const allCourses = [...curriculumCourses, ...electiveCourses];
        const coursesToParse = allCourses.filter(c => c.syllabusLink && c.term != null);
        console.log(`Found ${coursesToParse.length} total courses with syllabus links. Starting full parse...`);

        for (const course of coursesToParse) {
            try {
                console.log(`Parsing syllabus for: ${course.courseCode} (Term: ${course.term})`);
                const syllabusDetails = await parseSyllabus(browser, course.syllabusLink);

                if (syllabusDetails && Object.keys(syllabusDetails).length > 0) {
                    const newSyllabus = {
                        courseCode: course.courseCode,
                        term: course.term,
                        basic: syllabusDetails.basic,
                        description: syllabusDetails.description,
                        contents: syllabusDetails.contents
                    };

                    await Syllabus.updateOne(
                        { courseCode: course.courseCode, term: course.term },
                        { $set: newSyllabus },
                        { upsert: true }
                    );
                    console.log(`  -> Syllabus for ${course.courseCode} saved.`);
                } else {
                    console.log(`  -> No syllabus details found or parsed for ${course.courseCode}. Skipping.`);
                }
            } catch (e) {
                console.error(`[FATAL] Unhandled error while parsing syllabus for ${course.courseCode}. Skipping. Error: ${e.message}`);
            }
        }

    } catch (error) {
        console.error('An error occurred:', error.message);
    } finally {
        console.log('Closing browser.');
        await browser.close();
    }
}

