package com.lendit.lendit_backend.config;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import javax.sql.DataSource;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReviewTableSchemaSync implements CommandLineRunner {

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try (Connection connection = dataSource.getConnection()) {
            String catalog = connection.getCatalog();
            String schema = connection.getSchema();

            if (!tableExists(connection.getMetaData(), catalog, schema, "reviews")) {
                log.info("ReviewTableSchemaSync: 'reviews' table not found yet, skipping sync.");
                return;
            }

            Set<String> columns = getColumns(connection.getMetaData(), catalog, schema, "reviews");

            if (columns.contains("damage_report")) {
                jdbcTemplate.execute("ALTER TABLE reviews DROP COLUMN damage_report");
                log.info("ReviewTableSchemaSync: dropped legacy column 'damage_report'.");
                columns.remove("damage_report");
            }

            Map<String, String> requiredColumns = new LinkedHashMap<>();
            requiredColumns.put("created_at", "DATETIME(6) NOT NULL");
            requiredColumns.put("rating", "INT NOT NULL");
            requiredColumns.put("remarks", "TEXT NULL");
            requiredColumns.put("booking_id", "BIGINT NOT NULL");
            requiredColumns.put("reviewee_id", "BIGINT NOT NULL");
            requiredColumns.put("reviewer_id", "BIGINT NOT NULL");
            requiredColumns.put("tool_condition", "INT NULL");
            requiredColumns.put("experience", "INT NULL");

            for (Map.Entry<String, String> entry : requiredColumns.entrySet()) {
                if (!columns.contains(entry.getKey())) {
                    jdbcTemplate.execute("ALTER TABLE reviews ADD COLUMN " + entry.getKey() + " " + entry.getValue());
                    log.info("ReviewTableSchemaSync: added missing column '{}'.", entry.getKey());
                }
            }

            log.info("ReviewTableSchemaSync: reviews table sync completed.");
        } catch (SQLException ex) {
            throw new RuntimeException("Failed to synchronize reviews table schema", ex);
        }
    }

    private boolean tableExists(DatabaseMetaData metaData, String catalog, String schema, String tableName) throws SQLException {
        try (ResultSet rs = metaData.getTables(catalog, schema, tableName, new String[] { "TABLE" })) {
            return rs.next();
        }
    }

    private Set<String> getColumns(DatabaseMetaData metaData, String catalog, String schema, String tableName) throws SQLException {
        try (ResultSet rs = metaData.getColumns(catalog, schema, tableName, null)) {
            Set<String> columns = new java.util.HashSet<>();
            while (rs.next()) {
                String name = rs.getString("COLUMN_NAME");
                if (name != null) {
                    columns.add(name.toLowerCase(Locale.ROOT));
                }
            }
            return columns.stream().collect(Collectors.toSet());
        }
    }
}
