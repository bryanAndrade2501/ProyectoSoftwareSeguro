import jwt from "jsonwebtoken";
import crypto from "crypto";

// Generar una clave secreta segura
const secretKey = crypto.randomBytes(64).toString('hex');

export const createAccessToken = (payload) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      secretKey, // Se debe utilizar una clave secreta segura para firmar el token
      {
        expiresIn: "1d", // El token expirará después de 1 día
      },
      (err, token) => {
        if (err) reject(err); // Si hay un error, se rechaza la promesa
        resolve(token); // Si no hay errores, se resuelve la promesa con el token generado
      }
    );
  });
};
