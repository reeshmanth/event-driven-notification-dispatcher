const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'notifications.sqlite');
const schemaPath = path.join(__dirname, 'schema.sql');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

let sqlite3Db;
let nodeSqliteDb;
let sqlJsDb;
let initSqlJs;

try {
  const sqlite3 = require('sqlite3').verbose();
  sqlite3Db = new sqlite3.Database(dbPath);
} catch (error) {
  try {
    const { DatabaseSync } = require('node:sqlite');
    nodeSqliteDb = new DatabaseSync(dbPath);
  } catch (nodeSqliteError) {
    initSqlJs = require('sql.js');
  }
}

function run(sql, params = []) {
  if (nodeSqliteDb) {
    const result = nodeSqliteDb.prepare(sql).run(...params);
    return Promise.resolve({
      id: Number(result.lastInsertRowid || 0),
      changes: result.changes
    });
  }

  if (sqlJsDb) {
    const statement = sqlJsDb.prepare(sql);
    statement.run(params);
    statement.free();
    const id = sqlJsDb.exec('SELECT last_insert_rowid() AS id')[0].values[0][0];
    const changes = sqlJsDb.exec('SELECT changes() AS changes')[0].values[0][0];
    persistSqlJsDatabase();
    return Promise.resolve({ id, changes });
  }

  return new Promise((resolve, reject) => {
    sqlite3Db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  if (nodeSqliteDb) {
    return Promise.resolve(nodeSqliteDb.prepare(sql).get(...params));
  }

  if (sqlJsDb) {
    const rows = querySqlJs(sql, params);
    return Promise.resolve(rows[0]);
  }

  return new Promise((resolve, reject) => {
    sqlite3Db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
}

function all(sql, params = []) {
  if (nodeSqliteDb) {
    return Promise.resolve(nodeSqliteDb.prepare(sql).all(...params));
  }

  if (sqlJsDb) {
    return Promise.resolve(querySqlJs(sql, params));
  }

  return new Promise((resolve, reject) => {
    sqlite3Db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

async function initializeDatabase() {
  const schema = fs.readFileSync(schemaPath, 'utf8');

  if (nodeSqliteDb) {
    nodeSqliteDb.exec(schema);
    return;
  }

  if (initSqlJs) {
    const SQL = await initSqlJs();
    const fileBuffer = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : null;
    sqlJsDb = fileBuffer ? new SQL.Database(fileBuffer) : new SQL.Database();
    sqlJsDb.exec(schema);
    persistSqlJsDatabase();
    return;
  }

  await new Promise((resolve, reject) => {
    sqlite3Db.exec(schema, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function querySqlJs(sql, params = []) {
  const statement = sqlJsDb.prepare(sql);
  statement.bind(params);
  const rows = [];

  while (statement.step()) {
    rows.push(statement.getAsObject());
  }

  statement.free();
  return rows;
}

function persistSqlJsDatabase() {
  const data = sqlJsDb.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

module.exports = {
  db: sqlite3Db || nodeSqliteDb || sqlJsDb,
  run,
  get,
  all,
  initializeDatabase
};
