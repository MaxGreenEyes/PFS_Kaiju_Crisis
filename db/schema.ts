import { integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
export const eventState = sqliteTable("event_state", {
  id: integer("id").primaryKey(),
  tableCount: integer("table_count").notNull().default(8),
  phase: text("phase").notNull().default("intro"),
  startedAt: integer("started_at"),
  elapsedBeforePause: integer("elapsed_before_pause").notNull().default(0),
  paused: integer("paused", { mode: "boolean" }).notNull().default(true),
  revision: integer("revision").notNull().default(0),
  settingsJson: text("settings_json").notNull().default('{}'),
});
export const reports = sqliteTable("reports", {
  tableNo: integer("table_no").notNull(),
  reportKey: text("report_key").notNull(),
  count: integer("count").notNull().default(0),
}, t => [primaryKey({ columns: [t.tableNo, t.reportKey] })]);
export const announcements = sqliteTable("announcements", {
  key: text("key").primaryKey(),
  announcedAt: integer("announced_at").notNull(),
});
