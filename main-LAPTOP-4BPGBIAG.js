require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const bodyParser = require('body-parser');
const Student = require('./models/student');
const Notices = require('./models/notice');
const quiz = require('./models/quiz');
const Leadership = require('./models/quiz');
const Gallery = require('./models/gallery');
const bcrypt = require('bcryptjs');
const { resolve } = require("path");
const moment = require("moment");
const PDFDocument = require('pdfkit');


const app = express();

const PORT = process.env.PORT || 4000;
//image upload
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads');
    },
    filename: function(req, file, cb) {
        cb(null, file.filename + "_" + Date.now() + "_" + file.originalname);
    },
});

var upload = multer({ storage: storage }).single('image');


/*************************************************************************************************************** */
//database connection

mongoose
    .connect(process.env.DB_URI);
const db = mongoose.connection;
db.on('error', (error) => {
    console.log(error);
});
db.once('open', () => {
    console.log('connected to the database!');
});
//***********************************middlewares ************************************************************************** */

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(
    session({
        secret: "my secret key",
        saveUninitialized: true,
        resave: false,
    })
);

app.use((req, res, next) => {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
});



//static 
app.use(express.static('public'))
    //template engineS
app.set('view engine', "ejs");
//route
//------------------------------------------------router -----------------------------------------//
app.get("/", function(req, res) {
    res.render("login");
});

//dashboard
app.get("/dashboard", function(req, res) {
    Promise.all([
            Student.find(),
            Notices.find(),
            Student.countDocuments(),
            Student.countDocuments({ wing: 'Air-Wing' }),
            Student.countDocuments({ wing: 'Navy-Wing' }),
            Student.countDocuments({ wing: 'Army-Wing' })
        ])
        .then(([students, notices, cadetCount, airWingCadetCount, armyWingCadetCount, navyWingCadetCount]) => {
            res.render("dashboard", {
                student: students,
                notice: notices,
                cadetCount: cadetCount,
                airWingCadetCount: airWingCadetCount,
                armyWingCadetCount: armyWingCadetCount,
                navyWingCadetCount: navyWingCadetCount
            });
        })
        .catch((err) => {
            res.json({ message: err.message });
        });
});
//handel get of add
app.get("/add", function(req, res) {
    res.render("add");
});

app.get("/edit", function(req, res) {
    res.render("edit_cedit");
});
//-------------------Notice----------------------------------
app.get("/add_notice", function(req, res) {
    res.render("add_notice");
});

app.post('/add_notice', (req, res) => {
    const newNotice = new Notices({
        name: req.body.name,
        subject: req.body.subject,
        content: req.body.content,
        date: req.body.date,

    });
    newNotice.save()
        .then(() => {
            req.session.message = {
                type: 'success',
                message: 'Notice added successfully',
            };
            res.redirect('/dashboard');
        })
        .catch((err) => {
            res.json({ message: err.message, type: 'danger' });
        });
});
//----------------------edit notice-------------
app.get("/edit1/:id", async(req, res) => {
    const id = req.params.id;

    try {
        const notice = await Notices.findById(id).exec();

        if (!Notices) {
            res.redirect("/");
        } else {
            res.render("edit_notice", {
                title: "update notice",
                notice: notice,
            });
        }
    } catch (err) {
        console.error(err);
        res.redirect("/dashboard");
    }
});

//post handel
app.post("/edit1/:id", upload, async(req, res) => {
    const id = req.params.id;
    const notice = req.body;


    try {
        const result = await Notices.updateOne({ _id: id }, {
            name: req.body.name,
            subject: req.body.subject,
            content: req.body.content,
            date: req.body.date,
        });
        req.session.message = {
            type: 'success',
            message: 'Update successful'
        };
        res.redirect('/dashboard');
    } catch (err) {
        res.json({
            message: err.message,
            type: 'danger'
        });
    }
});
//-----------------------------------------------------
//--------------------------delete Notice-----------------------------

app.get("/delete1/:id", async(req, res) => {
    const id = req.params.id;

    try {
        const result = await Notices.findByIdAndRemove(id);
        req.session.message = {
            type: "info",
            message: "Notification Deleted Successfully",
        };
        res.redirect("/dashboard");
    } catch (err) {
        res.json({ message: err.message });
    }
});

//--------------------------------------------------

//---------------------------------------------
app.get("/forgetpassword", function(req, res) {
    res.render("forgetpassword");
});


//handel post
//Inser data into database
app.use(bodyParser.json());
//----------------------------------------------------inserting data from database-------------------------------------------------//
app.post('/add', upload, (req, res) => {
    const newStudent = new Student({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
        username: req.body.username,
        dob: req.body.dob,
        gender: req.body.gender,
        password: req.body.password,
        image: req.file.filename,
        wing: req.body.wing
    });
    newStudent.save()
        .then(() => {
            req.session.message = {
                type: 'success',
                message: 'User added successfully',
            };
            res.redirect('/view_cedit');
        })
        .catch((err) => {
            res.json({ message: err.message, type: 'danger' });
        });
});
//----------------------------------------------------geting data from database-------------------------------------------------//
//get data
app.get("/view_cedit", function(req, res) {
    Student.find()
        .then(function(student) {
            res.render("view_cedit", {
                title: "All Cadit",
                student: student
            });
        })
        .catch(function(err) {
            console.error(err);
            res.status(500).send("Internal Server Error");
        });
});


app.get("/photo/:id", async(req, res) => {
    const id = req.params.id;
    const student = await Student.findById(id);
    res.status(200).sendFile(resolve(`./uploads/${student.image}`))
})
app.get("/photo1/:id", async(req, res) => {
    const id = req.params.id;
    const image = await Gallery.findById(id);
    res.status(200).sendFile(resolve(`./gallery/${image.image}`))
})

//------------------------------------------------------------------------------------------//



//--------------------deleting Cadit record--------------------/

app.get("/delete/:id", async(req, res) => {
    const id = req.params.id;

    try {
        const result = await Student.findByIdAndRemove(id);

        if (result.image !== "") {
            try {
                await fs.unlinkSync("./uploads/" + result.image);
            } catch (err) {
                console.log(err);
            }
        }

        req.session.message = {
            type: "info",
            message: "User Deleted Successfully",
        };
        res.redirect("/view_cedit");
    } catch (err) {
        res.json({ message: err.message });
    }
});
//---------------------------------------------------------------------------------------------------------------------/  





//---------------------------edit details------------------------------------------------------------------------------/

app.get("/edit/:id", async(req, res) => {
    const id = req.params.id;

    try {
        const student = await Student.findById(id).exec();

        if (!Student) {
            res.redirect("/view_cedit");
        } else {
            res.render("edit_cadit", {
                title: "update Cadet",
                student: student,
            });
        }
    } catch (err) {
        console.error(err);
        res.redirect("/view_cedit");
    }
});


app.post("/edit/:id", upload, async(req, res) => {
    const id = req.params.id;
    const student = req.body;
    let new_image = '';

    if (req.file) {
        new_image = req.file.filename;
        try {
            await fs.unlinkSync('./uploads/' + req.body.old_image);
        } catch (err) {
            console.log(err);
        }
    } else {
        new_image = req.body.old_image;
    }

    try {
        const result = await Student.updateOne({ _id: id }, {
            firstName: req.body.firstName,
            email: req.body.email,
            phone: req.body.phone,
            username: req.body.username,
            dob: req.body.dob,
            gender: req.body.gender,
            password: req.body.password,
            image: new_image,
            wing: req.body.wing
        });
        req.session.message = {
            type: 'success',
            message: 'Update success'
        };
        res.redirect('/view_cedit');
    } catch (err) {
        res.json({
            message: err.message,
            type: 'danger'
        });
    }
});
//---------------------------------------------------------------------------------------------------------------------/

//------------------------------------------------------view detail------------------------------------------------------/

app.get("/view_details/:id", async(req, res) => {
    const id = req.params.id;

    try {
        const student = await Student.findById(id).exec();

        if (!Student) {
            res.redirect("/");
        } else {
            res.render("view_details", {
                title: "update user",
                student: student,
                moment: moment,
            });
        }
    } catch (err) {
        console.error(err);
        res.redirect("/view_cedit");
    }
});

//------------------------------------------------------------------------------------------------------------------------/

//------------------------------------------------------view Notice------------------------------------------------------/

app.get("/view_notice/:id", async(req, res) => {
    const id = req.params.id;

    try {
        const notice1 = await Notices.findById(id).exec();

        if (!Notices) {
            res.redirect("/");
        } else {
            res.render("view_notice", {
                title: "View Notice",
                notice1: notice1,
            });
        }
    } catch (err) {
        console.error(err);
        res.redirect("/dashboard");
    }
});

//------------------------------------------------------------------------------------------------------------------------/

//-----------------------------------------login-------------------------------------------------------------------------------/


//post
app.post("/login", async(req, res) => {
    try {
        const check = await Student.findOne({ username: req.body.username });
        if (check.password === req.body.password) {
            res.redirect('/dashboard');
        } else {
            res.redirect("/");
        }
        req.session.message = {
            type: 'success',
            message: 'Update success'
        };
    } catch (err) {
        res.json({
            message: err.message,
            type: 'danger'
        });
    }
});

//----------------logout-------------
app.get('/logout', function(req, res) {

    res.clearCookie('session');
    res.redirect('/'); // Replace "/login" with the URL of your login page
});

//------------------------------------------------------------------------------------------------

/*********************************************Student Details***************************************************/

app.get('/student/studentdashboard', function(req, res) {
    Promise.all([
            Student.find(),
            Notices.find(),
            Student.countDocuments(),
            Student.countDocuments({ wing: 'Air_Wing' }),
            Student.countDocuments({ wing: 'Navy_Wing' }),
            Student.countDocuments({ wing: 'Army_Wing' })
        ])
        .then(([students, notices, cadetCount, airWingCadetCount, armyWingCadetCount, navyWingCadetCount]) => {
            res.render("student/studentdashboard", {
                student: students,
                notice: notices,
                cadetCount: cadetCount,
                airWingCadetCount: airWingCadetCount,
                armyWingCadetCount: armyWingCadetCount,
                navyWingCadetCount: navyWingCadetCount
            });
        })
        .catch((err) => {
            res.json({ message: err.message });
        });
});



/*********************************************Student Details***************************************************/

//------------------------------------------------------------------------------------------------------------------------/

// download pdf
app.get('/download-student-details', (req, res) => {
    // Fetch student details from the database or any other data source
    Student.find()
        .then((students) => {
            // Create a new PDF document
            const doc = new PDFDocument();

            // Set the response headers for downloading the PDF file
            res.setHeader('Content-Disposition', 'attachment; filename="student-details.pdf"');
            res.setHeader('Content-Type', 'application/pdf');

            // Pipe the PDF document directly to the response stream
            doc.pipe(res);

            // Generate the PDF content
            doc.fontSize(14).text('Student Details', { align: 'center' }).moveDown(0.5);

            // Iterate through the students and add their details to the PDF
            students.forEach((student) => {
                doc.fontSize(12).text(`Name: ${student.firstName} ${student.lastName}`);
                doc.fontSize(12).text(`Email: ${student.email}`);
                doc.fontSize(12).text(`Phone: ${student.phone}`);
                doc.fontSize(12).text(`Username: ${student.username}`);
                doc.fontSize(12).text(`DOB: ${student.dob}`);
                doc.fontSize(12).text(`Gender: ${student.gender}`);
                doc.fontSize(12).text(`Wing: ${student.wing}`);
                doc.moveDown(0.5);
            });

            // Finalize the PDF and end the response
            doc.end();
        })
        .catch((err) => {
            res.status(500).json({ message: err.message });
        });
});

//port
app.listen(PORT, () => {
    console.log(`Server Started at http://localhost:${PORT}`);
});




app.post('/submit-quiz', (req, res) => {
    const quiz = {
        questions: [{
                question: "Who is the current Chief of the Indian Army?",
                options: [
                    "General Manoj Mukund Naravane",
                    "General Bipin Rawat",
                    "General Dalbir Singh Suhag",
                    "General Vijay Kumar Singh"
                ],
                correctAnswer: "General Manoj Mukund Naravane"
            },
            {
                question: "Which war did India fight against Pakistan in 1999?",
                options: [
                    "Indo-Pakistani War of 1947",
                    "Indo-Pakistani War of 1965",
                    "Kargil War",
                    "Indo-Pakistani War of 1971"
                ],
                correctAnswer: "Kargil War"
            },
            {
                question: "What is the highest rank an officer can achieve in the Indian Army?",
                options: [
                    "Field Marshal",
                    "General",
                    "Lieutenant General",
                    "Major General"
                ],
                correctAnswer: "Field Marshal"
            }
            // Add more questions...
        ]
    };

    const userAnswers = [];
    for (let i = 0; i < quiz.questions.length; i++) {
        const answer = req.body[`answer${i}`];
        userAnswers.push(answer);
    }

    // Calculate the score based on user answers and correct answers
    let score = 0;
    for (let i = 0; i < quiz.questions.length; i++) {
        if (userAnswers[i] === quiz.questions[i].correctAnswer) {
            score++;
        }
    }

    // Save the score and user details to the database
    const leadership = new Leadership({
        username: req.body.username,
        rank: "N/A", // You can calculate the rank based on scores if needed
        score: score
    });
    leadership.save()
        .then(() => {
            res.redirect('/leaderboard');
        })
        .catch((err) => {
            res.json({ message: err.message });
        });
});

app.get('/leaderboard', (req, res) => {
    Leadership.find()
        .sort({ score: -1 }) // Sort by descending score
        .then((leaders) => {
            res.render('leaderboard', { leaders: leaders });
        })
        .catch((err) => {
            res.json({ message: err.message });
        });
});

app.get('/quiz', (req, res) => {
    // Retrieve the quiz data from the database or any other source
    const quiz = {
        questions: [
            // Add more questions...
            {
                question: "Who is the current Chief of the Indian Army?",
                options: [
                    "General Manoj Mukund Naravane",
                    "General Bipin Rawat",
                    "General Dalbir Singh Suhag",
                    "General Vijay Kumar Singh"
                ],
                correctAnswer: "General Manoj Mukund Naravane"
            },
            {
                question: "Which war did India fight against Pakistan in 1999?",
                options: [
                    "Indo-Pakistani War of 1947",
                    "Indo-Pakistani War of 1965",
                    "Kargil War",
                    "Indo-Pakistani War of 1971"
                ],
                correctAnswer: "Kargil War"
            },
            {
                question: "What is the highest rank an officer can achieve in the Indian Army?",
                options: [
                    "Field Marshal",
                    "General",
                    "Lieutenant General",
                    "Major General"
                ],
                correctAnswer: "Field Marshal"
            }
        ]
    };


    res.render('quiz', { quiz: quiz });
});



var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './gallery');
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '_' + Date.now() + '_' + file.originalname);
    },
});

var upload = multer({ storage: storage }).single('image');


app.get('/gallery', (req, res) => {
    Gallery.find()
        .then((images) => {
            res.render('gallery', { images });
        })
        .catch((err) => {
            res.json({ message: err.message });
        });
});

app.post('/gallery/add', upload, (req, res) => {
    const { caption, description } = req.body;
    const image = req.file.filename;

    const newImage = new Gallery({ image, caption, description });

    newImage
        .save()
        .then(() => {
            req.session.message = {
                type: 'success',
                message: 'Image added successfully',
            };
            res.redirect('/gallery');
        })
        .catch((err) => {
            res.json({ message: err.message, type: 'danger' });
        });
});

app.get("/student/quiz", (req, res) => {
    const quiz = {
        questions: [
            // Add more questions...
            {
                question: "Who is the current Chief of the Indian Army?",
                options: [
                    "General Manoj Mukund Naravane",
                    "General Bipin Rawat",
                    "General Dalbir Singh Suhag",
                    "General Vijay Kumar Singh"
                ],
                correctAnswer: "General Manoj Mukund Naravane"
            },
            {
                question: "Which war did India fight against Pakistan in 1999?",
                options: [
                    "Indo-Pakistani War of 1947",
                    "Indo-Pakistani War of 1965",
                    "Kargil War",
                    "Indo-Pakistani War of 1971"
                ],
                correctAnswer: "Kargil War"
            },
            {
                question: "What is the highest rank an officer can achieve in the Indian Army?",
                options: [
                    "Field Marshal",
                    "General",
                    "Lieutenant General",
                    "Major General"
                ],
                correctAnswer: "Field Marshal"
            }
        ]
    };


    res.render('student/quiz', { quiz: quiz });
});

app.get("/view_gallery", (req, res) => {

    res.render('view_gallery')

});

app.post("/clogin", async(req, res) => {
    try {
        const check = await Student.findOne({ username: req.body.username });
        if (check.password === req.body.password) {
            res.redirect('student/studentdashboard');
        } else {
            res.redirect("/");
        }
        req.session.message = {
            type: 'success',
            message: 'Update success'
        };
    } catch (err) {
        res.json({
            message: err.message,
            type: 'danger'
        });
    }
});

app.get("/cadetlogin", (req, res) => {

    res.render('student/cadetlogin')

});