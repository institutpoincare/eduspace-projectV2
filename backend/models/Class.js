const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  meetLink: {
    type: String,
    validate: {
      validator: function(v) {
        return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  },
  pricing: {
    type: {
      type: String,
      enum: ['monthly', 'full_course', 'hourly'],
      default: 'monthly'
    },
    price: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'TND'
    }
  },
  schedule: [{
    day: {
      type: String,
      required: true,
      enum: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
    },
    startTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    }
  }],
  students: {
    enrolled: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    invited: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  recordings: [{
    title: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Class', classSchema);
