const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
const exerciseSchema = new mongoose.Schema({
  description: {type: String, required:true},
  duration: {type: Number, required:true},
  date: {type: Date, default: Date.now}
})

const UserSchema = new mongoose.Schema({
  username: {type: String,required: true},
  log: [exerciseSchema]
  
})
let Users= mongoose.model('Users', UserSchema)
app.use(bodyParser.urlencoded({extended: false}))

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async function(req, res){
  let newUser = new Users({username:req.body.username})
  await newUser.save()
  res.json({username:req.body.username,_id:newUser._id})
  
});
app.get('/api/users', async function(req,res){
  const u= await Users.find({})
  res.json(u)
});
app.post('/api/users/:_id/exercises', async function(req,res){
  let id = req.params._id
  let user = await Users.findById(id)
  if(!user){
    res.send("Unknown userId")
  }
  let date = req.body.date
  if(!date){
    date= new Date()
  }
  let newExercise ={description:req.body.description,duration:parseInt(req.body.duration),date:date?new Date(date):new Date()}
  user.log.push(newExercise)
  await user.save()
  res.json({_id:user._id,username:user.username,date:new Date(date).toDateString(),duration:parseInt(req.body.duration),description:req.body.description})
})
app.get('/api/users/:_id/logs?', async function(req,res){
  let use=await Users.findById(req.params._id)
  let from = req.query.from
  let to = req.query.to
  let limit = req.query.limit
  let logs = [...use.log]
  if(from){
    const fdate= new Date(from)
    logs = logs.filter(l=>l.date >=fdate)
  }
  if(to){
    const tdate= new Date(to)
    logs = logs.filter(l=>l.date <=tdate)
  }
  if(limit){ logs =logs.slice(0,parseInt(limit))}
  const formattedlogs = logs.map(l=>({description:l.description,duration:l.duration,date:l.date.toDateString()}))
  res.json({_id:use._id,username:use.username,count:logs.length,log:formattedlogs})
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
