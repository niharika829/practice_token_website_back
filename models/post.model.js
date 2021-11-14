const { Schema, model } = require("mongoose");

const postSchema = new Schema(
    {
        username: { type: String, required: true },
        post: { type: String, required: true }
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
);

const Post = model("Post", postSchema, "post");

// make this available to our posts in our Node applications
module.exports = Post;
