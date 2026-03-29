import { relations } from "drizzle-orm";
import { pgTable, timestamp,integer, varchar } from "drizzle-orm/pg-core";

const timestamps = {
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}

export const departments = pgTable("departments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  Code: varchar('Code',{length: 50}).notNull(),
  name: varchar('name',{length: 225}).notNull(),
  description: varchar('description',{length: 225}),
  ...timestamps
});

export const subjects = pgTable("subjects", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  departmentId: integer('department_id').notNull().references(() => departments.id, {onDelete: 'restrict'}),
  name: varchar('name',{length: 225}).notNull(),
  Code: varchar('Code',{length: 50}).notNull().unique(),
  description: varchar('description',{length: 225}),
  ...timestamps
});

export const departmentRelations = relations(departments,({many}) => ({subjects: many(subjects)}))

export const subjectsRelations = relations(subjects,({one,many}) => ({departments: one(departments,{
    fields: [subjects.departmentId],
    references: [departments.id]
})}))