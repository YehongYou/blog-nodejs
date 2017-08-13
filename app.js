var express    = require("express"),
    app        = express(),
    bodyParser = require("body-parser"),
    mongoose   = require("mongoose"),
    passport    = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    middleware = require("./middleware/index"),
    flash       = require("connect-flash");

// import models
var Post = require("./models/post");
var User = require("./models/user");
var Comment = require("./models/comment");


// setup app
// mongoose.connect("mongodb://localhost/blog_db",{useMongoClient: true});
mongoose.connect("mongodb://leo:880810youyehong@ds023478.mlab.com:23478/my_blog");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

// passport configuration
app.use(require("express-session")({
    secret: "hello man!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   console.log("=================");
   console.log(res.locals);
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   next();
});


// ======== index routes =============
app.get("/", function(req, res){
   res.render("landing");
});
     // show sign up page
app.get("/signup", function(req,res){
   res.render("signup");
})
     // create a new user and using passportJS
app.post("/signup", function(req, res){
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, newuser){
        if(err){
            req.flash("error", err.message);
          return res.render("signup");
        }
        passport.authenticate("local")(req, res, function(){
           req.flash("success", "Welcome to Leo Blog " + newuser.username);
           res.redirect("/posts");
        });
    });
});

// go the login page
app.get("/login", function(req, res){
    console.log(res.locals);
    res.render("login");
});

// login current user
app.post("/login", passport.authenticate("local",
    {
        successRedirect: "/posts",
        failureRedirect: "/login"
    }), function(req, res){
});

// logout
app.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "Logged you out!");
   res.redirect("/posts");
});

//====================================== post routes ===================================
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

// create post form
app.get("/posts/new",middleware.isLoggedIn,function(req,res){
   res.render("posts/new");
   console.log("===============");
   console.log(req.user);
});

// create a post to DB
app.post("/posts",function(req, res){
    var title = req.body.title;
    var image = req.body.image;
    var body = req.body.body;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    var newPost = {title: title, image: image, body: body, author:author}
    // Create a new post and save to DB
    Post.create(newPost, function(err, newlyPost){
        if(err){
            console.log(err);
        } else {
            res.redirect("/posts");
        }
    });
});

// show a post
app.get("/posts/:id",function(req,res){
  //find the post with provided ID
  Post.findById(req.params.id).populate("comments").exec(function(err, foundPost){
      if(err){
          console.log(err);
      } else {
          console.log(foundPost)
          //render show template with that campground
          res.render("posts/show", {post: foundPost});
      }
  });
});

// edit a post form
app.get("/posts/:id/edit",middleware.checkPostOwnership, function(req,res){
   Post.findById(req.params.id, function(err, foundPost){
      res.render("posts/edit", {post:foundPost});
   });
})
// update the post in DB
app.put("/posts/:id",middleware.checkPostOwnership, function(req, res){
    // find and update the correct post
    Post.findByIdAndUpdate(req.params.id, req.body.post, function(err, updatedPost){
       if(err){
           res.redirect("/posts");
       } else {
           //redirect somewhere(show page)
           res.redirect("/posts/" + req.params.id);
       }
    });
});

// destroy the post
app.delete("/posts/:id",middleware.checkPostOwnership, function(req, res){
   Post.findByIdAndRemove(req.params.id, function(err){
      if(err){
          res.redirect("/posts");
      } else {
          res.redirect("/posts");
      }
   });
});

//====================================== comments routes =================================
  // go to new comments form
app.get("/posts/:id/comments/new",middleware.isLoggedIn, function(req, res){
    // find post by id
    Post.findById(req.params.id, function(err, post){
        if(err){
            console.log(err);
        } else {
             res.render("comments/new", {post: post});
        }
    })
});

// create a new comment for the specfic post
app.post("/posts/:id/comments",middleware.isLoggedIn,function(req, res){

   Post.findById(req.params.id, function(err, post){
       if(err){
           console.log(err);
           res.redirect("/posts");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               req.flash("error", "Something wrong");
               console.log(err);
           } else {
               //add username and id to comment
               comment.author.id = req.user._id;
               comment.author.username = req.user.username;
               //save comment
               comment.save();
               post.comments.push(comment);
               post.save();
               req.flash("success", "Successfully added comment");
               res.redirect('/posts/' + post._id);
           }
        });
       }
   });
});

//  post edit form
app.get("/posts/:id/comments/:comment_id/edit",middleware.checkCommentOwnership,function(req, res){
   Comment.findById(req.params.comment_id, function(err, foundComment){
      if(err){
          res.redirect("back");
      } else {
        res.render("comments/edit", {post_id: req.params.id, comment: foundComment});
      }
   });
});

// update the comment
app.put("/posts/:id/comments/:comment_id", middleware.checkCommentOwnership, function(req, res){
   Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
      if(err){
          res.redirect("back");
      } else {
          res.redirect("/posts/" + req.params.id );
      }
   });
});

// delete the comment
app.delete("/posts/:id/comments/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
       if(err){
           res.redirect("back");
       } else {
           req.flash("success", "Comment deleted");
           res.redirect("/posts/" + req.params.id);
       }
    });
});

app.listen(process.env.PORT || 5000, function(){
    console.log("server is running !!");
})
