import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      }
    }
    return { top: 0, behavior: 'smooth' }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/tea-culture',
      name: 'tea-culture',
      component: () => import('../views/TeaCultureView.vue'),
    },
    {
      path: '/tea-experience-booking',
      name: 'tea-experience-booking',
      component: () => import('../views/TeaExperienceBookingView.vue'),
    },
    {
      path: '/surrounding-products',
      name: 'surrounding-products',
      component: () => import('../views/SurroundingProductsView.vue'),
    },
    {
      path: '/products',
      name: 'products',
      component: () => import('../views/user/ProductsView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/homestay-activities',
      name: 'homestay-activities',
      component: () => import('../views/HomestayActivitiesView.vue'),
    },
    {
      path: '/product/:id',
      name: 'ProductDetail',
      component: () => import('../views/ProductDetailView.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true, role: 'user' }
    },
    {
      path: '/edit-profile',
      name: 'edit-profile',
      component: () => import('../views/EditProfileView.vue'),
      meta: { requiresAuth: true, role: 'user' }
    },
    // AI选房页面
    {
      path: '/ai-rooms',
      name: 'ai-rooms',
      component: () => import('../views/user/AIRoomSelectionView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/room/:id',
      name: 'room-detail',
      component: () => import('../views/user/RoomDetailView.vue'),
      meta: { requiresAuth: true, role: 'user' }
    },
    {
      path: '/book/:id',
      name: 'booking',
      component: () => import('../views/user/BookingView.vue'),
      meta: { requiresAuth: true, role: 'user' }
    },
    {
      path: '/orders',
      name: 'orders',
      component: () => import('../views/user/OrdersView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/order/:id',
      name: 'order-detail',
      component: () => import('../views/user/OrderDetailView.vue'),
      meta: { requiresAuth: true, role: 'user' }
    },
    // 管理员登录页面
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('../views/admin/AdminLoginView.vue'),
      meta: { requiresAuth: false }
    },
    // 管理员后台页面
    {
      path: '/admin',
      name: 'admin',
      redirect: '/admin/dashboard'
    },
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: () => import('../views/admin/AdminDashboardView.vue'),
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/admin/simple',
      name: 'admin-simple',
      component: () => import('../views/admin/AdminDashboardSimple.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/admin/rooms',
      name: 'admin-rooms',
      component: () => import('../views/admin/AdminRooms.vue'),
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/admin/orders',
      name: 'admin-orders',
      component: () => import('../views/admin/AdminOrders.vue'),
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/admin/room-management',
      name: 'admin-room-management',
      component: () => import('../views/admin/RoomManagementView.vue'),
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/admin/order-management',
      name: 'admin-order-management',
      component: () => import('../views/admin/OrderManagementView.vue'),
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/admin/user-management',
      name: 'admin-user-management',
      component: () => import('../views/admin/UserManagementView.vue'),
      meta: { requiresAuth: true, role: 'admin' }
    },
  ],
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    if (!auth.isAuthenticated) {
      // 未登录，重定向到登录页
      next('/login')
      return
    }

    // 检查角色权限 - 使用 userRole 而不是 user.role
    if (to.meta.role && auth.userRole !== to.meta.role) {
      // 权限不足，重定向到首页
      next('/')
      return
    }
  }

  // 如果已登录用户访问登录页，重定向到首页
  if ((to.path === '/login' || to.path === '/register') && auth.isAuthenticated) {
    next('/')
    return
  }

  next()
})

export default router
