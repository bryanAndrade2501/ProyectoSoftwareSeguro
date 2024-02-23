import bcrypt from "bcrypt"; // Importación del módulo bcrypt para el hashing de contraseñas
import { pool } from "../db.js"; // Importación del pool de conexiones a la base de datos
import { createAccessToken } from "../libs/jwt.js"; // Importación de la función para crear tokens de acceso JWT
import md5 from 'md5'; // Importación de md5 para generar gravatar hashes

// Constantes para el control de intentos de inicio de sesión
const MAX_LOGIN_ATTEMPTS = 3; // Número máximo de intentos permitidos
const LOCK_TIME = 30 * 1000; // Tiempo de bloqueo en milisegundos

let loginAttempts = {}; // Objeto para rastrear los intentos de inicio de sesión

// Función para manejar el inicio de sesión
export const signin = async (req, res) => {
  console.log('Dentro dle metodo sign in del back');
  const { email, password } = req.body; // Extracción del correo electrónico y la contraseña del cuerpo de la solicitud

  const now = Date.now(); // Obtención de la hora actual
  // Verificar si el correo electrónico está bloqueado debido a intentos de inicio de sesión fallidos
  if (loginAttempts[email] && loginAttempts[email].attempts >= MAX_LOGIN_ATTEMPTS) {
    const lockTimeRemaining = LOCK_TIME - (now - loginAttempts[email].lastAttempt); // Cálculo del tiempo restante de bloqueo
    // Si aún queda tiempo de bloqueo, enviar un mensaje de error con el tiempo restante
    if (lockTimeRemaining > 0) {
      return res.status(401).json({
        message: `La cuenta está bloqueada. Intente nuevamente después de ${lockTimeRemaining / 1000} segundos.`,
      });
    } else {
      delete loginAttempts[email]; // Eliminar el registro de intentos de inicio de sesión fallidos una vez que haya pasado el tiempo de bloqueo
    }
  }

  // Consultar la base de datos para encontrar el usuario con el correo electrónico proporcionado
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

  // Si no se encuentra ningún usuario con el correo electrónico proporcionado, devolver un mensaje de error
  if (result.rowCount === 0) {
    return res.status(400).json({
      message: "El correo no está registrado",
    });
  }

  // Verificar si la contraseña proporcionada coincide con la contraseña almacenada mediante bcrypt
  const validPassword = await bcrypt.compare(password, result.rows[0].password);

  // Si la contraseña no es válida, actualizar el registro de intentos de inicio de sesión fallidos
  if (!validPassword) {
    if (!loginAttempts[email]) {
      loginAttempts[email] = {
        attempts: 1,
        lastAttempt: now,
      };
    } else {
      loginAttempts[email].attempts++;
      loginAttempts[email].lastAttempt = now;
    }

    return res.status(400).json({
      message: "La contraseña es incorrecta",
    });
  }

  // Si se ha realizado un inicio de sesión exitoso, eliminar cualquier registro de intentos de inicio de sesión fallidos
  if (loginAttempts[email]) {
    delete loginAttempts[email];
  }

  // Crear un token de acceso JWT para el usuario autenticado
  const token = await createAccessToken({ id: result.rows[0].id });

  // Establecer el token como una cookie en la respuesta del servidor para mantener la sesión activa
  res.cookie("token", token, {
    // httpOnly: true, // Comentar o descomentar según el entorno
    secure: true, // Asegurarse de que la cookie solo se envíe a través de conexiones HTTPS
    sameSite: "none", // Permitir que la cookie se envíe en solicitudes cruzadas (Cross-site)
    maxAge: 24 * 60 * 60 * 1000, // Duración máxima de la cookie (1 día)
  });

  // Devolver los datos del usuario autenticado como respuesta
  return res.json(result.rows[0]);
};

// Función para manejar el registro de usuarios
export const signup = async (req, res, next) => {
  const { name, email, password } = req.body; // Extracción del nombre, correo electrónico y contraseña del cuerpo de la solicitud

  try {
    // Generar un hash de la contraseña utilizando bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    // Crear un hash de Gravatar basado en el correo electrónico del usuario
    const gravatar = `https://www.gravatar.com/avatar/${md5(email)}`;

    // Insertar los datos del nuevo usuario en la base de datos
    const result = await pool.query(
      "INSERT INTO users(name, email, password, gravatar) VALUES($1, $2, $3, $4) Returning *",
      [name, email, hashedPassword, gravatar]
    );

    // Crear un token de acceso JWT para el usuario recién registrado
    const token = await createAccessToken({ id: result.rows[0].id });

    // Establecer el token como una cookie en la respuesta del servidor para mantener la sesión activa
    res.cookie("token", token, {
      // httpOnly: true, // Comentar o descomentar según el entorno
      secure: true, // Asegurarse de que la cookie solo se envíe a través de conexiones HTTPS
      sameSite: "none", // Permitir que la cookie se envíe en solicitudes cruzadas (Cross-site)
      maxAge: 24 * 60 * 60 * 1000, // Duración máxima de la cookie (1 día)
    });

    // Devolver los datos del usuario recién registrado como respuesta
    return res.json(result.rows[0]);
  } catch (error) {
    // Manejar errores durante el proceso de registro
    if (error.code === "23505") {
      return res.status(400).json({
        message: "El correo ya está registrado",
      });
    }

    next(error); // Pasar el error al siguiente middleware
  }
};

// Función para manejar el cierre de sesión
export const signout = (req, res) => {
  // Limpiar la cookie de sesión del usuario
  res.clearCookie('token');
  res.sendStatus(200); // Enviar respuesta exitosa
}

// Función para obtener el perfil del usuario autenticado
export const profile = async (req, res) => {
  // Consultar la base de datos para obtener los datos del usuario utilizando su ID
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
  // Devolver los datos del usuario como respuesta
  return res.json(result.rows[0]);
}