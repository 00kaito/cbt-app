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
  insertTherapistPatientSchema,
  insertTherapistExerciseSchema
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

  // Get single ABC schema by ID
  app.get("/api/abc-schemas/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const schema = await storage.getAbcSchema(req.params.id);
      
      if (!schema) {
        return res.status(404).json({ message: "ABC schema not found" });
      }
      
      // Check if user has access to this schema
      if (req.user!.role === "patient") {
        // Patient can only access their own schemas
        if (schema.userId !== req.user!.id) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else if (req.user!.role === "therapist") {
        // Therapist can access schemas of their assigned patients
        const patients = await storage.getTherapistPatients(req.user!.id);
        const hasAccess = patients.some(patient => patient.id === schema.userId);
        
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      res.json(schema);
    } catch (error) {
      console.error("Error fetching ABC schema:", error);
      res.status(500).json({ message: "Failed to fetch ABC schema" });
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
      // Get assigned therapists for the patient
      const therapists = await storage.getPatientTherapists(req.user!.id);
      if (!therapists || therapists.length === 0) {
        return res.status(400).json({ message: "No therapist assigned" });
      }

      // Use first assigned therapist
      const therapistId = therapists[0].id;
      await storage.shareAbcSchemaWithTherapist(req.params.id, therapistId);
      res.json({ message: "ABC schema shared with therapist" });
    } catch (error) {
      res.status(500).json({ message: "Failed to share ABC schema" });
    }
  });

  app.patch("/api/abc-schemas/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const schema = await storage.getAbcSchema(req.params.id);
      if (!schema || schema.userId !== req.user!.id) {
        return res.status(404).json({ message: "ABC schema not found" });
      }
      
      const updatedSchema = await storage.updateAbcSchema(req.params.id, req.body);
      res.json(updatedSchema);
    } catch (error) {
      res.status(500).json({ message: "Failed to update ABC schema" });
    }
  });

  app.delete("/api/abc-schemas/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const schema = await storage.getAbcSchema(req.params.id);
      if (!schema || schema.userId !== req.user!.id) {
        return res.status(404).json({ message: "ABC schema not found" });
      }
      
      await storage.deleteAbcSchema(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete ABC schema" });
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
      const validatedData = insertExerciseCompletionSchema.parse({
        ...req.body,
        userId: req.user!.id
      });

      // Check if this is a therapist exercise or regular exercise
      const isTherapistExercise = await storage.isTherapistExercise(validatedData.exerciseId);

      if (isTherapistExercise) {
        // For therapist exercises, we need to handle completion differently
        // Get the therapist exercise to check if it has an abcSchemaId
        const therapistExercise = await storage.getTherapistExercise(validatedData.exerciseId);
        const completionData = {
          ...validatedData,
          abcSchemaId: therapistExercise?.abcSchemaId || null
        };
        const completion = await storage.createTherapistExerciseCompletion(completionData);
        res.status(201).json(completion);
      } else {
        // Regular exercise completion
        // Calculate effectiveness if both before and after moods are provided
        if (validatedData.moodBefore && validatedData.moodAfter) {
          const improvement = validatedData.moodAfter - validatedData.moodBefore;
          validatedData.effectiveness = Math.max(0, improvement / 7); // Normalize to 0-1 scale
        }

        const completion = await storage.createExerciseCompletion(validatedData);
        res.status(201).json(completion);
      }
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
      
      // Enrich each patient with summary data
      const enrichedPatients = await Promise.all(
        patients.map(async (patient) => {
          const summary = await storage.getPatientSummaryForTherapist(patient.id, req.user!.id);
          return {
            ...patient,
            latestMood: summary.latestMood,
            newItemsSinceLastVisit: summary.newItemsSinceLastVisit
          };
        })
      );
      
      res.json(enrichedPatients);
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

  // Remove therapist assignment
  app.delete("/api/patient/remove-therapist/:therapistId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const therapistId = req.params.therapistId;
      
      // Remove the assignment
      await storage.removeTherapistPatient(req.user!.id, therapistId);
      
      res.json({ message: "Therapist assignment removed successfully" });
    } catch (error) {
      console.error("Error removing therapist assignment:", error);
      res.status(500).json({ message: "Failed to remove therapist assignment" });
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

      // Update last visit timestamp when therapist views patient details
      await storage.updateTherapistPatientVisit(req.user!.id, patientId);
      
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
      
      const completions = await storage.getPatientExerciseCompletionsForTherapist(patientId);
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

  // Therapist exercises endpoints
  app.get("/api/therapist/patient/:patientId/exercises", async (req, res) => {
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
      
      const exercises = await storage.getTherapistExercisesForPatient(patientId);
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient exercises" });
    }
  });

  app.post("/api/therapist/exercises", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "therapist") {
      return res.sendStatus(403);
    }
    try {
      // Verify patient is assigned to this therapist
      const patients = await storage.getTherapistPatients(req.user!.id);
      const patient = patients.find(p => p.id === req.body.patientId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found or not assigned to you" });
      }

      const validatedData = insertTherapistExerciseSchema.parse({
        ...req.body,
        therapistId: req.user!.id
      });
      
      const exercise = await storage.createTherapistExercise(validatedData);
      res.status(201).json(exercise);
    } catch (error) {
      res.status(400).json({ message: "Invalid exercise data" });
    }
  });

  // Get exercise completions for specific ABC schema (MUST be before the generic abc-schemas/:id route)
  app.get("/api/abc-schemas/:id/exercises", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const abcSchemaId = req.params.id;
      
      // Verify ABC schema exists and user has access
      const abcSchema = await storage.getAbcSchema(abcSchemaId);
      
      if (!abcSchema) {
        return res.status(404).json({ message: "ABC schema not found" });
      }

      // For therapists, verify they have access to this ABC schema
      if (req.user!.role === "therapist") {
        // Get all patients for this therapist to check access
        const patients = await storage.getTherapistPatients(req.user!.id);
        const hasAccess = patients.some(patient => patient.id === abcSchema.userId);
        
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied to this ABC schema" });
        }
      } else {
        // For patients, verify they own this ABC schema
        if (abcSchema.userId !== req.user!.id) {
          return res.status(403).json({ message: "Access denied to this ABC schema" });
        }
      }
      
      const exercises = await storage.getExerciseCompletionsByAbcSchemaId(abcSchemaId);
      res.json(exercises);
    } catch (error) {
      console.error("Error fetching ABC exercises:", error);
      res.status(500).json({ message: "Failed to fetch ABC exercises" });
    }
  });

  // Get exercises assigned to current patient
  app.get("/api/patient/exercises", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const exercises = await storage.getTherapistExercisesForPatient(req.user!.id);
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assigned exercises" });
    }
  });

  // Get exercises created by current therapist
  app.get("/api/therapist/exercises", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "therapist") {
      return res.sendStatus(403);
    }
    try {
      const exercises = await storage.getTherapistExercisesByTherapist(req.user!.id);
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch therapist exercises" });
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
