const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Islamic Dating Platform API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the Islamic Dating Platform with halal guidelines and wali oversight',
      contact: {
        name: 'API Support',
        email: 'support@islamicdating.com'
      },
      license: {
        name: 'Private',
        url: 'https://islamicdating.com/license'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.islamicdating.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName', 'dateOfBirth', 'gender'],
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            firstName: {
              type: 'string',
              description: 'First name'
            },
            lastName: {
              type: 'string',
              description: 'Last name'
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              description: 'Date of birth'
            },
            gender: {
              type: 'string',
              enum: ['male', 'female'],
              description: 'Gender'
            },
            maritalStatus: {
              type: 'string',
              enum: ['never_married', 'widow', 'divorced', 'separated'],
              description: 'Marital status'
            },
            religiousLevel: {
              type: 'string',
              enum: ['practicing', 'moderate', 'learning'],
              description: 'Religious practice level'
            },
            prayerFrequency: {
              type: 'string',
              enum: ['5_times_daily', 'regularly', 'sometimes', 'rarely'],
              description: 'Prayer frequency'
            },
            location: {
              type: 'object',
              properties: {
                country: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                latitude: { type: 'number' },
                longitude: { type: 'number' }
              }
            },
            bio: {
              type: 'string',
              description: 'User biography'
            },
            profilePhoto: {
              type: 'string',
              description: 'Profile photo URL'
            },
            subscription: {
              type: 'object',
              properties: {
                plan: {
                  type: 'string',
                  enum: ['free', 'premium']
                },
                status: { type: 'string' },
                currentPeriodEnd: { type: 'string', format: 'date-time' }
              }
            },
            isVerified: {
              type: 'boolean',
              description: 'Email verification status'
            },
            isPhotoVerified: {
              type: 'boolean',
              description: 'Photo verification status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Match: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user1: { type: 'string', description: 'First user ID' },
            user2: { type: 'string', description: 'Second user ID' },
            score: { type: 'number', description: 'Compatibility score (0-100)' },
            status: {
              type: 'string',
              enum: ['suggested', 'liked', 'matched', 'rejected']
            },
            matchedAt: { type: 'string', format: 'date-time' }
          }
        },
        Wali: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            relation: {
              type: 'string',
              enum: ['father', 'brother', 'uncle', 'guardian']
            },
            ward: { type: 'string', description: 'User ID of the ward' },
            permissions: {
              type: 'object',
              properties: {
                canViewProfile: { type: 'boolean' },
                canViewMatches: { type: 'boolean' },
                canViewMessages: { type: 'boolean' },
                canApproveConversations: { type: 'boolean' },
                canBlockUsers: { type: 'boolean' }
              }
            },
            isVerified: { type: 'boolean' }
          }
        },
        Chat: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            participants: {
              type: 'array',
              items: { type: 'string' }
            },
            messages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sender: { type: 'string' },
                  content: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' },
                  read: { type: 'boolean' }
                }
              }
            },
            waliApprovalRequired: { type: 'boolean' },
            waliApproved: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            errors: {
              type: 'array',
              items: { type: 'string' },
              description: 'Detailed error messages'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Success message'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'No token provided'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Resource not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Validation error',
                errors: ['Email is required', 'Password must be at least 8 characters']
              }
            }
          }
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Server error'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and registration'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Profiles',
        description: 'User profile operations'
      },
      {
        name: 'Matches',
        description: 'Matching and compatibility'
      },
      {
        name: 'Chat',
        description: 'Messaging and conversations'
      },
      {
        name: 'Subscription',
        description: 'Premium subscription and payments'
      },
      {
        name: 'Wali',
        description: 'Guardian oversight system'
      },
      {
        name: 'Search',
        description: 'Advanced search and filtering'
      },
      {
        name: 'Analytics',
        description: 'User and platform analytics'
      },
      {
        name: 'Moderation',
        description: 'Content moderation and reporting'
      },
      {
        name: 'Photo Verification',
        description: 'Photo verification system'
      },
      {
        name: 'Admin',
        description: 'Administrative operations'
      }
    ]
  },
  apis: ['./routes/*.js'] // Path to the API routes
};

const swaggerSpecs = swaggerJsdoc(options);

module.exports = swaggerSpecs;
