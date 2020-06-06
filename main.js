const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const app = express();
const userRouter = require('./routes/route1')
const session = require("express-session");

app.use(
  session({
    secret: "secret",
     resave: false,
    saveUninitialized: false,
    
  })
);



const port = process.env.PORT || 3000;


app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(userRouter)

app.listen(port, () => {
  console.log(`Server is working on ${port}`);
});
