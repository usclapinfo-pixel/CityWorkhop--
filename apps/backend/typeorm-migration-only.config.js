const { DataSource } = require("typeorm");

module.exports = new DataSource({
  type: "postgres",
  host: process.env.SUPABASE_DB_HOST,
  port: Number(process.env.SUPABASE_DB_PORT),
  username: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  database: process.env.SUPABASE_DB_NAME,

  entities: [],

  migrations: [
    "C:/Users/Mukesh Singh/Documents/Git/CityWorkhop--/apps/backend/dist/database/migrations/*.js"
  ],

  synchronize: false,
  logging: true,

  ssl: {
    rejectUnauthorized: false
  }
});
