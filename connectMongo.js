const mongoose = require('mongoose')

const connectDB = async () => {
    const rawMongoUri = process.env.MONGODB_CONNECT_URI
    const mongoUri = rawMongoUri
        ? rawMongoUri.trim().replace(/^['"]|['"]$/g, "")
        : ""

    if (!mongoUri) {
        throw new Error("Missing MONGODB_CONNECT_URI environment variable")
    }

    try {
        await mongoose.connect(mongoUri)
        console.log("Connect to MongoDB successfully")
    } catch (error) {
        console.log("Connect failed " + error.message )
        throw error
    }
}

module.exports = connectDB
