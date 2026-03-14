import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  timestamp,
  jsonb,
  decimal,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const videoStatusEnum = pgEnum('video_status', [
  'uploading',
  'processing',
  'completed',
  'failed',
])

export const jobStatusEnum = pgEnum('job_status', [
  'pending',
  'processing',
  'completed',
  'failed',
])

// Profiles table
export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Videos table
export const videos = pgTable('videos', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  originalFilename: text('original_filename').notNull(),
  storagePath: text('storage_path').notNull(),
  duration: integer('duration').default(0),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  width: integer('width').default(1920),
  height: integer('height').default(1080),
  status: videoStatusEnum('status').default('uploading'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Processing jobs table
export const processingJobs = pgTable('processing_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  videoId: uuid('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  status: jobStatusEnum('status').default('pending'),
  currentStep: text('current_step').default('Initializing'),
  progress: integer('progress').default(0),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Transcripts table
export const transcripts = pgTable('transcripts', {
  id: uuid('id').defaultRandom().primaryKey(),
  videoId: uuid('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }).unique(),
  content: text('content'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Analyses table
export const analyses = pgTable('analyses', {
  id: uuid('id').defaultRandom().primaryKey(),
  videoId: uuid('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }).unique(),
  data: jsonb('data'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Clips table
export const clips = pgTable('clips', {
  id: uuid('id').defaultRandom().primaryKey(),
  videoId: uuid('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').default(''),
  startTime: decimal('start_time', { precision: 10, scale: 2 }).notNull(),
  endTime: decimal('end_time', { precision: 10, scale: 2 }).notNull(),
  storagePath: text('storage_path').notNull(),
  thumbnailPath: text('thumbnail_path'),
  duration: integer('duration').notNull(),
  format: text('format').default('mp4'),
  resolution: text('resolution').default('1080p'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// Thumbnails table
export const thumbnails = pgTable('thumbnails', {
  id: uuid('id').defaultRandom().primaryKey(),
  clipId: uuid('clip_id').notNull().references(() => clips.id, { onDelete: 'cascade' }).unique(),
  storagePath: text('storage_path').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// Relations
export const videosRelations = relations(videos, ({ many, one }) => ({
  processingJobs: many(processingJobs),
  clips: many(clips),
  transcript: one(transcripts, {
    fields: [videos.id],
    references: [transcripts.videoId],
  }),
  analysis: one(analyses, {
    fields: [videos.id],
    references: [analyses.videoId],
  }),
}))

export const processingJobsRelations = relations(processingJobs, ({ one }) => ({
  video: one(videos, {
    fields: [processingJobs.videoId],
    references: [videos.id],
  }),
}))

export const clipsRelations = relations(clips, ({ one, many }) => ({
  video: one(videos, {
    fields: [clips.videoId],
    references: [videos.id],
  }),
  thumbnail: one(thumbnails, {
    fields: [clips.id],
    references: [thumbnails.clipId],
  }),
}))

export const transcriptsRelations = relations(transcripts, ({ one }) => ({
  video: one(videos, {
    fields: [transcripts.videoId],
    references: [videos.id],
  }),
}))

export const analysesRelations = relations(analyses, ({ one }) => ({
  video: one(videos, {
    fields: [analyses.videoId],
    references: [videos.id],
  }),
}))

export const thumbnailsRelations = relations(thumbnails, ({ one }) => ({
  clip: one(clips, {
    fields: [thumbnails.clipId],
    references: [clips.id],
  }),
}))

// Type exports
export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert
export type Video = typeof videos.$inferSelect
export type NewVideo = typeof videos.$inferInsert
export type ProcessingJob = typeof processingJobs.$inferSelect
export type NewProcessingJob = typeof processingJobs.$inferInsert
export type Transcript = typeof transcripts.$inferSelect
export type NewTranscript = typeof transcripts.$inferInsert
export type Analysis = typeof analyses.$inferSelect
export type NewAnalysis = typeof analyses.$inferInsert
export type Clip = typeof clips.$inferSelect
export type NewClip = typeof clips.$inferInsert
export type Thumbnail = typeof thumbnails.$inferSelect
export type NewThumbnail = typeof thumbnails.$inferInsert
