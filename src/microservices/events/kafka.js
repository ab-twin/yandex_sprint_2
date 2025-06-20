const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'events-service',
    brokers: [process.env.KAFKA_BROKERS || 'kafka:9092'],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'events-consumer-group' });

module.exports = { kafka, producer, consumer };