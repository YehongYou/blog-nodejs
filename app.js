var express    = require("express"),
    app        = express(),
    bodyParser = require("body-parser"),
    mongoose   = require("mongoose"),
    passport    = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override");

// import models
var Post = require("./models/post");


// import routes
// var postRoutes = require("./routes/posts");

// setup
mongoose.connect("mongodb://localhost/blog_db");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));








// ======== index routes =============
app.get("/", function(req, res){
   res.redirect("/posts");
});

//========== post routes ===============
//show all posts
app.get("/posts", function(req, res){
    // Get all posts from DB
    Post.find({}, function(err, allPosts){
       if(err){
           console.log(err);
       } else {
          res.render("posts/posts",{posts:allPosts});
       }
    });
});
// show a post
// app.get("/posts/:post_id",function(req,res){
//
// });

// create post form
app.get("/posts/new", function(req,res){
  res.render("posts/new");
})
// create a post to DB
app.post("/posts",function(req, res){
    var title = req.body.title;
    var image = req.body.image;
    var body = req.body.body;
    var newPost = {title: title, image: image, body: body}
    // Create a new post and save to DB
    Post.create(newPost, function(err, newlyPost){
        if(err){
            console.log(err);
        } else {
            res.redirect("/posts");
        }
    });
});

// edit a post form


// update the post in DB


// destroy the post





//============ comments routes ===========

app.listen(3000, function(){
    console.log("server is running !!");
})
