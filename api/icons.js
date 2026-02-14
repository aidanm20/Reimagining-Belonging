import { MongoClient } from "mongodb";

let cachedClient = null;

async function getClient() {
  if (cachedClient) return cachedClient;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

export default async function handler(req, res) {
  try {
    const client = await getClient();
    const db = client.db(); // uses DB name from URI
    const col = db.collection("icons");

    if (req.method === "POST") {
      const { svg, meta } = req.body || {};
      if (typeof svg !== "string" || svg.length < 10) {
        return res.status(400).json({ error: "Missing/invalid svg" });
      }

      // basic size guard
      if (svg.length > 200_000) {
        return res.status(413).json({ error: "SVG too large" });
      }

      const doc = {
        svg,
        meta: meta && typeof meta === "object" ? meta : {},
        createdAt: new Date(),
      };

      const result = await col.insertOne(doc);
      return res.status(201).json({ id: String(result.insertedId) });
    }

    if (req.method === "GET") {
      const limit = Math.min(parseInt(req.query.limit || "24", 10), 100);
      const icons = await col
        .find({}, { projection: { svg: 1, createdAt: 1 } })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      return res.status(200).json(
        icons.map((d) => ({
          id: String(d._id),
          svg: d.svg,
          createdAt: d.createdAt,
        }))
      );
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end("Method Not Allowed");
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
