const mongoose = require('mongoose');

// Define the meeting schema
const meetingSchema = new mongoose.Schema({
  classTitle: {
    type: String,
    required: true,
  },
  classDate: {
    type: String,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  googleMeetLink: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Create a Mongoose model for the meeting schema
const Meeting = mongoose.model('Meeting', meetingSchema);

// Define the admin schema
const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /\S+@\S+\.\S+/,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: 'admin',
  },
});

// Define a static method to create a default admin user
adminSchema.statics.createDefaultAdmin = async function () {
  const defaultAdmin = {
    name: 'Admin Name',
    email: 'admin@example.com',
    password: 'adminPassword', // Use the plain-text password here
  };

  try {
    // Create the default admin user
    await this.create(defaultAdmin);

    console.log('Default admin user created successfully.');
  } catch (error) {
    console.error('Error creating default admin user:', error);
  }
};

// Create a Mongoose model for the admin schema
const AdminModel = mongoose.model('Admin', adminSchema);

// Define the user schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /\S+@\S+\.\S+/,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  role: {
    type: String,
    enum: ['admin', 'student', 'instructor'],
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'others'],
  },
  city: String,
  age: Number,
  dob: Date,
  occupation: {
    type: String,
    enum: ['school', 'college', 'work'],
  },
  about: String,
  profilePic: String,
});

// Create a Mongoose model for the user schema
const UserModel = mongoose.model('User', userSchema);
module.exports = { Meeting, AdminModel, UserModel};
