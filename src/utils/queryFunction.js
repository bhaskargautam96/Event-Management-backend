// Make a query function for sql database which will be full dynamic there i m gonna pass row and all thing
import sql from "../db/postgres.db.connection.js";

export const insertRecord = async (table, data) => {
  try {
    const result = await sql`
      INSERT INTO ${sql(table)} ${sql(data)}
      RETURNING *;
    `;
    return result[0];
  } catch (error) {
    console.error("Insert Error:", error.message);
    throw error;
  }
};

export const readRecord = async ({
  table,
  select = ["*"],
  conditions = {},
  orderBy,
  limit,
  page,
}) => {
  try {
    const offset = page && limit ? (page - 1) * limit : 0;

    const result = await sql`
      SELECT ${sql(select)}
      FROM ${sql(table)}
      ${Object.keys(conditions).length ? sql`WHERE ${sql(conditions)}` : sql``}
      ${
        orderBy
          ? sql`ORDER BY ${sql(orderBy.column)} ${sql(orderBy.direction)}`
          : sql``
      }
      ${limit ? sql`LIMIT ${limit}` : sql``}
      ${limit && page ? sql`OFFSET ${offset}` : sql``}
    `;

    return result;
  } catch (error) {
    console.error("Read Error:", error.message);
    throw error;
  }
};

export const updateRecord = async (table, id, data) => {
  try {
    const result = await sql`
      UPDATE ${sql(table)}
      SET ${sql(data)}
      WHERE id = ${id}
      RETURNING *;
    `;
    return result[0];
  } catch (error) {
    console.error("Update Error:", error.message);
    throw error;
  }
};

export const deleteRecord = async (table, id) => {
  try {
    const result = await sql`
      DELETE FROM ${sql(table)}
      WHERE id = ${id}
      RETURNING *;
    `;
    return result[0];
  } catch (error) {
    console.error("Delete Error:", error.message);
    throw error;
  }
};

export const countRecords = async (table, conditions = {}) => {
  try {
    const result = await sql`
      SELECT COUNT(*) as total
      FROM ${sql(table)}
      ${Object.keys(conditions).length ? sql`WHERE ${sql(conditions)}` : sql``}
    `;
    return parseInt(result[0].total);
  } catch (error) {
    console.error("Count Error:", error.message);
    throw error;
  }
};
