import mysql from "mysql2/promise";

let pool;

function normalizeParams(params) {
  if (params === undefined || params === null) return [];
  return Array.isArray(params) ? params : [params];
}

function getPool() {
  if (!pool) {
    throw new Error("MySQL pool is not initialized. Call connectDB() first.");
  }
  return pool;
}

export async function connectDB() {
  if (pool) return pool;

  pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB_NAME,
    port: Number(process.env.MYSQL_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  await pool.query("SELECT 1");
  console.log("MySQL connected successfully!");

  return pool;
}

const db = {
  async run(sql, params = []) {
    const activePool = getPool();
    const [result] = await activePool.execute(sql, normalizeParams(params));
    return result;
  },

  async get(sql, params = []) {
    const activePool = getPool();
    const [rows] = await activePool.execute(sql, normalizeParams(params));
    return rows?.[0];
  },

  async all(sql, params = []) {
    const activePool = getPool();
    const [rows] = await activePool.execute(sql, normalizeParams(params));
    return rows;
  },

  prepare(sql) {
    return {
      run: (...params) => db.run(sql, params),
      get: (...params) => db.get(sql, params),
      all: (...params) => db.all(sql, params),
    };
  },
};

export default db;



// import mongoose from "mongoose";
// import { DB_NAME } from "../constant.js";

// const connectDB = async () => {
//     try {
//         const ConnectionInstance = await mongoose.connect(`${process.env.MONGO_DB_URI}/${DB_NAME}`);
//         console.log(`MongoDB connected !! DB HOST: ${ConnectionInstance.connection.host}`)
//     } catch (error) {
//         console.log("Mongo db connection error: ", error);
//         process.exit(1);
//     }
// }

// export default connectDB;



