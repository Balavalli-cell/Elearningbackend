const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  postid: {
    type: String,
    required: true,
    
  },
  title: {
    type: String,
    required: true,
    
  },
  content: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  
  }
 
});
// Create a model based on the schema

const BlogPost = mongoose.model('BlogPost', blogPostSchema);
module.exports = BlogPost;
