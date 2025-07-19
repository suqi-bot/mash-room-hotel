// 智能本地AI系统
// 当Dify不可用时提供智能降级服务

export interface UserIntent {
  type: 'room_recommendation' | 'booking' | 'inquiry' | 'greeting' | 'price_query' | 'floor_query'
  confidence: number
  parameters: Record<string, any>
}

export interface Room {
  id: number
  code: string
  name: string
  category: string
  price: number
  area: string
  status: string
  floor: number
  features: string[]
  vrUrl?: string
}

export class IntelligentAI {
  private rooms: Room[] = []
  
  constructor(rooms: Room[]) {
    this.rooms = rooms
  }

  // 分析用户意图
  analyzeIntent(message: string): UserIntent {
    const lowerMessage = message.toLowerCase()
    
    // 房间推荐意图
    if (this.matchKeywords(lowerMessage, ['推荐', '房间', '选房', '住宿', '民宿', '酒店'])) {
      const parameters = this.extractRoomPreferences(message)
      return {
        type: 'room_recommendation',
        confidence: 0.9,
        parameters
      }
    }
    
    // 预订意图
    if (this.matchKeywords(lowerMessage, ['预订', '预定', '订房', '要', '选择']) || /\d{3}/.test(message)) {
      const roomNumber = message.match(/(\d{3})/)?.[1]
      return {
        type: 'booking',
        confidence: 0.95,
        parameters: { roomNumber }
      }
    }
    
    // 楼层查询
    if (this.matchKeywords(lowerMessage, ['楼', '层', '2楼', '二楼', '1楼', '一楼', '3楼', '三楼'])) {
      const floor = this.extractFloor(message)
      return {
        type: 'floor_query',
        confidence: 0.8,
        parameters: { floor }
      }
    }
    
    // 价格查询
    if (this.matchKeywords(lowerMessage, ['价格', '费用', '多少钱', '便宜', '贵', '优惠'])) {
      const priceRange = this.extractPriceRange(message)
      return {
        type: 'price_query',
        confidence: 0.85,
        parameters: { priceRange }
      }
    }
    
    // 问候
    if (this.matchKeywords(lowerMessage, ['你好', '您好', 'hello', '嗨', '在吗'])) {
      return {
        type: 'greeting',
        confidence: 0.9,
        parameters: {}
      }
    }
    
    // 一般询问
    return {
      type: 'inquiry',
      confidence: 0.6,
      parameters: { originalMessage: message }
    }
  }

  // 生成智能回复
  generateResponse(intent: UserIntent): string {
    switch (intent.type) {
      case 'room_recommendation':
        return this.generateRoomRecommendation(intent.parameters)
      case 'booking':
        return this.generateBookingResponse(intent.parameters)
      case 'floor_query':
        return this.generateFloorResponse(intent.parameters)
      case 'price_query':
        return this.generatePriceResponse(intent.parameters)
      case 'greeting':
        return this.generateGreeting()
      default:
        return this.generateInquiryResponse(intent.parameters)
    }
  }

  // 智能房间推荐
  private generateRoomRecommendation(params: any): string {
    const availableRooms = this.rooms.filter(room => room.status === 'available')
    
    if (availableRooms.length === 0) {
      return '🍄 抱歉，目前没有可用房间。请稍后再试或联系客服。'
    }

    // 根据用户偏好筛选和排序
    let recommendedRooms = this.filterRoomsByPreferences(availableRooms, params)
    recommendedRooms = recommendedRooms.slice(0, 3) // 推荐前3个

    let response = '🤔 让我为您分析一下最适合的房间...\n\n'
    
    // 分析用户需求
    if (params.budget) {
      response += `💰 根据您的预算需求（${params.budget}），`
    }
    if (params.roomType) {
      response += `🛏️ 考虑到您偏好${params.roomType}，`
    }
    if (params.floor) {
      response += `🏢 结合您对${params.floor}楼的要求，`
    }
    
    response += '我为您精心推荐以下房间：\n\n'

    recommendedRooms.forEach((room, index) => {
      response += `🏠 **${room.code}号房** - ${room.name}\n`
      response += `💰 价格：${room.price}元/晚\n`
      response += `🛏️ 类型：${room.category} | 📐 面积：${room.area}\n`
      response += `🏢 位置：${room.floor}楼\n`
      
      // 智能推荐理由
      const reason = this.generateRecommendationReason(room, params)
      response += `✨ 推荐理由：${reason}\n`
      
      if (room.vrUrl) {
        response += `🔗 [查看VR房间](${room.vrUrl})\n`
      }
      response += '\n'
    })

    response += '💡 您可以说"预订201"来预订指定房间，或告诉我更具体的需求！'
    return response
  }

  // 智能预订处理
  private generateBookingResponse(params: any): string {
    const { roomNumber } = params
    
    if (!roomNumber) {
      return '🍄 请告诉我您想预订哪个房间号，比如"预订201"。'
    }

    const room = this.rooms.find(r => r.code === roomNumber)
    
    if (!room) {
      return `🍄 抱歉，没有找到${roomNumber}号房间。请确认房间号是否正确。`
    }

    if (room.status !== 'available') {
      return `🍄 抱歉，${roomNumber}号房间目前不可预订。让我为您推荐其他可用房间吧！`
    }

    return `🎉 太好了！${room.code}号房是绝佳选择！\n\n` +
           `🏠 **房间信息确认**\n` +
           `• 房间号：${room.code}\n` +
           `• 房型：${room.name}\n` +
           `• 价格：${room.price}元/晚\n` +
           `• 类型：${room.category}\n` +
           `• 面积：${room.area}\n` +
           `• 位置：${room.floor}楼\n\n` +
           `💭 **正在为您准备预订流程...**\n\n` +
           `📅 **请提供入住信息**：\n` +
           `• 入住日期和退房日期\n` +
           `• 入住人数\n\n` +
           `📝 **示例格式**：\n` +
           `"入住2025-07-15，退房2025-07-17，2人入住"\n` +
           `"明天入住，后天退房，1人"\n\n` +
           `🎁 **预订包含**：免费早餐、茶艺体验、WiFi`
  }

  // 楼层查询响应
  private generateFloorResponse(params: any): string {
    const { floor } = params
    const floorRooms = this.rooms.filter(room => 
      room.floor === floor && room.status === 'available'
    )

    if (floorRooms.length === 0) {
      return `🏢 抱歉，${floor}楼目前没有可用房间。让我为您推荐其他楼层的优质房间！`
    }

    let response = `🤔 您对${floor}楼感兴趣，让我为您分析一下...\n\n`
    response += `🏢 **${floor}楼的特色**：\n`
    
    // 根据楼层特点添加描述
    if (floor === 1) {
      response += '• 出入方便，适合行李较多的客人\n• 靠近大堂和餐厅\n• 部分房间有独立花园\n\n'
    } else if (floor === 2) {
      response += '• 视野开阔，采光极佳\n• 相对安静，远离大堂喧嚣\n• 可俯瞰茶园美景\n\n'
    } else if (floor === 3) {
      response += '• 最佳视野，山景尽收眼底\n• 私密性最好\n• 空气清新，远离尘嚣\n\n'
    }

    response += `🍄 **${floor}楼可用房间**：\n\n`

    floorRooms.slice(0, 4).forEach((room, index) => {
      response += `${index + 1}. **${room.code}号房** - ${room.name}\n`
      response += `   💰 ${room.price}元/晚 | 🛏️ ${room.category} | 📐 ${room.area}\n\n`
    })

    response += `您比较倾向于哪个房间呢？我可以为您详细介绍！`
    return response
  }

  // 价格查询响应
  private generatePriceResponse(params: any): string {
    const { priceRange } = params
    const availableRooms = this.rooms.filter(room => room.status === 'available')
    
    let filteredRooms = availableRooms
    if (priceRange) {
      filteredRooms = this.filterRoomsByPrice(availableRooms, priceRange)
    }

    // 按价格排序
    filteredRooms.sort((a, b) => a.price - b.price)

    let response = '🤔 让我为您分析一下价格情况...\n\n'
    response += '💰 **房间价格一览**：\n\n'

    // 分类显示
    const budget = filteredRooms.filter(r => r.price < 100)
    const mid = filteredRooms.filter(r => r.price >= 100 && r.price < 500)
    const luxury = filteredRooms.filter(r => r.price >= 500)

    if (budget.length > 0) {
      response += '🏷️ **经济实惠型** (100元以下)：\n'
      budget.slice(0, 2).forEach(room => {
        response += `• ${room.code}号房：${room.price}元/晚 - ${room.category}\n`
      })
      response += '\n'
    }

    if (mid.length > 0) {
      response += '🏷️ **舒适体验型** (100-500元)：\n'
      mid.slice(0, 2).forEach(room => {
        response += `• ${room.code}号房：${room.price}元/晚 - ${room.category}\n`
      })
      response += '\n'
    }

    if (luxury.length > 0) {
      response += '🏷️ **豪华享受型** (500元以上)：\n'
      luxury.slice(0, 2).forEach(room => {
        response += `• ${room.code}号房：${room.price}元/晚 - ${room.category}\n`
      })
      response += '\n'
    }

    response += '💡 所有价格都包含免费早餐和茶艺体验！\n'
    response += '您的预算范围是多少呢？我可以为您推荐最合适的房间。'

    return response
  }

  // 问候响应
  private generateGreeting(): string {
    const greetings = [
      '🍄 您好！欢迎来到普洱蘑菇庄园民宿！我是您的专属AI助手。',
      '🌿 您好！很高兴为您服务！我是普洱蘑菇庄园的智能助手。',
      '🍵 您好！欢迎光临！我可以为您提供房间推荐和预订服务。'
    ]
    
    const greeting = greetings[Math.floor(Math.random() * greetings.length)]
    
    return greeting + '\n\n' +
           '🤖 **我可以为您提供**：\n' +
           '• 🏠 智能房间推荐\n' +
           '• 📅 预订服务\n' +
           '• 💰 价格咨询\n' +
           '• 🏢 楼层选择建议\n' +
           '• 🍵 茶文化体验介绍\n\n' +
           '请告诉我您的需求，我会为您提供最合适的建议！'
  }

  // 一般询问响应
  private generateInquiryResponse(params: any): string {
    const { originalMessage } = params
    
    return `🤔 让我思考一下您的问题："${originalMessage}"\n\n` +
           `💭 **智能分析中...** 我理解您可能想了解：\n` +
           `• 🏠 房间信息和预订\n` +
           `• 💰 价格和优惠政策\n` +
           `• 🍵 民宿特色和服务\n` +
           `• 🗺️ 周边景点和交通\n\n` +
           `🍄 虽然我目前使用本地智能模式，但我会尽力为您提供帮助！\n\n` +
           `💡 **您可以尝试问我**：\n` +
           `• "推荐便宜的房间"\n` +
           `• "有没有2楼的大床房"\n` +
           `• "预订201房间"\n` +
           `• "100元以下的房间"`
  }

  // 辅助方法
  private matchKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword))
  }

  private extractRoomPreferences(message: string): any {
    const params: any = {}
    
    // 提取预算
    const budgetMatch = message.match(/(\d+)元|(\d+)块|便宜|经济|实惠|豪华|高端/)
    if (budgetMatch) {
      if (budgetMatch[1]) {
        params.budget = parseInt(budgetMatch[1])
      } else if (message.includes('便宜') || message.includes('经济') || message.includes('实惠')) {
        params.budget = 'low'
      } else if (message.includes('豪华') || message.includes('高端')) {
        params.budget = 'high'
      }
    }
    
    // 提取房型偏好
    if (message.includes('大床房')) params.roomType = '大床房'
    if (message.includes('单人间')) params.roomType = '单人间'
    if (message.includes('标准间')) params.roomType = '标准间'
    if (message.includes('家庭房')) params.roomType = '家庭房'
    
    // 提取楼层偏好
    if (message.includes('1楼') || message.includes('一楼')) params.floor = 1
    if (message.includes('2楼') || message.includes('二楼')) params.floor = 2
    if (message.includes('3楼') || message.includes('三楼')) params.floor = 3
    
    return params
  }

  private extractFloor(message: string): number {
    if (message.includes('1楼') || message.includes('一楼')) return 1
    if (message.includes('2楼') || message.includes('二楼')) return 2
    if (message.includes('3楼') || message.includes('三楼')) return 3
    return 2 // 默认2楼
  }

  private extractPriceRange(message: string): string {
    if (message.includes('便宜') || message.includes('经济') || message.includes('实惠')) return 'low'
    if (message.includes('贵') || message.includes('豪华') || message.includes('高端')) return 'high'
    
    const priceMatch = message.match(/(\d+)元/)
    if (priceMatch) {
      const price = parseInt(priceMatch[1])
      if (price < 100) return 'low'
      if (price > 500) return 'high'
      return 'mid'
    }
    
    return 'all'
  }

  private filterRoomsByPreferences(rooms: Room[], params: any): Room[] {
    let filtered = [...rooms]
    
    // 按预算筛选
    if (params.budget) {
      if (typeof params.budget === 'number') {
        filtered = filtered.filter(room => Math.abs(room.price - params.budget) <= params.budget * 0.3)
      } else if (params.budget === 'low') {
        filtered = filtered.filter(room => room.price < 100)
      } else if (params.budget === 'high') {
        filtered = filtered.filter(room => room.price > 500)
      }
    }
    
    // 按房型筛选
    if (params.roomType) {
      filtered = filtered.filter(room => room.category.includes(params.roomType))
    }
    
    // 按楼层筛选
    if (params.floor) {
      filtered = filtered.filter(room => room.floor === params.floor)
    }
    
    // 按价格排序（性价比优先）
    filtered.sort((a, b) => {
      // 优先推荐性价比高的房间
      const aScore = this.calculateRoomScore(a, params)
      const bScore = this.calculateRoomScore(b, params)
      return bScore - aScore
    })
    
    return filtered
  }

  private filterRoomsByPrice(rooms: Room[], priceRange: string): Room[] {
    switch (priceRange) {
      case 'low':
        return rooms.filter(room => room.price < 100)
      case 'mid':
        return rooms.filter(room => room.price >= 100 && room.price < 500)
      case 'high':
        return rooms.filter(room => room.price >= 500)
      default:
        return rooms
    }
  }

  private calculateRoomScore(room: Room, params: any): number {
    let score = 0
    
    // 基础分数
    score += 50
    
    // 价格性价比加分
    if (room.price < 50) score += 30
    else if (room.price < 200) score += 20
    else if (room.price < 500) score += 10
    
    // 匹配用户偏好加分
    if (params.roomType && room.category.includes(params.roomType)) score += 25
    if (params.floor && room.floor === params.floor) score += 20
    
    // 特殊房间加分
    if (room.vrUrl) score += 10
    if (room.features && room.features.length > 0) score += 5
    
    return score
  }

  private generateRecommendationReason(room: Room, params: any): string {
    const reasons = []
    
    if (room.price < 50) {
      reasons.push('超值性价比')
    } else if (room.price > 500) {
      reasons.push('豪华配置')
    } else {
      reasons.push('价格适中')
    }
    
    if (params.roomType && room.category.includes(params.roomType)) {
      reasons.push('符合房型偏好')
    }
    
    if (params.floor && room.floor === params.floor) {
      reasons.push('满足楼层要求')
    }
    
    if (room.floor === 2) {
      reasons.push('视野开阔')
    }
    
    if (room.vrUrl) {
      reasons.push('支持VR预览')
    }
    
    return reasons.join('、') || '综合推荐'
  }
}
