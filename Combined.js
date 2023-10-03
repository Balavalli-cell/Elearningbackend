const express = require("express");
const bp = require("body-parser"); // Import body-parser module
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");


const app = express();
const port = process.env.PORT || 9000;

// Middleware
app.use(bp());
app.use(cors());

// MongoDB Connection (Updated dbURI)
const dbURI = "mongodb://127.0.0.1:27017/Users";
mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

db.on("error", (error) => {
  console.error("MongoDB Connection Error:", error);
});

db.once("open", () => {
  console.log("Connected to MongoDB");
});
const { UserModel, AdminModel ,Meeting} = require("./schema");
const nodemailer = require("nodemailer");

app.use(bp());
app.use(cors());
const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json("Token is missing");
  } else {
    jwt.verify(token, "jwt-secret-key", (err, decoded) => {
      if (err) {
        return res.json("Error with token");
      } else {
        req.user = decoded; // Store user data in the request object
        next();
      }
    });
  }
};

app.get('/', verifyUser, (req, res) => {
  const userEmail = req.user.email;

  // Fetch user data based on userEmail from your database
  UserModel.findOne({ email: userEmail })
      .then(user => {
          if (!user) {
              return res.json("User not found");
          }

          const role = user.role; // Get user's role

          let dashboardContent = "";
          if (role === "admin") {
              // Load admin-specific content
              dashboardContent = "Admin Dashboard Content";
          } else if (role === "instructor") {
              // Load instructor-specific content
              dashboardContent = "Instructor Dashboard Content";
          } else if (role === "student") {
              // Load student-specific content
              dashboardContent = "Student Dashboard Content";
          } else {
              return res.json("Invalid role");
          }

          res.json({ message: "Welcome to the dashboard!", role, dashboardContent });
      })
      .catch(err => res.json(err));
});

app.post('/SignupPage', (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if the role is valid (only 'student' and 'instructor' are allowed)
  if (role !== 'student' && role !== 'instructor') {
      return res.status(400).json({ message: 'Invalid role' });
  }

  bcrypt.hash(password, 10)
      .then(hash => {
          UserModel.create({ name:name, email:email, password: hash, role :role})
              .then(user => res.json("Success"))
              .catch(err => res.json(err));
      })
      .catch(err => res.json(err));
});

app.post('/LoginPage', (req, res) => {
  const { email, password } = req.body;
  UserModel.findOne({ email: email })
      .then(user => {
          if (user) {
              bcrypt.compare(password, user.password, (err, response) => {
                  if (response) {
                      const token = jwt.sign({ email: user.email, role: user.role },
                          "jwt-secret-key", { expiresIn: '1d' });
                      res.cookie('token', token);
                      return res.json({ Status: "Success", role: user.role });
                  } else {
                      return res.json("The password is incorrect");
                  }
              });
          } else {
              return res.json("No record existed");
          }
      });
});

app.post('/add-instructor', verifyUser, (req, res) => {
  const role = req.user.role;
  if (role !== 'admin') {
      return res.json("Only admins can add instructors.");
  }

  const { name, email } = req.body;

  // Create a new instructor
  const instructor = new InstructorModel({ name, email });

  // Save the instructor
  instructor.save()
      .then(savedInstructor => {
          res.json("Instructor added successfully.");
      })
      .catch(err => res.json(err));
});

app.post('/Forgotpage', (req, res) => {
  const { email } = req.body;
  UserModel.findOne({ email: email })
      .then(user => {
          if (!user) {
              return res.send({ Status: "User not existed" });
          }
          const token = jwt.sign({ id: user._id }, "jwt_secret_key", { expiresIn: "1d" });
          var transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                  user: 'bala23032002@gmail.com',
                  pass: 'rbvj pody haqz zbwq'
              }
          });

          var mailOptions = {
              from: 'bala23032002@gmail.com',
              to: email,
              subject: 'Reset Password Link',
              text: `http://localhost:3000/Reset/${user._id}/${token}`
          };

          transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                  console.log(error);
              } else {
                  return res.send({ Status: "Success" });
              }
          });
      });
});

app.post('/Reset/:id/:token', (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  jwt.verify(token, "jwt_secret_key", (err, decoded) => {
      if (err) {
          return res.json({ Status: "Error with token" });
      } else {
          bcrypt.hash(password, 10)
              .then(hash => {
                  UserModel.findByIdAndUpdate({ _id: id }, { password: hash })
                      .then(u => {
                          res.send({ Status: "Success" });
                      })
                      .catch(err => res.send({ Status: err }));
              })
              .catch(err => res.send({ Status: err }));
      }
  });
});

app.get('/About', verifyUser, (req, res) => {
  const email = req.user.email; // Assuming you have stored the user's email in the decoded JWT
  UserModel.findOne({ email })
      .then(user => {
          if (user) {
              // Return the user's name and email
              const profileData = {
                  name: user.name,
                  email: user.email,
              };
              res.json(profileData);
          } else {
              return res.json("User not found");
          }
      })
      .catch(err => res.json(err));
});
app.put('/update-user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        // Update the user data in the database based on the user ID
        await UserModel.findByIdAndUpdate(id, updatedData);

        res.status(200).json({ message: 'User data updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user data', error: error.message });
    }
});

// Route to create a new user ( student or instructor)
app.post('/create-user', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if the role is valid (only 'student' and 'instructor' are allowed)
        if (role !== 'student' && role !== 'instructor') {
            return res.status(400).json({ message: 'Invalid role' });
        }


        await User.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

// Route to add an instructor (accessible only by admin)
app.post('/add-instructor', async (req, res) => {
    try {
        // Check if the user making the request is an admin
        if (req.body.role !== 'admin') {
            return res.status(403).json({ message: 'Only admin users can add instructors' });
        }

        const { name, email, password } = req.body;

        // Create a new instructor user
        const instructor = new UserModel({
            name,
            email,
            password,
            role: 'instructor',
        });

        await instructor.save();
        res.status(201).json({ message: 'Instructor added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error adding instructor', error: error.message });
    }
});
app.post('/api/meetings', (req, res) => {
  const meetingData = req.body;

  const meeting = new Meeting(meetingData);

  meeting
    .save()
    .then((savedMeeting) => {
      res.json(savedMeeting);
    })
    .catch((error) => {
      console.error('Error saving meeting:', error);
      res.status(500).json({ error: 'Error saving meeting' });
    });
});

// Fetch all meetings
app.get('/api/meetings', (req, res) => {
  Meeting.find({})
    .then((meetings) => {
      res.json(meetings);
    })
    .catch((error) => {
      console.error('Error fetching meetings:', error);
      res.status(500).json({ error: 'Error fetching meetings' });
    });
});

// Delete a meeting by ID
app.delete('/api/meetings/:id', (req, res) => {
  const { id } = req.params;

  Meeting.findByIdAndDelete(id)
    .then(() => {
      res.json({ message: 'Meeting deleted successfully' });
    })
    .catch((error) => {
      console.error('Error deleting meeting:', error);
      res.status(500).json({ error: 'Error deleting meeting' });
    });
});

app.put('/api/meetings/:id', async function (req, res) {
  try {
    const meetingId = req.params.id;
    const { classTitle, classDate, startTime, endTime, googleMeetLink } = req.body;

    // Find the meeting by ID
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Update the meeting details
    meeting.classTitle = classTitle;
    meeting.classDate = classDate;
    meeting.startTime = startTime;
    meeting.endTime = endTime;
    meeting.googleMeetLink = googleMeetLink;

    // Save the updated meeting
    await meeting.save();
    
    res.json({ message: 'Meeting updated successfully', meeting });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});





