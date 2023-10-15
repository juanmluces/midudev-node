import mysql from 'mysql2/promise'
import 'dotenv/config'

const DEFAULT_CONFIG = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
}

const config = process.env.PLANET_SCALE_DATABASE_URL ?? DEFAULT_CONFIG

const connection = await mysql.createConnection(config)

export class MovieModel {
  static async getAll ({ genre }) {
    if (genre) {
      const lowerCaseGenre = genre.toLowerCase()
      const [movies] = await connection.query(`
      SELECT
      BIN_TO_UUID(movie.id) AS id,
      movie.title,
      movie.year,
      movie.director,
      movie.duration,
      movie.poster,
      movie.rate,
      GROUP_CONCAT(genre.name) AS genres
      FROM movie
      INNER JOIN (
        SELECT movie_id
        FROM movie_genres
        INNER JOIN genre ON movie_genres.genre_id = genre.id
        WHERE genre.name = ?
      ) AS action_movies ON movie.id = action_movies.movie_id
      INNER JOIN movie_genres ON movie.id = movie_genres.movie_id
      INNER JOIN genre ON movie_genres.genre_id = genre.id
      GROUP BY movie.id`, [lowerCaseGenre])
      return movies.map(movie => {
        movie.genres = movie.genres.split(',')
        return movie
      })
    }

    const [movies] = await connection.query(`
    SELECT 
    BIN_TO_UUID(movie.id) AS id,
    movie.title,
    movie.year,
    movie.director,
    movie.duration,
    movie.poster,
    movie.rate,
    GROUP_CONCAT(genre.name) AS genres
    FROM movie 
    LEFT JOIN movie_genres ON movie.id = movie_genres.movie_id
    LEFT JOIN genre ON movie_genres.genre_id = genre.id
    GROUP BY movie.id
  `)
    return movies.map(movie => {
      movie.genres = movie.genres?.split(',')
      return movie
    })
  }

  static async getById ({ id }) {
    const [movies] = await connection.query(`
    SELECT 
    BIN_TO_UUID(movie.id) AS id,
    movie.title,
    movie.year,
    movie.director,
    movie.duration,
    movie.poster,
    movie.rate,
    GROUP_CONCAT(genre.name) AS genres
    FROM movie 
    LEFT JOIN movie_genres ON movie.id = movie_genres.movie_id
    LEFT JOIN genre ON movie_genres.genre_id = genre.id
    WHERE movie.id = UUID_TO_BIN(?)
    GROUP BY movie.id
    `, id)
    return movies.map(movie => {
      movie.genres = movie.genres?.split(',')
      return movie
    })
  }

  static async create ({ input }) {
    const {
      genre: genreInput,
      title,
      year,
      duration,
      director,
      rate,
      poster
    } = input

    const [uuidResult] = await connection.query('SELECT UUID() uuid;')
    const [{ uuid }] = uuidResult

    try {
      await connection.query(`
      INSERT INTO movie (id, title, year, director, duration, poster, rate) 
      VALUES
      ( UUID_TO_BIN("${uuid}"),?, ?, ?, ?, ?, ? );
      `, [title, year, director, duration, poster, rate])

      const genreRelationQuery = genreInput.map(genre => `(UUID_TO_BIN("${uuid}"), (SELECT id FROM genre WHERE name = ?) )`).join(', ')

      await connection.query(`
      INSERT INTO movie_genres (movie_id, genre_id) VALUES
      ${genreRelationQuery}
      `, [...genreInput])
    } catch (e) {
      //  Nunca lo debe ver el usuario, puede contener información sensible
      throw new Error('Error creating movie')
      // enviar la traza a un servicio interno
      // sendLog(e)
    }

    const [movies] = await connection.query(`
      SELECT
      BIN_TO_UUID(movie.id) AS id,
      movie.title,
      movie.year,
      movie.director,
      movie.duration,
      movie.poster,
      movie.rate,
      GROUP_CONCAT(genre.name) AS genres
      FROM movie 
      LEFT JOIN movie_genres ON movie.id = movie_genres.movie_id
      LEFT JOIN genre ON movie_genres.genre_id = genre.id
      WHERE movie.id = UUID_TO_BIN('${uuid}')
      GROUP BY movie.id
      `)
    return movies.map(movie => {
      movie.genres = movie.genres?.split(',')
      return movie
    })[0]
  }

  static async delete ({ id }) {
    const [result] = await connection.query('DELETE FROM movie WHERE (id = UUID_TO_BIN(?))', [id])
    return Boolean(result.affectedRows)
  }

  static async update ({ id, input }) {
    const inputKeys = Object.keys(input)
    const inputValues = Object.values(input)
    const setQuery = inputKeys.map(key => `${key} = ?`).join(',')
    const [result] = await connection.query(`
    UPDATE movie
    SET
    ${setQuery}
    WHERE id = UUID_TO_BIN(?)
    `, [...inputValues, id])
    if (!result.affectedRows) return false
    const [movies] = await connection.query(`
    SELECT
    BIN_TO_UUID(movie.id) AS id,
    movie.title,
    movie.year,
    movie.director,
    movie.duration,
    movie.poster,
    movie.rate,
    GROUP_CONCAT(genre.name) AS genres
    FROM movie 
    LEFT JOIN movie_genres ON movie.id = movie_genres.movie_id
    LEFT JOIN genre ON movie_genres.genre_id = genre.id
    WHERE movie.id = UUID_TO_BIN(?)
    GROUP BY movie.id
    `, [id])
    return movies.map(movie => {
      movie.genres = movie.genres?.split(',')
      return movie
    })[0]
  }
}
