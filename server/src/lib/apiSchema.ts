import { z } from 'zod';
import type { Template } from '@shared/types/options/template';

// Request schemas
export const UpdateTemplateSchema = z.custom<Template>();

export const UpdateProjectDataSchema = z.object({
	data: z.any(),
});

export const UploadPauseSoundSchema = z.object({
	file: z.any(), // FormData file
});

// Response schemas
export const MessageResponseSchema = z.object({
	message: z.string(),
});

export const ErrorResponseSchema = z.object({
	error: z.string(),
});

export const FileUploadResponseSchema = z.object({
	filename: z.string(),
});

// Combined schemas for routes
export const UpdateTemplateRoute = {
	request: UpdateTemplateSchema,
	response: z.union([UpdateTemplateSchema, ErrorResponseSchema]),
};

export const UpdateProjectDataRoute = {
	request: UpdateProjectDataSchema,
	response: z.union([MessageResponseSchema, ErrorResponseSchema]),
};

export const UploadPauseSoundRoute = {
	request: UploadPauseSoundSchema,
	response: z.union([FileUploadResponseSchema, ErrorResponseSchema]),
};
