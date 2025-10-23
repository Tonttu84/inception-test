import { db } from '../db/client';

//Creates a new user, if user already exists it throws an exceptin because username is unique field
export function createUser(username: string, hashedPassword: string) {
  const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
  return stmt.run(username, hashedPassword);
}

//Checks that user exists in database
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