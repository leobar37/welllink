import {
  NotFoundException,
  BadRequestException,
} from "../../utils/http-exceptions";
import { ClientRepository } from "../repository/client";
import { ClientNoteRepository } from "../repository/client-note";
import type { Client, NewClient } from "../../db/schema/client";
import { ClientLabel } from "../../db/schema/client";
import type { HealthSurveyResponse } from "../../db/schema/health-survey";
import type { RequestContext } from "../../types/context";

export class ClientService {
  constructor(
    private clientRepository: ClientRepository,
    private clientNoteRepository: ClientNoteRepository,
  ) {}

  async getClients(ctx: RequestContext): Promise<Client[]> {
    return this.clientRepository.findByUser(ctx);
  }

  async getClient(ctx: RequestContext, id: string): Promise<Client> {
    const client = await this.clientRepository.findById(ctx, id);
    if (!client) {
      throw new NotFoundException("Client not found");
    }
    return client;
  }

  async createClient(
    ctx: RequestContext,
    data: NewClient,
  ): Promise<Client> {
    if (!data.name) {
      throw new BadRequestException("Client name is required");
    }

    // Phone/WhatsApp is required and used for both phone and WhatsApp communication
    if (!data.phone) {
      throw new BadRequestException("Phone/WhatsApp number is required");
    }

    // Check if client already exists with same phone/WhatsApp
    const existing = await this.clientRepository.findByPhone(ctx, data.phone);
    if (existing) {
      throw new BadRequestException(
        "Client with this phone/WhatsApp already exists",
      );
    }

    return this.clientRepository.create(data);
  }

  async updateClient(
    ctx: RequestContext,
    id: string,
    data: Partial<NewClient>,
  ): Promise<Client> {
    const existingClient = await this.clientRepository.findById(ctx, id);
    if (!existingClient) {
      throw new NotFoundException("Client not found");
    }

    return this.clientRepository.update(ctx, id, data);
  }

  async deleteClient(ctx: RequestContext, id: string): Promise<void> {
    const existingClient = await this.clientRepository.findById(ctx, id);
    if (!existingClient) {
      throw new NotFoundException("Client not found");
    }

    await this.clientRepository.delete(ctx, id);
  }

  async getClientsByLabel(
    ctx: RequestContext,
    label: ClientLabel,
  ): Promise<Client[]> {
    return this.clientRepository.getByLabel(ctx, label);
  }

  async getClientsWithoutContact(
    ctx: RequestContext,
    daysSince: number,
  ): Promise<Client[]> {
    return this.clientRepository.getWithoutRecentContact(ctx, daysSince);
  }

  async addNote(ctx: RequestContext, clientId: string, note: string) {
    const client = await this.clientRepository.findById(ctx, clientId);
    if (!client) {
      throw new NotFoundException("Client not found");
    }

    return this.clientNoteRepository.create({
      clientId,
      profileId: client.profileId,
      note,
    });
  }

  async getNotes(ctx: RequestContext, clientId: string) {
    return this.clientNoteRepository.findByClientId(ctx, clientId);
  }

  async createClientFromSurvey(
    ctx: RequestContext,
    survey: HealthSurveyResponse,
    profileId: string,
  ): Promise<Client> {
    // Use visitorPhone for both phone and WhatsApp (single field approach)
    if (!survey.visitorPhone) {
      throw new BadRequestException(
        "Survey must have phone/WhatsApp number",
      );
    }

    const phone = survey.visitorPhone;

    // Check if client already exists
    const existing = await this.clientRepository.findByPhone(ctx, phone);
    if (existing) {
      throw new BadRequestException("Client already exists from this survey");
    }

    return this.clientRepository.create({
      profileId,
      healthSurveyId: survey.id,
      name: survey.visitorName,
      phone: phone, // Used for both phone and WhatsApp
      email: survey.visitorEmail,
      label: ClientLabel.PROSPECTO, // Default for survey leads
    });
  }
}
