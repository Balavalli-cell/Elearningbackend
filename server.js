const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const BlogPost = require('./models/blogpost');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

const url = 'mongodb://127.0.0.1:27017/myblog';
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB...');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

app.listen(5000, function () {
  console.log('Server listening on port 5000...');
});

app.post('/create', async (req, res) => {
  const {postid,date,title,content}=req.body;

 const blog = await BlogPost.create({ postid,date, title, content });
    if (blog) {
      console.log(blog);
      res.send({ status: 201, msg: "Blog added successfully." });
    } else {
      res.send({
        status: 500,
        msg: "Unable to Add Blog. PLEASE TRY AGAIN LATER !!!",
      });
     }
  });


app.get('/blog/posts', async function (req, res) {
  try {
    const result = await BlogPost.find();
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/blog/post', async function (req, res) {
  try {
    const { postId } = req.body;
    const post = await BlogPost.findById(postId);

    if (!post) {
      console.log('hello')
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
app.post('/blog/postsByInst', async function (req, res) {
  try {
    const { postId } = req.body;
    const result = await BlogPost.findById(postId);
    //console.log(postId);
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
app.put('/blog/posts', async function (req, res) {
  try {
    const { id, postId, title, content } = req.body;
    const post = await BlogPost.findById(id);

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    post.title = title;
    post.postid = postid;
    post.content = content;

    await post.save();

    res.json({ message: 'Blog post updated successfully', post });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/blog/posts', async function (req, res) {
  try {
    const { id } = req.body;
    const deletedPost = await BlogPost.findOneAndDelete({ _id: id });

    if (!deletedPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    res.json({ message: 'Blog post deleted successfully', post: deletedPost });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

