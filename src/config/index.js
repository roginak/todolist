const dotenv = require("dotenv");

dotenv.config();

// Set the NODE_ENV to 'development' by default
// process.env.NODE_ENV = process.env.NODE_ENV || 'development'
process.env.NODE_ENV =
  process.env.NODE_ENV && process.env.NODE_ENV.trim().toLowerCase() == "production"
    ? "production"
    : "development";

module.exports = {
  appurl: process.env.APP_URL,
  apiurl: process.env.API_URL,

  // db config
  db_database: process.env.DB_NAME,
  db_username: process.env.DB_USER,
  db_password: process.env.DB_PW,
  db_host: process.env.DB_HOST,
  db_port: process.env.DB_PORT,

  // jwt key
  jwtSecretKey: process.env.JWT_SECRET,

  versioncode: 1,
};
