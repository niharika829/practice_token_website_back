// enable dotenv
require("dotenv").config()
const bcrypt = require("bcryptjs");
// to import express
const express = require("express")
const jwt = require("jsonwebtoken")
const postData = require("./data/posts")
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const User = require("./models/User.model");
const Token = require("./models/token.model");
const Post = require("./models/post.model");
const formidable = require("formidable")
// we need to have a app variable to setput the express server
const app = express()

// this will allow us to convert the chunks into json objects which are being fetch from the payload -> body while an API request

app.use(cookieParser());
app.use(express.json({ limit: "50mb", extended: true }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
const corsOptions = {
    origin: true, //included origin as true
    credentials: true, //included credentials as true
};
app.use(cors(corsOptions));


app.use(morgan("combined"));

app.get('/posts', authenticateToken, async (req, res) => {
    // res.json({ message: "success", data: postData.postArr })
    const postQuery = await Post.find().skip(Number(req.query._start)).limit(Number(req.query._limit))
    res.json({ message: "success", data: postQuery })
})

app.post('/store', (req, res, next) => {

    const form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {
        if (err) {
            next(err);
            return;
        }
        res.json({ message: "success", fields, files });
    });



})

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const userRecord = await User.findOne({ username })
    if (userRecord) {
        const isMatch = await bcrypt.compare(password, userRecord.password);
        if (!isMatch) {
            return res.sendStatus(403)
        }

        const accessToken = jwt.sign({ ...userRecord }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '40s' })
        const refreshToken = jwt.sign({ ...userRecord }, process.env.REFRESH_TOKEN_SECRET)

        const tokenRecord = await Token.create({
            user: userRecord._id,
            token: refreshToken
        })
        console.log(`tokenRecord`, tokenRecord)

        res.json({ message: "success", data: { accessToken, refreshToken, userRecord, tokenRecord } })
    } else {
        res.sendStatus(404)
    }

})

app.post("/register", async (req, res) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    record = await User.create({
        ...req.body,
        password: hashedPassword,
    });
    if (record)
        res.json({ message: "success", data: record })
})
app.post("/post", async (req, res) => {

    const record = await Post.create({
        ...req.body,

    });
    if (record)
        res.json({ message: "success", data: record })
})

app.post("/logout", authenticateToken, async (req, res) => {
    const { _id } = req.user;

    const logoutRes = await Token.findOneAndDelete({
        user: _id
    })

    console.log(`logoutRes`, logoutRes)

    res.sendStatus(204)
})



// middleware
function authenticateToken(req, res, next) {

    // the token will be in form if "BEARER ACCESS_TOKEN"
    const authToken = req.headers['authorization'];
    const secretToken = req.headers['secret']
    const token = authToken && authToken.split(" ")[1]
    if (token === null) return res.sendStatus(401)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
        // forbidden
        if (err) {

            const payload = jwt.verify(secretToken, process.env.REFRESH_TOKEN_SECRET);
            if (!payload) res.sendStatus("403")

            const resultQuery = await Token.findOne({
                user: payload._doc._id,
                token: secretToken,
            })
            console.log(`resultQuery`, resultQuery)
            if (!resultQuery) return res.json({ message: "login again" })
            const accessToken = jwt.sign({ ...payload }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '40s' })
            const refreshToken = jwt.sign({ ...payload }, process.env.REFRESH_TOKEN_SECRET)

            const updateQuery = await Token.findOneAndUpdate({ _id: payload._id },
                {
                    $set: {
                        token: refreshToken,
                    }
                })


            const json_ = res.json; // capture the default resp.json implementation


            res.json = function (object) {
                object["accessToken"] = accessToken;
                object["refreshToken"] = refreshToken;
                json_.call(res, object);
            };

            req.user = payload._doc;
            // return res.sendStatus("403")
            return next()


        }
        // not res, it will be a added to the payload which was passed by the api call
        req.user = user;



        //   

        //   return next();
        // perforn the next functionality
        next()
    })
}


// mongoose.set("useCreateIndex", true);
mongoose
    .connect('mongodb+srv://neha1234:neha1234@cluster0.pdlfg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log(`MongoDB Connected!`)
    }
    )
    .then(() => {
        const PORT = 5000;
        // the app variable will therfore listen to the specified port
        app.listen(5000)

    })
    .catch((err) => console.log(err));
