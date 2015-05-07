var mongo    = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var DB;
var request = require('request');


mongo.connect(process.env.MONGOLAB_URI || 'mongodb://localhost:27017/ideatool', function(err, db){
  if (err) throw err;
  // when the connection occurs, we store the connection 'object' (or whatever it is) in a global variable so we can use it elsewhere.
  DB = db;
});

var ideaConstruct = function(req){
  var idea = {
    // need format like int or str for user id slackId
    sUserName    : req.body.user_name,
    sTeamId      : req.body.team_id,
    sChannelId   : req.body.channel_id,
    sChannelName : req.body.channel_name,
    sToken       : process.env.SLACK_TOKEN,
    sTeamDomain  : req.body.team_domain,
    sCommand     : req.body.command,
    sText        : req.body.text,
    tags         : req.body.tags || null,
    active       : true,
    votes        : 1,
    comments     : []
  };
  return idea;
};

var commentConstruct = function(req){
  var comment = {
    parentId     : req.body.parentId || null,
    sUserName     : req.body.user_name,
    sTeamId      : req.body.team_id,
    sChannelId   : req.body.channel_id,
    sChannelName : req.body.channel_name,
    sToken       : process.env.SLACK_TOKEN,
    sTeamDomain  : req.body.team_domain,
    sCommand     : req.body.command,
    sText        : req.body.text,
    tags         : req.body.tags || null,
    active       : true,
    votes        : 1,
    comments     : []
  };
  return comment;
};

module.exports = {
  getIdeas : function(req,res){
    var ideas  = DB.collection('ideasDB');
    req.headers.query = req.headers.query || "";

    switch(req.headers.query){
      case 'dateFirst':
        ideas = ideas.find().sort({'datetime':1}).limit(10);
        break;
      case 'dateLast':
        ideas = ideas.find().sort({'datetime':-1}).limit(10);
        break;
      case 'votes':
        ideas = ideas.find().sort({votes:1}).limit(10);
        break;
      case 'tags':
      //add username to tags array for easy find of people also.
        ideas = ideas.find({tags:{$in:req.headers.tags}}).limit(10);
        break;
      case 'userId':
        ideas = ideas.find({userId:req.headers.userId });
        break;
      default:
      //custom query (to do when need arises)
        console.log('cant cant cant');
    }

    var counts;
    ideas.count(function(err, total){
      counts = total;
    });

    var results = [];
    ideas.on('data', function(data){
      results.push(data);
      if(results.length === counts){
        res.end(JSON.stringify(results));
      }
    });
  },

  createIdea : function(req,res){
    var idea = ideaConstruct(req);

    var reply = { 'text': 'IDEA POSTED! Whoohoo! - Idea: '+ idea.sText };

    request({ method: 'POST', 
      uri: process.env.SLACK_WEBHOOK, 
      body: JSON.stringify(reply) 
      },
      function (error, response, body) {
        if(error) console.log(error);
      }
    );

    DB.collection('ideasDB').insert(idea, function(err, done){
      console.log('DB insert done: ', idea);
    });
    
    res.end();
  },

  createComment : function(req,res){
    var comment = commentConstruct(req);
    var commentId;
    var ideaId = req.data._id;
    DB.collection('ideasDB').insert(comment, function(err, id){
      if (err) {console.log(err);}
      commentId = id._id;
    });

    DB.collection('ideasDB').update({_id:ObjectId(postId)},{$push:{comments:commentid}});
    res.end('posted comment');
  }
};

/*schema

*/
