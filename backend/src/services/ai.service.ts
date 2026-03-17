import { GoogleGenerativeAI } from '@google/generative-ai';
import { ReportService } from './report.service';
import { FuelService } from './fuel.service';
import { NotificationService } from './notification.service';

export interface ChatMessage {
  role: 'user' | 'model' | 'function';
  parts: Array<{
    text?: string;
    functionResponse?: {
      name: string;
      response: any;
    };
    functionCall?: {
      name: string;
      args: Record<string, any>;
    };
  }>;
}

export class AiService {
  private genAI: GoogleGenerativeAI | null = null;
  private reportService = new ReportService();
  private fuelService = new FuelService();
  private notificationService = new NotificationService();

  constructor() {
    // Check API Key at class instantiation
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is missing in .env');
    }
  }

  /**
   * Initialize the Gemini AI client lazily (only when needed)
   */
  private initializeGenAI(): GoogleGenerativeAI {
    if (this.genAI) {
      return this.genAI;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing in .env');
    }
    
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      return this.genAI;
    } catch (error: any) {
      console.error('Error initializing Gemini AI client:', error);
      throw new Error(`Failed to initialize Gemini AI: ${error.message}`);
    }
  }

  /**
   * Get function declarations for Gemini
   */
  private getFunctionDeclarations() {
    return [
      {
        name: 'get_dashboard_stats',
        description: 'Get comprehensive dashboard statistics including total revenue, daily burn (expenses + fuel), net profit, production count, and yield efficiency. Use this when asked about revenue, profit, expenses, or overall financial performance.',
        parameters: {
          type: 'OBJECT',
          properties: {
            startDate: {
              type: 'STRING',
              description: 'Start date in YYYY-MM-DD format. Defaults to today if not provided.',
            },
            endDate: {
              type: 'STRING',
              description: 'End date in YYYY-MM-DD format. Defaults to today if not provided.',
            },
          },
          required: [],
        },
      },
      {
        name: 'get_fuel_efficiency',
        description: 'Get current fuel efficiency metrics and alerts. Returns recent fuel logs with efficiency data and alert levels. Use this when asked about fuel consumption, efficiency, or generator performance.',
        parameters: {
          type: 'OBJECT',
          properties: {
            limit: {
              type: 'NUMBER',
              description: 'Number of recent fuel logs to retrieve. Defaults to 10.',
            },
          },
          required: [],
        },
      },
      {
        name: 'check_active_alerts',
        description: 'Check for active system alerts including credit risks, fuel efficiency issues, low production warnings, and other operational concerns. Use this when asked about alerts, warnings, issues, or problems.',
        parameters: {
          type: 'OBJECT',
          properties: {},
          required: [],
        },
      },
    ];
  }

  /**
   * Execute a function call with error handling
   */
  private async executeFunction(functionName: string, args: Record<string, any>): Promise<any> {
    try {
      console.log(`[AI Service] Executing function: ${functionName}`, { args });
      
      switch (functionName) {
        case 'get_dashboard_stats': {
          try {
            const startDate = args.startDate ? new Date(args.startDate) : undefined;
            const endDate = args.endDate ? new Date(args.endDate) : undefined;
            const data = await this.reportService.getDashboardData(startDate, endDate);
            return {
              total_revenue: data.total_revenue,
              total_burn: data.total_burn,
              net_profit: data.net_profit,
              production_count: data.production_count,
              yield_efficiency: data.yield_efficiency,
              cost_per_unit: data.cost_per_unit,
              cash_revenue: data.cash_revenue,
              credit_revenue: data.credit_revenue,
              period: data.period,
              comparison: data.comparison,
            };
          } catch (error: any) {
            console.error('[AI Service] Error in get_dashboard_stats:', {
              error: error.message,
              stack: error.stack,
            });
            throw new Error(`Failed to fetch dashboard stats: ${error.message}`);
          }
        }

        case 'get_fuel_efficiency': {
          try {
            const limit = args.limit || 10;
            const fuelLogs = await this.fuelService.getFuelLogs(limit, 0);
            return {
              recent_logs: fuelLogs.map((log) => ({
                date: log.fuel_date,
                liters_added: log.liters_added,
                cost_per_liter: log.cost_per_liter,
                total_cost: log.total_cost,
                boxes_produced: log.boxes_produced,
                fuel_efficiency: log.fuel_efficiency,
                alert_level: log.alert_level,
              })),
              latest_efficiency: fuelLogs[0]?.fuel_efficiency || null,
              latest_alert_level: fuelLogs[0]?.alert_level || 'NORMAL',
            };
          } catch (error: any) {
            console.error('[AI Service] Error in get_fuel_efficiency:', {
              error: error.message,
              stack: error.stack,
            });
            throw new Error(`Failed to fetch fuel efficiency: ${error.message}`);
          }
        }

        case 'check_active_alerts': {
          try {
            const alerts = await this.notificationService.getActiveAlerts();
            return {
              active_alerts: alerts.map((alert) => ({
                type: alert.type,
                severity: alert.severity,
                title: alert.title,
                message: alert.message,
                timestamp: alert.timestamp,
              })),
              count: alerts.length,
            };
          } catch (error: any) {
            console.error('[AI Service] Error in check_active_alerts:', {
              error: error.message,
              stack: error.stack,
            });
            throw new Error(`Failed to fetch active alerts: ${error.message}`);
          }
        }

        default:
          throw new Error(`Unknown function: ${functionName}`);
      }
    } catch (error: any) {
      // Log and re-throw - the caller will handle it gracefully
      console.error(`[AI Service] Function execution error for ${functionName}:`, {
        error: error.message,
        stack: error.stack,
        args,
      });
      throw error;
    }
  }

  /**
   * Convert chat history to Gemini format
   * Handles both the ChatMessage interface format and the simpler format from frontend
   */
  private convertHistoryToGeminiFormat(history: ChatMessage[] | any[]): any[] {
    return history.map((msg: any) => {
      // Handle simple format from frontend: { role: 'user'|'model', parts: [{ text: string }] }
      if (msg.parts && Array.isArray(msg.parts) && msg.parts.length > 0 && msg.parts[0].text !== undefined) {
        if (msg.role === 'user' || msg.role === 'model') {
          return {
            role: msg.role,
            parts: msg.parts.map((part: any) => ({
              text: part.text || '',
            })),
          };
        }
      }
      
      // Handle ChatMessage interface format
      if (msg.role === 'user') {
        return {
          role: 'user',
          parts: (msg.parts || []).map((part: any) => ({
            text: part.text || '',
          })),
        };
      } else if (msg.role === 'model' || msg.role === 'assistant') {
        return {
          role: 'model',
          parts: (msg.parts || []).map((part: any) => {
            if (part.text) {
              return { text: part.text };
            } else if (part.functionResponse) {
              return {
                functionResponse: {
                  name: part.functionResponse.name,
                  response: part.functionResponse.response,
                },
              };
            }
            return { text: '' };
          }),
        };
      }
      return null;
    }).filter(Boolean);
  }

  /**
   * Main chat method with function calling
   */
  async chat(userMessage: string, history: ChatMessage[] = []): Promise<string> {
    try {
      console.log('[AI Service] Starting chat request', { messageLength: userMessage.length, historyLength: history.length });
      
      // Check API Key first
      if (!process.env.GEMINI_API_KEY) {
        const error = new Error('GEMINI_API_KEY is missing in .env');
        console.error('[AI Service] API Key check failed:', error.message);
        throw error;
      }

      // Initialize Gemini AI client lazily (only when actually used)
      let genAI: GoogleGenerativeAI;
      try {
        genAI = this.initializeGenAI();
        console.log('[AI Service] Gemini AI client initialized successfully');
      } catch (error: any) {
        console.error('[AI Service] Failed to initialize Gemini AI client:', {
          error: error.message,
          stack: error.stack,
        });
        throw new Error(`API Key or Model initialization error: ${error.message}`);
      }
      
      // Get model with tools - try multiple model names for compatibility
      // Updated to use current Gemini model names (2024)
      const modelNames = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash-latest', 'gemini-1.5-flash-002', 'gemini-pro'];
      let model;
      let lastError: any = null;
      
      for (const modelName of modelNames) {
        try {
          console.log(`[AI Service] Attempting to initialize model: ${modelName}`);
          model = genAI.getGenerativeModel({
            model: modelName,
            tools: [
              {
                functionDeclarations: this.getFunctionDeclarations(),
              },
            ],
            systemInstruction: {
              parts: [
                {
                  text: `You are the HGT Orchestrator, an operational intelligence agent for an Ice Factory Management System. 

Your role:
- Provide concise, data-driven insights about factory operations
- Use the available tools (functions) to fetch real data ONLY when answering factual questions about factory data
- For simple greetings or general questions, respond directly without using tools
- Be proactive in identifying issues and opportunities
- Use clear, professional language suitable for factory managers
- When presenting numbers, include context (e.g., "Revenue is 50,000 SSP, which is 15% higher than yesterday")
- For financial data, always mention both revenue and expenses to give a complete picture

Guidelines:
- For greetings (hello, hi, etc.) or general questions, respond directly without tools
- If asked about revenue, profit, expenses, or financial metrics, use get_dashboard_stats
- If asked about fuel, generator, or efficiency, use get_fuel_efficiency
- If asked about alerts, warnings, or issues, use check_active_alerts
- Only use tools when you need actual data from the factory system
- Be concise but informative
- Format numbers with commas for readability (e.g., 50,000 instead of 50000)`,
                },
              ],
            },
          });
          console.log(`[AI Service] Model ${modelName} initialized successfully`);
          break; // Success, exit the loop
        } catch (error: any) {
          console.warn(`[AI Service] Failed to initialize model ${modelName}:`, error.message);
          lastError = error;
          continue; // Try next model
        }
      }
      
      if (!model) {
        console.error('[AI Service] All model initialization attempts failed:', {
          attemptedModels: modelNames,
          lastError: lastError?.message,
          stack: lastError?.stack,
        });
        throw new Error(`Model initialization error: Failed to initialize any model. Last error: ${lastError?.message || 'Unknown error'}. Please check your API key and model availability.`);
      }

      // Convert history to Gemini format
      const geminiHistory = this.convertHistoryToGeminiFormat(history);

      // Start chat with history (only if we have history)
      const chatConfig: any = {};
      if (geminiHistory && geminiHistory.length > 0) {
        chatConfig.history = geminiHistory;
      }
      const chat = model.startChat(chatConfig);

      // Send user message
      let result;
      let response;
      try {
        console.log('[AI Service] Sending message to Gemini API...');
        result = await chat.sendMessage(userMessage);
        response = result.response;
        console.log('[AI Service] Received response from Gemini API');
      } catch (error: any) {
        console.error('[AI Service] Error sending message to Gemini API:', {
          error: error.message,
          stack: error.stack,
          errorType: error.name,
        });
        throw new Error(`Gemini API communication error: ${error.message}`);
      }

      // Handle function calling loop
      let iterations = 0;
      const maxIterations = 5; // Prevent infinite loops

      while (iterations < maxIterations) {
        // Try to get function calls - check if it's a method or property
        let functionCalls: any[] = [];
        try {
          if (typeof response.functionCalls === 'function') {
            functionCalls = response.functionCalls() || [];
          } else if (Array.isArray(response.functionCalls)) {
            functionCalls = response.functionCalls;
          } else if (response.candidates && response.candidates.length > 0) {
            // Alternative structure: check candidates[0].content.parts for function calls
            const parts = response.candidates[0].content?.parts || [];
            functionCalls = parts
              .filter((part: any) => part.functionCall)
              .map((part: any) => part.functionCall);
          }
        } catch (err: any) {
          console.warn('Error accessing functionCalls:', err);
        }

        if (!functionCalls || functionCalls.length === 0) {
          // No more function calls, return the text response
          break;
        }

        // Execute all function calls with error handling
        const functionResponses = await Promise.all(
          functionCalls.map(async (functionCall: any) => {
            const functionName = functionCall.name;
            const args = functionCall.args || {} as Record<string, any>;

            try {
              console.log(`[AI Service] Executing function: ${functionName}`, { args });
              const functionResult = await this.executeFunction(functionName, args);
              console.log(`[AI Service] Function ${functionName} executed successfully`);
              return {
                functionResponse: {
                  name: functionName,
                  response: functionResult,
                },
              };
            } catch (error: any) {
              // Log detailed error but don't crash - return error response instead
              console.error(`[AI Service] Error executing function ${functionName}:`, {
                error: error.message,
                stack: error.stack,
                args,
              });
              return {
                functionResponse: {
                  name: functionName,
                  response: {
                    error: error.message || 'Function execution failed',
                    errorType: error.name || 'UnknownError',
                  },
                },
              };
            }
          })
        );

        // Send function responses back to the model
        result = await chat.sendMessage(functionResponses);
        response = result.response;
        iterations++;
      }

      // Get final text response
      let textResponse = '';
      try {
        if (typeof response.text === 'function') {
          textResponse = response.text();
        } else if (typeof response.text === 'string') {
          textResponse = response.text;
        } else if (response.candidates && response.candidates.length > 0) {
          // Alternative: extract text from candidates
          const parts = response.candidates[0].content?.parts || [];
          textResponse = parts
            .filter((part: any) => part.text)
            .map((part: any) => part.text)
            .join('');
        }
        console.log('[AI Service] Successfully extracted text response', { responseLength: textResponse.length });
      } catch (err: any) {
        console.error('[AI Service] Error extracting text response:', {
          error: err.message,
          stack: err.stack,
        });
        textResponse = 'I encountered an error while processing the response.';
      }
      
      if (!textResponse) {
        console.warn('[AI Service] No text response extracted from Gemini API');
        return 'I apologize, but I could not generate a response.';
      }
      
      return textResponse;

    } catch (error: any) {
      // Critical error logging - this must appear in terminal
      console.error('[AI Service] AI Service Error:', error);
      console.error('[AI Service] Error stack:', error.stack);
      console.error('[AI Service] Error details:', {
        message: error.message,
        name: error.name,
        cause: error.cause,
        userMessage: userMessage.substring(0, 100), // Log first 100 chars of user message
      });
      
      // Re-throw with clear error message
      throw error;
    }
  }
}
