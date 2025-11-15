/**
 * Messages Controller
 * Handles in-app messaging endpoints
 */

import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Query,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  async sendMessage(
    @CurrentUser() user: any,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.messagesService.sendMessage(user.id, createMessageDto);
  }

  @Get('inbox')
  @ApiOperation({ summary: 'Get inbox messages' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async getInbox(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.messagesService.getInbox(
      user.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('sent')
  @ApiOperation({ summary: 'Get sent messages' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async getSentMessages(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.messagesService.getSentMessages(
      user.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get conversations list' })
  async getConversationsList(@CurrentUser() user: any) {
    return this.messagesService.getConversationsList(user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread message count' })
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.messagesService.getUnreadCount(user.id);
    return { count };
  }

  @Get('conversation/:otherUserId')
  @ApiOperation({ summary: 'Get conversation with a specific user' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  async getConversation(
    @CurrentUser() user: any,
    @Param('otherUserId') otherUserId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.messagesService.getConversation(
      user.id,
      otherUserId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get message by ID' })
  async getMessage(@Param('id') id: string, @CurrentUser() user: any) {
    return this.messagesService.getMessage(id, user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark message as read' })
  async markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.messagesService.markAsRead(id, user.id);
  }
}
