const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const route = express.Router();
const { MONGODB_URL } = process.env;
const url = MONGODB_URL || require('../secrets/mongodb.json').url;
const client = new MongoClient(url);

const getCollection = async (dbName, collectionName) => {
    try {
        await client.connect();
        return client.db(dbName).collection(collectionName);
    } catch (error) {
        throw new Error(`Failed to connect to the database: ${error.message}`);
    }
};

// GET /api/todos
route.get('/', async (_, response) => {
    try {
        const collection = await getCollection('todo-api', 'todos');
        const todos = await collection.find().toArray();
        response.json(todos);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
});

// POST /api/todos
route.post('/', async (request, response) => {
    try {
        const { item } = request.body;
        if (!item) {
            return response.status(400).json({ error: 'Item is required' });
        }
        const complete = false;
        const collection = await getCollection('todo-api', 'todos');
        const { insertedId } = await collection.insertOne({ item, complete });
        response.json({ insertedId });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
});

// PUT /api/todos/:id
route.put('/:id', async (request, response) => {
    try {
        const { id } = request.params;
        const collection = await getCollection('todo-api', 'todos');
        const task = await collection.findOne({ _id: new ObjectId(id) });
        if (!task) {
            return response.status(404).json({ error: 'Task not found' });
        }
        const complete = !task.complete; // toggle the complete property
        const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: { complete } });
        response.json({ id, complete });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
});

module.exports = route;
