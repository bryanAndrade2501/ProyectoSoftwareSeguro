export const validateSchema = (schema) => async (req, res, next) => {
  try {
    // Se intenta validar los datos de entrada de la solicitud utilizando el esquema proporcionado
    await schema.parse(req.body);

    // Si la validación es exitosa, se pasa al siguiente middleware en la cadena de middleware
    next();
  } catch (error) {
    // Si ocurre un error durante la validación

    // Si el error tiene una propiedad 'errors', significa que es un error de validación generado por el esquema
    if (Array.isArray(error.errors)) {
      // Se responde con un código de estado 400 (Solicitud incorrecta) y se envían los mensajes de error como una matriz
      return res.status(400).json(error.errors.map((error) => error.message));
    }

    // Si el error no tiene una propiedad 'errors', se responde con un código de estado 400 (Solicitud incorrecta)
    // y se envía el mensaje de error
    return res.status(400).json(error.message);
  }
};
