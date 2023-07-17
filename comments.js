// Create web server

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Map of post id to comments
const commentsByPostId = {};

// Route for handling incoming posts
app.post('/events', async (req, res) => {
    const { type, data } = req.body;
    console.log(`Received event of type ${type}`);

    // Check for comment moderation
    if (type === 'CommentCreated') {
        const { id, content, postId, status } = data;
        const comments = commentsByPostId[postId] || [];

        // Check for bad words
        const badWords = ['orange', 'apple', 'banana'];
        const badWord = badWords.find(word => content.includes(word));
        const moderatedStatus = badWord ? 'rejected' : 'approved';

        // Add comment to list of comments
        comments.push({ id, content, status: moderatedStatus });
        commentsByPostId[postId] = comments;

        // Emit CommentUpdated event
        await axios.post('http://event-bus-clusterip-srv:4005/events', {
            type: 'CommentModerated',
            data: { id, postId, status: moderatedStatus, content }
        });
    }

    // Send response
    res.send({});
});

// Route for getting comments by post id
app.get('/posts/:id/comments', (req, res) => {
    const { id } = req.params;
    const comments = commentsByPostId[id] || [];
    res.send(comments);
});

// Listen for requests
app.listen(4001, () => {
    console.log('Listening on 4001');
});