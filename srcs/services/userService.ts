import { db } from '../db/client';

export function createUser(username: string, hashedPassword: string) {
  const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
  return stmt.run(username, hashedPassword);
}

export function logInUser(username:string, hashedPassword: string)
{
  const row = db.prepare('SELECT id, username, password FROM users WHERE username = ?').get(username);

  if (!row) {
    return null; //return username does not exist  
  }

  if (row.password != hashedPassword){
    return null //return password doesnt exist
  }  

   return { id: row.id, username: row.username };

}