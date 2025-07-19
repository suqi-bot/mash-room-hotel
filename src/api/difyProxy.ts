// Dify代理服务 - 解决CORS问题
export interface DifyProxyRequest {
  url: string
  data: any
  headers?: Record<string, string>
}

export interface DifyProxyResponse {
  success: boolean
  data?: any
  error?: string
}

/**
 * 通过代理调用Dify API，解决CORS问题
 */
export async function callDifyWithProxy(request: DifyProxyRequest): Promise<DifyProxyResponse> {
  try {
    const response = await fetch(request.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...request.headers
      },
      body: JSON.stringify(request.data)
    })

    // 获取响应文本
    const responseText = await response.text()

    if (response.ok) {
      // 检查响应是否为JSON格式
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        try {
          const data = JSON.parse(responseText)
          return {
            success: true,
            data
          }
        } catch (parseError) {
          return {
            success: false,
            error: `JSON解析失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`
          }
        }
      } else {
        return {
          success: false,
          error: `响应格式错误: 期望JSON，实际收到 ${contentType}。响应内容: ${responseText.substring(0, 200)}`
        }
      }
    } else {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}. 响应: ${responseText.substring(0, 200)}`
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 调用Dify公网链接（通过代理）
 */
export async function callDifyPublicAPI(message: string): Promise<DifyProxyResponse> {
  return callDifyWithProxy({
    url: '/api/dify/chat/fggmGdSFt6MSQFJa', // 使用代理路径
    data: {
      query: message,
      inputs: {
        room_info: `普洱蘑菇庄园民宿房间信息：
- 201号房：大床房，19元/晚，温馨舒适
- 301号房：家庭房，486元/晚，适合家庭入住
- 204号房：单人间带窗，999元/晚，景观优美
- 105号房：单人间无窗，256元/晚，经济实惠
- 303号房：双人间，标准配置`,
        context: '您是普洱蘑菇庄园民宿的AI选房助手，请根据客人需求推荐合适的房间。'
      },
      response_mode: 'blocking',
      user: 'ai-room-user'
    }
  })
}

/**
 * 调用Dify后端API（通过代理）
 */
export async function callDifyBackendAPI(message: string): Promise<DifyProxyResponse> {
  return callDifyWithProxy({
    url: '/api/dify/v1/chat-messages', // 使用代理路径
    data: {
      inputs: {
        room_info: `普洱蘑菇庄园民宿房间信息：
- 201号房：大床房，19元/晚，温馨舒适
- 301号房：家庭房，486元/晚，适合家庭入住
- 204号房：单人间带窗，999元/晚，景观优美
- 105号房：单人间无窗，256元/晚，经济实惠
- 303号房：双人间，标准配置`,
        context: '您是普洱蘑菇庄园民宿的AI选房助手，请根据客人需求推荐合适的房间。'
      },
      query: message,
      response_mode: 'blocking',
      user: 'ai-room-user'
    },
    headers: {
      'Authorization': 'Bearer app-iB6nMxbyCqXQPwHConOuiImb'
    }
  })
}
