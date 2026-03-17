import { Request, Response } from 'express';
import { AiService, ChatMessage } from '../services/ai.service';
import { ApiResponse } from '../types';

export class AiController {
  private aiService = new AiService();

  async handleChat(req: Request, res: Response): Promise<void> {
    try {
      const { message, history = [] } = req.body;

      if (!message || typeof message !== 'string') {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Message is required and must be a string',
        };
        res.status(400).json(response);
        return;
      }

      // Validate history format if provided
      if (!Array.isArray(history)) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'History must be an array',
        };
        res.status(400).json(response);
        return;
      }

      // Call AI service
      const aiResponse = await this.aiService.chat(message, history as ChatMessage[]);

      const response: ApiResponse<{ response: string }> = {
        success: true,
        data: {
          response: aiResponse,
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      console.error('AI Controller Error:', error);
      console.error('Error stack:', error.stack);
      console.error('Request body:', req.body);
      const response: ApiResponse<null> = {
        success: false,
        error: error.message || 'Failed to process chat message',
      };
      res.status(500).json(response);
    }
  }
}
