const { Pool } = require('pg')
const config = require('../config');

const dbConfig = {
  host: config.db_host, 
  user: config.db_username, 
  password: config.db_password, 
  database: config.db_database, 
  port: config.db_port, 
  ssl: false,
  //
  max: 50,
  idleTimeoutMillis: 15000, // Time to keep a connection idle. Default is 10s
  waitForAvailableConnectionTimeoutMillis: 90000, // Time to wait to obtain a connection from the pool. Default is 90s
  connectionTimeoutMillis: 60000, // Max time to connect to postgres
  //
  reconnectOnDatabaseIsStartingError: true,         // Enable/disable reconnecting on "the database system is starting up" errors
  waitForDatabaseStartupMillis: 1000,               // Milliseconds to wait between retry connection attempts while the database is starting up
  databaseStartupTimeoutMillis: 90000,              // If connection attempts continually return "the database system is starting up", this is the total number of milliseconds to wait until an error is thrown.
  reconnectOnReadOnlyTransactionError: true,        // If the query should be retried when the database throws "cannot execute X in a read-only transaction"
  waitForReconnectReadOnlyTransactionMillis: 0,     // Milliseconds to wait between retry queries while the connection is marked as read-only
  readOnlyTransactionReconnectTimeoutMillis: 90000, // If queries continually return "cannot execute X in a read-only transaction", this is the total number of milliseconds to wait until an error is thrown
  reconnectOnConnectionError: true,                 // If the query should be retried when the database throws "Client has encountered a connection error and is not queryable"
  waitForReconnectConnectionMillis: 0,              // Milliseconds to wait between retry queries after receiving a connection error
  connectionReconnectTimeoutMillis: 90000           // If queries continually return "Client has encountered a connection error and is not queryable", this is the total number of milliseconds to wait until an error is thrown
}

const client = new Pool(dbConfig)
client.connect()

exports.connect = client