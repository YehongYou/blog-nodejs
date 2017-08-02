var express = require("express");
var router  = express.Router();
var Post = require("../models/post");
// var middleware = require("../middleware");

//show all posts
router.get("/", function(req, res){
    // Get all posts from DB
    Post.find({}, function(err, allPosts){
       if(err){
           console.log(err);
       } else {
          // res.render("posts/posts",{posts:allPosts});
          res.send("allPosts");
       }
    });
});
