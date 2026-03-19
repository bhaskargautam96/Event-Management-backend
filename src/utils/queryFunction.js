// Make a query function for sql database which will be full dynamic there i m gonna pass row and all thing
import sql from "../db/postgres.db.connection.js";

const IDENTIFIER_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;

const safeIdentifier = (value, label = "identifier") => {
  const identifier = String(value || "").trim();
  if (!IDENTIFIER_REGEX.test(identifier)) {
    throw new Error(`Invalid SQL ${label}: ${value}`);
  }
  return sql.unsafe(`"${identifier}"`);
};

const safeQualifiedIdentifier = (
  value,
  label = "identifier",
  { allowStar = false } = {},
) => {
  const raw = String(value || "").trim();
  if (!raw) {
    throw new Error(`Invalid SQL ${label}: ${value}`);
  }

  const parts = raw.split(".").map((part) => part.trim());
  const quotedParts = parts.map((part, index) => {
    const isLast = index === parts.length - 1;
    if (allowStar && isLast && part === "*") return "*";
    if (!IDENTIFIER_REGEX.test(part)) {
      throw new Error(`Invalid SQL ${label}: ${value}`);
    }
    return `"${part}"`;
  });

  return sql.unsafe(quotedParts.join("."));
};

export const insertRecord = async (table, data) => {
  try {
    const result = await sql`
      INSERT INTO ${sql([table])} ${sql(data)}
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
  tableAlias,
  select = ["*"],
  where,
  conditions = {},
  rowQuery,
  joins,
  groupBy,
  having,
  orderBy,
  withClause,
  withRecursive = false,
  tail,
  limit,
  page,
  offset,
  distinct = false,
}) => {
  try {
    const mergeWithAnd = (fragments) => {
      if (!fragments.length) return null;
      let merged = fragments[0];
      for (let index = 1; index < fragments.length; index += 1) {
        merged = sql`${merged} AND ${fragments[index]}`;
      }
      return merged;
    };

    const mergeWithComma = (fragments) => {
      if (!fragments.length) return null;
      let merged = fragments[0];
      for (let index = 1; index < fragments.length; index += 1) {
        merged = sql`${merged}, ${fragments[index]}`;
      }
      return merged;
    };

    const mergeWithSpace = (fragments) => {
      if (!fragments.length) return null;
      let merged = fragments[0];
      for (let index = 1; index < fragments.length; index += 1) {
        merged = sql`${merged} ${fragments[index]}`;
      }
      return merged;
    };

    const toArray = (value) => {
      if (Array.isArray(value)) return value;
      if (value === undefined || value === null || value === "") return [];
      return [value];
    };

    const fromObjectToConditions = (input) => {
      if (!input || Array.isArray(input)) return [];
      return Object.entries(input)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([key, value]) =>
          sql`${safeQualifiedIdentifier(key, "column")} = ${value}`,
        );
    };

    const buildJoins = (items) => {
      const allowedJoinTypes = new Set([
        "INNER",
        "LEFT",
        "RIGHT",
        "FULL",
        "CROSS",
        "LEFT OUTER",
        "RIGHT OUTER",
        "FULL OUTER",
      ]);

      const joinItems = toArray(items).filter(Boolean);
      const joinFragments = joinItems.map((joinItem) => {
        if (!joinItem || typeof joinItem !== "object" || Array.isArray(joinItem)) {
          throw new Error("Invalid join config: each join must be an object");
        }

        const joinTypeRaw = String(joinItem.type || "INNER").trim().toUpperCase();
        const joinType = joinTypeRaw.replace(/\s+/g, " ");
        if (!allowedJoinTypes.has(joinType)) {
          throw new Error(`Invalid join type: ${joinItem.type}`);
        }

        const joinTableName = joinItem.table || joinItem.name;
        if (!joinTableName) {
          throw new Error("Invalid join config: join table is required");
        }

        const tableFragment = safeQualifiedIdentifier(joinTableName, "join table");
        const aliasFragment = joinItem.alias
          ? sql` ${safeIdentifier(joinItem.alias, "join alias")}`
          : sql``;

        const usingColumns = toArray(joinItem.using).filter(Boolean);
        const usingClause = usingColumns.length
          ? sql` USING (${mergeWithComma(
              usingColumns.map((column) =>
                safeQualifiedIdentifier(column, "join using column"),
              ),
            )})`
          : sql``;
        const onClause = joinItem.on ? sql` ON ${joinItem.on}` : sql``;

        if (joinType !== "CROSS" && !joinItem.on && !usingColumns.length) {
          throw new Error(
            "Invalid join config: non-CROSS joins require on or using",
          );
        }

        return sql`${sql.unsafe(joinType)} JOIN ${tableFragment}${aliasFragment}${usingClause}${onClause}`;
      });

      return mergeWithSpace(joinFragments);
    };

    const limitNumber = Number(limit);
    const hasLimit = Number.isFinite(limitNumber) && limitNumber > 0;
    const pageNumber = Number(page);
    const hasPage = Number.isFinite(pageNumber) && pageNumber > 0;
    const offsetNumber = Number(offset);
    const hasOffset = Number.isFinite(offsetNumber) && offsetNumber >= 0;
    const computedOffset = hasOffset
      ? offsetNumber
      : hasLimit && hasPage
      ? (pageNumber - 1) * limitNumber
      : 0;

    const selectColumns = Array.isArray(select) ? select : [select];
    const tableClause = safeQualifiedIdentifier(table, "table");
    const tableAliasClause = tableAlias
      ? sql` ${safeIdentifier(tableAlias, "table alias")}`
      : sql``;
    const isWildcardSelect =
      select === "*" ||
      (Array.isArray(select) && select.length === 1 && select[0] === "*");
    const selectClause = isWildcardSelect
      ? sql`*`
      : mergeWithComma(
          selectColumns.map((column) => {
            if (typeof column === "string") {
              return safeQualifiedIdentifier(column, "column", { allowStar: true });
            }
            return column;
          }),
        );

    const distinctColumns = distinct === true || distinct === false ? [] : toArray(distinct);
    const distinctClause =
      distinct === true
        ? sql`DISTINCT`
        : distinctColumns.length
        ? sql`DISTINCT ON (${mergeWithComma(
            distinctColumns.map((column) =>
              safeQualifiedIdentifier(column, "distinct column"),
            ),
          )})`
        : null;

    const joinClause = buildJoins(joins);

    const whereFragments = [
      ...fromObjectToConditions(conditions),
      ...(Array.isArray(conditions) ? conditions.filter(Boolean) : []),
      ...fromObjectToConditions(where),
      ...(Array.isArray(where) ? where.filter(Boolean) : []),
      ...(!Array.isArray(where) && where && typeof where !== "object" ? [where] : []),
      ...(rowQuery ? [rowQuery] : []),
    ];

    const whereClause = whereFragments.length
      ? sql`WHERE ${mergeWithAnd(whereFragments)}`
      : sql``;

    const groupByColumns = toArray(groupBy);
    const groupByClause = groupByColumns.length
      ? sql`GROUP BY ${mergeWithComma(
          groupByColumns.map((column) =>
            safeQualifiedIdentifier(column, "groupBy column"),
          ),
        )}`
      : sql``;

    const havingFragments = toArray(having).filter(Boolean);
    const havingClause = havingFragments.length
      ? sql`HAVING ${mergeWithAnd(havingFragments)}`
      : sql``;

    const orderItems = toArray(orderBy).filter(Boolean);
    const orderFragments = orderItems.map((item) => {
      if (typeof item === "string") {
        return sql`${safeQualifiedIdentifier(item, "orderBy column")} ASC`;
      }

      const direction =
        item?.direction && String(item.direction).toUpperCase() === "DESC"
          ? sql`DESC`
          : sql`ASC`;
      return sql`${safeQualifiedIdentifier(item?.column, "orderBy column")} ${direction}`;
    });

    const orderClause = orderFragments.length
      ? sql`ORDER BY ${mergeWithComma(orderFragments)}`
      : sql``;

    const selectExpression = distinctClause
      ? sql`${distinctClause} ${selectClause}`
      : selectClause;

    const withClausePart = withClause
      ? sql`WITH ${withRecursive ? sql`RECURSIVE ` : sql``}${withClause}`
      : sql``;

    const tailClause = tail ? sql`${tail}` : sql``;

    const result = await sql`
      ${withClausePart}
      SELECT ${selectExpression}
      FROM ${tableClause}${tableAliasClause}
      ${joinClause || sql``}
      ${whereClause}
      ${groupByClause}
      ${havingClause}
      ${orderClause}
      ${hasLimit ? sql`LIMIT ${limitNumber}` : sql``}
      ${computedOffset > 0 ? sql`OFFSET ${computedOffset}` : sql``}
      ${tailClause}
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
      UPDATE ${sql([table])}
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
      DELETE FROM ${sql([table])}
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
      FROM ${sql([table])}
      ${Object.keys(conditions).length ? sql`WHERE ${sql(conditions)}` : sql``}
    `;
    return parseInt(result[0].total);
  } catch (error) {
    console.error("Count Error:", error.message);
    throw error;
  }
};
