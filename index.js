const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dub8z.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect();
        console.log('db is connected');

        const toolsCollection = client.db('mason_hut').collection('tools');

        const usersCollection = client.db('mason_hut').collection('users');

        const ordersCollection = client.db('mason_hut').collection('orders');

        const reviewsCollection = client.db('mason_hut').collection('reviews');


        // verify jwt token
        const verifyJWT = (req, res, next) => {
            // console.log('abc');
            const authHeader = req.headers.authorization;
            // console.log(authHeader);
            if (!authHeader) {
                return res.status(401).send({ message: 'unauthorized access' });
            }
            const token = authHeader.split(' ')[1];
            // console.log(token);
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
                if (err) {
                    return res.status(403).send({ message: 'forbidden access' });
                }
                req.decoded = decoded;
                next();
            })
        };

        // getting user specific order

        app.get('/myorder', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (decodedEmail === email) {
                const query = { email: email };
                console.log(query);
                const result = await ordersCollection.find(query).toArray();
                return res.send(result);
            }
            
            
            else {
                return res.status(403).send({ message: 'Forbidden Access' })
            }

        });

        // load all tools 

        app.get('/tools', async (req, res) => {
            const tools = await toolsCollection.find({}).toArray();
            res.send(tools);
        });

        // load single tools by id

        app.get('/tools/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const tool = await toolsCollection.findOne(query);
            res.send(tool);
        });

        // update quantity after order

        app.put('/tools/:id', async (req, res) => {
            const id = req.params.id;
            const tool = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: tool
            }
            const result = await toolsCollection.updateOne(filter, updatedDoc, options);
            res.send(result)
        });

        // adding order 

        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.send(result);
        });


        // get all orders

        app.get('/order', async (req, res) => {
            const result = await ordersCollection.find({}).toArray();
            res.send(result);
        });

        // all reviews

        app.get('/review', async (req, res) => {
            const result = await reviewsCollection.find({}).toArray();
            res.send(result);
        });


        // post a review

        app.post('/review', async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.send(result);
        });


        // deleteing a single order

        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.send(result);
        })

        // issuing jwt token for login and signup

        app.post('/user/:email', async (req, res) => {
            const email = req.params.email;
            const userInfo = req.body;
            const filter = { email: email };
            const optiions = { upsert: true };
            const updatedDoc = {
                $set: userInfo
            };
            const result = await usersCollection.updateOne(filter, updatedDoc, optiions);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
            res.send({ result, token });
        });
    }

    finally {

    }
};





// root api
app.get('/', (req, res) => {
    res.send('Hello from Mason hut server');
});

app.listen(port, () => {
    console.log('Listening to port ', port);
});

run().catch(console.dir);
