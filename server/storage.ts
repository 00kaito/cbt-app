import { 
  users, 
  moodScales, 
  moodEntries, 
  abcSchemas, 
  exercises,
  exerciseCompletions,
  therapistPatients,
  therapistExercises,
  sharedData,
  therapistPatientVisits,
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
  type TherapistExercise,
  type InsertTherapistExercise,
  type SharedData,
  type TherapistPatientVisit,
  type InsertTherapistPatientVisit
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  // Seed methods
  seedExercises(): Promise<void>;
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
  updateMoodEntry(id: string, moodEntry: Partial<InsertMoodEntry>): Promise<MoodEntry | undefined>;

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
  getExerciseCompletionsWithExercise(userId: string): Promise<(ExerciseCompletion & { exercise: Exercise })[]>;
  createExerciseCompletion(completion: InsertExerciseCompletion): Promise<ExerciseCompletion>;

  // Therapist-patient methods
  getTherapistPatients(therapistId: string): Promise<User[]>;
  getPatientTherapists(patientId: string): Promise<User[]>;
  addTherapistPatient(relationship: InsertTherapistPatient): Promise<TherapistPatient>;
  removeTherapistPatient(patientId: string, therapistId: string): Promise<void>;
  getPatientExerciseCompletionsForTherapist(patientId: string): Promise<(ExerciseCompletion & { exercise: Exercise })[]>;

  // Therapist exercise methods
  getTherapistExercisesForPatient(patientId: string): Promise<TherapistExercise[]>;
  getTherapistExercisesByTherapist(therapistId: string): Promise<TherapistExercise[]>;
  getTherapistExercise(id: string): Promise<TherapistExercise | undefined>;
  createTherapistExercise(exercise: InsertTherapistExercise): Promise<TherapistExercise>;
  updateTherapistExercise(id: string, exercise: Partial<InsertTherapistExercise>): Promise<TherapistExercise>;
  deleteTherapistExercise(id: string): Promise<void>;
  isTherapistExercise(exerciseId: string): Promise<boolean>;
  createTherapistExerciseCompletion(completion: InsertExerciseCompletion): Promise<ExerciseCompletion>;

  // Shared data methods
  getSharedDataForTherapist(therapistId: string, patientId: string): Promise<{
    moodEntries: MoodEntry[];
    abcSchemas: AbcSchema[];
    exerciseCompletions: ExerciseCompletion[];
  }>;

  // Therapist visit tracking methods
  updateTherapistPatientVisit(therapistId: string, patientId: string): Promise<void>;
  getPatientSummaryForTherapist(patientId: string, therapistId: string): Promise<{
    latestMood: { value: number; date: Date } | null;
    newItemsSinceLastVisit: number;
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

  async updateMoodEntry(id: string, moodEntry: Partial<InsertMoodEntry>): Promise<MoodEntry | undefined> {
    const [updated] = await db
      .update(moodEntries)
      .set(moodEntry)
      .where(eq(moodEntries.id, id))
      .returning();
    return updated;
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

  async deleteAbcSchema(id: string): Promise<void> {
    await db.delete(abcSchemas).where(eq(abcSchemas.id, id));
  }

  async getExerciseCompletionsByAbcSchemaId(abcSchemaId: string): Promise<(ExerciseCompletion & { exercise: Exercise | TherapistExercise })[]> {
    const completions = await db
      .select({
        id: exerciseCompletions.id,
        exerciseId: exerciseCompletions.exerciseId,
        userId: exerciseCompletions.userId,
        response: exerciseCompletions.response,
        moodBefore: exerciseCompletions.moodBefore,
        moodAfter: exerciseCompletions.moodAfter,
        effectiveness: exerciseCompletions.effectiveness,
        completedAt: exerciseCompletions.completedAt,
        abcSchemaId: exerciseCompletions.abcSchemaId,
      })
      .from(exerciseCompletions)
      .where(eq(exerciseCompletions.abcSchemaId, abcSchemaId))
      .orderBy(desc(exerciseCompletions.completedAt));

    // Get exercises for each completion
    const completionsWithExercises = await Promise.all(
      completions.map(async (completion) => {
        // Try to get from therapist exercises first
        let exercise = await db
          .select()
          .from(therapistExercises)
          .where(eq(therapistExercises.id, completion.exerciseId))
          .limit(1)
          .then(rows => rows[0]);
        
        // If not found in therapist exercises, get from regular exercises
        if (!exercise) {
          exercise = await db
            .select()
            .from(exercises)
            .where(eq(exercises.id, completion.exerciseId))
            .limit(1)
            .then(rows => rows[0]);
        }
        
        return {
          ...completion,
          exercise: exercise || { 
            id: completion.exerciseId, 
            title: "Deleted Exercise", 
            description: "This exercise no longer exists" 
          }
        };
      })
    );

    return completionsWithExercises;
  }

  async getExercises(): Promise<Exercise[]> {
    const dbExercises = await db.select().from(exercises).orderBy(asc(exercises.title));
    
    // If no exercises in DB, return mock exercises for now
    if (dbExercises.length === 0) {
      return [
        {
          id: "evidence-examination",
          title: "Evidence Examination",
          description: "Examine the evidence for and against your negative thoughts",
          instructions: "List all evidence supporting your thought, then list evidence against it. Compare both lists objectively.",
          category: "Thought Challenging",
          targetDistortions: ["catastrophizing", "all-or-nothing-thinking"],
          estimatedDuration: 15,
          difficulty: "medium",
        },
        {
          id: "balanced-thinking",
          title: "Balanced Thinking",
          description: "Reframe negative thoughts into more balanced, realistic perspectives",
          instructions: "Take your negative thought and rewrite it in a more balanced, fair way that considers multiple perspectives.",
          category: "Cognitive Restructuring",
          targetDistortions: ["all-or-nothing-thinking", "mental-filter"],
          estimatedDuration: 10,
          difficulty: "easy",
        },
        {
          id: "thought-challenging",
          title: "Thought Challenging",
          description: "Question the validity and helpfulness of negative thoughts",
          instructions: "Ask yourself: Is this thought helpful? Is it realistic? What would I tell a friend having this thought?",
          category: "Thought Challenging",
          targetDistortions: ["overgeneralization", "mind-reading"],
          estimatedDuration: 12,
          difficulty: "medium",
        },
        {
          id: "mindfulness-exercise",
          title: "Mindfulness Breathing",
          description: "Practice present-moment awareness through focused breathing",
          instructions: "Focus on your breath for 5-10 minutes. When your mind wanders, gently return attention to breathing.",
          category: "Mindfulness",
          targetDistortions: ["emotional-reasoning", "worry"],
          estimatedDuration: 10,
          difficulty: "easy",
        },
      ];
    }
    
    return dbExercises;
  }

  async seedExercises(): Promise<void> {
    const existing = await db.select().from(exercises).limit(1);
    if (existing.length > 0) return; // Already seeded

    const mockExercises = [
      {
        id: "evidence-examination",
        title: "Evidence Examination",
        description: "Examine the evidence for and against your negative thoughts",
        instructions: "List all evidence supporting your thought, then list evidence against it. Compare both lists objectively.",
        category: "Thought Challenging",
        targetDistortions: ["catastrophizing", "all-or-nothing-thinking"],
        estimatedDuration: 15,
        difficulty: "medium",
      },
      {
        id: "balanced-thinking",
        title: "Balanced Thinking",
        description: "Reframe negative thoughts into more balanced, realistic perspectives",
        instructions: "Take your negative thought and rewrite it in a more balanced, fair way that considers multiple perspectives.",
        category: "Cognitive Restructuring",
        targetDistortions: ["all-or-nothing-thinking", "mental-filter"],
        estimatedDuration: 10,
        difficulty: "easy",
      },
      {
        id: "thought-challenging",
        title: "Thought Challenging",
        description: "Question the validity and helpfulness of negative thoughts",
        instructions: "Ask yourself: Is this thought helpful? Is it realistic? What would I tell a friend having this thought?",
        category: "Thought Challenging",
        targetDistortions: ["overgeneralization", "mind-reading"],
        estimatedDuration: 12,
        difficulty: "medium",
      },
      {
        id: "mindfulness-exercise",
        title: "Mindfulness Breathing",
        description: "Practice present-moment awareness through focused breathing",
        instructions: "Focus on your breath for 5-10 minutes. When your mind wanders, gently return attention to breathing.",
        category: "Mindfulness",
        targetDistortions: ["emotional-reasoning", "worry"],
        estimatedDuration: 10,
        difficulty: "easy",
      },
    ];

    await db.insert(exercises).values(mockExercises).onConflictDoNothing();
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

  async getExerciseCompletionsWithExercise(userId: string): Promise<(ExerciseCompletion & { exercise: Exercise | TherapistExercise })[]> {
    // Get all exercise completions for the user
    const completions = await db
      .select()
      .from(exerciseCompletions)
      .where(eq(exerciseCompletions.userId, userId))
      .orderBy(desc(exerciseCompletions.completedAt));

    // For each completion, try to find the exercise from therapist_exercises first, then exercises
    const completionsWithExercise = await Promise.all(
      completions.map(async (completion) => {
        // Try to find in therapist_exercises first
        const [therapistExercise] = await db
          .select()
          .from(therapistExercises)
          .where(eq(therapistExercises.id, completion.exerciseId));

        if (therapistExercise) {
          return {
            ...completion,
            exercise: therapistExercise
          };
        }

        // Fallback to regular exercises table
        const [exercise] = await db
          .select()
          .from(exercises)
          .where(eq(exercises.id, completion.exerciseId));

        if (exercise) {
          return {
            ...completion,
            exercise: exercise
          };
        }

        // If no exercise found, return null (will be filtered out)
        return null;
      })
    );

    // Filter out null results and return
    return completionsWithExercise.filter(Boolean) as (ExerciseCompletion & { exercise: Exercise | TherapistExercise })[];
  }

  async createExerciseCompletion(completion: InsertExerciseCompletion & { abcSchemaId?: string }): Promise<ExerciseCompletion> {
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

  async removeTherapistPatient(patientId: string, therapistId: string): Promise<void> {
    await db
      .delete(therapistPatients)
      .where(
        and(
          eq(therapistPatients.patientId, patientId),
          eq(therapistPatients.therapistId, therapistId)
        )
      );
  }

  async getPatientExerciseCompletionsForTherapist(patientId: string): Promise<(ExerciseCompletion & { exercise: Exercise })[]> {
    const result = await db
      .select()
      .from(exerciseCompletions)
      .innerJoin(exercises, eq(exerciseCompletions.exerciseId, exercises.id))
      .where(eq(exerciseCompletions.userId, patientId))
      .orderBy(desc(exerciseCompletions.completedAt));
    
    return result.map(row => ({
      ...row.exercise_completions,
      exercise: row.exercises
    }));
  }

  async getTherapistExercisesForPatient(patientId: string): Promise<TherapistExercise[]> {
    return await db
      .select()
      .from(therapistExercises)
      .where(and(
        eq(therapistExercises.patientId, patientId),
        eq(therapistExercises.isActive, true)
      ))
      .orderBy(desc(therapistExercises.createdAt));
  }

  async getTherapistExercisesByTherapist(therapistId: string): Promise<TherapistExercise[]> {
    return await db
      .select()
      .from(therapistExercises)
      .where(and(
        eq(therapistExercises.therapistId, therapistId),
        eq(therapistExercises.isActive, true)
      ))
      .orderBy(desc(therapistExercises.createdAt));
  }

  async getTherapistExercise(id: string): Promise<TherapistExercise | undefined> {
    const [exercise] = await db.select().from(therapistExercises).where(eq(therapistExercises.id, id));
    return exercise || undefined;
  }

  async createTherapistExercise(exercise: InsertTherapistExercise): Promise<TherapistExercise> {
    const [created] = await db
      .insert(therapistExercises)
      .values(exercise)
      .returning();
    return created;
  }

  async updateTherapistExercise(id: string, exercise: Partial<InsertTherapistExercise>): Promise<TherapistExercise> {
    const [updated] = await db
      .update(therapistExercises)
      .set(exercise)
      .where(eq(therapistExercises.id, id))
      .returning();
    return updated;
  }

  async deleteTherapistExercise(id: string): Promise<void> {
    await db
      .update(therapistExercises)
      .set({ isActive: false })
      .where(eq(therapistExercises.id, id));
  }

  async isTherapistExercise(exerciseId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(therapistExercises)
      .where(eq(therapistExercises.id, exerciseId))
      .limit(1);
    return !!result;
  }

  async createTherapistExerciseCompletion(completion: InsertExerciseCompletion & { abcSchemaId?: string }): Promise<ExerciseCompletion> {
    // Calculate effectiveness if both before and after moods are provided
    if (completion.moodBefore && completion.moodAfter) {
      const improvement = completion.moodAfter - completion.moodBefore;
      completion.effectiveness = Math.max(0, improvement / 7); // Normalize to 0-1 scale
    }

    // Create a pseudo exercise completion record that matches the expected structure
    // but references the therapist exercise ID
    const [created] = await db
      .insert(exerciseCompletions)
      .values({
        userId: completion.userId,
        exerciseId: completion.exerciseId, // This will be the therapist exercise ID
        response: completion.response,
        moodBefore: completion.moodBefore,
        moodAfter: completion.moodAfter,
        effectiveness: completion.effectiveness,
        notes: completion.notes,
        abcSchemaId: completion.abcSchemaId,
      })
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

  async getExerciseCompletionsByAbcSchema(abcSchemaId: string): Promise<(ExerciseCompletion & { exercise: Exercise | TherapistExercise })[]> {
    // Get all exercise completions for this ABC schema
    const completions = await db
      .select()
      .from(exerciseCompletions)
      .where(eq(exerciseCompletions.abcSchemaId, abcSchemaId))
      .orderBy(desc(exerciseCompletions.completedAt));

    // For each completion, try to find the exercise
    const completionsWithExercise = await Promise.all(
      completions.map(async (completion) => {
        // Try to find in therapist_exercises first
        const [therapistExercise] = await db
          .select()
          .from(therapistExercises)
          .where(eq(therapistExercises.id, completion.exerciseId));

        if (therapistExercise) {
          return {
            ...completion,
            exercise: therapistExercise
          };
        }

        // Fallback to regular exercises table
        const [exercise] = await db
          .select()
          .from(exercises)
          .where(eq(exercises.id, completion.exerciseId));

        if (exercise) {
          return {
            ...completion,
            exercise: exercise
          };
        }

        return null;
      })
    );

    return completionsWithExercise.filter(Boolean) as (ExerciseCompletion & { exercise: Exercise | TherapistExercise })[];
  }

  async updateTherapistPatientVisit(therapistId: string, patientId: string): Promise<void> {
    // Try to find existing visit record
    const [existingVisit] = await db
      .select()
      .from(therapistPatientVisits)
      .where(and(
        eq(therapistPatientVisits.therapistId, therapistId),
        eq(therapistPatientVisits.patientId, patientId)
      ));

    if (existingVisit) {
      // Update existing record
      await db
        .update(therapistPatientVisits)
        .set({ lastVisitAt: new Date() })
        .where(and(
          eq(therapistPatientVisits.therapistId, therapistId),
          eq(therapistPatientVisits.patientId, patientId)
        ));
    } else {
      // Create new record
      await db
        .insert(therapistPatientVisits)
        .values({
          therapistId,
          patientId,
          lastVisitAt: new Date(),
        });
    }
  }

  async getPatientSummaryForTherapist(patientId: string, therapistId: string): Promise<{
    latestMood: { value: number; date: Date } | null;
    newItemsSinceLastVisit: number;
  }> {
    // Get latest mood entry
    const [latestMoodEntry] = await db
      .select()
      .from(moodEntries)
      .where(eq(moodEntries.userId, patientId))
      .orderBy(desc(moodEntries.createdAt))
      .limit(1);

    // Get last visit timestamp
    const [lastVisit] = await db
      .select()
      .from(therapistPatientVisits)
      .where(and(
        eq(therapistPatientVisits.therapistId, therapistId),
        eq(therapistPatientVisits.patientId, patientId)
      ));

    let newItemsCount = 0;
    
    if (lastVisit) {
      // Count new shared items since last visit
      const newItems = await db
        .select()
        .from(sharedData)
        .where(and(
          eq(sharedData.therapistId, therapistId),
          eq(sharedData.patientId, patientId),
          sql`${sharedData.sharedAt} > ${lastVisit.lastVisitAt}`
        ));
      
      newItemsCount = newItems.length;
    } else {
      // No previous visit, count all shared items
      const allItems = await db
        .select()
        .from(sharedData)
        .where(and(
          eq(sharedData.therapistId, therapistId),
          eq(sharedData.patientId, patientId)
        ));
      
      newItemsCount = allItems.length;
    }

    return {
      latestMood: latestMoodEntry ? {
        value: latestMoodEntry.moodLevel,
        date: latestMoodEntry.createdAt
      } : null,
      newItemsSinceLastVisit: newItemsCount
    };
  }
}

export const storage = new DatabaseStorage();
