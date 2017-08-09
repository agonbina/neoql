# neoql

This library contains utilities which can be used to automatically create resolvers from your graphql schema into cypher(neo4j) queries.

Goals:
- Implement a `Node` interface in the schema
- Implement a `Relationship` interface in the schema
- Implement a `graphql-tools` utility which generates resolvers for all types(in the schema) that implement `Node` and `Relationship`