import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean, real } from "drizzle-orm/pg-core";
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
  exerciseId: varchar("exercise_id").notNull().references(() => exercises.id),
  response: text("response"), // user's exercise response/completion text
  moodBefore: integer("mood_before"),
  moodAfter: integer("mood_after"),
  effectiveness: real("effectiveness"), // calculated improvement
  notes: text("notes"),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const therapistPatients = pgTable("therapist_patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull().references(() => users.id),
  patientId: varchar("patient_id").notNull().references(() => users.id),
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

export const abcSchemasRelations = relations(abcSchemas, ({ one }) => ({
  user: one(users, {
    fields: [abcSchemas.userId],
    references: [users.id],
  }),
}));

export const exercisesRelations = relations(exercises, ({ many }) => ({
  completions: many(exerciseCompletions),
}));

export const exerciseCompletionsRelations = relations(exerciseCompletions, ({ one }) => ({
  user: one(users, {
    fields: [exerciseCompletions.userId],
    references: [users.id],
  }),
  exercise: one(exercises, {
    fields: [exerciseCompletions.exerciseId],
    references: [exercises.id],
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
export type SharedData = typeof sharedData.$inferSelect;
