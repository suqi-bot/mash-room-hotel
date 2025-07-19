<template>
  <div class="ai-room-selection">
    <AppNavbar />

    <!-- 页面标题 -->
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">
          <span class="ai-icon">🌳</span>
          AI智能选房
        </h1>
        <p class="page-subtitle">与普普AI助手对话，找到最适合您的房间</p>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="main-content">
      <div class="container">
        <div class="content-grid">
          <!-- 左侧：AI助手、推荐房间、订单详情 -->
          <div class="left-panel">
            <!-- AI助手头像和信息 -->
            <div class="ai-assistant">
              <div class="ai-header">
                <div class="ai-avatar">
                  <video
                    ref="aiVideo"
                    :src="currentVideoSrc"
                    alt="普普AI助手"
                    :class="['ai-character', aiState]"
                    autoplay
                    loop
                    muted
                    playsinline
                    @loadstart="onVideoLoadStart"
                    @loadeddata="onVideoLoaded"
                    @error="onVideoError"
                  ></video>
                  <div v-if="isSpeaking" class="speaking-indicator">
                    <div class="wave"></div>
                    <div class="wave"></div>
                    <div class="wave"></div>
                  </div>
                </div>
                <div class="ai-info">
                  <h3>普普 AI助手</h3>
                  <p>专属选房顾问</p>
                  <div class="ai-status">
                    <span class="status-dot" :class="{ online: isDifyConnected }"></span>
                    <span>{{ isDifyConnected ? '在线' : '离线' }}</span>
                  </div>
                </div>
              </div>

              <!-- AI控制按钮 -->
              <div class="ai-controls">
                <div class="control-buttons">
                  <button
                    class="control-btn voice-btn"
                    :class="{ active: isListening }"
                    @click="toggleVoiceInput"
                    :disabled="!isDifyConnected"
                  >
                    <i class="fas fa-microphone" v-if="!isListening"></i>
                    <i class="fas fa-stop" v-else></i>
                    <span>{{ isListening ? '停止录音' : '语音输入' }}</span>
                  </button>

                  <button
                    class="control-btn reset-btn"
                    @click="resetConversation"
                    :disabled="!isDifyConnected"
                  >
                    <i class="fas fa-redo-alt"></i>
                    <span>重置对话</span>
                  </button>
                </div>

                <div v-if="isListening" class="voice-indicator">
                  <div class="voice-wave">
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                  </div>
                  <p class="voice-text">正在聆听您的语音...</p>
                </div>

                <div v-if="voiceText" class="voice-result">
                  <p class="voice-label">识别结果：</p>
                  <p class="voice-content">{{ voiceText }}</p>
                  <div class="voice-actions">
                    <button class="send-voice-btn" @click="sendVoiceMessage">
                      <i class="fas fa-paper-plane"></i>
                      发送
                    </button>
                    <button class="clear-voice-btn" @click="clearVoiceText">
                      <i class="fas fa-times"></i>
                      清除
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 推荐房间 -->
            <div class="recommended-rooms" :class="{ 'has-content': aiRecommendations.length > 0 }">
              <h3>
                <i class="fas fa-star"></i>
                AI推荐房间
                <span v-if="aiRecommendations.length > 0" class="count">({{ aiRecommendations.length }})</span>
              </h3>
              <div class="rooms-list">
                <div v-if="aiRecommendations.length === 0" class="empty-state">
                  <i class="fas fa-robot"></i>
                  <p>请与AI助手对话，我会为您推荐最适合的房间</p>
                  <p class="empty-hint">例如：我想要一个便宜的房间、推荐豪华房间、适合家庭的房间</p>
                </div>
                <div v-else class="rooms-container">
                  <div class="recommendations-header">
                    <span class="recommendations-count">{{ aiRecommendations.length }}个推荐房间</span>
                    <button class="clear-recommendations" @click="clearRecommendations" title="清除推荐">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                  <div class="rooms-scroll" ref="roomsScrollContainer">
                    <div
                      v-for="room in aiRecommendations"
                      :key="room.id"
                      class="room-card recommended"
                      @click="selectRoom(room)"
                    >
                      <div class="recommend-badge">
                        <i class="fas fa-robot"></i>
                        AI推荐
                      </div>
                      <img :src="room.image" :alt="room.name" class="room-image">
                      <div class="room-info">
                        <h4>{{ room.code }}号房</h4>
                        <p>{{ room.name }}</p>
                        <div class="recommend-reason" v-if="room.recommendReason">
                          <i class="fas fa-lightbulb"></i>
                          {{ room.recommendReason }}
                        </div>

                        <div class="room-meta">
                          <span class="price">¥{{ room.price }}/晚</span>
                          <span class="rating">⭐{{ room.rating }}</span>
                          <span class="status" :class="room.status">
                            {{ room.status === 'available' ? '可预订' : '已预订' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <!-- 滑动指示器 -->
                </div>
              </div>
            </div>

            <!-- 订单详情 -->
            <div class="order-details">
              <h3>
                <i class="fas fa-receipt"></i>
                订单详情
                <span v-if="currentOrder" class="order-status">已确认</span>
              </h3>
              <div class="order-content">
                <div v-if="currentOrder" class="order-info">
                  <div class="order-header">
                    <div class="order-number">
                      <span class="label">订单号</span>
                      <span class="value">{{ currentOrder.orderNumber }}</span>
                    </div>
                    <div class="order-date">
                      <span class="label">创建时间</span>
                      <span class="value">{{ new Date(currentOrder.createdAt).toLocaleString() }}</span>
                    </div>
                  </div>

                  <div class="order-room-info">
                    <div class="room-image-container">
                      <img :src="getRoomImage(currentOrder.roomCode)" alt="房间图片" class="room-thumbnail">
                    </div>
                    <div class="room-details">
                      <h4>{{ currentOrder.roomCode }}号房 - {{ currentOrder.roomName }}</h4>
                      <div class="stay-dates">
                        <div class="date-item">
                          <i class="fas fa-calendar-check"></i>
                          <span>入住: {{ formatDate(currentOrder.checkInDate) }}</span>
                        </div>
                        <div class="date-item">
                          <i class="fas fa-calendar-times"></i>
                          <span>退房: {{ formatDate(currentOrder.checkOutDate) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="guest-info">
                    <div class="guest-item">
                      <i class="fas fa-user"></i>
                      <span class="label">客人:</span>
                      <span class="value">{{ currentOrder.guestName || '待补充' }}</span>
                    </div>
                    <div class="guest-item">
                      <i class="fas fa-phone"></i>
                      <span class="label">电话:</span>
                      <span class="value">{{ currentOrder.phone || '待补充' }}</span>
                    </div>
                  </div>

                  <div class="order-summary">
                    <div class="summary-item">
                      <span class="label">房费</span>
                      <span class="value">¥{{ currentOrder.totalAmount }}</span>
                    </div>
                    <div class="summary-item">
                      <span class="label">服务费</span>
                      <span class="value">¥0</span>
                    </div>
                    <div class="summary-item total">
                      <span class="label">总计</span>
                      <span class="value price">¥{{ currentOrder.totalAmount }}</span>
                    </div>
                  </div>

                  <div class="order-actions">
                    <button class="btn btn-outline" @click="cancelOrder">
                      <i class="fas fa-times"></i>
                      取消订单
                    </button>
                    <button class="btn btn-primary" @click="modifyOrder">
                      <i class="fas fa-edit"></i>
                      修改订单
                    </button>
                  </div>
                </div>
                <div v-else class="empty-state">
                  <i class="fas fa-clipboard-list"></i>
                  <p>暂无订单信息</p>
                  <p class="empty-hint">与AI助手对话，创建订单后将显示在这里</p>
                  <p class="empty-hint">例如：我想预订101号房间</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：AI聊天 -->
          <div class="right-panel">
            <div class="chat-container">
              <div class="chat-header">
                <h3>
                  <i class="fas fa-comments"></i>
                  与AI助手对话
                </h3>
                <div class="chat-status">
                  <span class="status-dot" :class="{ online: isDifyConnected }"></span>
                  <span>{{ isDifyConnected ? '在线' : '离线' }}</span>
                </div>
              </div>

              <!-- Dify聊天组件 -->
              <div class="dify-chat-wrapper">
                <DifyChatWidget
                  ref="difyChatWidget"
                  container-id="ai-room-dify-container"
                  :auto-load="true"
                  @loaded="onDifyLoaded"
                  @error="onDifyError"
                  @message="onDifyMessage"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 全部房间展示 -->
        <div class="all-rooms-section">
          <div class="section-header">
            <h2>
              <i class="fas fa-home"></i>
              全部房间
            </h2>
            <div class="room-filters">
              <select v-model="roomFilter" @change="filterRooms" class="filter-select">
                <option value="all">全部房型</option>
                <option value="single">单人房</option>
                <option value="double">双人房</option>
                <option value="family">家庭房</option>
                <option value="suite">套房</option>
              </select>
              <div class="view-toggle">
                <button
                  :class="['toggle-btn', { active: viewMode === 'grid' }]"
                  @click="viewMode = 'grid'"
                >
                  <i class="fas fa-th"></i>
                </button>
                <button
                  :class="['toggle-btn', { active: viewMode === 'list' }]"
                  @click="viewMode = 'list'"
                >
                  <i class="fas fa-list"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="rooms-content">
            <div v-if="roomsLoading" class="loading-state">
              <div class="loading-spinner"></div>
              <p>正在加载房间信息...</p>
            </div>

            <div v-else-if="filteredRooms.length === 0" class="empty-state">
              <i class="fas fa-home"></i>
              <p>暂无符合条件的房间</p>
            </div>

            <div v-else :class="['rooms-grid', viewMode]">
              <div
                v-for="room in filteredRooms"
                :key="room.id"
                class="room-item"
                @click="selectRoom(room)"
              >
                <div class="room-image-container">
                  <img :src="room.image" :alt="room.name" class="room-image">
                  <div class="room-status-badge" :class="room.status">
                    {{ room.status === 'available' ? '可预订' : '已预订' }}
                  </div>
                  <div class="room-price-badge">
                    {{ room.price > 0 ? `¥${room.price}/晚` : '价格待定' }}
                  </div>
                </div>
                <div class="room-details">
                  <div class="room-header">
                    <h4 class="room-name">{{ room.code }}号房 - {{ room.roomType }}</h4>
                    <div class="room-rating" v-if="room.rating > 0">
                      <i class="fas fa-star"></i>
                      <span>{{ room.rating }}</span>
                    </div>
                  </div>
                  <p class="room-type">{{ room.name }} ({{ room.floor }})</p>
                  <div class="room-features">
                    <span class="feature" v-if="room.seat > 0">
                      <i class="fas fa-users"></i>
                      {{ room.seat }}人
                    </span>
                    <span class="feature">
                      <i class="fas fa-window-maximize"></i>
                      {{ room.hasWindow ? `${room.windowDirection}向` : '无窗' }}
                    </span>
                    <span class="feature">
                      <i class="fas fa-wifi"></i>
                      免费WiFi
                    </span>
                    <span class="feature">
                      <i class="fas fa-snowflake"></i>
                      空调
                    </span>
                    <span class="feature" v-if="room.vrUrl">
                      <i class="fas fa-vr-cardboard"></i>
                      <a :href="room.vrUrl" target="_blank" class="vr-link" @click="handleVrClick(room.vrUrl)">VR看房</a>
                    </span>
                  </div>
                  <div class="room-footer">
                    <div class="room-category">{{ room.category }}</div>
                    <button
                      class="book-btn"
                      :class="{ disabled: room.status !== 'available' || room.price === 0 }"
                      :disabled="room.status !== 'available' || room.price === 0"
                      @click.stop="selectRoom(room)"
                    >
                      {{ room.price === 0 ? '价格待定' : (room.status === 'available' ? '选择房间' : '已预订') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import request from '../../utils/request'
import AppNavbar from '../../components/AppNavbar.vue'

// 导入房间图片
import roomVisit1 from '@/assets/images/field-research/room-visits/room-visit1.jpg'
import roomVisit2 from '@/assets/images/field-research/room-visits/room-visit2.jpg'
import indoor3 from '@/assets/images/field-research/indoor-research/indoor3.jpg'
import indoor4 from '@/assets/images/field-research/indoor-research/indoor4.jpg'
import indoor5 from '@/assets/images/field-research/indoor-research/indoor5.jpg'

// 导入AI形象视频
import aiCharacterVideo from '@/assets/images/ip-character/37b48b40dbc80e2a44dce0f626120357_raw.mp4'
import type { Room } from '@/types/api'
import DifyChatWidget from '../../components/DifyChatWidgetNew.vue'
import { IntelligentAI } from '../../utils/intelligentAI'
import { useChatHistoryStore } from '../../stores/chatHistory'
import { OrderService, type OrderCreateData } from '../../services/orderService'

const router = useRouter()
const auth = useAuthStore()
const chatHistory = useChatHistoryStore()

// 基础状态
const isDifyConnected = ref(false)
const isSpeaking = ref(false)
const aiState = ref('idle')
const currentVideoSrc = ref(aiCharacterVideo)

// AI推荐房间
const aiRecommendations = ref<Room[]>([])

// 房间滑动相关
const currentRoomIndex = ref(0)
const roomsScrollContainer = ref<HTMLElement>()

// 语音输入相关
const isListening = ref(false)
const voiceText = ref('')
const recognition = ref<any>(null)

// 当前订单
const currentOrder = ref<any>(null)

// 聊天消息监听
const chatMessages = ref<any[]>([])

// 房间数据库（模拟数据）
const roomDatabase = [
  // 1楼房间
  {
    id: '107',
    code: '107',
    name: '雨林景观豪华蘑菇屋（单人间）',
    price: 456,
    rating: 4.8,
    status: 'available',
    image: roomVisit1,
    floor: '1楼',
    direction: '南向带阳台',
    type: '单人间',
    features: ['南向阳台', '茶园景观']
  },
  {
    id: '108',
    code: '108',
    name: '1楼茶园房',
    price: 156,
    rating: 4.6,
    status: 'available',
    image: roomVisit1,
    floor: '1楼',
    direction: '南向阳光',
    type: '单人间',
    features: ['性价比之选', '茶园景观']
  },

  // 2楼房间
  {
    id: '201',
    code: '201',
    name: '雨林景观豪华蘑菇屋（单人间）',
    price: 268,
    rating: 4.7,
    status: 'available',
    image: roomVisit2,
    floor: '2楼',
    direction: '南向带阳台',
    type: '单人间',
    features: ['南向阳台', '雨林景观']
  },
  {
    id: '202',
    code: '202',
    name: '雨林景观豪华蘑菇屋',
    price: 486,
    rating: 4.9,
    status: 'available',
    image: roomVisit2,
    floor: '2楼',
    direction: '南向采光',
    type: '双人间',
    features: ['含双早', '茶园景观']
  },
  {
    id: '204',
    code: '204',
    name: '山景阳台南向房',
    price: 999,
    rating: 4.9,
    status: 'available',
    image: roomVisit2,
    floor: '2楼',
    direction: '南向阳台',
    type: '双人间',
    features: ['含双早', '特色山景阳台', '雨林景观']
  },
  {
    id: '206',
    code: '206',
    name: '雨林景观豪华蘑菇屋',
    price: 654,
    rating: 4.8,
    status: 'available',
    image: roomVisit2,
    floor: '2楼',
    direction: '西向观景',
    type: '双人间',
    features: ['含双早', '配茶具套装']
  },
  {
    id: '207',
    code: '207',
    name: '雨林景观豪华蘑菇屋（双人间）',
    price: 186,
    rating: 4.7,
    status: 'available',
    image: roomVisit2,
    floor: '2楼',
    direction: '东向带阳台',
    type: '双人间',
    features: ['东向阳台', '雨林景观']
  },
  {
    id: '208',
    code: '208',
    name: '茶园景观北向房',
    price: 198,
    rating: 4.6,
    status: 'available',
    image: roomVisit2,
    floor: '2楼',
    direction: '北向',
    type: '单人间',
    features: ['山景阳台', '早餐', '茶园景观']
  },

  // 3楼房间
  {
    id: '301',
    code: '301',
    name: '雨林景观豪华蘑菇屋（双人间）',
    price: 486,
    rating: 4.8,
    status: 'available',
    image: indoor3,
    floor: '3楼',
    direction: '南向',
    type: '双人间',
    features: ['茶具套装', '含早餐', '茶园景观']
  },
  {
    id: '302',
    code: '302',
    name: '雨林景观豪华蘑菇屋（双人间）',
    price: 688,
    rating: 4.8,
    status: 'available',
    image: indoor4,
    floor: '3楼',
    direction: '南向',
    type: '双人间',
    features: ['茶园景观', '雨林景观']
  },
  {
    id: '303',
    code: '303',
    name: '雨林景观豪华蘑菇屋（亲子房）',
    price: 1088,
    rating: 4.9,
    status: 'available',
    image: indoor5,
    floor: '3楼',
    direction: '南向',
    type: '亲子房',
    features: ['山景阳台', '含早餐', '适合家庭']
  }
]

// 聊天相关 (已替换为Dify组件)
// const fallbackMessages = ref<any[]>([])
// const fallbackInput = ref('')
// const isFallbackLoading = ref(false)
// const fallbackChatContainer = ref<HTMLElement>()

// AI视频引用
const aiVideo = ref<HTMLVideoElement>()

// Dify组件引用
const difyChatWidget = ref()

// 全部房间相关
const allRooms = ref<any[]>([])
const filteredRooms = ref<any[]>([])
const roomsLoading = ref(false)
const roomFilter = ref('all')
const viewMode = ref('grid')

// 视频事件处理
const onVideoLoadStart = () => {
  console.log('AI视频开始加载:', currentVideoSrc.value)
}

const onVideoLoaded = () => {
  console.log('AI视频加载完成')
  if (aiVideo.value) {
    aiVideo.value.play().catch(error => {
      console.error('AI视频播放失败:', error)
    })
  }
}

const onVideoError = (event: Event) => {
  console.error('AI视频加载错误:', event)
  console.error('视频源:', currentVideoSrc.value)
}

// 初始化
onMounted(() => {
  initializeAI()
  loadInitialData()
  initSpeechRecognition()

  // 确保视频正确加载
  console.log('当前视频源:', currentVideoSrc.value)
})

// 初始化AI
const initializeAI = () => {
  // Dify组件会自动处理初始化，不需要手动添加欢迎消息
  console.log('AI助手初始化完成，使用Dify组件')
}

// 加载初始数据
const loadInitialData = async () => {
  await loadAllRooms()
}

// 加载全部房间
const loadAllRooms = async () => {
  roomsLoading.value = true
  try {
    // 真实房间数据
    const realRooms: Room[] = [
      {
        id: 1,
        code: '展览厅',
        name: '展览厅',
        category: '展览厅',
        floor: '1楼',
        height: '2438',
        hasWindow: false,
        windowDirection: '无',
        roomType: '展览厅',
        price: 0,
        seat: 0,
        rating: 0,
        status: 'unavailable',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
        vrUrl: '',
        recommendReason: '展览厅暂不开放预订'
      },
      {
        id: 2,
        code: '105',
        name: '雨林景观豪华蘑菇屋',
        category: '单人间',
        floor: '1楼',
        height: '2438',
        hasWindow: false,
        windowDirection: '无',
        roomType: '单人间',
        price: 256,
        seat: 1,
        rating: 4.5,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
        vrUrl: 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00',
        recommendReason: '雨林景观，环境优美，适合独自旅行'
      },
      {
        id: 3,
        code: '104',
        name: '雨林景观豪华蘑菇屋',
        category: '单人间',
        floor: '1楼',
        height: '2438',
        hasWindow: false,
        windowDirection: '无',
        roomType: '单人间',
        price: 255,
        seat: 1,
        rating: 4.5,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
        vrUrl: 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00',
        recommendReason: '性价比高，环境舒适'
      },
      {
        id: 4,
        code: '103',
        name: '雨林景观豪华蘑菇屋',
        category: '单人间',
        floor: '1楼',
        height: '2438',
        hasWindow: false,
        windowDirection: '无',
        roomType: '单人间',
        price: 333,
        seat: 1,
        rating: 4.6,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
        vrUrl: 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00',
        recommendReason: '高评分房间，服务优质'
      },
      {
        id: 5,
        code: '102',
        name: '雨林景观豪华蘑菇屋',
        category: '大床房',
        floor: '1楼',
        height: '2438',
        hasWindow: true,
        windowDirection: '东',
        roomType: '大床房',
        price: 888,
        seat: 2,
        rating: 4.8,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=300&fit=crop',
        vrUrl: 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00',
        recommendReason: '豪华大床房，带窗户，视野开阔'
      },
      {
        id: 6,
        code: '106',
        name: '雨林景观豪华蘑菇屋',
        category: '单人间',
        floor: '1楼',
        height: '2438',
        hasWindow: true,
        windowDirection: '南',
        roomType: '单人间',
        price: 666,
        seat: 1,
        rating: 4.7,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=300&fit=crop',
        vrUrl: 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00',
        recommendReason: '南向房间，采光充足，环境优雅'
      },
      {
        id: 7,
        code: '107',
        name: '雨林景观豪华蘑菇屋',
        category: '单人间',
        floor: '1楼',
        height: '2438',
        hasWindow: true,
        windowDirection: '南',
        roomType: '单人间',
        price: 456,
        seat: 1,
        rating: 4.6,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=300&fit=crop',
        vrUrl: 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00',
        recommendReason: '中等价位，性价比不错'
      },
      {
        id: 8,
        code: '108',
        name: '雨林景观豪华蘑菇屋',
        category: '单人间',
        floor: '1楼',
        height: '2438',
        hasWindow: true,
        windowDirection: '南',
        roomType: '单人间',
        price: 156,
        seat: 1,
        rating: 4.4,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=300&fit=crop',
        vrUrl: 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00',
        recommendReason: '经济实惠，适合预算有限的客人'
      },
      {
        id: 9,
        code: '101',
        name: '雨林景观豪华蘑菇屋',
        category: '单人间',
        floor: '1楼',
        height: '2438',
        hasWindow: true,
        windowDirection: '东',
        roomType: '单人间',
        price: 18,
        seat: 1,
        rating: 4.2,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=300&fit=crop',
        vrUrl: 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00',
        recommendReason: '超值特价房，性价比极高'
      },
      {
        id: 10,
        code: '211',
        name: '雨林景观豪华蘑菇屋',
        category: '亲子房',
        floor: '2楼',
        height: '2438',
        hasWindow: true,
        windowDirection: '西',
        roomType: '亲子房',
        price: 419,
        seat: 3,
        rating: 4.7,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop',
        vrUrl: 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00',
        recommendReason: '亲子房，适合家庭出行，空间宽敞'
      },
      {
        id: 11,
        code: '212',
        name: '雨林景观豪华蘑菇屋',
        category: '亲子房',
        floor: '2楼',
        height: '2438',
        hasWindow: true,
        windowDirection: '西',
        roomType: '亲子房',
        price: 418,
        seat: 3,
        rating: 4.7,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop',
        vrUrl: 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00'
      },
      {
        id: 12,
        code: '210',
        name: '雨林景观豪华蘑菇屋',
        category: '单人间',
        floor: '2楼',
        height: '2438',
        hasWindow: true,
        windowDirection: '北',
        roomType: '单人间',
        price: 189,
        seat: 1,
        rating: 4.4,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=300&fit=crop',
        vrUrl: 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00'
      },
      {
        id: 13,
        code: '209',
        name: '雨林景观豪华蘑菇屋',
        category: '单人间',
        floor: '2楼',
        height: '2438',
        hasWindow: true,
        windowDirection: '北',
        roomType: '单人间',
        price: 418,
        seat: 1,
        rating: 4.6,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=300&fit=crop',
        vrUrl: 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00'
      },
      {
        id: 14,
        code: '208',
        name: '雨林景观豪华蘑菇屋',
        category: '单人间',
        floor: '2楼',
        height: '2438',
        hasWindow: true,
        windowDirection: '北',
        roomType: '单人间',
        price: 18,
        seat: 1,
        rating: 4.2,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=300&fit=crop',
        vrUrl: 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00'
      },
      {
        id: 15,
        code: '207',
        name: '雨林景观豪华蘑菇屋',
        category: '大床房',
        floor: '2楼',
        height: '2438',
        hasWindow: true,
        windowDirection: '东',
        roomType: '大床房',
        price: 186,
        seat: 2,
        rating: 4.5,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=300&fit=crop',
        vrUrl: 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00'
      },
      {
        id: 16,
        code: '206',
        name: '雨林景观豪华蘑菇屋',
        category: '双人间',
        floor: '2楼',
        height: '2438',
        hasWindow: true,
        windowDirection: '西',
        roomType: '双人间',
        price: 654,
        seat: 2,
        rating: 4.7,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&h=300&fit=crop',
        vrUrl: 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00'
      },
      {
        id: 17,
        code: '205',
        name: '雨林景观豪华蘑菇屋',
        category: '双人间',
        floor: '2楼',
        height: '2438',
        hasWindow: true,
        windowDirection: '东',
        roomType: '双人间',
        price: 789,
        seat: 2,
        rating: 4.8,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&h=300&fit=crop',
        vrUrl: 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00'
      },
      {
        id: 18,
        code: '204',
        name: '雨林景观豪华蘑菇屋',
        category: '单人间',
        floor: '2楼',
        height: '2438',
        hasWindow: true,
        windowDirection: '南',
        roomType: '单人间',
        price: 999,
        seat: 1,
        rating: 4.9,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=300&fit=crop',
        vrUrl: 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00'
      },
      {
        id: 19,
        code: '203',
        name: '雨林景观豪华蘑菇屋',
        category: '单人间',
        floor: '2楼',
        height: '2438',
        hasWindow: true,
        windowDirection: '南',
        roomType: '单人间',
        price: 889,
        seat: 1,
        rating: 4.8,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=300&fit=crop',
        vrUrl: 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00'
      },
      {
        id: 20,
        code: '202',
        name: '雨林景观豪华蘑菇屋',
        category: '单人间',
        floor: '2楼',
        height: '2438',
        hasWindow: true,
        windowDirection: '南',
        roomType: '单人间',
        price: 48,
        seat: 1,
        rating: 4.3,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=300&fit=crop',
        vrUrl: 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00'
      },
      {
        id: 21,
        code: '201',
        name: '雨林景观豪华蘑菇屋',
        category: '大床房',
        floor: '2楼',
        height: '2438',
        hasWindow: true,
        windowDirection: '南',
        roomType: '大床房',
        price: 19,
        seat: 2,
        rating: 4.1,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=300&fit=crop',
        vrUrl: 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00'
      },
      {
        id: 22,
        code: '301',
        name: '雨林景观豪华蘑菇屋',
        category: '亲子房',
        floor: '3楼',
        height: '2438',
        hasWindow: false,
        windowDirection: '无',
        roomType: '亲子房',
        price: 486,
        seat: 4,
        rating: 4.8,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop',
        vrUrl: 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00'
      },
      {
        id: 23,
        code: '302',
        name: '雨林景观豪华蘑菇屋',
        category: '亲子房',
        floor: '3楼',
        height: '2438',
        hasWindow: false,
        windowDirection: '无',
        roomType: '亲子房',
        price: 1088,
        seat: 4,
        rating: 4.9,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop',
        vrUrl: 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00'
      },
      {
        id: 24,
        code: '303',
        name: '雨林景观豪华蘑菇屋',
        category: '双人间',
        floor: '3楼',
        height: '2438',
        hasWindow: true,
        windowDirection: '南',
        roomType: '双人间',
        price: 0, // 价格未设定
        seat: 2,
        rating: 4.6,
        status: 'unavailable', // 价格未设定，暂不可预订
        image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&h=300&fit=crop',
        vrUrl: 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00'
      }
    ]

    allRooms.value = realRooms
    filteredRooms.value = realRooms
  } catch (error) {
    console.error('加载房间数据失败:', error)
  } finally {
    roomsLoading.value = false
  }
}

// 过滤房间
const filterRooms = () => {
  if (roomFilter.value === 'all') {
    filteredRooms.value = allRooms.value.filter(room => room.code !== '展览厅') // 排除展览厅
  } else {
    filteredRooms.value = allRooms.value.filter(room => {
      if (room.code === '展览厅') return false // 排除展览厅

      switch (roomFilter.value) {
        case 'single':
          return room.roomType === '单人间'
        case 'double':
          return room.roomType === '双人间' || room.roomType === '大床房'
        case 'family':
          return room.roomType === '亲子房'
        case 'suite':
          return room.category.includes('套房') || room.category.includes('豪华')
        default:
          return true
      }
    })
  }
}

// 删除了AI语音切换功能

// 测试Dify连接
const testDifyConnection = () => {
  if (difyChatWidget.value) {
    difyChatWidget.value.retryConnection()
  } else {
    isDifyConnected.value = !isDifyConnected.value
  }
}

// Dify加载成功回调
const onDifyLoaded = () => {
  isDifyConnected.value = true
}

// Dify错误回调
const onDifyError = (error: string) => {
  isDifyConnected.value = false
}

// 选择房间
const selectRoom = (room: Room) => {
  console.log('选择房间:', room)

  // 如果房间有VR链接，直接跳转
  if (room.vrUrl && room.vrUrl.trim() !== '') {
    console.log('跳转到VR链接:', room.vrUrl)
    window.open(room.vrUrl, '_blank')
  } else {
    // 如果没有VR链接，使用默认的VR链接
    const defaultVrUrl = 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00'
    console.log('使用默认VR链接:', defaultVrUrl)
    window.open(defaultVrUrl, '_blank')
  }
}

// 清除推荐房间
const clearRecommendations = () => {
  console.log('清除所有推荐房间')
  aiRecommendations.value = []
}

// 发送消息 (已替换为Dify组件)
// const sendFallbackMessage = () => {
//   // Dify组件会处理消息发送
//   console.log('消息发送由Dify组件处理')
// }

// 发送快捷问题 (已替换为Dify组件)
// const sendQuickQuestion = (question: string) => {
//   // Dify组件会处理快捷问题
//   console.log('快捷问题由Dify组件处理:', question)
// }

// 转换Markdown链接 (Dify组件内置支持)
// const convertMarkdownLinks = (content: string) => {
//   return content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
// }

// 滚动到底部 (Dify组件自动处理)
// const scrollToBottom = () => {
//   // Dify组件会自动滚动到底部
//   console.log('滚动由Dify组件处理')
// }

// 获取表情符号
const getExpressionEmoji = () => {
  return '😊'
}

// 获取AI状态文本
const aiStatusText = ref('我会根据您的需求为您推荐最适合的房间')

// 发送提示词
const sendPrompt = (prompt: string) => {
  if (difyChatWidget.value) {
    difyChatWidget.value.sendMessage(prompt)
  }
}

// 滑动到指定房间
const scrollToRoom = (index: number) => {
  currentRoomIndex.value = index
  if (roomsScrollContainer.value) {
    const container = roomsScrollContainer.value
    const roomCard = container.children[index] as HTMLElement
    if (roomCard) {
      roomCard.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      })
    }
  }
}

// 初始化语音识别
const initSpeechRecognition = () => {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    recognition.value = new SpeechRecognition()
    recognition.value.continuous = false
    recognition.value.interimResults = false
    recognition.value.lang = 'zh-CN'

    recognition.value.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      voiceText.value = transcript
      isListening.value = false
    }

    recognition.value.onerror = (event: any) => {
      console.error('语音识别错误:', event.error)
      isListening.value = false
    }

    recognition.value.onend = () => {
      isListening.value = false
    }
  }
}

// 切换语音输入
const toggleVoiceInput = () => {
  if (!recognition.value) {
    initSpeechRecognition()
  }

  if (isListening.value) {
    recognition.value.stop()
    isListening.value = false
  } else {
    voiceText.value = ''
    recognition.value.start()
    isListening.value = true
  }
}

// 发送语音消息
const sendVoiceMessage = () => {
  if (voiceText.value && difyChatWidget.value) {
    difyChatWidget.value.sendMessage(voiceText.value)
    voiceText.value = ''
  }
}

// 清除语音文本
const clearVoiceText = () => {
  voiceText.value = ''
}

// 重置对话
const resetConversation = () => {
  if (difyChatWidget.value) {
    difyChatWidget.value.resetConversation()
  }
  // 清空推荐和订单
  aiRecommendations.value = []
  currentOrder.value = null
}

// 解析AI聊天内容中的房间推荐
const parseRoomRecommendations = (message: string) => {
  const recommendations: any[] = []
  console.log('🔍 解析房间推荐，消息内容:', message)

  // 多种房间号码匹配模式（优化后）
  const roomPatterns = [
    /(\d{3})号?房/g,           // 101号房、101房
    /房间号[：:]\s*(\d{3})/g,  // 房间号：101
    /房间\s*(\d{3})/g,         // 房间101
    /(\d{3})\s*房间/g,         // 101房间
    /推荐.*?(\d{3})号?房/g,    // 推荐...101号房
    /建议.*?(\d{3})号?房/g,    // 建议...101号房
    /适合.*?(\d{3})号?房/g,    // 适合...101号房
  ]

  // 尝试所有匹配模式
  roomPatterns.forEach(pattern => {
    const matches = message.match(pattern)
    if (matches) {
      matches.forEach(match => {
        const roomCode = match.match(/\d{3}/)?.[0]
        if (roomCode) {
          // 检查是否已经在推荐列表中
          if (recommendations.find(r => r.code === roomCode)) {
            return
          }

          const room = roomDatabase.find(r => r.code === roomCode)
          if (room) {
            recommendations.push({
              ...room,
              recommendReason: extractRecommendReason(message, roomCode)
            })
          } else {
            // 数据库中不存在的房间，使用模板创建
            const templateRoom = createTemplateRoom(roomCode, message)
            recommendations.push(templateRoom)
          }
        }
      })
    }
  })

  return recommendations
}

// 创建模板房间（用于数据库中不存在的房间）
const createTemplateRoom = (roomCode: string, message: string) => {
  // 从消息中提取房间信息
  const roomInfo = extractRoomInfoFromMessage(message, roomCode)

  return {
    id: `template-${roomCode}`,
    code: roomCode,
    name: roomInfo.name || `${roomCode}号房`,
    price: roomInfo.price || 0,
    rating: 4.5,
    status: 'available',
    image: roomVisit1, // 使用默认图片
    floor: roomInfo.floor || '未知楼层',
    direction: roomInfo.direction || '朝向未知',
    type: roomInfo.type || '标准间',
    category: roomInfo.category || '标准房',
    features: roomInfo.features || ['基础设施'],
    vrUrl: 'https://share-xt.hwbim.com/qlh/ffd333620ebb4e83b50899653b516f00',
    recommendReason: extractRecommendReason(message, roomCode)
  }
}

// 从消息中提取房间详细信息
const extractRoomInfoFromMessage = (message: string, roomCode: string) => {
  const info: any = {}

  // 提取价格信息（支持更多格式）
  const pricePatterns = [
    new RegExp(`${roomCode}.*?(\\d+)元`, 'i'),
    new RegExp(`${roomCode}.*?¥(\\d+)`, 'i'),
    new RegExp(`价格.*?(\\d+)`, 'i'),
    new RegExp(`总费用.*?¥(\\d+)`, 'i'),
    new RegExp(`总计.*?(\\d+)`, 'i'),
    new RegExp(`¥(\\d+)`, 'i'),
    new RegExp(`(\\d+)元`, 'i')
  ]

  for (const pattern of pricePatterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      info.price = parseInt(match[1])
      break
    }
  }

  // 提取房间类型（扩展更多类型）
  const typePatterns = [
    /单人间|双人间|大床房|标准间|豪华房|套房|亲子房|海景房|山景房|商务房/i,
    /蘑菇屋|景观房|阳台房|花园房|湖景房|森林房/i
  ]

  for (const pattern of typePatterns) {
    const match = message.match(pattern)
    if (match) {
      info.type = match[0]
      // 如果消息中包含房间号，组合房间名称
      if (message.includes(roomCode)) {
        info.name = `${roomCode}号${match[0]}`
      } else {
        info.name = `${roomCode}号房`
      }
      break
    }
  }

  // 如果没有找到类型，尝试从房间号附近的文字提取
  if (!info.type) {
    const roomContext = message.match(new RegExp(`${roomCode}[^，。！？]*`, 'i'))
    if (roomContext) {
      info.name = roomContext[0] || `${roomCode}号房`
    }
  }

  // 提取楼层信息
  const floorMatch = message.match(/(\d+)楼/i)
  if (floorMatch) {
    info.floor = `${floorMatch[1]}楼`
  }

  // 提取朝向信息
  const directionMatch = message.match(/(南向|北向|东向|西向|朝南|朝北|朝东|朝西)/i)
  if (directionMatch) {
    info.direction = directionMatch[1]
  }

  // 提取特色功能
  const features = []
  if (message.includes('阳台')) features.push('阳台')
  if (message.includes('景观') || message.includes('景色') || message.includes('海景') || message.includes('山景')) features.push('景观房')
  if (message.includes('早餐')) features.push('含早餐')
  if (message.includes('WiFi') || message.includes('wifi')) features.push('免费WiFi')
  if (message.includes('空调')) features.push('空调')
  if (message.includes('电视')) features.push('电视')
  if (features.length > 0) {
    info.features = features
  }

  return info
}

// 提取推荐理由
const extractRecommendReason = (message: string, roomCode: string) => {
  const reasonPatterns = [
    new RegExp(`${roomCode}.*?因为(.{10,50})`, 'i'),
    new RegExp(`推荐${roomCode}.*?(.{10,50})`, 'i'),
    new RegExp(`${roomCode}.*?适合(.{10,50})`, 'i'),
  ]

  for (const pattern of reasonPatterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return '根据您的需求推荐'
}

// 根据关键词推荐房间
const getRecommendationsByKeywords = (message: string) => {
  const recommendations: any[] = []
  const lowerMessage = message.toLowerCase()

  // 如果消息包含"推荐"关键词，推荐多个房间
  if (lowerMessage.includes('推荐') || lowerMessage.includes('房间') || lowerMessage.includes('选择')) {
    // 推荐3-4个不同类型的房间
    const recommendedRooms = [
      // 性价比房间
      roomDatabase.find(r => r.code === '208'), // 198元单人间
      // 中档房间
      roomDatabase.find(r => r.code === '202'), // 486元双人间
      // 高档房间
      roomDatabase.find(r => r.code === '204'), // 999元双人间
      // 经济房间
      roomDatabase.find(r => r.code === '108')  // 156元单人间
    ].filter(Boolean) // 过滤掉undefined

    recommendedRooms.forEach((room, index) => {
      if (room) {
        let reason = ''
        switch (index) {
          case 0:
            reason = '性价比高，茶园景观'
            break
          case 1:
            reason = '中档舒适，南向采光'
            break
          case 2:
            reason = '豪华山景，设施完善'
            break
          case 3:
            reason = '经济实惠，1楼便利'
            break
          default:
            reason = '根据您的需求推荐'
        }

        recommendations.push({
          ...room,
          recommendReason: reason
        })
      }
    })
  }

  // 价格关键词
  if (lowerMessage.includes('便宜') || lowerMessage.includes('经济') || lowerMessage.includes('实惠')) {
    const cheapRooms = roomDatabase.filter(r => r.price <= 200).slice(0, 2)
    cheapRooms.forEach(room => {
      if (!recommendations.find(r => r.code === room.code)) {
        recommendations.push({
          ...room,
          recommendReason: '价格实惠，性价比高'
        })
      }
    })
  }

  // 豪华关键词
  if (lowerMessage.includes('豪华') || lowerMessage.includes('高档') || lowerMessage.includes('奢华')) {
    const luxuryRooms = roomDatabase.filter(r => r.price >= 400).slice(0, 2)
    luxuryRooms.forEach(room => {
      if (!recommendations.find(r => r.code === room.code)) {
        recommendations.push({
          ...room,
          recommendReason: '豪华舒适，设施完善'
        })
      }
    })
  }

  // 家庭关键词
  if (lowerMessage.includes('家庭') || lowerMessage.includes('亲子') || lowerMessage.includes('孩子')) {
    const familyRooms = roomDatabase.filter(r => r.type.includes('双人') || r.type.includes('亲子')).slice(0, 2)
    familyRooms.forEach(room => {
      if (!recommendations.find(r => r.code === room.code)) {
        recommendations.push({
          ...room,
          recommendReason: '适合家庭入住，空间宽敞'
        })
      }
    })
  }

  return recommendations
}

// 解析订单信息
const parseOrderInfo = (message: string) => {
  const orderInfo: any = {}

  // 多种房间号匹配模式
  const roomPatterns = [
    /(\d{3})号?房/,
    /房间号[：:]\s*(\d{3})/,
    /房间\s*(\d{3})/,
    /(\d{3})\s*房间/,
    /预订.*?(\d{3})/,
    /选择.*?(\d{3})/,
  ]

  for (const pattern of roomPatterns) {
    const roomMatch = message.match(pattern)
    if (roomMatch) {
      orderInfo.roomCode = roomMatch[1]
      const room = roomDatabase.find(r => r.code === roomMatch[1])
      if (room) {
        // 数据库中存在的房间
        orderInfo.roomName = room.name
        orderInfo.price = room.price
      } else {
        // 数据库中不存在的房间，从消息中提取信息
        const roomInfo = extractRoomInfoFromMessage(message, roomMatch[1])
        orderInfo.roomName = roomInfo.name || `${roomMatch[1]}号房`
        orderInfo.price = roomInfo.price || 0
      }
      break
    }
  }

  // 多种日期匹配模式
  const datePatterns = [
    /(\d{4})年(\d{1,2})月(\d{1,2})日/,
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
    /(\d{1,2})月(\d{1,2})日/,
    /入住.*?(\d{4})年(\d{1,2})月(\d{1,2})日/,
    /入住.*?(\d{4})-(\d{1,2})-(\d{1,2})/,
    /入住时间.*?(\d{1,2})月(\d{1,2})日/,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /7月(\d{1,2})日/,  // 特殊处理7月格式
    /(\d{1,2})月(\d{1,2})号/,  // 支持"号"
  ]

  // 解析入住日期
  for (const pattern of datePatterns) {
    const dateMatch = message.match(pattern)
    if (dateMatch) {
      if (dateMatch.length === 4) { // 完整年月日
        orderInfo.checkInDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`
      } else if (dateMatch.length === 3) { // 只有月日，使用当前年
        const currentYear = new Date().getFullYear()
        orderInfo.checkInDate = `${currentYear}-${dateMatch[1].padStart(2, '0')}-${dateMatch[2].padStart(2, '0')}`
      } else if (pattern.source.includes('7月')) { // 特殊处理7月
        const currentYear = new Date().getFullYear()
        orderInfo.checkInDate = `${currentYear}-07-${dateMatch[1].padStart(2, '0')}`
      }
      break
    }
  }

  // 解析退房日期
  const checkoutPatterns = [
    /退房.*?(\d{1,2})月(\d{1,2})日/,
    /退房时间.*?(\d{1,2})月(\d{1,2})日/,
    /7月(\d{1,2})日.*?退房/,
    /退房.*?7月(\d{1,2})日/,
  ]

  for (const pattern of checkoutPatterns) {
    const checkoutMatch = message.match(pattern)
    if (checkoutMatch) {
      const currentYear = new Date().getFullYear()
      if (pattern.source.includes('7月')) {
        orderInfo.checkOutDate = `${currentYear}-07-${checkoutMatch[1].padStart(2, '0')}`
      } else {
        orderInfo.checkOutDate = `${currentYear}-${checkoutMatch[1].padStart(2, '0')}-${checkoutMatch[2].padStart(2, '0')}`
      }
      break
    }
  }

  // 解析手机号
  const phonePatterns = [
    /1[3-9]\d{9}/,
    /手机[：:]\s*(1[3-9]\d{9})/,
    /电话[：:]\s*(1[3-9]\d{9})/,
    /联系方式[：:]\s*(1[3-9]\d{9})/,
  ]

  for (const pattern of phonePatterns) {
    const phoneMatch = message.match(pattern)
    if (phoneMatch) {
      orderInfo.phone = phoneMatch[1] || phoneMatch[0]
      break
    }
  }

  // 解析总费用
  const pricePatterns = [
    /(\d+)元/,
    /总计[：:]\s*(\d+)/,
    /费用[：:]\s*(\d+)/,
    /价格[：:]\s*(\d+)/,
    /¥(\d+)/,
  ]

  for (const pattern of pricePatterns) {
    const priceMatch = message.match(pattern)
    if (priceMatch) {
      orderInfo.totalAmount = parseInt(priceMatch[1])
      break
    }
  }

  // 解析客人姓名
  const namePatterns = [
    /姓名[：:]\s*([^\s\d]{2,4})/,
    /客人[：:]\s*([^\s\d]{2,4})/,
    /预订人[：:]\s*([^\s\d]{2,4})/,
  ]

  for (const pattern of namePatterns) {
    const nameMatch = message.match(pattern)
    if (nameMatch) {
      orderInfo.guestName = nameMatch[1]
      break
    }
  }

  console.log('📊 解析订单结果:', orderInfo)
  return orderInfo
}

// 监听Dify聊天消息
const onDifyMessage = (message: any) => {
  console.log('收到Dify消息:', message)

  if (message.type === 'ai' && message.content) {
    // 解析房间推荐
    const newRecommendations = parseRoomRecommendations(message.content)
    if (newRecommendations.length > 0) {
      // 合并新推荐到现有推荐中，避免重复
      const existingCodes = aiRecommendations.value.map(r => r.code)
      const uniqueNewRecommendations = newRecommendations.filter(r => !existingCodes.includes(r.code))

      if (uniqueNewRecommendations.length > 0) {
        aiRecommendations.value = [...aiRecommendations.value, ...uniqueNewRecommendations]
        console.log('添加新推荐房间:', uniqueNewRecommendations)
        console.log('当前所有推荐房间:', aiRecommendations.value)
      } else {
        console.log('没有新的推荐房间，所有房间都已存在')
      }
    }

    // 检查是否包含订单确认信息
    const orderTriggers = [
      '预订成功', '订单详情', '预订确认', '订单确认',
      '预订完成', '已预订', '预订信息', '订单生成',
      '确认预订', '预订单', '订单创建', '预订记录'
    ]

    const hasOrderTrigger = orderTriggers.some(trigger => message.content.includes(trigger))

    if (hasOrderTrigger) {
      const orderInfo = parseOrderInfo(message.content)
      if (orderInfo.roomCode) {
        // 创建订单
        const order = {
          orderNumber: 'ORD' + Date.now(),
          roomCode: orderInfo.roomCode,
          roomName: orderInfo.roomName || '雨林景观豪华蘑菇屋',
          checkInDate: orderInfo.checkInDate || getTomorrowDate(),
          checkOutDate: calculateCheckOutDate(orderInfo.checkInDate || getTomorrowDate()),
          totalAmount: orderInfo.totalAmount || orderInfo.price || 48,
          phone: orderInfo.phone || '待补充',
          guestName: orderInfo.guestName || '待补充',
          status: 'confirmed',
          createdAt: new Date().toISOString()
        }
        currentOrder.value = order
        // 显示订单创建成功提示
        showOrderCreatedNotification()
      }
    }
  }
}

// 处理VR链接点击
const handleVrClick = (vrUrl: string) => {
  console.log('点击VR链接:', vrUrl)

  // 检查链接是否有效
  if (!vrUrl || vrUrl.trim() === '') {
    console.error('VR链接为空')
    alert('VR链接无效，请联系客服')
    return
  }

  // 检查链接格式
  if (!vrUrl.startsWith('http://') && !vrUrl.startsWith('https://')) {
    console.error('VR链接格式无效:', vrUrl)
    alert('VR链接格式无效，请联系客服')
    return
  }

  console.log('正在打开VR链接:', vrUrl)
  // 链接会通过 target="_blank" 在新窗口打开
}



// 获取明天的日期
const getTomorrowDate = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

// 计算退房日期（默认住一晚）
const calculateCheckOutDate = (checkInDate: string) => {
  const date = new Date(checkInDate)
  date.setDate(date.getDate() + 1)
  return date.toISOString().split('T')[0]
}

// 显示订单创建成功通知
const showOrderCreatedNotification = () => {
  // 这里可以添加更多的通知逻辑，比如显示toast消息
}

// 获取房间图片
const getRoomImage = (roomCode: string) => {
  const room = roomDatabase.find(r => r.code === roomCode)
  return room?.image || roomVisit1
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 取消订单
const cancelOrder = () => {
  if (currentOrder.value) {
    currentOrder.value = null
  }
}

// 修改订单
const modifyOrder = () => {
  if (currentOrder.value) {
    // 订单修改请求
  }
}
</script>

<style scoped>
/* 基础样式 */
.ai-room-selection {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%) !important;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 确保body背景不会覆盖页面背景 */
body {
  background: transparent !important;
}

/* 页面标题 */
.page-header {
  background: transparent;
  padding: 2rem 0;
  margin-top: 70px;
  text-align: center;
  position: relative;
}

.page-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%);
  border-radius: 0 0 2rem 2rem;
}

.page-title {
  font-size: 2.8rem;
  font-weight: 800;
  background: linear-gradient(135deg, #1e40af 0%, #059669 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  position: relative;
}

.page-title .ai-icon {
  font-size: 3rem;
  filter: drop-shadow(0 4px 8px rgba(59, 130, 246, 0.3));
}

.page-subtitle {
  color: #475569;
  font-size: 1.2rem;
  font-weight: 500;
  text-align: center;
  position: relative;
}

/* 主要内容 */
.main-content {
  padding: 3rem 0;
  position: relative;
}

.container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 2rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 3rem;
  min-height: 800px;
  margin-bottom: 4rem;
  align-items: start;
}

/* 左侧面板 */
.left-panel {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  height: fit-content;
}

/* AI助手 */
.ai-assistant {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.08),
    0 8px 25px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  min-height: 220px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.ai-assistant::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6 0%, #10b981 50%, #8b5cf6 100%);
  border-radius: 24px 24px 0 0;
}

/* AI控制按钮样式 */
.ai-controls {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.control-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 15px;
}

.control-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 20px;
  border: none;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.voice-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.voice-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

.voice-btn.active {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.reset-btn {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
}

.reset-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 语音指示器 */
.voice-indicator {
  text-align: center;
  padding: 15px;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 12px;
  margin-bottom: 15px;
}

.voice-wave {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 3px;
  margin-bottom: 10px;
}

.wave-bar {
  width: 4px;
  height: 20px;
  background: #10b981;
  border-radius: 2px;
  animation: wave 1.2s infinite ease-in-out;
}

.wave-bar:nth-child(2) { animation-delay: -1.1s; }
.wave-bar:nth-child(3) { animation-delay: -1.0s; }
.wave-bar:nth-child(4) { animation-delay: -0.9s; }
.wave-bar:nth-child(5) { animation-delay: -0.8s; }

.voice-text {
  margin: 0;
  font-size: 14px;
  color: #059669;
  font-weight: 500;
}

/* 语音结果 */
.voice-result {
  background: rgba(59, 130, 246, 0.1);
  border-radius: 12px;
  padding: 15px;
}

.voice-label {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
}

.voice-content {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #1f2937;
  background: white;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.voice-actions {
  display: flex;
  gap: 8px;
}

.send-voice-btn {
  flex: 1;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.send-voice-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
}

.clear-voice-btn {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.clear-voice-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

/* 保留必要的动画 */
@keyframes wave {
  0%, 40%, 100% { transform: scaleY(0.4); }
  20% { transform: scaleY(1.0); }
}

/* 推荐房间动画 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes expandHeight {
  from {
    max-height: 320px;
  }
  to {
    max-height: 600px;
  }
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.ai-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  transition: transform 0.3s ease;
}

.ai-avatar:hover {
  transform: scale(1.05);
}

.ai-character {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.speaking-indicator {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 2px;
}

.wave {
  width: 3px;
  height: 15px;
  background: #d4af37;
  border-radius: 2px;
  animation: wave 1s ease-in-out infinite;
}

.wave:nth-child(2) {
  animation-delay: 0.2s;
}

.wave:nth-child(3) {
  animation-delay: 0.4s;
}



.ai-info h3 {
  font-size: 1.4rem;
  font-weight: 800;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.ai-info p {
  color: #64748b;
  margin-bottom: 0.75rem;
  font-weight: 500;
}

.ai-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #6b7280;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  transition: all 0.3s ease;
}

.status-dot.online {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
}

.status-dot.online {
  background: #10b981;
}

.ai-controls {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  background: white;
  color: #6b7280;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn.active {
  background: #d4af37;
  color: white;
  border-color: #d4af37;
}

/* 推荐房间 */
.recommended-rooms {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.08),
    0 8px 25px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  min-height: 320px;
  max-width: 936px;
  flex: 1;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  width: 100%;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 推荐房间有内容时的状态 */
.recommended-rooms.has-content {
  animation: expandHeight 0.5s ease-out forwards;
}

/* 推荐房间内容区域 */
.recommended-rooms .rooms-container {
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.recommended-rooms.has-content .rooms-container {
  opacity: 1;
  transform: translateY(0);
  transition-delay: 0.2s;
}

/* 空状态动画 */
.recommended-rooms .empty-state {
  opacity: 1;
  transform: translateY(0);
  transition: all 0.3s ease;
}

.recommended-rooms.has-content .empty-state {
  opacity: 0;
  transform: translateY(-10px);
  pointer-events: none;
}

.recommended-rooms::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
  border-radius: 24px 24px 0 0;
}

.recommended-rooms h3 {
  font-size: 1.3rem;
  font-weight: 800;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
  transition: all 0.3s ease;
}

.recommended-rooms.has-content h3 {
  transform: translateY(-2px);
}

.recommended-rooms h3 i {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.4rem;
}

.count {
  font-size: 0.9rem;
  color: #d4af37;
}

.rooms {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 推荐房间头部 */
.recommendations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0 0.5rem;
}

.recommendations-count {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
}

.clear-recommendations {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.clear-recommendations:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  transform: translateY(-1px);
}

/* 房间滑动容器 */
.rooms-container {
  position: relative;
  overflow: hidden;
  width: 100%;
  transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
}

.rooms-scroll {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding-bottom: 12px;
  scrollbar-width: thin;
  scrollbar-color: rgba(245, 158, 11, 0.6) rgba(241, 241, 241, 0.8);
  width: 100%;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.rooms-scroll::-webkit-scrollbar {
  height: 8px;
}

.rooms-scroll::-webkit-scrollbar-track {
  background: rgba(241, 241, 241, 0.8);
  border-radius: 4px;
}

.rooms-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
  border-radius: 4px;
}

.rooms-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(90deg, #d97706 0%, #b45309 100%);
}

.rooms-scroll .room-card {
  min-width: 320px;
  max-width: 380px;
  flex-shrink: 0;
  width: auto;
  opacity: 0;
  transform: translateY(30px) scale(0.95);
  animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.rooms-scroll .room-card:nth-child(1) { animation-delay: 0.1s; }
.rooms-scroll .room-card:nth-child(2) { animation-delay: 0.2s; }
.rooms-scroll .room-card:nth-child(3) { animation-delay: 0.3s; }
.rooms-scroll .room-card:nth-child(4) { animation-delay: 0.4s; }
.rooms-scroll .room-card:nth-child(5) { animation-delay: 0.5s; }



.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e5e7eb;
  cursor: pointer;
  transition: all 0.3s ease;
}

.indicator.active {
  background: #d4af37;
  transform: scale(1.2);
}

.indicator:hover {
  background: #f59e0b;
}

.room-card {
  display: flex;
  gap: 1.25rem;
  padding: 1.5rem;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 16px;
  cursor: pointer;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%);
  backdrop-filter: blur(8px);
}

.room-card:hover {
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow:
    0 12px 40px rgba(59, 130, 246, 0.15),
    0 4px 20px rgba(0, 0, 0, 0.08);
}

.room-card.recommended {
  position: relative;
  border-color: rgba(245, 158, 11, 0.4);
  background: linear-gradient(135deg, rgba(255, 251, 235, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%);
  box-shadow:
    0 8px 32px rgba(245, 158, 11, 0.12),
    0 4px 16px rgba(0, 0, 0, 0.06);
  flex-direction: column;
  min-height: 280px;
  width: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.room-card.recommended:hover {
  transform: translateY(-4px);
  box-shadow:
    0 12px 40px rgba(245, 158, 11, 0.2),
    0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: rgba(245, 158, 11, 0.6);
}

.room-card.recommended::after {
  content: '🏠 点击查看VR';
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0;
  transition: all 0.3s ease;
  pointer-events: none;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.room-card.recommended:hover::after {
  opacity: 1;
}

.recommend-badge {
  position: absolute;
  top: -10px;
  right: 16px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow:
    0 4px 16px rgba(245, 158, 11, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  z-index: 5;
}







.recommend-reason {
  background: rgba(212, 175, 55, 0.1);
  color: #b8860b;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 0.85rem;
  margin: 8px 0;
  display: flex;
  align-items: center;
  gap: 6px;
  border-left: 3px solid #d4af37;
}



.room-card .room-image {
  width: 80px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.room-card.recommended .room-image {
  width: 100%;
  height: 120px;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.room-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.room-info h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.3rem;
}

.room-info p {
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.room-card.recommended .room-info {
  padding: 0;
}

.room-card.recommended .room-info h4 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.room-card.recommended .room-info p {
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
}

.room-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
}

.price {
  color: #d4af37;
  font-weight: 600;
}

.rating {
  color: #f59e0b;
}

.status.available {
  color: #10b981;
}

.status.unavailable {
  color: #ef4444;
}

/* 订单详情 */
.order-details {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.08),
    0 8px 25px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  min-height: 280px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.order-details::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  border-radius: 24px 24px 0 0;
}

.order-details h3 {
  font-size: 1.3rem;
  font-weight: 800;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: space-between;
}

.order-details h3 i {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.4rem;
}

.order-status {
  background: #10b981;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.order-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.order-number, .order-date {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.order-number .label, .order-date .label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
}

.order-number .value, .order-date .value {
  font-size: 0.95rem;
  color: #1f2937;
  font-weight: 600;
}

.order-room-info {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 12px;
}

.room-image-container {
  flex-shrink: 0;
}

.room-thumbnail {
  width: 80px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
}

.room-details h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.stay-dates {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #6b7280;
}

.date-item i {
  color: #d4af37;
}

.guest-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 12px;
}

.guest-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
}

.guest-item i {
  color: #d4af37;
  width: 16px;
}

.guest-item .label {
  color: #6b7280;
  font-weight: 500;
}

.guest-item .value {
  color: #1f2937;
  font-weight: 600;
}

.order-summary {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
  margin-bottom: 1.5rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.9rem;
}

.summary-item.total {
  border-top: 1px solid #e5e7eb;
  margin-top: 0.5rem;
  padding-top: 1rem;
  font-weight: 600;
  font-size: 1rem;
}

.summary-item .label {
  color: #6b7280;
}

.summary-item .value {
  color: #1f2937;
  font-weight: 600;
}

.summary-item .price {
  color: #d4af37;
  font-size: 1.1rem;
  font-weight: 700;
}

.order-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.order-item.total {
  border-bottom: none;
  font-weight: 600;
  color: #d4af37;
}

.label {
  color: #6b7280;
}

.order-actions {
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-outline {
  background: white;
  color: #ef4444;
  border: 1px solid #ef4444;
}

.btn-outline:hover {
  background: #ef4444;
  color: white;
}

.btn-primary {
  background: #d4af37;
  color: white;
  border: 1px solid #d4af37;
}

.btn-primary:hover {
  background: #b8941f;
  border-color: #b8941f;
}

.empty-hint {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-top: 0.5rem;
}

/* 右侧面板 */
.right-panel {
  display: flex;
  flex-direction: column;
}

/* 聊天容器 */
.chat-container {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%);
  border-radius: 24px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.08),
    0 8px 25px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 650px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.chat-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%);
  border-radius: 24px 24px 0 0;
}

.chat-header {
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h3 {
  font-size: 1.3rem;
  font-weight: 800;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.chat-header h3 i {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.4rem;
}

.chat-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #6b7280;
}

/* Dify聊天组件样式 */
.dify-chat-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 聊天消息 */
.chat-messages {
  flex: 1;
  padding: 1rem 2rem;
  overflow-y: auto;
  max-height: 400px;
  min-height: 300px;
}

.message {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-content {
  flex: 1;
  max-width: 80%;
}

.message-text {
  background: #f3f4f6;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 0.3rem;
}

.message.user .message-text {
  background: #d4af37;
  color: white;
}

.message-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

/* 输入提示 */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f3f4f6;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.typing-dots {
  display: flex;
  gap: 0.2rem;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: #9ca3af;
  border-radius: 50%;
}



.typing-text {
  font-size: 0.8rem;
  color: #6b7280;
}

/* 聊天输入 */
.chat-input-section {
  padding: 1rem 2rem 2rem;
  border-top: 1px solid #f3f4f6;
  margin-top: auto; /* 推到底部 */
  background: rgba(255, 255, 255, 0.98);
  border-radius: 0 0 20px 20px;
}

.quick-questions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.quick-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(212, 175, 55, 0.1);
  color: #d4af37;
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.8rem;
}

.quick-btn:hover {
  background: #d4af37;
  color: white;
}

.input-container {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.chat-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 25px;
  outline: none;
  font-size: 0.9rem;
}

.chat-input:focus {
  border-color: #d4af37;
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
}

.send-btn {
  width: 40px;
  height: 40px;
  background: #d4af37;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.send-btn:hover:not(:disabled) {
  background: #b8941f;
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.empty-state i {
  font-size: 3rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

/* 全部房间展示 */
.all-rooms-section {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%);
  border-radius: 24px;
  padding: 3rem;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.08),
    0 8px 25px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  margin-top: 3rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.all-rooms-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #ec4899 0%, #be185d 100%);
  border-radius: 24px 24px 0 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.section-header h2 {
  font-size: 1.75rem;
  font-weight: 800;
  background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-header h2 i {
  background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.875rem;
}

.room-filters {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #6b7280;
  cursor: pointer;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
}

.toggle-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #d1d5db;
  background: white;
  color: #6b7280;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.toggle-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.toggle-btn.active {
  background: #d4af37;
  color: white;
  border-color: #d4af37;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #d4af37;
  border-radius: 50%;
  margin: 0 auto 1rem;
}



.rooms-grid {
  display: grid;
  gap: 1.5rem;
}

.rooms-grid.grid {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.rooms-grid.list {
  grid-template-columns: 1fr;
}

.room-item {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%);
  border-radius: 20px;
  overflow: hidden;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.06),
    0 4px 16px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  cursor: pointer;
  border: 1px solid rgba(226, 232, 240, 0.6);
  backdrop-filter: blur(8px);
}

.room-item:hover {
  box-shadow:
    0 20px 60px rgba(59, 130, 246, 0.15),
    0 8px 32px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border-color: rgba(59, 130, 246, 0.3);
}

.room-image-container {
  position: relative;
  height: 220px;
  overflow: hidden;
  border-radius: 16px 16px 0 0;
}

.room-image-container .room-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(1.05) contrast(1.1);
}

.room-item:hover .room-image {
  filter: brightness(1.1) contrast(1.15);
}

.room-status-badge {
  position: absolute;
  top: 1.25rem;
  left: 1.25rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  z-index: 2;
}

.room-status-badge.available {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.room-status-badge.unavailable {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
}

.room-price-badge {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(31, 41, 55, 0.8) 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 2;
}

.room-details {
  padding: 2rem;
  position: relative;
  z-index: 2;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.room-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
}

.room-rating {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: #f59e0b;
  font-size: 0.9rem;
  font-weight: 600;
}

.room-type {
  color: #6b7280;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.room-features {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.feature {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: #6b7280;
  font-size: 0.8rem;
}

.feature i {
  color: #d4af37;
}

.vr-link {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  transition: all 0.3s ease;
  display: inline-block;
}

.vr-link:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
  color: #1d4ed8;
  text-decoration: none;
  transform: translateY(-1px);
}

.room-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-category {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
  color: #3b82f6;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.book-btn {
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 0.875rem;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
}

.book-btn:hover:not(.disabled) {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.4);
}

.book-btn.disabled {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
  cursor: not-allowed;
  box-shadow: none;
}

/* 移除所有动画效果 */

/* 响应式设计 */
@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .container {
    max-width: 1000px;
  }
}

@media (max-width: 1024px) {
  .rooms-grid.grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }

  .page-title {
    font-size: 2.4rem;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }

  .page-title {
    font-size: 2rem;
    flex-direction: column;
    gap: 0.5rem;
  }

  .ai-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .ai-controls {
    justify-content: center;
  }

  .quick-questions {
    flex-direction: column;
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .room-filters {
    width: 100%;
    justify-content: space-between;
  }

  .rooms-grid.grid {
    grid-template-columns: 1fr;
  }

  .ai-assistant,
  .recommended-rooms,
  .order-details,
  .all-rooms-section {
    padding: 1.5rem;
  }

  .chat-container {
    min-height: 500px;
  }

  .rooms-scroll .room-card {
    min-width: 280px;
    max-width: 320px;
  }

  .room-card.recommended {
    min-height: 240px;
  }
}
</style>
