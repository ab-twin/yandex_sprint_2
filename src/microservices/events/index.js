const express = require('express');
const bodyParser = require('body-parser');
const { producer, consumer } = require('./kafka');

const PORT = process.env.PORT || 8082;
const app = express();

app.use(bodyParser.json());

const topics = ['movie', 'user', 'payment'];

// Health check
app.get('/api/events/health', (req, res) => {
    res.status(200).send({ status: true });
});

// POST endpoints
topics.forEach(topic => {
    app.post(`/api/events/${topic}`, async (req, res) => {
        try {
            await producer.send({
                topic: `${topic}-events`,
                messages: [{ value: JSON.stringify(req.body) }],
            });
            res.status(201).json({ status: 'success', topic });
        } catch (err) {
            console.error(`Error sending to topic ${topic}`, err);
            res.status(500).json({ error: 'Kafka send failed' });
        }
    });
});

const start = async () => {
    await producer.connect();
    await consumer.connect();

    for (const topic of topics) {
        await consumer.subscribe({ topic: `${topic}-events`, fromBeginning: true });
    }

    await consumer.run({
        eachMessage: async ({ topic, message }) => {
            console.log(`Received from [${topic}]:`, message.value.toString());
        },
    });

    app.listen(PORT, () => {
        console.log(`Events service running on port ${PORT}`);
    });
};

start().catch(console.error);
