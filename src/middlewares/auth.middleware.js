import jwt from "jsonwebtoken";
import { secretKey } from "../config.js";

export const isAuth = (req, res, next) => {
  const token = req.cookies.token;

  // Si no se proporciona un token en las cookies de la solicitud, se responde con un código de estado 401 (No autorizado)
  if (!token) {
    return res.status(401).json({
      message: "No estás autorizado",
    });
  }

  // Se verifica la validez del token utilizando la misma clave secreta utilizada para firmarlo
  jwt.verify(token, secretKey, (err, decoded) => {
    // Si hay un error al verificar el token, se responde con un código de estado 401 (No autorizado)
    if (err)
      return res.status(401).json({
        message: "No estás autorizado",
      });

    // Si el token es válido, se extrae el ID del usuario decodificado y se añade a la solicitud para su posterior uso
    req.userId = decoded.id; 

    // Se pasa al siguiente middleware en la cadena de middleware
    next();
  });
};
