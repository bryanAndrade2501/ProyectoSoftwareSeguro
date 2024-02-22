import { pool } from "../db.js"; // Importación del pool de conexiones a la base de datos

// Función para obtener todas las tareas del usuario autenticado
export const getAllTasks = async (req, res, next) => {
  // Consultar la base de datos para obtener todas las tareas asociadas al usuario
  const result = await pool.query("SELECT * FROM task WHERE user_id = $1", [
    req.userId,
  ]);
  // Devolver las tareas encontradas como respuesta
  return res.json(result.rows);
};

// Función para obtener una tarea específica por su ID
export const getTask = async (req, res) => {
  // Consultar la base de datos para obtener la tarea con el ID proporcionado
  const result = await pool.query("SELECT * FROM task WHERE id = $1", [
    req.params.id,
  ]);

  // Si no se encuentra ninguna tarea con el ID proporcionado, devolver un mensaje de error
  if (result.rowCount === 0) {
    return res.status(404).json({
      message: "No existe una tarea con ese id",
    });
  }

  // Devolver la tarea encontrada como respuesta
  return res.json(result.rows[0]);
};

// Función para crear una nueva tarea
export const createTask = async (req, res, next) => {
  const { title, description } = req.body; // Extracción del título y descripción de la tarea del cuerpo de la solicitud

  try {
    // Insertar la nueva tarea en la base de datos
    const result = await pool.query(
      "INSERT INTO task (title, description, user_id) VALUES ($1, $2, $3) RETURNING *",
      [title, description, req.userId]
    );

    // Devolver la nueva tarea creada como respuesta
    res.json(result.rows[0]);
  } catch (error) {
    // Manejar errores durante el proceso de creación de la tarea
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Ya existe una tarea con ese título",
      });
    }
    next(error); // Pasar el error al siguiente middleware
  }
};

// Función para actualizar una tarea existente
export const updateTask = async (req, res) => {
  const id = req.params.id; // Obtener el ID de la tarea a actualizar desde los parámetros de la solicitud
  const { title, description } = req.body; // Obtener el título y la descripción actualizados de la tarea desde el cuerpo de la solicitud

  // Actualizar la tarea en la base de datos con los nuevos datos proporcionados
  const result = await pool.query(
    "UPDATE task SET title = $1, description = $2 WHERE id = $3 RETURNING *",
    [title, description, id]
  );

  // Si no se encuentra ninguna tarea con el ID proporcionado, devolver un mensaje de error
  if (result.rowCount === 0) {
    return res.status(404).json({
      message: "No existe una tarea con ese id",
    });
  }

  // Devolver la tarea actualizada como respuesta
  return res.json(result.rows[0]);
};

// Función para eliminar una tarea existente
export const deleteTask = async (req, res) => {
  // Eliminar la tarea de la base de datos con el ID proporcionado
  const result = await pool.query("DELETE FROM task WHERE id = $1", [
    req.params.id,
  ]);

  // Si no se encuentra ninguna tarea con el ID proporcionado, devolver un mensaje de error
  if (result.rowCount === 0) {
    return res.status(404).json({
      message: "No existe una tarea con ese id",
    });
  }

  // Devolver una respuesta exitosa
  return res.sendStatus(204);
};
