import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean, real, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("patient"), // "patient" or "therapist"
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const moodScales = pgTable("mood_scales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  levels: jsonb("levels").$type<Array<{
    level: number;
    title: string;
    description: string;
    behavioralIndicators: string[];
    category: 'depression' | 'normal' | 'elevation' | 'mania';
  }>>().notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const moodEntries = pgTable("mood_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  moodLevel: integer("mood_level").notNull(),
  moodScaleId: varchar("mood_scale_id").references(() => moodScales.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const abcSchemas = pgTable("abc_schemas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  activatingEvent: text("activating_event").notNull(),
  beliefs: text("beliefs").notNull(),
  consequences: text("consequences").notNull(),
  moodBefore: integer("mood_before"),
  moodAfter: integer("mood_after"),
  analysisResults: jsonb("analysis_results").$type<{
    distortions: Array<{
      type: string;
      description: string;
      confidence: number;
    }>;
    recommendations: Array<{
      exerciseId: string;
      reason: string;
    }>;
  }>(),
  sharedWithTherapist: boolean("shared_with_therapist").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const exercises = pgTable("exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  instructions: text("instructions").notNull(),
  category: text("category").notNull(),
  targetDistortions: text("target_distortions").array(),
  estimatedDuration: integer("estimated_duration"), // in minutes
  difficulty: text("difficulty").notNull(), // "easy", "medium", "hard"
});

export const exerciseCompletions = pgTable("exercise_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  exerciseId: text("exercise_id").notNull(), // Changed back to text as it's not a foreign key
  response: text("response"), // user's exercise response/completion text
  moodBefore: integer("mood_before"),
  moodAfter: integer("mood_after"),
  effectiveness: real("effectiveness"), // calculated improvement
  notes: text("notes"),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  abcSchemaId: varchar("abc_schema_id").references(() => abcSchemas.id),
});

export const therapistPatients = pgTable("therapist_patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull().references(() => users.id),
  patientId: varchar("patient_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Exercise Templates - therapist's exercise library (no patient assignment)
export const exerciseTemplates = pgTable("exercise_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  instructions: text("instructions").notNull(),
  category: text("category").notNull(),
  estimatedDuration: integer("estimated_duration"), // in minutes
  difficulty: text("difficulty").notNull(), // "easy", "medium", "hard"
  isActive: boolean("is_active").default(true),
  originalTemplateId: varchar("original_template_id"), // for duplicates - reference added in relations
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Exercise Assignments - specific assignments of templates to patients
export const exerciseAssignments = pgTable("exercise_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => exerciseTemplates.id),
  therapistId: varchar("therapist_id").notNull().references(() => users.id),
  patientId: varchar("patient_id").notNull().references(() => users.id),
  abcSchemaId: varchar("abc_schema_id").references(() => abcSchemas.id),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
  notes: text("notes"), // therapist notes for this specific assignment
});

// Keep existing table for backward compatibility - will be migrated gradually
export const therapistExercises = pgTable("therapist_exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull().references(() => users.id),
  patientId: varchar("patient_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  instructions: text("instructions").notNull(),
  category: text("category").notNull(),
  estimatedDuration: integer("estimated_duration"), // in minutes
  difficulty: text("difficulty").notNull(), // "easy", "medium", "hard"
  isActive: boolean("is_active").default(true),
  abcSchemaId: varchar("abc_schema_id").references(() => abcSchemas.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sharedData = pgTable("shared_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => users.id),
  therapistId: varchar("therapist_id").notNull().references(() => users.id),
  dataType: text("data_type").notNull(), // "mood_entry", "abc_schema", "exercise_completion"
  dataId: varchar("data_id").notNull(),
  sharedAt: timestamp("shared_at").defaultNow().notNull(),
});

export const therapistPatientVisits = pgTable("therapist_patient_visits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull().references(() => users.id),
  patientId: varchar("patient_id").notNull().references(() => users.id),
  lastVisitAt: timestamp("last_visit_at").defaultNow().notNull(),
}, (table) => ({
  uniqueTherapistPatient: unique().on(table.therapistId, table.patientId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  moodScales: many(moodScales),
  moodEntries: many(moodEntries),
  abcSchemas: many(abcSchemas),
  exerciseCompletions: many(exerciseCompletions),
  patientsAsTherapist: many(therapistPatients, { relationName: "therapist" }),
  therapistsAsPatient: many(therapistPatients, { relationName: "patient" }),
}));

export const moodScalesRelations = relations(moodScales, ({ one, many }) => ({
  user: one(users, {
    fields: [moodScales.userId],
    references: [users.id],
  }),
  moodEntries: many(moodEntries),
}));

export const moodEntriesRelations = relations(moodEntries, ({ one }) => ({
  user: one(users, {
    fields: [moodEntries.userId],
    references: [users.id],
  }),
  moodScale: one(moodScales, {
    fields: [moodEntries.moodScaleId],
    references: [moodScales.id],
  }),
}));

export const abcSchemasRelations = relations(abcSchemas, ({ one, many }) => ({
  user: one(users, {
    fields: [abcSchemas.userId],
    references: [users.id],
  }),
  exerciseCompletions: many(exerciseCompletions),
}));

export const exercisesRelations = relations(exercises, ({ many }) => ({
  completions: many(exerciseCompletions),
}));

export const exerciseCompletionsRelations = relations(exerciseCompletions, ({ one }) => ({
  user: one(users, {
    fields: [exerciseCompletions.userId],
    references: [users.id],
  }),
  abcSchema: one(abcSchemas, {
    fields: [exerciseCompletions.abcSchemaId],
    references: [abcSchemas.id],
  }),
}));

export const therapistPatientsRelations = relations(therapistPatients, ({ one }) => ({
  therapist: one(users, {
    fields: [therapistPatients.therapistId],
    references: [users.id],
    relationName: "therapist",
  }),
  patient: one(users, {
    fields: [therapistPatients.patientId],
    references: [users.id],
    relationName: "patient",
  }),
}));

// Relations for new exercise system
export const exerciseTemplatesRelations = relations(exerciseTemplates, ({ one, many }) => ({
  therapist: one(users, {
    fields: [exerciseTemplates.therapistId],
    references: [users.id],
    relationName: "therapist",
  }),
  originalTemplate: one(exerciseTemplates, {
    fields: [exerciseTemplates.originalTemplateId],
    references: [exerciseTemplates.id],
    relationName: "original",
  }),
  assignments: many(exerciseAssignments),
}));

export const exerciseAssignmentsRelations = relations(exerciseAssignments, ({ one }) => ({
  template: one(exerciseTemplates, {
    fields: [exerciseAssignments.templateId],
    references: [exerciseTemplates.id],
  }),
  therapist: one(users, {
    fields: [exerciseAssignments.therapistId],
    references: [users.id],
    relationName: "therapist",
  }),
  patient: one(users, {
    fields: [exerciseAssignments.patientId],
    references: [users.id],
    relationName: "patient",
  }),
  abcSchema: one(abcSchemas, {
    fields: [exerciseAssignments.abcSchemaId],
    references: [abcSchemas.id],
  }),
}));

export const therapistExercisesRelations = relations(therapistExercises, ({ one }) => ({
  therapist: one(users, {
    fields: [therapistExercises.therapistId],
    references: [users.id],
    relationName: "therapist",
  }),
  patient: one(users, {
    fields: [therapistExercises.patientId],
    references: [users.id],
    relationName: "patient",
  }),
}));

export const therapistPatientVisitsRelations = relations(therapistPatientVisits, ({ one }) => ({
  therapist: one(users, {
    fields: [therapistPatientVisits.therapistId],
    references: [users.id],
    relationName: "therapist",
  }),
  patient: one(users, {
    fields: [therapistPatientVisits.patientId],
    references: [users.id],
    relationName: "patient",
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
});

export const insertMoodScaleSchema = createInsertSchema(moodScales).omit({
  id: true,
  createdAt: true,
});

export const insertMoodEntrySchema = createInsertSchema(moodEntries).omit({
  id: true,
  createdAt: true,
});

export const insertAbcSchemaSchema = createInsertSchema(abcSchemas).omit({
  id: true,
  createdAt: true,
});

export const insertExerciseCompletionSchema = createInsertSchema(exerciseCompletions).omit({
  id: true,
  completedAt: true,
});

export const insertTherapistPatientSchema = createInsertSchema(therapistPatients).omit({
  id: true,
  createdAt: true,
});

export const insertTherapistExerciseSchema = createInsertSchema(therapistExercises).omit({
  id: true,
  createdAt: true,
});

export const insertTherapistPatientVisitSchema = createInsertSchema(therapistPatientVisits).omit({
  id: true,
});

// Insert schemas for new exercise system
export const insertExerciseTemplateSchema = createInsertSchema(exerciseTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertExerciseAssignmentSchema = createInsertSchema(exerciseAssignments).omit({
  id: true,
  assignedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type MoodScale = typeof moodScales.$inferSelect;
export type InsertMoodScale = z.infer<typeof insertMoodScaleSchema>;
export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;
export type AbcSchema = typeof abcSchemas.$inferSelect;
export type InsertAbcSchema = z.infer<typeof insertAbcSchemaSchema>;
export type Exercise = typeof exercises.$inferSelect;
export type ExerciseCompletion = typeof exerciseCompletions.$inferSelect;
export type InsertExerciseCompletion = z.infer<typeof insertExerciseCompletionSchema>;
export type TherapistPatient = typeof therapistPatients.$inferSelect;
export type InsertTherapistPatient = z.infer<typeof insertTherapistPatientSchema>;
export type TherapistExercise = typeof therapistExercises.$inferSelect;
export type InsertTherapistExercise = z.infer<typeof insertTherapistExerciseSchema>;
export type SharedData = typeof sharedData.$inferSelect;
export type TherapistPatientVisit = typeof therapistPatientVisits.$inferSelect;
export type InsertTherapistPatientVisit = z.infer<typeof insertTherapistPatientVisitSchema>;

// Types for new exercise system
export type ExerciseTemplate = typeof exerciseTemplates.$inferSelect;
export type InsertExerciseTemplate = z.infer<typeof insertExerciseTemplateSchema>;
export type ExerciseAssignment = typeof exerciseAssignments.$inferSelect;
export type InsertExerciseAssignment = z.infer<typeof insertExerciseAssignmentSchema>;
