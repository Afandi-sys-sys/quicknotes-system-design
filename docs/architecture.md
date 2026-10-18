# QuickNotes System Architecture

## 1. Overview

QuickNotes is a note-taking application that allows users to create, read, update, delete, and organize notes.

The system uses a web frontend, REST API servers, a relational database, caching, and a background job queue. The architecture is designed to support growth while maintaining security, availability, and acceptable response times.

## 2. Functional Requirements

The system must allow users to:

1. Register and log in securely.
2. Create notes with a required title and optional body.
3. View and search their notes.
4. Update existing notes.
5. Delete notes.
6. Organize notes using tags.
7. Access their notes from a web browser.
8. Receive clear messages when requests succeed or fail.

## 3. Non-Functional Requirements

### Performance

- Common note-reading requests should aim for a response time below 300 milliseconds at the 95th percentile under normal load.
- Frequently accessed notes may be served from a cache.
- Database queries should use appropriate indexes.

### Availability

- The service should target 99.9% monthly availability.
- Multiple application servers should reduce dependence on a single server.
- Database backups and recovery procedures should protect against data loss.

### Security

- HTTPS encrypts traffic between clients and the service.
- Authentication verifies user identity.
- Authorization ensures users can access only their own private notes.
- Passwords are stored as secure hashes rather than plaintext.
- Input validation and rate limiting reduce common application risks.

### Scalability

- Application servers should be stateless where possible so that additional instances can be added behind a load balancer.
- Read replicas can help handle database read traffic.
- Caching can reduce repeated database queries.
- Background workers can process tasks outside the main request-response path.

### Maintainability

- The application should separate frontend, API, database, and background-processing responsibilities.
- Automated tests and monitoring should help identify defects and performance problems.

## 4. Architecture Diagram

```text
                    +-------------------------+
                    |      Web Browser        |
                    |    QuickNotes Client    |
                    +------------+------------+
                                 |
                                 v
                    +-------------------------+
                    |       DNS Service       |
                    +------------+------------+
                                 |
                                 v
                    +-------------------------+
                    |     CDN / Edge Layer    |
                    | Static HTML, CSS, JS    |
                    +------------+------------+
                                 |
                                 v
                    +-------------------------+
                    |     Load Balancer       |
                    +------------+------------+
                                 |
                      +----------+----------+
                      |                     |
                      v                     v
             +----------------+    +----------------+
             | Application    |    | Application    |
             | Server 1       |    | Server 2       |
             +-------+--------+    +--------+-------+
                     |                      |
                     +----------+-----------+
                                |
                    +-----------+-----------+
                    |                       |
                    v                       v
             +-------------+         +-------------+
             | Cache       |         | Job Queue   |
             | Redis       |         |             |
             +------+------+         +------+------+
                    |                       |
                    |                       v
                    |               +---------------+
                    |               | Background    |
                    |               | Worker        |
                    |               +-------+-------+
                    |                       |
                    +-----------+-----------+
                                |
                                v
                       +------------------+
                       | Primary Database |
                       |   PostgreSQL     |
                       +--------+---------+
                                |
                         Replication
                                |
                                v
                       +------------------+
                       | Read Replica     |
                       |   PostgreSQL     |
                       +------------------+
```

The diagram shows the major components and their intended relationships. In a production deployment, database access would be controlled by the application layer, and the primary database would handle writes while the read replica could serve eligible read queries.

## 5. Component Responsibilities

### Web Browser

Displays the QuickNotes interface and sends HTTP requests to the API.

### DNS Service

Translates the application's domain name into the address of the appropriate network endpoint.

### CDN / Edge Layer

Caches static frontend assets closer to users to reduce loading time and traffic reaching the origin server.

### Load Balancer

Distributes incoming API requests across healthy application servers and avoids routing traffic to unhealthy instances.

### Application Servers

Validate requests, authenticate users, enforce authorization, run application logic, and communicate with the cache and database.

At least two application servers allow traffic to continue if one instance becomes unavailable, provided the load balancer and remaining server have sufficient capacity.

### Cache

A Redis cache stores frequently requested data temporarily to reduce repeated database reads and improve response times.

Cached private data must be isolated by user and authorization context to prevent information from being exposed across accounts.

### Primary Database

The PostgreSQL primary database stores authoritative user, note, tag, and relationship data. It processes writes and maintains transactional consistency.

### Read Replica

The read replica receives replicated database changes from the primary and can serve suitable read-only queries.

Replication may lag behind the primary, so the application must consider consistency requirements before reading recently changed data from the replica.

### Job Queue

The queue holds background tasks that do not need to finish before an API request can return.

### Background Worker

A worker processes queued jobs, such as sending email notifications, performing scheduled cleanup, or generating reports.

Workers should retry transient failures safely and avoid processing the same job twice when possible.

## 6. Estimated Load for One Million Users

For capacity planning, assume the application has one million registered users and approximately 100,000 daily active users.

These estimates are illustrative planning assumptions, not measured production traffic.

### Assumptions

- Registered users: 1,000,000
- Daily active users: 100,000
- Average reads per active user per day: 40
- Average writes per active user per day: 5
- Average note size, including ordinary text fields: 2 KB
- Average notes created per active user per day: 2

### Estimated Read Traffic

Daily reads:

100,000 active users × 40 reads = 4,000,000 reads per day.

Average reads per second:

4,000,000 ÷ 86,400 ≈ 46 reads per second.

For planning, a peak of approximately 460 reads per second could be used as an initial ten-times-average traffic assumption.

### Estimated Write Traffic

Daily writes:

100,000 active users × 5 writes = 500,000 writes per day.

Average writes per second:

500,000 ÷ 86,400 ≈ 5.8 writes per second.

A peak of approximately 58 writes per second is a reasonable initial ten-times-average planning assumption.

### Estimated Storage Growth

Assume two new notes per active user per day.

Daily note creation:

100,000 × 2 = 200,000 notes per day.

Estimated storage for note content:

200,000 × 2 KB = 400,000 KB per day, or approximately 400 MB per day using decimal units.

Estimated annual note content:

400 MB × 365 ≈ 146 GB per year.

This estimate covers note content only. It excludes database indexes, user records, tags, replication, backups, logs, and other operational overhead.

Real storage requirements would therefore be higher.

### Capacity Planning Summary

| Metric              | Estimated Average | Initial Peak Planning Estimate |
| ------------------- | ----------------: | -----------------------------: |
| Reads per second    |                46 |                            460 |
| Writes per second   |               5.8 |                             58 |
| New notes per day   |           200,000 |         Depends on usage peaks |
| Annual note content |            146 GB |              Excludes overhead |

The system should be monitored and load-tested so that its actual capacity can be adjusted to observed traffic.

## 7. Request Flow: GET /notes

When a user requests their notes:

1. The browser sends `GET /v1/notes` to the API.
2. DNS resolves the application domain, and the request reaches the load balancer.
3. The load balancer selects a healthy application server.
4. The application server authenticates the user and validates their permissions.
5. The server checks the cache for the user's notes.
6. If suitable cached data exists, the server returns it after confirming that it is safe to use.
7. If the cache misses, the application queries PostgreSQL. An eligible read may use the read replica.
8. The application returns the notes as JSON.
9. Where appropriate, the application updates the cache with a suitable expiration time.

For operations that require the latest committed data, such as immediately reading a note after creating it, the application may read from the primary database instead of a potentially lagging replica.

## 8. Request Flow: POST /notes

When a user creates a note:

1. The browser sends `POST /v1/notes` with a JSON request body and authentication credentials.
2. The load balancer forwards the request to a healthy application server.
3. The application authenticates the user and validates the title and body.
4. The application inserts the new note into the primary PostgreSQL database.
5. The database commits the transaction and returns the new note ID.
6. The application invalidates or updates any affected cache entries.
7. The API returns `201 Created` with the saved note in the response body.
8. If a separate background task is required, the application can publish a job to the queue for a worker to process.

The application should not report successful creation before the database transaction has committed.

## 9. Architectural Trade-Offs

### Trade-Off 1: Cache Performance vs Data Freshness

Caching reduces database load and can improve response times. However, cached data may become stale after a note is updated or deleted.

The application should use cache expiration and invalidation strategies. Requests that require the latest data can bypass the cache when appropriate.

### Trade-Off 2: Read Replicas vs Consistency

Read replicas increase read capacity and can reduce load on the primary database.

However, replication lag may cause a user to temporarily see old data. Recently written data can be read from the primary when stronger consistency is required.

### Trade-Off 3: Simplicity vs Scalability

A single application server and database are simpler to develop and operate, but they provide limited capacity and introduce failure risks.

Multiple application servers, a load balancer, a cache, a queue, and a replica improve scalability and resilience but increase infrastructure costs and operational complexity.

### Trade-Off 4: Synchronous vs Asynchronous Processing

Synchronous processing gives users an immediate result but can increase request latency when a task takes a long time.

A queue and background worker allow nonessential tasks to run asynchronously, but they introduce eventual completion, retry, and duplicate-processing considerations.

## 10. Avoiding Single Points of Failure

A single point of failure is a component whose failure can make the entire service unavailable.

The architecture reduces these risks through the following measures:

- **Application servers:** Run at least two instances across separate failure domains and use health checks with the load balancer.
- **Load balancing:** Deploy a managed or redundant load-balancing service instead of relying on a single manually maintained server.
- **Database:** Configure backups, replication monitoring, and a tested failover procedure; replication alone is not a backup.
- **Cache:** Allow the application to degrade gracefully if the cache becomes unavailable, falling back to the database where capacity permits.
- **Job queue:** Use durable queue storage, retry policies, and monitoring for jobs that repeatedly fail.
- **DNS and CDN:** Use reliable managed services and appropriate health checks and caching policies.
- **Monitoring:** Collect logs, metrics, and alerts so that failures can be detected and investigated quickly.
- **Recovery:** Regularly test database restoration and disaster-recovery procedures.

A read replica is not automatically a failover solution. Promotion to primary must be configured and tested, and the application must reconnect safely after a database role change.

## 11. Conclusion

This architecture provides a scalable starting point for QuickNotes.

The load balancer and multiple application servers distribute traffic, the cache reduces repeated reads, PostgreSQL maintains structured and consistent data, the read replica increases eligible read capacity, and the job queue supports background processing.

The design can evolve as real traffic, reliability requirements, and operating costs become clearer.
