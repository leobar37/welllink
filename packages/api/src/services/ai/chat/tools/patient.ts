import { createTool } from "@voltagent/core";
import { z } from "zod";
import { db } from "../../../../db";
import { client } from "../../../../db/schema/client";
import { ClientLabel } from "../../../../db/schema/client";
import { eq, and } from "drizzle-orm";

/**
 * Input schema for patient lookup
 */
const PatientLookupInput = z.object({
  profileId: z.string().describe("The profile ID to look up the patient in"),
  phone: z.string().describe("Patient phone number with country code, e.g., +51987654321"),
});

/**
 * Input schema for patient creation
 */
const CreatePatientInput = z.object({
  profileId: z.string().describe("The profile ID to associate the patient with"),
  phone: z.string().describe("Patient phone number"),
  name: z.string().describe("Patient full name"),
  email: z.string().optional().describe("Patient email (optional)"),
});

/**
 * Input schema for updating patient label
 */
const UpdateLabelInput = z.object({
  profileId: z.string().describe("The profile ID the patient belongs to"),
  patientId: z.string().describe("Patient ID"),
  label: z.enum(["consumidor", "prospecto", "afiliado"]).describe("New label for the patient"),
});

/**
 * Patient tool for the AI agent
 * Handles patient lookups, creation, and label updates
 */
export const getPatientTool = createTool({
  name: "get_patient",
  description:
    "Look up a patient by phone number. Returns patient info if found, or null if not found. Use this to check if a patient exists before creating a new one.",
  parameters: PatientLookupInput,
  execute: async ({ profileId, phone }) => {
    try {
      const [patient] = await db
        .select()
        .from(client)
        .where(
          and(
            eq(client.phone, phone),
            eq(client.profileId, profileId)
          )
        )
        .limit(1);

      if (!patient) {
        return {
          found: false,
          message: `No patient found with phone ${phone}`,
        };
      }

      return {
        found: true,
        patient: {
          id: patient.id,
          name: patient.name,
          phone: patient.phone,
          email: patient.email,
          label: patient.label,
          createdAt: patient.createdAt?.toISOString(),
        },
      };
    } catch (error) {
      return {
        error: true,
        message: `Error looking up patient: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});

/**
 * Tool to create a new patient
 */
export const createPatientTool = createTool({
  name: "create_patient",
  description:
    "Create a new patient record. Use this when a patient is contacting for the first time. Required fields: phone and name. Optional: email. The patient will be created with the 'prospecto' label by default.",
  parameters: CreatePatientInput,
  execute: async ({ profileId, phone, name, email }) => {
    try {
      const [patient] = await db
        .insert(client)
        .values({
          phone,
          name,
          email: email || null,
          profileId,
          label: ClientLabel.PROSPECTO,
        })
        .returning();

      return {
        success: true,
        patient: {
          id: patient.id,
          name: patient.name,
          phone: patient.phone,
          email: patient.email,
          label: patient.label,
        },
      };
    } catch (error) {
      return {
        error: true,
        message: `Error creating patient: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});

/**
 * Tool to update patient label
 */
export const updatePatientLabelTool = createTool({
  name: "update_patient_label",
  description:
    "Update a patient's label to track their relationship stage. Labels: 'consumidor' (has purchased), 'prospecto' (potential customer), 'afiliado' (affiliate/partner). Use this after appointments to move from 'prospecto' to 'consumidor'.",
  parameters: UpdateLabelInput,
  execute: async ({ profileId, patientId, label }) => {
    try {
      const [patient] = await db
        .update(client)
        .set({
          label: label as ClientLabel,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(client.id, patientId),
            eq(client.profileId, profileId)
          )
        )
        .returning();

      if (!patient) {
        return {
          error: true,
          message: `Patient with ID ${patientId} not found`,
        };
      }

      return {
        success: true,
        patient: {
          id: patient.id,
          name: patient.name,
          label: patient.label,
        },
      };
    } catch (error) {
      return {
        error: true,
        message: `Error updating patient label: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
