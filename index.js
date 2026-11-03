import express from "express";
import 'dotenv/config'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb';
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const port = 5000;

// 
app.use(cors())
app.use(express.json());


const client = new MongoClient(process.env.BETTER_AUTH_MONGODB_URI);
export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}


 const mongoClient = await connectToMongoDB();
 const db = mongoClient.db('careConnect')
 const eventsCollection = db.collection('events')
 const joinEventCollection = db.collection('joinevent')

const verifyToken = async(req, res, next)=>{
  const authHeader = req.headers.authorization
  
  if(!authHeader){
    return res.status(401).send({msg: "Unauthorized!"})
  }

  const token = authHeader.split(" ")[1]

  if(!token){
    return res.status(401).send({msg: "Unauthorized!"})
  }

  const JWKS = createRemoteJWKSet(new URL('http://localhost:3000/api/auth/jwks'))
  console.log(JWKS);
  try {
    const {payload} = await jwtVerify(token, JWKS)
     next()
  } catch (error) {
    return res.status(401).send({msg: "Server Error!"})
  }
 
}

// Home Route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// events add korar jonno 
app.post('/add-events',verifyToken, async(req, res)=>{
   const data = req.body;
   const result = await eventsCollection.insertOne(data);
   res.send(result);
})

//all event get korar jonno
app.get('/upcoming-events', async(req, res)=>{
    const result = await eventsCollection.find().toArray()
    res.send(result);
})

app.get('/upcoming-events/:id',verifyToken, async(req, res)=>{
  const {id} = req.params;
  const result = await eventsCollection.findOne({_id: new ObjectId(id)})
  res.send(result);
})

//manage events api
app.get('/upcoming-events/email/:email', async(req, res)=>{
   const {email} = req.params
   console.log(email)
   const result = await eventsCollection.find({email}).toArray()
   console.log(result);
   res.send(result);
})

//manage events api update 
app.patch('/upcoming-events/:id', async(req, res)=>{
  const {id} = req.params
  const updateData = req.body
  delete updateData._id
  const result = await eventsCollection.updateOne(
    {_id: new ObjectId(id)},
    {$set: updateData}
  )
  res.send(result)
})

//manage event api delete
app.delete('/upcoming-events/:id', async(req, res)=>{
  const {id} = req.params
  const result = await eventsCollection.deleteOne({_id: new ObjectId(id)})
  res.json(result);
})


// join event api 
app.post('/joinevent', async(req, res)=>{
   const data = req.body
   const result = await joinEventCollection.insertOne(data)
   res.send(result);
})

app.get('/joinevent', async(req, res)=>{
  const result = await joinEventCollection.find().toArray()
  res.send(result);
})

//user age thekei event a join ace kina check korar jonno
app.get("/joinevent/check/:eventId/:userId", async (req, res) => {
  const { eventId, userId } = req.params;
  const existingJoin = await joinEventCollection.findOne({
    eventId,
    userId,
  });
  res.send({
    joined: !!existingJoin,
  });

});

// Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});