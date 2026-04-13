import mongoose, { Schema, Document, Types } from 'mongoose'

export interface INotification extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  type: 'application_update' | 'new_job' | 'subscription_approved' | 'subscription_rejected' | 'job_expired' | 'message' | 'system'
  title: string
  message: string
  data?: Record<string, unknown>
  read: boolean
  createdAt: Date
  updatedAt: Date
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['application_update', 'new_job', 'subscription_approved', 'subscription_rejected', 'job_expired', 'message', 'system'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Index for fetching user notifications sorted by date
notificationSchema.index({ userId: 1, createdAt: -1 })

// Auto-delete old read notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { read: true } })

// Static method to create notifications
notificationSchema.statics.createNotification = async function(
  userId: Types.ObjectId | string,
  type: INotification['type'],
  title: string,
  message: string,
  data?: Record<string, unknown>
) {
  return this.create({
    userId,
    type,
    title,
    message,
    data,
    read: false,
  })
}

export const Notification = mongoose.model<INotification>('Notification', notificationSchema)
