const { Schema, model } = require("mongoose");

const userSchema = new Schema(
    {
        username: { type: String, required: true },
        password: { type: String, required: true }
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
);

const User = model("User", userSchema, "user");

// make this available to our users in our Node applications
module.exports = User;
