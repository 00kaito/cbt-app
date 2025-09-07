import { 
  users, 
  moodScales, 
  moodEntries, 
  abcSchemas, 
  exercises,
  exerciseCompletions,
  therapistPatients,
  sharedData,
  type User, 
  type InsertUser,
  type MoodScale,
  type InsertMoodScale,
  type MoodEntry,
  type InsertMoodEntry,
  type AbcSchema,
  type InsertAbcSchema,
  type Exercise,
  type ExerciseCompletion,
  type InsertExerciseCompletion,
  type TherapistPatient,
  type InsertTherapistPatient,
  type SharedData
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Mood scale methods
  getMoodScales(userId: string): Promise<MoodScale[]>;
  getMoodScale(id: string): Promise<MoodScale | undefined>;
  createMoodScale(moodScale: InsertMoodScale): Promise<MoodScale>;
  updateMoodScale(id: string, moodScale: Partial<InsertMoodScale>): Promise<MoodScale>;
  deleteMoodScale(id: string): Promise<void>;

  // Mood entry methods
  getMoodEntries(userId: string, limit?: number): Promise<MoodEntry[]>;
  createMoodEntry(moodEntry: InsertMoodEntry): Promise<MoodEntry>;

  // ABC schema methods
  getAbcSchemas(userId: string): Promise<AbcSchema[]>;
  getAbcSchema(id: string): Promise<AbcSchema | undefined>;
  createAbcSchema(abcSchema: InsertAbcSchema): Promise<AbcSchema>;
  updateAbcSchema(id: string, abcSchema: Partial<InsertAbcSchema>): Promise<AbcSchema>;
  shareAbcSchemaWithTherapist(id: string, therapistId: string): Promise<void>;

  // Exercise methods
  getExercises(): Promise<Exercise[]>;
  getExercise(id: string): Promise<Exercise | undefined>;
  getExercisesByCategory(category: string): Promise<Exercise[]>;

  // Exercise completion methods
  getExerciseCompletions(userId: string): Promise<ExerciseCompletion[]>;
  createExerciseCompletion(completion: InsertExerciseCompletion): Promise<ExerciseCompletion>;

  // Therapist-patient methods
  getTherapistPatients(therapistId: string): Promise<User[]>;
  getPatientTherapists(patientId: string): Promise<User[]>;
  addTherapistPatient(relationship: InsertTherapistPatient): Promise<TherapistPatient>;

  // Shared data methods
  getSharedDataForTherapist(therapistId: string, patientId: string): Promise<{
    moodEntries: MoodEntry[];
    abcSchemas: AbcSchema[];
    exerciseCompletions: ExerciseCompletion[];
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getMoodScales(userId: string): Promise<MoodScale[]> {
    return await db
      .select()
      .from(moodScales)
      .where(eq(moodScales.userId, userId))
      .orderBy(desc(moodScales.isDefault), desc(moodScales.createdAt));
  }

  async getMoodScale(id: string): Promise<MoodScale | undefined> {
    const [moodScale] = await db.select().from(moodScales).where(eq(moodScales.id, id));
    return moodScale || undefined;
  }

  async createMoodScale(moodScale: InsertMoodScale): Promise<MoodScale> {
    const [created] = await db
      .insert(moodScales)
      .values(moodScale)
      .returning();
    return created;
  }

  async updateMoodScale(id: string, moodScale: Partial<InsertMoodScale>): Promise<MoodScale> {
    const [updated] = await db
      .update(moodScales)
      .set(moodScale)
      .where(eq(moodScales.id, id))
      .returning();
    return updated;
  }

  async deleteMoodScale(id: string): Promise<void> {
    await db.delete(moodScales).where(eq(moodScales.id, id));
  }

  async getMoodEntries(userId: string, limit = 30): Promise<MoodEntry[]> {
    return await db
      .select()
      .from(moodEntries)
      .where(eq(moodEntries.userId, userId))
      .orderBy(desc(moodEntries.createdAt))
      .limit(limit);
  }

  async createMoodEntry(moodEntry: InsertMoodEntry): Promise<MoodEntry> {
    const [created] = await db
      .insert(moodEntries)
      .values(moodEntry)
      .returning();
    return created;
  }

  async getAbcSchemas(userId: string): Promise<AbcSchema[]> {
    return await db
      .select()
      .from(abcSchemas)
      .where(eq(abcSchemas.userId, userId))
      .orderBy(desc(abcSchemas.createdAt));
  }

  async getAbcSchema(id: string): Promise<AbcSchema | undefined> {
    const [schema] = await db.select().from(abcSchemas).where(eq(abcSchemas.id, id));
    return schema || undefined;
  }

  async createAbcSchema(abcSchema: InsertAbcSchema): Promise<AbcSchema> {
    const [created] = await db
      .insert(abcSchemas)
      .values(abcSchema)
      .returning();
    return created;
  }

  async updateAbcSchema(id: string, abcSchema: Partial<InsertAbcSchema>): Promise<AbcSchema> {
    const [updated] = await db
      .update(abcSchemas)
      .set(abcSchema)
      .where(eq(abcSchemas.id, id))
      .returning();
    return updated;
  }

  async shareAbcSchemaWithTherapist(id: string, therapistId: string): Promise<void> {
    // Update the ABC schema to mark as shared
    await db
      .update(abcSchemas)
      .set({ sharedWithTherapist: true })
      .where(eq(abcSchemas.id, id));

    // Get the ABC schema to find the patient ID
    const [schema] = await db.select().from(abcSchemas).where(eq(abcSchemas.id, id));
    if (schema) {
      // Create shared data entry
      await db.insert(sharedData).values({
        patientId: schema.userId,
        therapistId,
        dataType: "abc_schema",
        dataId: id,
      });
    }
  }

  async getExercises(): Promise<Exercise[]> {
    return await db.select().from(exercises).orderBy(asc(exercises.title));
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    const [exercise] = await db.select().from(exercises).where(eq(exercises.id, id));
    return exercise || undefined;
  }

  async getExercisesByCategory(category: string): Promise<Exercise[]> {
    return await db
      .select()
      .from(exercises)
      .where(eq(exercises.category, category))
      .orderBy(asc(exercises.title));
  }

  async getExerciseCompletions(userId: string): Promise<ExerciseCompletion[]> {
    return await db
      .select()
      .from(exerciseCompletions)
      .where(eq(exerciseCompletions.userId, userId))
      .orderBy(desc(exerciseCompletions.completedAt));
  }

  async createExerciseCompletion(completion: InsertExerciseCompletion): Promise<ExerciseCompletion> {
    const [created] = await db
      .insert(exerciseCompletions)
      .values(completion)
      .returning();
    return created;
  }

  async getTherapistPatients(therapistId: string): Promise<User[]> {
    const relationships = await db
      .select({ patient: users })
      .from(therapistPatients)
      .innerJoin(users, eq(therapistPatients.patientId, users.id))
      .where(eq(therapistPatients.therapistId, therapistId));
    
    return relationships.map(r => r.patient);
  }

  async getPatientTherapists(patientId: string): Promise<User[]> {
    const relationships = await db
      .select({ therapist: users })
      .from(therapistPatients)
      .innerJoin(users, eq(therapistPatients.therapistId, users.id))
      .where(eq(therapistPatients.patientId, patientId));
    
    return relationships.map(r => r.therapist);
  }

  async addTherapistPatient(relationship: InsertTherapistPatient): Promise<TherapistPatient> {
    const [created] = await db
      .insert(therapistPatients)
      .values(relationship)
      .returning();
    return created;
  }

  async getSharedDataForTherapist(therapistId: string, patientId: string): Promise<{
    moodEntries: MoodEntry[];
    abcSchemas: AbcSchema[];
    exerciseCompletions: ExerciseCompletion[];
  }> {
    // Get shared mood entries
    const sharedMoodEntries = await db
      .select({ moodEntry: moodEntries })
      .from(sharedData)
      .innerJoin(moodEntries, eq(sharedData.dataId, moodEntries.id))
      .where(
        and(
          eq(sharedData.therapistId, therapistId),
          eq(sharedData.patientId, patientId),
          eq(sharedData.dataType, "mood_entry")
        )
      );

    // Get shared ABC schemas
    const sharedAbcSchemas = await db
      .select({ abcSchema: abcSchemas })
      .from(sharedData)
      .innerJoin(abcSchemas, eq(sharedData.dataId, abcSchemas.id))
      .where(
        and(
          eq(sharedData.therapistId, therapistId),
          eq(sharedData.patientId, patientId),
          eq(sharedData.dataType, "abc_schema")
        )
      );

    // Get shared exercise completions
    const sharedExerciseCompletions = await db
      .select({ exerciseCompletion: exerciseCompletions })
      .from(sharedData)
      .innerJoin(exerciseCompletions, eq(sharedData.dataId, exerciseCompletions.id))
      .where(
        and(
          eq(sharedData.therapistId, therapistId),
          eq(sharedData.patientId, patientId),
          eq(sharedData.dataType, "exercise_completion")
        )
      );

    return {
      moodEntries: sharedMoodEntries.map(item => item.moodEntry),
      abcSchemas: sharedAbcSchemas.map(item => item.abcSchema),
      exerciseCompletions: sharedExerciseCompletions.map(item => item.exerciseCompletion),
    };
  }
}

export const storage = new DatabaseStorage();
