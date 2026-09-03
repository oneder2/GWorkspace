import Database from 'better-sqlite3'
import { runMigrations } from '../src/config/migrations.js'
import { GellariaIdentity } from '../src/models/GellariaIdentity.js'

const db = new Database(':memory:')
db.pragma('foreign_keys = ON')
runMigrations({ db, logger: null })
const user = db.prepare(`
  INSERT INTO users (username, email, password_hash, role)
  VALUES ('gellaria-check', 'gellaria-check@example.test', 'unused', 'user')
`).run()

const first = { palette: 3, form: 2 }
GellariaIdentity.saveAvatar(user.lastInsertRowid, first, db)
const handoff = GellariaIdentity.createHandoff(user.lastInsertRowid, db)
const session = GellariaIdentity.exchangeHandoff(handoff.code, db)

if (!session || session.appearance?.palette !== first.palette || session.appearance?.form !== first.form) {
  throw new Error('Gellaria appearance was not returned during handoff exchange')
}
if (GellariaIdentity.exchangeHandoff(handoff.code, db) !== null) {
  throw new Error('Gellaria handoff must be single use')
}
if (GellariaIdentity.getSession(session.token, db)?.user.id !== user.lastInsertRowid) {
  throw new Error('Gellaria session did not resolve its GWorkspace user')
}

const updated = GellariaIdentity.saveAvatar(user.lastInsertRowid, { palette: 1, form: 0 }, db)
if (updated.palette !== 1 || updated.form !== 0) {
  throw new Error('Gellaria appearance update was not persisted')
}
if (!GellariaIdentity.revokeSession(session.token, db) || GellariaIdentity.getSession(session.token, db)) {
  throw new Error('Gellaria session revocation failed')
}

db.close()
console.log('Gellaria identity checks passed')
