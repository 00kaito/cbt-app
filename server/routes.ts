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

  app.patch("/api/mood-entries/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const entry = await storage.updateMoodEntry(req.params.id, req.body);
      if (!entry || entry.userId !== req.user!.id) {
        return res.status(404).json({ message: "Mood entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to update mood entry" });
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
      // Ensure exercises are seeded
      await storage.seedExercises();
      
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

  app.get("/api/exercise-completions-with-exercise", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const completions = await storage.getExerciseCompletionsWithExercise(req.user!.id);
      res.json(completions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exercise completions with exercise details" });
    }
  });

  app.post("/api/exercise-completions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      console.log("Exercise completion request body:", req.body);
      const validatedData = insertExerciseCompletionSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      console.log("Validated data:", validatedData);

      // Calculate effectiveness if both before and after moods are provided
      if (validatedData.moodBefore && validatedData.moodAfter) {
        const improvement = validatedData.moodAfter - validatedData.moodBefore;
        validatedData.effectiveness = Math.max(0, improvement / 7); // Normalize to 0-1 scale
      }

      const completion = await storage.createExerciseCompletion(validatedData);
      res.status(201).json(completion);
    } catch (error) {
      console.error("Exercise completion error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: "Invalid exercise completion data", details: error.message });
      } else {
        res.status(400).json({ message: "Invalid exercise completion data" });
      }
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

  // Patient routes for therapist management
  app.get("/api/patient/therapists", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const therapists = await storage.getPatientTherapists(req.user!.id);
      res.json(therapists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch therapists" });
    }
  });

  app.post("/api/patient/assign-therapist", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Find therapist by email
      const therapist = await storage.getUserByEmail(email);
      
      if (!therapist) {
        return res.status(404).json({ message: "Therapist not found with this email address" });
      }

      if (therapist.role !== "therapist") {
        return res.status(400).json({ message: "User with this email is not a therapist" });
      }

      // Check if relationship already exists
      const existingTherapists = await storage.getPatientTherapists(req.user!.id);
      const alreadyAssigned = existingTherapists.some(t => t.id === therapist.id);
      
      if (alreadyAssigned) {
        return res.status(400).json({ message: "This therapist is already assigned to your account" });
      }

      // Create the relationship
      const validatedData = insertTherapistPatientSchema.parse({
        therapistId: therapist.id,
        patientId: req.user!.id
      });
      
      const relationship = await storage.addTherapistPatient(validatedData);
      res.status(201).json(relationship);
    } catch (error) {
      res.status(400).json({ message: "Failed to assign therapist" });
    }
  });

  // Get individual patient details for therapist
  app.get("/api/therapist/patient/:patientId", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "therapist") {
      return res.sendStatus(403);
    }
    try {
      const patientId = req.params.patientId;
      // Verify this patient is assigned to this therapist
      const patients = await storage.getTherapistPatients(req.user!.id);
      const patient = patients.find(p => p.id === patientId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found or not assigned to you" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient details" });
    }
  });

  // Get patient's mood entries for therapist
  app.get("/api/therapist/patient/:patientId/mood-entries", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "therapist") {
      return res.sendStatus(403);
    }
    try {
      const patientId = req.params.patientId;
      
      // Verify this patient is assigned to this therapist
      const patients = await storage.getTherapistPatients(req.user!.id);
      const patient = patients.find(p => p.id === patientId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found or not assigned to you" });
      }
      
      const moodEntries = await storage.getMoodEntries(patientId);
      res.json(moodEntries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mood entries" });
    }
  });

  // Get exercise completions for specific patient
  app.get("/api/therapist/patient/:patientId/exercise-completions", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "therapist") {
      return res.sendStatus(403);
    }
    try {
      const patientId = req.params.patientId;
      
      // Verify this patient is assigned to this therapist
      const patients = await storage.getTherapistPatients(req.user!.id);
      const patient = patients.find(p => p.id === patientId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found or not assigned to you" });
      }
      
      const completions = await storage.getExerciseCompletions(patientId);
      res.json(completions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exercise completions" });
    }
  });

  // Get shared data for specific patient
  app.get("/api/therapist/patient/:patientId/shared-data", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "therapist") {
      return res.sendStatus(403);
    }
    try {
      const patientId = req.params.patientId;
      
      // Verify this patient is assigned to this therapist
      const patients = await storage.getTherapistPatients(req.user!.id);
      const patient = patients.find(p => p.id === patientId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found or not assigned to you" });
      }
      
      const sharedData = await storage.getSharedDataForTherapist(req.user!.id, patientId);
      res.json(sharedData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shared data" });
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
