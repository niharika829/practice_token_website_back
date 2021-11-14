const { Schema, model } = require("mongoose");

const tokenSchema = new Schema(
    {
        token: { type: String, required: true },
        user: { type: Schema.Types.ObjectId, ref: "User" },
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
);

const Token = model("Token", tokenSchema, "token");

// make this available to our users in our Node applications
module.exports = Token;
