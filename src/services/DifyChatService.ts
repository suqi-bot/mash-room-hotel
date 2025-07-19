// Dify聊天服务
export interface DifyChatMessage {
  inputs?: any
  query: string
  response_mode: string
  conversation_id?: string
  user: string
}

export interface DifyChatResponse {
  event: string
  data: any
  conversation_id?: string
  message_id?: string
}

export class DifyChatService {
  private baseURL: string
  private conversationId: string | null = null
  private token: string

  constructor() {
    // 使用代理路径避免CORS问题
    // 开发环境使用Vite代理，生产环境需要配置相应的代理
    this.baseURL = '/api/dify/v1'
    this.token = 'app-iB6nMxbyCqXQPwHConOuiImb'
  }

  /**
   * 发送聊天消息
   */
  async sendMessage(message: string, userId: string = 'user'): Promise<ReadableStream> {
    const chatMessage: DifyChatMessage = {
      inputs: {},
      query: message,
      response_mode: 'streaming',
      conversation_id: this.conversationId || undefined,
      user: userId
    }

    try {
      const response = await fetch(`${this.baseURL}/chat-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(chatMessage)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      return response.body!
    } catch (error) {
      throw error
    }
  }

  /**
   * 处理SSE流式响应
   */
  async *processStreamResponse(stream: ReadableStream): AsyncGenerator<string, void, unknown> {
    const reader = stream.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.trim() === '') continue

          // 处理SSE格式的数据
          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            if (data === '[DONE]') {
              return
            }

            try {
              const parsed = JSON.parse(data)

              // 更新会话ID
              if (parsed.conversation_id) {
                this.conversationId = parsed.conversation_id
              }

              // 处理不同类型的事件
              if (parsed.event === 'message' && parsed.answer) {
                // Dify 返回的完整消息
                yield parsed.answer
              } else if (parsed.event === 'agent_message' && parsed.answer) {
                // Agent 消息
                yield parsed.answer
              } else if (parsed.event === 'message_replace' && parsed.answer) {
                // 消息替换
                yield parsed.answer
              } else if (parsed.event === 'message_end') {
                return
              } else if (parsed.answer) {
                // 其他包含 answer 的情况
                yield parsed.answer
              }
            } catch (e) {
              // 如果不是JSON格式，直接返回文本
              if (data && data !== '[DONE]') {
                yield data
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * 重置会话
   */
  resetConversation() {
    this.conversationId = null
  }

  /**
   * 获取当前会话ID
   */
  getConversationId(): string | null {
    return this.conversationId
  }
}

// 创建单例实例
export const difyChatService = new DifyChatService()
