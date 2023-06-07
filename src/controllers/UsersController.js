const { hash, compare } = require("bcryptjs");
const AppError = require("../utils/AppError");

const sqliteconnection = require("../database/sqlite");


class UsersController{
async create(request, response) {

    const {name, email, password} = request.body;

    const database = await sqliteconnection();
    // Tudo em verde simula oque deve ser escrito no banco de dados
    const checkUserExists = await database.get("SELECT * FROM users WHERE email = (?)", [email]);
 
    if(checkUserExists){
        throw new AppError("Este e-mail já está em uso.");
      }

      const hashedPassword = await hash(password, 8);

      await database.run(
        // run uma propriedade do database escrito em aspas banco de dados colchetes oque deve ser ativado
      "INSERT INTO users (name, email, password) VALUES ( ?, ?, ? )",
      [name, email, hashedPassword]
      
      );
      

     return response.status(201).json();
}

async update(request, response) {
  const { name, email, password, old_password } = request.body;
  const { id } = request.params;

  const database = await sqliteconnection();
  const user = await database.get("SELECT * FROM users WHERE id = ?", [id]);

  if (!user) {
    throw new AppError("Usuário não encontrado");
  }

  const userWithUpdatedEmail = await database.get("SELECT * FROM users WHERE email = ? AND id <> ?", [email, id]);

  if (userWithUpdatedEmail) {
    throw new AppError("Este e-mail já está em uso.");
  }

  user.name = name ?? user.name;
  user.email = email ?? user.email;

  if (password && !old_password) {
    throw new AppError("Você precisa informar a senha antiga para definir uma nova");
  }

  if(password && old_password) {
    const checkOldPassword = await compare(old_password, user.password);

    if(!checkOldPassword) {
      throw new AppError("A senha antiga não confere.");
    }

    user.password = await hash(password, 8);
  }


  await database.run(
    `
    UPDATE users SET
    name = ?,
    email = ?,
    password = ?,
    updated_at = DATETIME('now')
    WHERE id = ?`,
    [user.name, user.email, user.password, id]
  );

  return response.status(201).json();
}

}

module.exports = UsersController;