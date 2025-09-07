import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { analyzeABCSchema } from "./services/openai";
import { 
  insertMoodScaleSchema,
  insertMoodEntrySchema,
  insertAbcSchemaSchema,
  insertExerciseCompletionSchema,
  insertTherapistPatientSchema
} from "@shared/schema";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Mood Scale routes
  app.get("/api/mood-scales", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const scales = await storage.getMoodScales(req.user!.id);
      res.json(scales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mood scales" });
    }
  });

  app.post("/api/mood-scales", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const validatedData = insertMoodScaleSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      const scale = await storage.createMoodScale(validatedData);
      res.status(201).json(scale);
    } catch (error) {
      res.status(400).json({ message: "Invalid mood scale data" });
    }
  });

  app.put("/api/mood-scales/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const scale = await storage.updateMoodScale(req.params.id, req.body);
      res.json(scale);
    } catch (error) {
      res.status(500).json({ message: "Failed to update mood scale" });
    }
  });

  app.delete("/api/mood-scales/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      await storage.deleteMoodScale(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete mood scale" });
    }
  });

  // Mood Entry routes
  app.get("/api/mood-entries", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const entries = await storage.getMoodEntries(req.user!.id, limit);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mood entries" });
    }
  });

  app.post("/api/mood-entries", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const validatedData = insertMoodEntrySchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      const entry = await storage.createMoodEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      res.status(400).json({ message: "Invalid mood entry data" });
    }
  });

  // ABC Schema routes
  app.get("/api/abc-schemas", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const schemas = await storage.getAbcSchemas(req.user!.id);
      res.json(schemas);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ABC schemas" });
    }
  });

  app.post("/api/abc-schemas", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const validatedData = insertAbcSchemaSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      const schema = await storage.createAbcSchema(validatedData);
      res.status(201).json(schema);
    } catch (error) {
      res.status(400).json({ message: "Invalid ABC schema data" });
    }
  });

  app.post("/api/abc-schemas/:id/analyze", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const schema = await storage.getAbcSchema(req.params.id);
      if (!schema || schema.userId !== req.user!.id) {
        return res.status(404).json({ message: "ABC schema not found" });
      }

      const analysis = await analyzeABCSchema(
        schema.activatingEvent,
        schema.beliefs,
        schema.consequences
      );

      const updatedSchema = await storage.updateAbcSchema(req.params.id, {
        analysisResults: analysis
      });

      res.json(updatedSchema);
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze ABC schema" });
    }
  });

  app.post("/api/abc-schemas/:id/share", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { therapistId } = req.body;
      if (!therapistId) {
        return res.status(400).json({ message: "Therapist ID is required" });
      }

      await storage.shareAbcSchemaWithTherapist(req.params.id, therapistId);
      res.json({ message: "ABC schema shared with therapist" });
    } catch (error) {
      res.status(500).json({ message: "Failed to share ABC schema" });
    }
  });

  // Exercise routes
  app.get("/api/exercises", async (req, res) => {
    try {
      const category = req.query.category as string;
      const exercises = category 
        ? await storage.getExercisesByCategory(category)
        : await storage.getExercises();
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exercises" });
    }
  });

  app.get("/api/exercise-completions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const completions = await storage.getExerciseCompletions(req.user!.id);
      res.json(completions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exercise completions" });
    }
  });

  app.post("/api/exercise-completions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const validatedData = insertExerciseCompletionSchema.parse({
        ...req.body,
        userId: req.user!.id
      });

      // Calculate effectiveness if both before and after moods are provided
      if (validatedData.moodBefore && validatedData.moodAfter) {
        const improvement = validatedData.moodAfter - validatedData.moodBefore;
        validatedData.effectiveness = Math.max(0, improvement / 7); // Normalize to 0-1 scale
      }

      const completion = await storage.createExerciseCompletion(validatedData);
      res.status(201).json(completion);
    } catch (error) {
      res.status(400).json({ message: "Invalid exercise completion data" });
    }
  });

  // Therapist routes
  app.get("/api/therapist/patients", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "therapist") {
      return res.sendStatus(403);
    }
    try {
      const patients = await storage.getTherapistPatients(req.user!.id);
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.post("/api/therapist/patients", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "therapist") {
      return res.sendStatus(403);
    }
    try {
      const validatedData = insertTherapistPatientSchema.parse({
        therapistId: req.user!.id,
        patientId: req.body.patientId
      });
      const relationship = await storage.addTherapistPatient(validatedData);
      res.status(201).json(relationship);
    } catch (error) {
      res.status(400).json({ message: "Invalid patient relationship data" });
    }
  });

  app.get("/api/therapist/shared-data/:patientId", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "therapist") {
      return res.sendStatus(403);
    }
    try {
      const sharedData = await storage.getSharedDataForTherapist(
        req.user!.id,
        req.params.patientId
      );
      res.json(sharedData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shared data" });
    }
  });

  // Patient routes
  app.get("/api/patient/therapists", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const therapists = await storage.getPatientTherapists(req.user!.id);
      res.json(therapists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch therapists" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
