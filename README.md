# CodeVector Product Pagination Backend

This is a production-quality backend to efficiently browse, filter, and paginate ~200,000 products.

## Architecture Decisions

### 1. Why MongoDB was chosen?
MongoDB is a NoSQL database that excels at storing large volumes of unstructured or semi-structured data. It was chosen here because it allows extremely fast reads and writes without complex schema migrations. Features like `insertMany` for fast bulk data generation and powerful indexing make it a great choice for paginating through millions of documents efficiently.

### 2. Why offset/skip pagination was avoided?
Offset-based pagination (`limit` and `skip`) becomes increasingly slow as the offset grows. This is because the database must sequentially read and discard all `skip` records before returning the next page. Additionally, offset pagination is highly prone to data anomalies (skipping items or duplicating items) if new records are inserted or existing ones are deleted/updated while the user is actively paging through results.

### 3. Why cursor pagination was chosen?
Cursor (keyset) pagination does not skip records. Instead, it uses a unique identifier (the cursor) to pinpoint exactly where the last page left off, and immediately fetches records "after" that point. Cursor pagination allows MongoDB to efficiently seek into the index and continue scanning from the last cursor position. Performance remains stable even for deep pages because the database does not need to skip previously visited records.

### 4. How `(updated_at, _id)` guarantees stable ordering?
Sorting simply by `updated_at` can result in ties if multiple products are updated at the exact same millisecond. If a tie occurs at a page boundary, standard pagination logic might skip or duplicate one of the tied records. 

By adding `_id` as a secondary sort parameter (`updated_at DESC, _id DESC`), we create a strict, deterministic global ordering. MongoDB `_id` values are mathematically guaranteed to be unique. Thus, no two items will ever share the same exact `(updated_at, _id)` pair, ensuring absolute stability. 

### 5. How indexes improve performance?
Without indexes, MongoDB must perform a "collection scan" (checking every single document in the 200,000+ database) to find the documents matching the query and sorting them. This is extremely slow.
By creating compound indexes (`{ updated_at: -1, _id: -1 }` and `{ category: 1, updated_at: -1, _id: -1 }`), MongoDB maintains an internally sorted B-Tree. When a request asks for "documents where updated_at < X and category = Y", the database instantly jumps to the correct node in the index and reads the top 20 items sequentially. The indexes significantly reduce query latency by avoiding full collection scans and allowing MongoDB to use efficient index scans for filtering and sorting.

### 6. Consistency During Data Changes
The system uses cursor pagination based on the tuple `(updated_at, _id)`.

When new products are inserted or existing products are updated, their position in the ordering may change. Offset-based pagination can therefore produce duplicates or skipped records.

Using a deterministic cursor based on `(updated_at, _id)` ensures stable traversal of the dataset and prevents pagination anomalies caused by concurrent inserts or updates.

### 7. Future improvements
- **Caching**: Implement a Redis cache for frequently accessed pages or total count aggregates.
- **Validation**: Use Joi or Zod middleware to robustly validate incoming query parameters.
- **Testing**: Add Jest and Supertest unit/integration test suites to guarantee endpoint reliability.
- **Dockerization**: Provide a `Dockerfile` and `docker-compose.yml` for seamless deployment and local testing.

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Run the seed script to generate 200,000 products:
   ```bash
   npm run seed
   ```
4. Start the server:
   ```bash
   npm start
   ```

Visit `http://localhost:3000` to view the simple bonus UI.
