const bCrypt= require('bcrypt')
const passport = require ('passport')
module.exports = function (app, myDataBase) {
app.route('/').get((req,res)=>{
    res.render('pug',
    {title:'Connected to Database',message:'Please login',showLogin:true,showRegistration: true,showSocialAuth: true})
  })
  // ---- Serialization and Deserializtion-- 
  //--logout 
  app.route('/logout').get((req,res)=>{
    req.logout()
    res.redirect('/')
  })
  //=== logout
//-- login -- 
app.route('/login').post(passport.authenticate('local',{failureRedirect:'/'}),(req,res)=>{
res.redirect('/profile')
})
app.route('/profile').get(ensureAuthenticated,(req,res)=>{
res.render(process.cwd()+'/views/pug/profile',
{username:req.user.username})
})
app.route('/register').post((req,res,next)=>{
  myDataBase.findOne({username:req.body.username},(err,user)=>{
    if (err){
      console.log(err)
      next(err)
    } else if (user){
      console.log(user)
      res.redirect('/')
    }else{
      const hash= bCrypt.hashSync(req.body.password,12)
      myDataBase.insertOne({username:req.body.username,password:hash},(iErr,doc)=>{
        if(iErr){
          console.log(iErr)
          res.redirect('/')
        }else{
          console.log(doc)
          next(null,doc.ops[0])
        }
      })
    }
  })
},passport.authenticate('local',{failureRedirect:'/'}),(req,res,next)=>{

res.redirect('/profile')
})
   app.route('/auth/github').get(passport.authenticate('github'))
  app.route('/auth/github/callback').get(passport.authenticate('github', { failureRedirect: '/' }),(req,res)=>{
 req.session.user_id = req.user.id;
    res.redirect('/chat');
  })
app.use((req,res,next)=>{
  res.status(404)
  .type('text')
  .send('Not Found')
})

}
function ensureAuthenticated(req,res,next){
  if (req.isAuthenticated()){
    return next()
  }
  res.redirect('/') 
}