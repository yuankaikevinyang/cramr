const { Client } = require('pg'); // import pg library

// Check if MYDB_IP_ADDR environment variable is set
if (!process.env.MYDB_IP_ADDR) {
    console.error('Error: MYDB_IP_ADDR environment variable is not set');
    console.error('Please set the environment variable: export MYDB_IP_ADDR="your_database_ip_address"');
    process.exit(1);
}

const client = new Client({
    user: 'postgres',      // postgresql user
    host: process.env.CRAMR_DB_IP_ADDR,     //IP address from environment variable
    database: 'cramr_db',  // database name
    password: process.env.CRAMR_DB_POSTGRES_PASSWORD, // postgresql password
    port: 5432,
    connectionTimeoutMillis: 10000, // 10 second timeout
    query_timeout: 10000, // 10 second query timeout
});

client.connect()
  .catch((err) => {
    console.error('Connection error:', err.stack);
    process.exit(1);
  });

const selectUsersQuery = 'SELECT * FROM users';
const selectEventsQuery = 'SELECT * FROM events';
const selectEventAttendeesQuery = 'SELECT * FROM event_attendees';

client.query(selectUsersQuery)
  .then(res => {
    console.log('Users:', res.rows);
    return client.query(selectEventsQuery);
  })
  .then(res => {
    console.log('Events:', res.rows);
    return client.query(selectEventAttendeesQuery);
  })
  .then(res => {
    console.log('Event Attendees:', res.rows);
  })
  .catch(err => {
    console.error('Error querying data:', err.stack);
  })
  .finally(() => {
    client.end();
  });