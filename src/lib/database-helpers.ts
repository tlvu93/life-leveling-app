import { sql } from "./db";
import {
  PaginationOptions,
  PaginatedResult,
  QueryBuilder,
  DatabaseError,
  CreateResult,
  UpdateResult,
  DeleteResult,
  BatchCreateResult,
} from "@/types";

// Enhanced error handling wrapper
export async function executeWithErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`Database operation failed in ${context}:`, error);

    // Transform database errors into more user-friendly errors
    if (error && typeof error === "object" && "code" in error) {
      const dbError = error as any;

      switch (dbError.code) {
        case "23505": // Unique violation
          throw new Error(
            `Duplicate entry: ${dbError.detail || "Record already exists"}`
          );
        case "23503": // Foreign key violation
          throw new Error(
            `Invalid reference: ${
              dbError.detail || "Referenced record does not exist"
            }`
          );
        case "23514": // Check constraint violation
          throw new Error(
            `Invalid data: ${
              dbError.detail || "Data does not meet requirements"
            }`
          );
        case "23502": // Not null violation
          throw new Error(
            `Missing required field: ${
              dbError.column || "Required field is missing"
            }`
          );
        default:
          throw new Error(
            `Database error: ${dbError.message || "Unknown database error"}`
          );
      }
    }

    throw error;
  }
}

// Generic paginated query function
export async function executePaginatedQuery<T>(
  baseQuery: string,
  params: any[],
  options: PaginationOptions,
  countQuery?: string
): Promise<PaginatedResult<T>> {
  return executeWithErrorHandling(async () => {
    const { page, limit, sortBy, sortOrder = "ASC" } = options;
    const offset = (page - 1) * limit;

    // Build the final query with pagination
    let finalQuery = baseQuery;

    if (sortBy) {
      finalQuery += ` ORDER BY ${sortBy} ${sortOrder}`;
    }

    finalQuery += ` LIMIT ${limit} OFFSET ${offset}`;

    // Execute the main query
    const data = (await sql(finalQuery, ...params)) as T[];

    // Get total count
    let total = 0;
    if (countQuery) {
      const countResult = await sql(countQuery, ...params);
      total = parseInt(countResult[0]?.count || "0");
    } else {
      // Fallback: modify the original query to get count
      const countQueryFallback = baseQuery.replace(
        /SELECT .+ FROM/,
        "SELECT COUNT(*) as count FROM"
      );
      const countResult = await sql(countQueryFallback, ...params);
      total = parseInt(countResult[0]?.count || "0");
    }

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }, "executePaginatedQuery");
}

// Query builder helper
export function buildSelectQuery(builder: QueryBuilder): {
  query: string;
  params: any[];
} {
  const {
    select = ["*"],
    from,
    joins = [],
    where = {},
    orderBy = [],
    limit,
    offset,
  } = builder;

  let query = `SELECT ${select.join(", ")} FROM ${from}`;
  const params: any[] = [];
  let paramIndex = 1;

  // Add joins
  for (const join of joins) {
    query += ` ${join.type || "INNER"} JOIN ${join.table} ON ${join.on}`;
  }

  // Add where conditions
  const whereConditions: string[] = [];
  for (const [key, value] of Object.entries(where)) {
    if (value !== undefined && value !== null) {
      whereConditions.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  if (whereConditions.length > 0) {
    query += ` WHERE ${whereConditions.join(" AND ")}`;
  }

  // Add order by
  if (orderBy.length > 0) {
    const orderClauses = orderBy.map((o) => `${o.column} ${o.direction}`);
    query += ` ORDER BY ${orderClauses.join(", ")}`;
  }

  // Add limit and offset
  if (limit) {
    query += ` LIMIT ${limit}`;
  }
  if (offset) {
    query += ` OFFSET ${offset}`;
  }

  return { query, params };
}

// Generic CRUD operations
export async function createRecord<T>(
  table: string,
  data: Record<string, any>,
  returningColumns: string[] = ["*"]
): Promise<CreateResult<T>> {
  return executeWithErrorHandling(async () => {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`);

    const query = `
      INSERT INTO ${table} (${columns.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING ${returningColumns.join(", ")}
    `;

    const result = await sql(query, ...values);

    return {
      success: true,
      data: result[0] as T,
    };
  }, `createRecord:${table}`);
}

export async function updateRecord<T>(
  table: string,
  id: string,
  data: Record<string, any>,
  returningColumns: string[] = ["*"]
): Promise<UpdateResult<T>> {
  return executeWithErrorHandling(async () => {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns
      .map((col, index) => `${col} = $${index + 1}`)
      .join(", ");

    const query = `
      UPDATE ${table}
      SET ${setClause}
      WHERE id = $${values.length + 1}
      RETURNING ${returningColumns.join(", ")}
    `;

    const result = await sql(query, ...values, id);

    return {
      success: true,
      data: result[0] as T,
      rowsAffected: result.length,
    };
  }, `updateRecord:${table}`);
}

export async function deleteRecord(
  table: string,
  id: string
): Promise<DeleteResult> {
  return executeWithErrorHandling(async () => {
    const query = `DELETE FROM ${table} WHERE id = $1`;
    const result = await sql(query, id);

    return {
      success: true,
      rowsAffected: result.length,
    };
  }, `deleteRecord:${table}`);
}

// Batch operations
export async function batchCreateRecords<T>(
  table: string,
  records: Record<string, any>[],
  returningColumns: string[] = ["*"]
): Promise<BatchCreateResult<T>> {
  const created: T[] = [];
  const failed: Array<{ data: any; error: string }> = [];

  for (const record of records) {
    try {
      const result = await createRecord<T>(table, record, returningColumns);
      if (result.success && result.data) {
        created.push(result.data);
      }
    } catch (error) {
      failed.push({
        data: record,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    success: failed.length === 0,
    created,
    failed,
    totalAttempted: records.length,
    totalCreated: created.length,
    totalFailed: failed.length,
  };
}

// Specialized query functions
export async function findRecordById<T>(
  table: string,
  id: string,
  columns: string[] = ["*"]
): Promise<T | null> {
  return executeWithErrorHandling(async () => {
    const query = `SELECT ${columns.join(", ")} FROM ${table} WHERE id = $1`;
    const result = await sql(query, id);
    return result.length > 0 ? (result[0] as T) : null;
  }, `findRecordById:${table}`);
}

export async function findRecordsByField<T>(
  table: string,
  field: string,
  value: any,
  columns: string[] = ["*"],
  orderBy?: string
): Promise<T[]> {
  return executeWithErrorHandling(async () => {
    let query = `SELECT ${columns.join(
      ", "
    )} FROM ${table} WHERE ${field} = $1`;

    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }

    const result = await sql(query, value);
    return result as T[];
  }, `findRecordsByField:${table}`);
}

export async function countRecords(
  table: string,
  whereConditions: Record<string, any> = {}
): Promise<number> {
  return executeWithErrorHandling(async () => {
    let query = `SELECT COUNT(*) as count FROM ${table}`;
    const params: any[] = [];

    const conditions = Object.entries(whereConditions).filter(
      ([_, value]) => value !== undefined && value !== null
    );

    if (conditions.length > 0) {
      const whereClause = conditions
        .map(([key], index) => `${key} = $${index + 1}`)
        .join(" AND ");
      query += ` WHERE ${whereClause}`;
      params.push(...conditions.map(([_, value]) => value));
    }

    const result = await sql(query, ...params);
    return parseInt(result[0]?.count || "0");
  }, `countRecords:${table}`);
}

// Transaction helper
export async function executeTransaction<T>(
  operations: Array<() => Promise<any>>
): Promise<T[]> {
  return executeWithErrorHandling(async () => {
    // Note: Neon doesn't support explicit transactions in the same way as traditional PostgreSQL
    // This is a simplified version - in production, you might want to use a different approach
    const results: T[] = [];

    for (const operation of operations) {
      const result = await operation();
      results.push(result);
    }

    return results;
  }, "executeTransaction");
}

// Health check functions
export async function checkTableExists(tableName: string): Promise<boolean> {
  return executeWithErrorHandling(async () => {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      )
    `;
    return result[0]?.exists || false;
  }, `checkTableExists:${tableName}`);
}

export async function getTableRowCount(tableName: string): Promise<number> {
  return executeWithErrorHandling(async () => {
    const result = await sql(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt(result[0]?.count || "0");
  }, `getTableRowCount:${tableName}`);
}

// Index and performance helpers
export async function analyzeTablePerformance(tableName: string): Promise<{
  rowCount: number;
  tableSize: string;
  indexCount: number;
}> {
  return executeWithErrorHandling(async () => {
    // Get row count
    const rowCountResult = await sql(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    const rowCount = parseInt(rowCountResult[0]?.count || "0");

    // Get table size
    const sizeResult = await sql`
      SELECT pg_size_pretty(pg_total_relation_size(${tableName}::regclass)) as size
    `;
    const tableSize = sizeResult[0]?.size || "Unknown";

    // Get index count
    const indexResult = await sql`
      SELECT COUNT(*) as count
      FROM pg_indexes
      WHERE tablename = ${tableName}
    `;
    const indexCount = parseInt(indexResult[0]?.count || "0");

    return {
      rowCount,
      tableSize,
      indexCount,
    };
  }, `analyzeTablePerformance:${tableName}`);
}
