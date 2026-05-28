import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      default: 'New Chat',
    },
    agentMode: {
      type: String,
      required: true,
      enum: ['maths', 'ml', 'automata'],
    },
    problem: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: 'idle',
    },
    events: {
      type: Array,
      default: [],
    },
    finalAnswer: {
      type: String,
      default: '',
    },
    errorMsg: {
      type: String,
      default: '',
    },
    attachments: {
      type: Array,
      default: [],
    },
    history: {
      type: Array,
      default: [],
    }
  },
  {
    timestamps: true,
  }
);

const Chat = mongoose.models.Chat || mongoose.model('Chat', ChatSchema);

export default Chat;
