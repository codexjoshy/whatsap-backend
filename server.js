//imports
import express from "express"
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from 'pusher';
import cors from "cors"
//set configuration
const app = express();
const port = process.env.port || 9000;

const pusher = new Pusher({
    appId: '1089910',
    key: '0c177a8a7ec282d748b0',
    secret: '300c3f460f1d54d612c2',
    cluster: 'eu',
    encrypted: true
});

// set middlewaer
app.use(express.json());
app.use(cors());
//db config
const connectionUrl = 'mongodb+srv://admin:7HSbMlzNodaFK96m@cluster0.bvpev.mongodb.net/whatsappdb?retryWrites=true&w=majority';
mongoose.connect(connectionUrl, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology:true
})
const db = mongoose.connection;

db.once('open', ()=>{
    console.log("Db connected");
    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change', change=>{
        console.log(change);
        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', {
                name: messageDetails.name,
                message:messageDetails.message,
                timestamp: messageDetails.timestamp,
                recieved: messageDetails.recieved,
            })
        }else{
            console.log('error triggered in pusher');
        }
    })
})
//set routes
app.get('/', (req, res)=>res.status(200).send('hello world'))

app.post('/message/create', (req, res)=>{
    const dbMessage = req.body;
    Messages.create(dbMessage, (err, data)=>{
        if(err){
            res.status(500).send(err);
        } else{
            res.status(201).send(`new message created: \n ${data}`)
        }
    })
})
app.get('/messages/', (req, res)=>{
    Messages.find((err, data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            res.status(200).send(data)
        }
    })
})
//listen to a port
app.listen(port, ()=>console.log(`listening on ${port}`))

//7HSbMlzNodaFK96m