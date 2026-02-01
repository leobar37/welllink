import { createTool } from "@voltagent/core";
import { z } from "zod";
import { ClientService } from "../../../../services/business/client";
import { ClientRepository } from "../../../../services/repository/client";
import { ClientNoteRepository } from "../../../../services/repository/client-note";
import { ClientLabel } from "../../../../db/schema/client";

const clientRepository = new ClientRepository();
const clientNoteRepository = new ClientNoteRepository();
const clientService = new ClientService(clientRepository, clientNoteRepository);

const PatientLookupInput = z.object({
  profileId: z.string().describe("The profile ID to look up the patient in"),
  phone: z
    .string()
    .describe("Patient phone number with country code, e.g., +51987654321"),
});

const CreatePatientInput = z.object({
  profileId: z
    .string()
    .describe("The profile ID to associate the patient with"),
  phone: z.string().describe("Patient phone number"),
  name: z.string().describe("Patient full name"),
  email: z.string().optional().describe("Patient email (optional)"),
});

const UpdateLabelInput = z.object({
  profileId: z.string().describe("The profile ID the patient belongs to"),
  patientId: z.string().describe("Patient ID"),
  label: z
    .enum(["consumidor", "prospecto", "afiliado"])
    .describe("New label for the patient"),
});

export const getPatientTool = createTool({
  name: "get_patient",
  description:
    "Look up a patient by phone number. Returns patient info if found, or null if not found. Use this to check if a patient exists before creating a new one.",
  parameters: PatientLookupInput,
  execute: async ({ profileId, phone }) => {
    try {
      const patient = await clientService.findByPhoneAndProfile(
        phone,
        profileId,
      );

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

export const createPatientTool = createTool({
  name: "create_patient",
  description:
    "Create a new patient record. Use this when a patient is contacting for the first time. Required fields: phone and name. Optional: email. The patient will be created with the 'prospecto' label by default.",
  parameters: CreatePatientInput,
  execute: async ({ profileId, phone, name, email }) => {
    try {
      const patient = await clientService.createForProfile({
        phone,
        name,
        email: email || null,
        profileId,
        label: ClientLabel.PROSPECTO,
      });

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

export const updatePatientLabelTool = createTool({
  name: "update_patient_label",
  description:
    "Update a patient's label to track their relationship stage. Labels: 'consumidor' (has purchased), 'prospecto' (potential customer), 'afiliado' (affiliate/partner). Use this after appointments to move from 'prospecto' to 'consumidor'.",
  parameters: UpdateLabelInput,
  execute: async ({ profileId, patientId, label }) => {
    try {
      const patient = await clientService.updateForProfile(
        patientId,
        profileId,
        {
          label: label as ClientLabel,
        },
      );

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
