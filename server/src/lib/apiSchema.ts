import { z } from 'zod';
import type { ProjectTemplate } from '@shared/types/options/template';

// Request schemas
export const UpdateProjectTemplateSchema = z.custom<ProjectTemplate>();

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
export const UpdateProjectTemplateRoute = {
	request: UpdateProjectTemplateSchema,
	response: z.union([UpdateProjectTemplateSchema, ErrorResponseSchema]),
};

export const UpdateProjectDataRoute = {
	request: UpdateProjectDataSchema,
	response: z.union([MessageResponseSchema, ErrorResponseSchema]),
};

export const UploadPauseSoundRoute = {
	request: UploadPauseSoundSchema,
	response: z.union([FileUploadResponseSchema, ErrorResponseSchema]),
};
